<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import { Modal } from 'ant-design-vue';
import { fetchNoticeDelete, fetchNoticeEnums, fetchNoticePage } from '@/service/api';
import NoticeModal from './modules/notice-modal.vue';

defineOptions({
  name: 'SystemNotice'
});

const searchParams = reactive<{ keyword: string; status: Api.Common.EnableStatus | undefined }>({
  keyword: '',
  status: undefined
});

const tableData = ref<Api.Notice.NoticeVO[]>([]);
const loading = ref(false);
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: total => `共 ${total} 条`
});

const statusOptions = ref<{ value: number; label: string }[]>([]);
const positionOptions = [
  { value: 1, label: '后台' },
  { value: 2, label: '前台' }
];

async function loadEnums() {
  const { data, error } = await fetchNoticeEnums();
  if (!error && data) {
    statusOptions.value = data.status.map(item => ({ value: item.code, label: item.desc }));
  }
}

async function getData() {
  loading.value = true;
  const { data, error } = await fetchNoticePage({
    page: pagination.current ?? 1,
    pageSize: pagination.pageSize ?? 10,
    keyword: searchParams.keyword || undefined,
    status: searchParams.status
  });

  if (!error && data) {
    tableData.value = data.records;
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
  row: null as Api.Notice.NoticeVO | null
});

function openAdd() {
  modalState.type = 'add';
  modalState.row = null;
  modalState.visible = true;
}

function openEdit(row: Api.Notice.NoticeVO) {
  modalState.type = 'edit';
  modalState.row = row;
  modalState.visible = true;
}

function handleDelete(row: Api.Notice.NoticeVO) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除通知 "${row.title}" 吗？`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      const { error } = await fetchNoticeDelete(row.id);
      if (!error) {
        window.$message?.success('删除成功');
        getData();
      }
    }
  });
}

function positionLabel(position: number) {
  return positionOptions.find(item => item.value === position)?.label ?? String(position);
}

const columns = [
  {
    title: '序号',
    key: 'index',
    align: 'center' as const,
    width: 70
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    align: 'center' as const,
    width: 200
  },
  {
    title: '展示位置',
    dataIndex: 'position',
    key: 'position',
    align: 'center' as const,
    width: 120
  },
  {
    title: '内容',
    dataIndex: 'content',
    key: 'content',
    align: 'center' as const,
    width: 260,
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
    title: '操作',
    key: 'action',
    align: 'center' as const,
    fixed: 'right' as const,
    width: 160
  }
];

onMounted(() => {
  loadEnums();
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
            placeholder="标题/内容"
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
      <div class="mb-16px">
        <AButton type="primary" @click="openAdd">新增通知</AButton>
      </div>
      <ATable
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        size="small"
        :scroll="{ x: 1280 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ ((pagination.current ?? 1) - 1) * (pagination.pageSize ?? 10) + index + 1 }}
          </template>
          <template v-if="column.key === 'position'">
            <ATag :color="(record as Api.Notice.NoticeVO).position === 2 ? 'blue' : 'default'">
              {{ positionLabel((record as Api.Notice.NoticeVO).position) }}
            </ATag>
          </template>
          <template v-if="column.key === 'status'">
            <ATag :color="(record as Api.Notice.NoticeVO).status === 1 ? 'success' : 'default'">
              {{ (record as Api.Notice.NoticeVO).status === 1 ? '正常' : '禁用' }}
            </ATag>
          </template>
          <template v-if="column.key === 'action'">
            <ASpace>
              <AButton type="link" size="small" @click="openEdit(record as Api.Notice.NoticeVO)">编辑</AButton>
              <AButton type="link" size="small" danger @click="handleDelete(record as Api.Notice.NoticeVO)">
                删除
              </AButton>
            </ASpace>
          </template>
        </template>
      </ATable>
    </ACard>

    <NoticeModal
      v-model:visible="modalState.visible"
      :type="modalState.type"
      :row="modalState.row"
      @submitted="getData"
    />
  </div>
</template>

<style scoped></style>
