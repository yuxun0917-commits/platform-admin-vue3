<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { Modal } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import Sortable from 'sortablejs';
import { fetchRoleDelete, fetchRoleEditStatus, fetchRoleEnums, fetchRolePage, fetchRoleSort } from '@/service/api';
import { useAuth } from '@/hooks/business/auth';
import RoleModal from './modules/role-modal.vue';
import MenuAuthModal from './modules/menu-auth-modal.vue';

defineOptions({
  name: 'SystemRole'
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

const tableData = ref<Api.Role.RoleVO[]>([]);
const loading = ref(false);
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: total => `共 ${total} 条`
});

const statusOptions = ref<{ value: number; label: string }[]>([]);

async function loadStatusOptions() {
  const { data, error } = await fetchRoleEnums();
  if (!error && data) {
    statusOptions.value = data.map(item => ({ value: item.code, label: item.desc }));
  }
}

async function getData() {
  loading.value = true;
  const { data, error } = await fetchRolePage({
    page: pagination.current ?? 1,
    pageSize: pagination.pageSize ?? 10,
    keyword: searchParams.keyword || undefined,
    status: searchParams.status as Api.Role.Status | undefined
  });

  if (!error && data) {
    // 前端按 displayOrder 升序渲染（与后端排序口径一致，避免返回顺序不确定）
    const records = [...(data.records ?? [])].sort(
      (a, b) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER)
    );
    tableData.value = records;
    pagination.total = data.total;
    pagination.current = data.page;
    pagination.pageSize = data.pageSize;
  }

  loading.value = false;
}

function handleSearch() {
  pagination.current = 1;
  getData();
}

function handleReset() {
  searchParams.keyword = '';
  searchParams.status = undefined;
  pagination.current = 1;
  getData();
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 10;
  getData();
}

const modalState = reactive({
  visible: false,
  type: 'add' as 'add' | 'edit',
  row: null as Api.Role.RoleVO | null
});

function handleAdd() {
  modalState.type = 'add';
  modalState.row = null;
  modalState.visible = true;
}

function handleEdit(row: Api.Role.RoleVO) {
  modalState.type = 'edit';
  modalState.row = row;
  modalState.visible = true;
}

function handleDelete(row: Api.Role.RoleVO) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除角色 "${row.roleName}" 吗？`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      const { error } = await fetchRoleDelete(row.id);
      if (!error) {
        window.$message?.success('删除成功');
        getData();
      }
    }
  });
}

async function handleStatusChange(row: Api.Role.RoleVO, checked: boolean) {
  const { error } = await fetchRoleEditStatus(row.id);
  if (!error) {
    window.$message?.success('状态切换成功');
    row.status = checked ? 1 : 0;
    row.statusText = checked ? '正常' : '禁用';
  }
}

const menuModalState = reactive({
  visible: false,
  roleId: null as number | null,
  roleName: ''
});

function handleAssignMenus(row: Api.Role.RoleVO) {
  menuModalState.roleId = row.id;
  menuModalState.roleName = row.roleName;
  menuModalState.visible = true;
}

/* ---------- 拖拽排序（基于 SortableJS，整行可拖，按钮/开关除外） ---------- */
const tableWrapRef = ref<HTMLElement>();
let sortableInstance: Sortable | null = null;

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
    filter: '.ant-btn, .ant-switch, .ant-table-row-expand-icon, input, a',
    preventOnFilter: false,
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    onEnd(evt) {
      if (evt.oldIndex === evt.newIndex) return;
      const tbodyEl = tableWrapRef.value?.querySelector('.ant-table-tbody');
      if (!tbodyEl) return;
      const domIds = Array.from(tbodyEl.querySelectorAll('tr[data-row-key]')).map(tr =>
        Number((tr as HTMLElement).getAttribute('data-row-key'))
      );
      const ordered = domIds
        .map(id => tableData.value.find(r => r.id === id))
        .filter((r): r is Api.Role.RoleVO => Boolean(r));
      tableData.value = ordered;
      submitSort(domIds);
    }
  });
}

// 数据变化后待 DOM 更新重新初始化 Sortable
watch(tableData, () => nextTick(initSortable));

async function submitSort(ids: number[]) {
  const { error } = await fetchRoleSort({
    startOrder: ((pagination.current ?? 1) - 1) * (pagination.pageSize ?? 10) + 1,
    ids
  });
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
    {
      title: '',
      key: 'drag',
      align: 'center' as const,
      width: 60
    },
    {
      title: '角色名称',
      dataIndex: 'roleName',
      key: 'roleName',
      align: 'center' as const,
      width: 140
    },
    {
      title: '角色编码',
      dataIndex: 'roleCode',
      key: 'roleCode',
      align: 'center' as const,
      width: 140
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      align: 'center' as const,
      width: 100
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      align: 'center' as const,
      width: 200
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      align: 'center' as const,
      width: 170
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      align: 'center' as const,
      width: 170
    },
    {
      title: '操作',
      key: 'action',
      align: 'center' as const,
      fixed: 'right' as const,
      width: 220
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
          <AInput v-model:value="searchParams.keyword" placeholder="角色名称" allow-clear @press-enter="handleSearch" />
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
      <div class="mb-16px">
        <AButton v-if="hasAuth('system:role:add')" type="primary" @click="handleAdd">新增角色</AButton>
        <span class="pl-12px text-12px text-gray-400">拖动整行（或最左侧手柄）可调整排序</span>
      </div>
      <div ref="tableWrapRef" class="role-drag-wrap">
        <ATable
          :columns="columns"
          :data-source="tableData"
          :loading="loading"
          :pagination="pagination"
          row-key="id"
          size="small"
          :scroll="{ x: 1200 }"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'drag'">
              <div class="h-24px flex-center cursor-grab select-none text-18px text-gray-400" title="拖拽排序">
                <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" class="pointer-events-none">
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
                :checked="record.status === 1"
                :disabled="!hasAuth('system:role:editStatus')"
                @change="(checked: any) => handleStatusChange(record as Api.Role.RoleVO, Boolean(checked))"
              />
            </template>
            <template v-if="column.key === 'action'">
              <ASpace>
                <AButton
                  v-if="hasAuth('system:role:edit')"
                  type="link"
                  size="small"
                  @click="handleEdit(record as Api.Role.RoleVO)"
                >
                  编辑
                </AButton>
                <AButton
                  v-if="hasAuth('system:role:assignMenus')"
                  type="link"
                  size="small"
                  @click="handleAssignMenus(record as Api.Role.RoleVO)"
                >
                  分配权限
                </AButton>
                <AButton
                  v-if="hasAuth('system:role:delete')"
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(record as Api.Role.RoleVO)"
                >
                  删除
                </AButton>
              </ASpace>
            </template>
          </template>
        </ATable>
      </div>
    </ACard>

    <RoleModal
      v-model:visible="modalState.visible"
      :type="modalState.type"
      :row="modalState.row"
      @submitted="getData"
    />

    <MenuAuthModal
      v-model:visible="menuModalState.visible"
      :role-id="menuModalState.roleId"
      :role-name="menuModalState.roleName"
      @submitted="getData"
    />
  </div>
</template>

<style scoped>
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
</style>
