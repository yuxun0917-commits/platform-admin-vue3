<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { Modal } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import Sortable from 'sortablejs';
import { fetchPostDelete, fetchPostEnums, fetchPostPage, fetchPostSort } from '@/service/api';
import { useAuth } from '@/hooks/business/auth';
import { useTableScrollY } from '@/hooks/common/use-table-scroll-y';
import PostModal from './modules/post-modal.vue';

defineOptions({
  name: 'SystemPost'
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

const tableData = ref<Api.Post.PostVO[]>([]);
const loading = ref(false);
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`
});

const statusOptions = ref<{ value: number; label: string }[]>([]);

async function loadStatusOptions() {
  const { data, error } = await fetchPostEnums();
  if (!error && data) {
    statusOptions.value = data.map(item => ({ value: item.code, label: item.desc }));
  }
}

/** 排序：拉到数据后按 displayOrder 升序（与后端排序口径一致） */
async function getData() {
  loading.value = true;
  const { data, error } = await fetchPostPage({
    page: pagination.current ?? 1,
    pageSize: pagination.pageSize ?? 10,
    keyword: searchParams.keyword || undefined,
    status: searchParams.status
  });
  if (!error && data) {
    const sorted = [...data.records].sort(
      (a, b) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER)
    );
    tableData.value = sorted;
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
  row: null as Api.Post.PostVO | null
});

function handleAdd() {
  modalState.type = 'add';
  modalState.row = null;
  modalState.visible = true;
}

function handleEdit(row: Api.Post.PostVO) {
  modalState.type = 'edit';
  modalState.row = row;
  modalState.visible = true;
}

function handleDelete(row: Api.Post.PostVO) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除岗位 "${row.postName}" 吗？`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      const { error } = await fetchPostDelete(row.id);
      if (!error) {
        window.$message?.success('删除成功');
        getData();
      }
    }
  });
}

/* ---------- 拖拽排序（基于 SortableJS，整行可拖，按钮除外） ---------- */
const tableWrapRef = ref<HTMLElement | null>(null);
const { tableScrollY } = useTableScrollY(tableWrapRef);
let sortableInstance: Sortable | null = null;

function destroySortable() {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
}

function clearDragHighlights() {
  const tbodyEl = tableWrapRef.value?.querySelector('.ant-table-tbody');
  tbodyEl?.querySelectorAll('tr.drag-source').forEach(tr => {
    tr.classList.remove('drag-source');
  });
}

function initSortable() {
  const root = tableWrapRef.value;
  if (!root) return;
  const tbody = root.querySelector('.ant-table-tbody') as HTMLElement;
  if (!tbody) return;
  destroySortable();
  sortableInstance = new Sortable(tbody, {
    filter: '.ant-btn, .ant-switch, input, a',
    preventOnFilter: false,
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    onStart(evt) {
      const itemEl = evt.item as HTMLElement;
      itemEl.classList.add('drag-source');
    },
    onEnd(evt) {
      if (evt.oldIndex === evt.newIndex) {
        clearDragHighlights();
        return;
      }
      const tbodyEl = tableWrapRef.value?.querySelector('.ant-table-tbody') as HTMLElement;
      if (!tbodyEl) {
        clearDragHighlights();
        return;
      }
      const domIds = Array.from(tbodyEl.querySelectorAll('tr[data-row-key]')).map(tr =>
        Number((tr as HTMLElement).getAttribute('data-row-key'))
      );
      const ordered = domIds
        .map(id => tableData.value.find(r => r.id === id))
        .filter((r): r is Api.Post.PostVO => Boolean(r));
      tableData.value = ordered;
      clearDragHighlights();
      submitSort(domIds);
    }
  });
}

// 数据变化后待 DOM 更新重新初始化 Sortable
watch(tableData, () => {
  if (hasAuth('system:post:sort')) {
    nextTick(initSortable);
  } else {
    nextTick(destroySortable);
  }
});

async function submitSort(ids: number[]) {
  const { error } = await fetchPostSort({
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
    ...(hasAuth('system:post:sort')
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
      title: '岗位编码',
      dataIndex: 'postCode',
      key: 'postCode',
      align: 'center' as const,
      width: 120
    },
    {
      title: '岗位名称',
      dataIndex: 'postName',
      key: 'postName',
      align: 'center' as const,
      width: 140
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      align: 'center' as const,
      width: 90
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
      width: 160
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
            placeholder="岗位名称/编码"
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

    <ACard :bordered="false" class="post-card flex-1-hidden card-wrapper">
      <div class="mb-16px flex items-center gap-12px">
        <AButton v-if="hasAuth('system:post:add')" type="primary" @click="handleAdd">新增岗位</AButton>
        <span v-if="hasAuth('system:post:sort')" class="text-12px text-gray-400">
          拖动整行（或最左侧手柄）可调整排序
        </span>
      </div>
      <div ref="tableWrapRef" class="post-drag-wrap">
        <ATable
          :columns="columns"
          :data-source="tableData"
          :loading="loading"
          :pagination="pagination"
          row-key="id"
          size="small"
          :scroll="{ x: 1114, y: tableScrollY }"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'drag'">
              <div
                v-if="hasAuth('system:post:sort')"
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
              <ATag :color="record.status === 1 ? 'success' : 'error'">
                {{ record.status === 1 ? '正常' : '禁用' }}
              </ATag>
            </template>
            <template v-if="column.key === 'action'">
              <ASpace>
                <AButton
                  v-if="hasAuth('system:post:edit')"
                  type="link"
                  size="small"
                  @click="handleEdit(record as Api.Post.PostVO)"
                >
                  编辑
                </AButton>
                <AButton
                  v-if="hasAuth('system:post:delete')"
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(record as Api.Post.PostVO)"
                >
                  删除
                </AButton>
              </ASpace>
            </template>
          </template>
        </ATable>
      </div>
    </ACard>

    <PostModal
      v-model:visible="modalState.visible"
      :type="modalState.type"
      :row="modalState.row"
      @submitted="getData"
    />
  </div>
</template>

<style scoped>
.post-card :deep(.ant-card-body) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.post-drag-wrap {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: hidden;
}

/* 整行可拖拽的视觉提示（交互元素除外） */
:deep(.ant-table-tbody > tr) {
  cursor: grab;
}
:deep(.ant-table-tbody > tr:active) {
  cursor: grabbing;
}
:deep(.ant-table-tbody .ant-btn) {
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
:deep(.ant-table-tbody tr.drag-source) > td {
  background-color: rgba(245, 34, 45, 0.08) !important;
}
</style>
