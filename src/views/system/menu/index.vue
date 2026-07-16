<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { Modal } from 'ant-design-vue';
import Sortable from 'sortablejs';
import { fetchMenuDelete, fetchMenuEditStatus, fetchMenuSort, fetchMenuTree } from '@/service/api';
import { useAuth } from '@/hooks/business/auth';
import SvgIcon from '@/components/custom/svg-icon.vue';
import MenuModal from './modules/menu-modal.vue';

defineOptions({
  name: 'SystemMenu'
});

const { hasAuth } = useAuth();

const tableData = ref<Api.Menu.MenuVO[]>([]);
const loading = ref(false);
const expandedKeys = ref<number[]>([]);
const allExpanded = ref(true);

function collectKeys(nodes: Api.Menu.MenuVO[], keys: number[] = []) {
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

function handleExpand(expanded: boolean, record: Api.Menu.MenuVO) {
  if (expanded) {
    if (!expandedKeys.value.includes(record.id)) expandedKeys.value.push(record.id);
  } else {
    expandedKeys.value = expandedKeys.value.filter(k => k !== record.id);
  }
  allExpanded.value = expandedKeys.value.length === collectKeys(tableData.value).length;
}

/** 递归按 displayOrder 升序排序（每一层级独立排序），无子节点时删除 children 字段，避免 antd 树形表显示空的展开图标 */
function sortTreeByDisplayOrder(nodes: Api.Menu.MenuVO[]): Api.Menu.MenuVO[] {
  const sorted = [...nodes].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  return sorted.map(n => {
    if (n.children?.length) {
      return { ...n, children: sortTreeByDisplayOrder(n.children) };
    }
    const { children: _, ...rest } = n;
    return rest;
  });
}

async function getData() {
  loading.value = true;
  const { data, error } = await fetchMenuTree();
  if (!error && data) {
    const sorted = sortTreeByDisplayOrder(data);
    tableData.value = sorted;
    // 默认展开全部
    const keys: number[] = [];
    const walk = (nodes: Api.Menu.MenuVO[]) => {
      for (const n of nodes) {
        keys.push(n.id);
        if (n.children?.length) walk(n.children);
      }
    };
    walk(sorted);
    expandedKeys.value = keys;
    allExpanded.value = true;
  }
  loading.value = false;
}

const modalState = reactive({
  visible: false,
  type: 'add' as 'add' | 'edit',
  row: null as Api.Menu.MenuVO | null,
  defaultParentId: 0
});

function handleAdd() {
  modalState.type = 'add';
  modalState.row = null;
  modalState.defaultParentId = 0;
  modalState.visible = true;
}

function handleAddChild(row: Api.Menu.MenuVO) {
  modalState.type = 'add';
  modalState.row = null;
  modalState.defaultParentId = row.id;
  modalState.visible = true;
}

function handleEdit(row: Api.Menu.MenuVO) {
  modalState.type = 'edit';
  modalState.row = row;
  modalState.visible = true;
}

function handleDelete(row: Api.Menu.MenuVO) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除菜单 "${row.menuName}" 吗？其子菜单也会一并删除。`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      const { error } = await fetchMenuDelete(row.id);
      if (!error) {
        window.$message?.success('删除成功');
        getData();
      }
    }
  });
}

async function handleStatusChange(row: Api.Menu.MenuVO, checked: boolean) {
  const { error } = await fetchMenuEditStatus(row.id);
  if (!error) {
    window.$message?.success('状态切换成功');
    row.status = checked ? 1 : 0;
    row.statusText = checked ? '正常' : '禁用';
  }
}

function menuTypeText(type: number) {
  if (type === 1) return '目录';
  if (type === 2) return '菜单';
  return '按钮';
}
function menuTypeColor(type: number) {
  if (type === 1) return 'blue';
  if (type === 2) return 'green';
  return 'orange';
}

/* ---------- 同级拖拽排序（仅支持同父级，基于 SortableJS） ---------- */
/** 在树中按 id 查找节点 */
function findNode(id: number, nodes: Api.Menu.MenuVO[] = tableData.value): Api.Menu.MenuVO | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const r = findNode(id, n.children);
      if (r) return r;
    }
  }
  return null;
}

const tableWrapRef = ref<HTMLElement>();
let sortableInstance: Sortable | null = null;
/** 拖拽过程中目标行的 parentId（用于判定跨级），普通变量避免触发重渲染 */
let dragTargetParentId = -1;

function destroySortable() {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
}

function initSortable() {
  const root = tableWrapRef.value;
  if (!root) return;
  const tbody = root.querySelector('.ant-table-tbody');
  if (!tbody) return;
  destroySortable();
  sortableInstance = new Sortable(tbody as HTMLElement, {
    // 整行可拖（按钮/开关/展开箭头除外），降低抓取难度
    filter: '.ant-btn, .ant-switch, .ant-table-row-expand-icon, input, a',
    preventOnFilter: false,
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    onStart(evt) {
      dragTargetParentId = -1;
      const itemEl = evt.item as HTMLElement;
      const draggedId = Number(itemEl.getAttribute('data-row-key'));
      const dragged = findNode(draggedId);
      const tbodyEl = tableWrapRef.value?.querySelector('.ant-table-tbody');
      if (!tbodyEl) return;
      if (dragged) {
        // 拖拽时给同 parentId 的兄弟行加红色虚线框，圈出可放置范围（直接 DOM 操作，不触发 Vue 重渲染）
        tbodyEl.querySelectorAll('tr[data-row-key]').forEach(tr => {
          const id = Number((tr as HTMLElement).getAttribute('data-row-key'));
          const n = findNode(id);
          if (n && n.parentId === dragged.parentId) {
            tr.classList.add('drag-allowed');
          }
        });
      }
      itemEl.classList.add('drag-source');
    },
    // 仅允许同级（同 parentId）之间互换位置
    onMove(evt) {
      const draggedId = Number((evt.dragged as HTMLElement).getAttribute('data-row-key'));
      const relatedId = Number((evt.related as HTMLElement).getAttribute('data-row-key'));
      const d = findNode(draggedId);
      const r = findNode(relatedId);
      if (!d || !r) return false;
      dragTargetParentId = r.parentId;
      return d.parentId === r.parentId;
    },
    onEnd(evt) {
      // 清理拖拽范围高亮（虚线框 / 源行标记）
      tableWrapRef.value
        ?.querySelector('.ant-table-tbody')
        ?.querySelectorAll('tr.drag-allowed, tr.drag-source')
        .forEach(tr => {
          tr.classList.remove('drag-allowed', 'drag-source');
        });
      const itemEl = evt.item as HTMLElement;
      const draggedId = Number(itemEl.getAttribute('data-row-key'));
      const dragged = findNode(draggedId);
      if (!dragged) return;
      // 位置未变：可能是跨级被 onMove 拦下，或原地点击
      if (evt.oldIndex === evt.newIndex) {
        if (dragTargetParentId !== -1 && dragTargetParentId !== dragged.parentId) {
          window.$message?.warning('仅支持同级菜单排序');
        }
        return;
      }
      const parentId = dragged.parentId;
      const tbodyEl = tableWrapRef.value?.querySelector('.ant-table-tbody');
      if (!tbodyEl) return;
      // 拖拽后 DOM 已重排，按 DOM 顺序读取同级兄弟的新次序
      const domIds = Array.from(tbodyEl.querySelectorAll('tr[data-row-key]'))
        .map(tr => Number((tr as HTMLElement).getAttribute('data-row-key')))
        .filter(id => {
          const n = findNode(id);
          return n && n.parentId === parentId;
        });
      const siblings = parentId === 0 ? tableData.value : (findNode(parentId)?.children ?? []);
      const ordered = domIds.map(id => siblings.find(s => s.id === id)).filter((s): s is Api.Menu.MenuVO => Boolean(s));
      if (parentId === 0) {
        tableData.value = ordered;
      } else {
        const parent = findNode(parentId);
        if (parent) parent.children = ordered;
        tableData.value = [...tableData.value];
      }
      submitSort(parentId, domIds);
    }
  });
}

async function submitSort(parentId: number, ids: number[]) {
  const { error } = await fetchMenuSort({ parentId, ids });
  if (!error) {
    window.$message?.success('排序已更新');
  } else {
    window.$message?.error('排序保存失败，已恢复');
  }
  // 重新拉取以保证 displayOrder 与后端一致，并重建 Sortable 实例
  getData();
}

// 数据或展开状态变化后，待 DOM 更新重新初始化 Sortable
watch([tableData, expandedKeys], () => {
  nextTick(initSortable);
});

const columns = computed(() => {
  const cols: any[] = [
    {
      title: '',
      key: 'drag',
      align: 'center' as const,
      width: 64
    },
    {
      title: '菜单名称',
      dataIndex: 'menuName',
      key: 'menuName',
      width: 220
    },
    {
      title: '类型',
      key: 'menuType',
      align: 'center' as const,
      width: 90
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      align: 'center' as const,
      width: 120
    },
    {
      title: '权限标识',
      dataIndex: 'perms',
      key: 'perms',
      align: 'center' as const,
      width: 180,
      ellipsis: true
    },
    {
      title: '组件路径',
      dataIndex: 'component',
      key: 'component',
      align: 'center' as const,
      width: 200,
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      align: 'center' as const,
      width: 100
    },
    {
      title: '操作',
      key: 'action',
      align: 'center' as const,
      fixed: 'right' as const,
      width: 260
    }
  ];
  return cols;
});

onMounted(() => {
  getData();
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <ACard :bordered="false" class="card-wrapper">
      <div class="mb-16px flex items-center gap-8px">
        <AButton v-if="hasAuth('system:menu:add')" type="primary" @click="handleAdd">新增菜单</AButton>
        <AButton @click="toggleExpandAll">{{ allExpanded ? '全部折叠' : '全部展开' }}</AButton>
        <span class="pl-12px text-12px text-gray-400">
          拖动时红色虚线框会圈出可放置的
          <b class="text-red-500">同级范围</b>
          ，跨级不可拖
        </span>
      </div>
      <div ref="tableWrapRef" class="menu-drag-wrap">
        <ATable
          :columns="columns"
          :data-source="tableData"
          :loading="loading"
          :pagination="false"
          :scroll="{ x: 1240 }"
          row-key="id"
          size="small"
          :expanded-row-keys="expandedKeys"
          children-column-name="children"
          :expand-icon-column-index="1"
          @expand="handleExpand"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'drag'">
              <div
                class="drag-handle h-full w-full flex-center cursor-move select-none text-18px text-gray-400"
                title="拖拽排序（仅限同级）"
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
            <template v-if="column.key === 'icon'">
              <div class="flex-center">
                <SvgIcon
                  v-if="(record as Api.Menu.MenuVO).icon"
                  :icon="(record as Api.Menu.MenuVO).icon"
                  style="font-size: 18px"
                />
                <span v-else class="text-gray-300">-</span>
              </div>
            </template>
            <template v-if="column.key === 'menuType'">
              <ATag :color="menuTypeColor((record as Api.Menu.MenuVO).menuType)">
                {{ menuTypeText((record as Api.Menu.MenuVO).menuType) }}
              </ATag>
            </template>
            <template v-if="column.key === 'status'">
              <ASwitch
                :checked="(record as Api.Menu.MenuVO).status === 1"
                :disabled="!hasAuth('system:menu:editStatus')"
                @change="(checked: any) => handleStatusChange(record as Api.Menu.MenuVO, Boolean(checked))"
              />
            </template>
            <template v-if="column.key === 'action'">
              <ASpace>
                <AButton
                  v-if="hasAuth('system:menu:add')"
                  type="link"
                  size="small"
                  @click="handleAddChild(record as Api.Menu.MenuVO)"
                >
                  新增子项
                </AButton>
                <AButton
                  v-if="hasAuth('system:menu:edit')"
                  type="link"
                  size="small"
                  @click="handleEdit(record as Api.Menu.MenuVO)"
                >
                  编辑
                </AButton>
                <AButton
                  v-if="hasAuth('system:menu:delete')"
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(record as Api.Menu.MenuVO)"
                >
                  删除
                </AButton>
              </ASpace>
            </template>
          </template>
        </ATable>
      </div>
    </ACard>

    <MenuModal
      v-model:visible="modalState.visible"
      :type="modalState.type"
      :row="modalState.row"
      :tree="tableData"
      :default-parent-id="modalState.defaultParentId"
      @submitted="getData"
    />
  </div>
</template>

<style scoped>
/* 纵向滚动交给外层容器：antd 表格本身不配 scroll.y（否则分离表体破坏拖拽），由本容器提供纵向滚动 */
.menu-drag-wrap {
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
:deep(.ant-table-tbody .ant-switch),
:deep(.ant-table-tbody .ant-table-row-expand-icon) {
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

/* 拖拽时：红色虚线框圈出可放置的同级范围（onStart 给兄弟行加 .drag-allowed） */
:deep(.ant-table-tbody tr.drag-allowed) > td {
  border-top: 2px dashed #f5222d !important;
  border-bottom: 2px dashed #f5222d !important;
}
:deep(.ant-table-tbody tr.drag-allowed) > td:first-child {
  border-left: 2px dashed #f5222d !important;
}
:deep(.ant-table-tbody tr.drag-allowed) > td:last-child {
  border-right: 2px dashed #f5222d !important;
}
/* 被拖动的源行：浅红底，便于辨认 */
:deep(.ant-table-tbody tr.drag-source) > td {
  background-color: rgba(245, 34, 45, 0.06) !important;
}
</style>
