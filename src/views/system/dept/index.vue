<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { Modal } from 'ant-design-vue';
import Sortable from 'sortablejs';
import { fetchDeptDelete, fetchDeptEditStatus, fetchDeptEnums, fetchDeptSort, fetchDeptTree } from '@/service/api';
import { useAuth } from '@/hooks/business/auth';
import DeptModal from './modules/dept-modal.vue';

defineOptions({
  name: 'SystemDept'
});

const { hasAuth } = useAuth();

interface SearchParams {
  keyword: string;
  status: number | undefined;
}

const searchParams = reactive<SearchParams>({
  keyword: '',
  status: undefined
});

const rawData = ref<Api.Dept.DeptVO[]>([]);
const tableData = ref<Api.Dept.DeptVO[]>([]);
const loading = ref(false);
const expandedKeys = ref<number[]>([]);
const allExpanded = ref(false);

const statusOptions = ref<{ value: number; label: string }[]>([]);

async function loadStatusOptions() {
  const { data, error } = await fetchDeptEnums();
  if (!error && data) {
    statusOptions.value = data.map(item => ({ value: item.code, label: item.desc }));
  }
}

/** 递归按 displayOrder 升序排序，并剔除空 children，让树表叶子不显示展开图标 */
function sortTreeByDisplayOrder(nodes: Api.Dept.DeptVO[]): Api.Dept.DeptVO[] {
  const sorted = [...nodes].sort(
    (a, b) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER)
  );
  return sorted.map(n => {
    if (n.children?.length) {
      return { ...n, children: sortTreeByDisplayOrder(n.children) };
    }
    const { children: _, ...rest } = n;
    return rest;
  });
}

/** 按关键词过滤树（保留命中节点及其祖先） */
function filterTree(nodes: Api.Dept.DeptVO[], keyword: string, status?: number): Api.Dept.DeptVO[] {
  const lower = keyword.trim().toLowerCase();
  const result: Api.Dept.DeptVO[] = [];
  for (const n of nodes) {
    const children = n.children?.length ? filterTree(n.children, keyword, status) : undefined;
    const selfMatch =
      (!lower || n.deptName.toLowerCase().includes(lower) || (n.leader ?? '').toLowerCase().includes(lower)) &&
      (status === undefined || n.status === status);
    if (selfMatch || (children && children.length > 0)) {
      const { children: _c, ...rest } = n;
      result.push({ ...rest, ...(children && children.length > 0 ? { children } : {}) });
    }
  }
  return result;
}

async function getData() {
  loading.value = true;
  const { data, error } = await fetchDeptTree();
  if (!error && data) {
    rawData.value = data;
    const sorted = sortTreeByDisplayOrder(data);
    // 默认展开全部
    const keys: number[] = [];
    const walk = (nodes: Api.Dept.DeptVO[]) => {
      for (const n of nodes) {
        keys.push(n.id);
        if (n.children?.length) walk(n.children);
      }
    };
    walk(sorted);
    expandedKeys.value = keys;
    allExpanded.value = true;
    applyFilter(sorted);
  }
  loading.value = false;
}

function applyFilter(nodes: Api.Dept.DeptVO[]) {
  const filtered = filterTree(nodes, searchParams.keyword, searchParams.status);
  tableData.value = filtered;
}

watch(
  () => [searchParams.keyword, searchParams.status],
  () => {
    const sorted = sortTreeByDisplayOrder(rawData.value);
    applyFilter(sorted);
  }
);

function handleSearch() {
  const sorted = sortTreeByDisplayOrder(rawData.value);
  applyFilter(sorted);
}

function handleReset() {
  searchParams.keyword = '';
  searchParams.status = undefined;
  const sorted = sortTreeByDisplayOrder(rawData.value);
  applyFilter(sorted);
}

function collectKeys(nodes: Api.Dept.DeptVO[], keys: number[] = []) {
  for (const n of nodes) {
    keys.push(n.id);
    if (n.children?.length) collectKeys(n.children, keys);
  }
  return keys;
}

function toggleExpandAll() {
  if (allExpanded.value) {
    expandedKeys.value = [];
  } else {
    expandedKeys.value = collectKeys(tableData.value);
  }
  allExpanded.value = !allExpanded.value;
}

function handleExpand(expanded: boolean, record: Api.Dept.DeptVO) {
  if (expanded) {
    if (!expandedKeys.value.includes(record.id)) expandedKeys.value.push(record.id);
  } else {
    expandedKeys.value = expandedKeys.value.filter(k => k !== record.id);
  }
  allExpanded.value = expandedKeys.value.length === collectKeys(tableData.value).length;
}

const modalState = reactive({
  visible: false,
  type: 'add' as 'add' | 'edit',
  row: null as Api.Dept.DeptVO | null,
  defaultParentId: 0
});

function handleAdd() {
  modalState.type = 'add';
  modalState.row = null;
  modalState.defaultParentId = 0;
  modalState.visible = true;
}

function handleAddChild(row: Api.Dept.DeptVO) {
  modalState.type = 'add';
  modalState.row = null;
  modalState.defaultParentId = row.id;
  modalState.visible = true;
}

function handleEdit(row: Api.Dept.DeptVO) {
  modalState.type = 'edit';
  modalState.row = row;
  modalState.defaultParentId = 0;
  modalState.visible = true;
}

function handleDelete(row: Api.Dept.DeptVO) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除部门 "${row.deptName}" 吗？${row.children?.length ? '该部门存在下级部门，请先删除下级部门。' : ''}`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      if (row.children?.length) {
        window.$message?.warning('该部门存在下级部门，无法删除');
        return;
      }
      const { error } = await fetchDeptDelete(row.id);
      if (!error) {
        window.$message?.success('删除成功');
        getData();
      }
    }
  });
}

async function handleStatusChange(row: Api.Dept.DeptVO, checked: boolean) {
  const { error } = await fetchDeptEditStatus(row.id);
  if (!error) {
    window.$message?.success('状态切换成功');
    row.status = checked ? 1 : 0;
    row.statusText = checked ? '正常' : '禁用';
  }
}

/* ---------- 拖拽排序（SortableJS，仅同级） ---------- */
const tableWrapRef = ref<HTMLElement>();
let sortableInstance: Sortable | null = null;
let dragTargetParentId = -1;

function destroySortable() {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
}

function findNode(id: number, nodes: Api.Dept.DeptVO[] = rawData.value): Api.Dept.DeptVO | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const found = findNode(id, n.children);
      if (found) return found;
    }
  }
  return null;
}

function clearDragHighlights() {
  const tbodyEl = tableWrapRef.value?.querySelector('.ant-table-tbody');
  tbodyEl?.querySelectorAll('tr.drag-allowed, tr.drag-source').forEach(tr => {
    tr.classList.remove('drag-allowed', 'drag-source');
  });
}

function initSortable() {
  const root = tableWrapRef.value;
  if (!root) return;
  const tbody = root.querySelector('.ant-table-tbody') as HTMLElement;
  if (!tbody) return;
  destroySortable();
  sortableInstance = new Sortable(tbody, {
    filter: '.ant-btn, .ant-switch, .ant-table-row-expand-icon, input, a',
    preventOnFilter: false,
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    onStart(evt) {
      dragTargetParentId = -1;
      const itemEl = evt.item as HTMLElement;
      const id = Number(itemEl.getAttribute('data-row-key'));
      const node = findNode(id);
      const parentId = node?.parentId ?? 0;
      itemEl.classList.add('drag-source');
      // 给同级兄弟加虚线红框
      Array.from(tbody.querySelectorAll('tr[data-row-key]')).forEach(tr => {
        const siblingId = Number((tr as HTMLElement).getAttribute('data-row-key'));
        const sibling = findNode(siblingId);
        if (sibling && (sibling.parentId ?? 0) === parentId) {
          tr.classList.add('drag-allowed');
        }
      });
    },
    onMove(evt) {
      const draggedEl = evt.dragged as HTMLElement;
      const relatedEl = evt.related as HTMLElement;
      const draggedId = Number(draggedEl.getAttribute('data-row-key'));
      const relatedId = Number(relatedEl.getAttribute('data-row-key'));
      const dragged = findNode(draggedId);
      const related = findNode(relatedId);
      if (!dragged || !related) return false;
      // 无论是否同级，都记录目标行的 parentId，用于 onEnd 判定跨级并给出提示（与菜单管理一致）
      dragTargetParentId = related.parentId ?? 0;
      return (related.parentId ?? 0) === (dragged.parentId ?? 0);
    },
    onEnd(evt) {
      const itemEl = evt.item as HTMLElement;
      const draggedId = Number(itemEl.getAttribute('data-row-key'));
      const dragged = findNode(draggedId);
      if (!dragged) {
        clearDragHighlights();
        return;
      }
      const parentId = dragged.parentId ?? 0;
      const tbodyEl = tableWrapRef.value?.querySelector('.ant-table-tbody') as HTMLElement;
      if (!tbodyEl) {
        clearDragHighlights();
        return;
      }
      // 按 DOM 顺序读取同级兄弟 id
      const ids = Array.from(tbodyEl.querySelectorAll('tr[data-row-key]'))
        .map(tr => {
          const id = Number((tr as HTMLElement).getAttribute('data-row-key'));
          const node = findNode(id);
          return { id, node };
        })
        .filter(({ node }) => node && (node.parentId ?? 0) === parentId)
        .map(({ id }) => id);

      clearDragHighlights();

      if (evt.oldIndex === evt.newIndex) {
        if (dragTargetParentId !== -1 && dragTargetParentId !== parentId) {
          window.$message?.warning('仅支持同级部门排序');
        }
        return;
      }

      submitSort({ parentId, ids });
    }
  });
}

// 数据或展开状态变化后，待 DOM 更新重新初始化 Sortable
watch([tableData, expandedKeys], () => {
  if (hasAuth('system:dept:sort')) {
    nextTick(initSortable);
  } else {
    nextTick(destroySortable);
  }
});

async function submitSort({ parentId, ids }: { parentId: number; ids: number[] }) {
  const { error } = await fetchDeptSort({ parentId, ids });
  if (!error) {
    window.$message?.success('排序已更新');
  } else {
    window.$message?.error('排序保存失败，已恢复');
  }
  // 重新调用接口渲染数据，并按 displayOrder 排序（成功/失败都以此为准）
  getData();
}

const columns = computed(() => {
  const cols: any[] = [
    ...(hasAuth('system:dept:sort')
      ? [
          {
            title: '',
            key: 'drag',
            align: 'center' as const,
            width: 64
          }
        ]
      : []),
    {
      title: '部门名称',
      dataIndex: 'deptName',
      key: 'deptName',
      width: 220
    },
    {
      title: '负责人',
      dataIndex: 'leader',
      key: 'leader',
      align: 'center' as const,
      width: 120
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      align: 'center' as const,
      width: 140
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      align: 'center' as const,
      width: 200
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      align: 'center' as const,
      width: 100
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      align: 'center' as const,
      width: 170
    },
    {
      title: '操作',
      key: 'action',
      align: 'center' as const,
      fixed: 'right' as const,
      width: 200
    }
  ];
  return cols;
});

onMounted(() => {
  loadStatusOptions();
  getData();
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <ACard :bordered="false" class="card-wrapper">
      <AForm layout="inline" :model="searchParams">
        <AFormItem label="关键词">
          <AInput
            v-model:value="searchParams.keyword"
            placeholder="部门名称/负责人"
            allow-clear
            @press-enter="handleSearch"
          />
        </AFormItem>
        <AFormItem label="状态">
          <ASelect v-model:value="searchParams.status" placeholder="请选择状态" allow-clear class="w-140px">
            <ASelectOption v-for="item in statusOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </ASelectOption>
          </ASelect>
        </AFormItem>
        <AFormItem>
          <ASpace>
            <AButton type="primary" @click="handleSearch">查询</AButton>
            <AButton @click="handleReset">重置</AButton>
          </ASpace>
        </AFormItem>
      </AForm>
    </ACard>

    <ACard :bordered="false" class="flex-1-hidden card-wrapper">
      <div class="mb-16px flex items-center gap-12px">
        <AButton v-if="hasAuth('system:dept:add')" type="primary" @click="handleAdd">新增部门</AButton>
        <AButton @click="toggleExpandAll">{{ allExpanded ? '全部折叠' : '全部展开' }}</AButton>
        <span v-if="hasAuth('system:dept:sort')" class="text-12px text-gray-400">
          拖动时红色虚线框会圈出可放置的
          <b class="text-red-500">同级范围</b>
          ，跨级不可拖
        </span>
      </div>
      <div ref="tableWrapRef" class="dept-drag-wrap">
        <ATable
          :columns="columns"
          :data-source="tableData"
          :loading="loading"
          :pagination="false"
          row-key="id"
          size="small"
          :expand-icon-column-index="hasAuth('system:dept:sort') ? 1 : 0"
          :expanded-row-keys="expandedKeys"
          :scroll="{ x: 1214 }"
          children-column-name="children"
          :indent-size="32"
          @expand="handleExpand"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'drag'">
              <div
                v-if="hasAuth('system:dept:sort')"
                class="h-24px flex-center cursor-grab select-none text-18px text-gray-400"
                title="拖拽排序"
              >
                <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" style="pointer-events: none">
                  <circle cx="7" cy="5" r="1.6" fill="currentColor" />
                  <circle cx="13" cy="5" r="1.6" fill="currentColor" />
                  <circle cx="7" cy="10" r="1.6" fill="currentColor" />
                  <circle cx="13" cy="10" r="1.6" fill="currentColor" />
                  <circle cx="7" cy="15" r="1.6" fill="currentColor" />
                  <circle cx="13" cy="15" r="1.6" fill="currentColor" />
                </svg>
              </div>
            </template>
            <template v-if="column.key === 'status'">
              <ASwitch
                :disabled="!hasAuth('system:dept:editStatus')"
                :checked="record.status === 1"
                @change="(checked: any) => handleStatusChange(record as Api.Dept.DeptVO, Boolean(checked))"
              />
            </template>
            <template v-if="column.key === 'action'">
              <ASpace>
                <AButton
                  v-if="hasAuth('system:dept:add')"
                  type="link"
                  size="small"
                  @click="handleAddChild(record as Api.Dept.DeptVO)"
                >
                  新增下级
                </AButton>
                <AButton
                  v-if="hasAuth('system:dept:edit')"
                  type="link"
                  size="small"
                  @click="handleEdit(record as Api.Dept.DeptVO)"
                >
                  编辑
                </AButton>
                <AButton
                  v-if="hasAuth('system:dept:delete')"
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(record as Api.Dept.DeptVO)"
                >
                  删除
                </AButton>
              </ASpace>
            </template>
          </template>
        </ATable>
      </div>
    </ACard>

    <DeptModal
      v-model:visible="modalState.visible"
      :type="modalState.type"
      :row="modalState.row"
      :tree="rawData"
      :default-parent-id="modalState.defaultParentId"
      @submitted="getData"
    />
  </div>
</template>

<style scoped>
.dept-drag-wrap {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
  overflow-x: hidden;
}

/* 整行可拖拽的视觉提示（交互元素除外） */
:deep(.ant-table-tbody > tr) {
  cursor: grab;
}
:deep(.ant-table-tbody > tr:active) {
  cursor: grabbing;
}
:deep(.ant-table-tbody .ant-btn),
:deep(.ant-table-tbody .ant-switch) {
  cursor: pointer;
}
:deep(.ant-table-tbody .sortable-ghost) > td {
  background-color: #e6f4ff !important;
}
:deep(.ant-table-tbody .sortable-chosen) > td {
  background-color: rgba(22, 119, 255, 0.12) !important;
}
:deep(.ant-table-tbody .sortable-drag) > td {
  background-color: #fff !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
/* 拖拽时：同级可拖范围红色虚线框 */
:deep(.ant-table-tbody tr.drag-allowed) > td {
  border: 2px dashed #f5222d !important;
}
:deep(.ant-table-tbody tr.drag-source) > td {
  background-color: rgba(245, 34, 45, 0.08) !important;
}
/* 无子节点的行隐藏占位展开图标 */
:deep(.ant-table-row-expand-icon-spaced) {
  display: none;
}
</style>
