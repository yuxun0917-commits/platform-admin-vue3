<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import { Modal } from 'ant-design-vue';
import { fetchSysLogClean, fetchSysLogDelete, fetchSysLogEnums, fetchSysLogPage } from '@/service/api';
import OperlogDetailDrawer from './modules/detail-drawer.vue';

defineOptions({
  name: 'LogOperlog'
});

const searchParams = reactive<{ keyword: string; status: number | undefined }>({
  keyword: '',
  status: undefined
});

const statusOptions = ref<{ label: string; value: number }[]>([]);

const tableData = ref<Api.SysLog.SysLogVO[]>([]);
const loading = ref(false);
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: total => `共 ${total} 条`
});

async function getData() {
  loading.value = true;
  const { data, error } = await fetchSysLogPage({
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

const detailState = reactive({
  visible: false,
  row: null as Api.SysLog.SysLogVO | null
});

function openDetail(row: Api.SysLog.SysLogVO) {
  detailState.row = row;
  detailState.visible = true;
}

function handleDelete(row: Api.SysLog.SysLogVO) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除该条操作日志吗？此操作不可恢复。`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      const { error } = await fetchSysLogDelete(row.id);
      if (!error) {
        window.$message?.success('删除成功');
        getData();
      }
    }
  });
}

function handleClean() {
  Modal.confirm({
    title: '确认清空',
    content: '确定清空全部操作日志吗？此操作不可恢复。',
    okType: 'danger',
    okText: '确认清空',
    cancelText: '取消',
    async onOk() {
      const { error } = await fetchSysLogClean();
      if (!error) {
        window.$message?.success('清空成功');
        pagination.current = 1;
        getData();
      }
    }
  });
}

function methodColor(method: string) {
  const m = (method || '').toUpperCase();
  if (m === 'GET') return 'green';
  if (m === 'POST') return 'blue';
  if (m === 'PUT') return 'orange';
  if (m === 'DELETE') return 'red';
  return 'default';
}

const columns = [
  {
    title: '日志编号',
    dataIndex: 'id',
    key: 'id',
    align: 'center' as const,
    width: 90
  },
  {
    title: '操作模块',
    dataIndex: 'title',
    key: 'title',
    align: 'center' as const,
    width: 160,
    ellipsis: true
  },
  {
    title: '操作人员',
    dataIndex: 'operName',
    key: 'operName',
    align: 'center' as const,
    width: 120,
    ellipsis: true
  },
  {
    title: '请求方式',
    dataIndex: 'requestMethod',
    key: 'requestMethod',
    align: 'center' as const,
    width: 110
  },
  {
    title: '请求地址',
    dataIndex: 'requestUrl',
    key: 'requestUrl',
    align: 'center' as const,
    width: 200,
    ellipsis: true
  },
  {
    title: '操作状态',
    dataIndex: 'statusText',
    key: 'statusText',
    align: 'center' as const,
    width: 100
  },
  {
    title: '耗时',
    dataIndex: 'costTime',
    key: 'costTime',
    align: 'center' as const,
    width: 100
  },
  {
    title: '操作时间',
    dataIndex: 'operTime',
    key: 'operTime',
    align: 'center' as const,
    width: 170
  },
  {
    title: '操作',
    key: 'action',
    align: 'center' as const,
    fixed: 'right' as const,
    width: 140
  }
];

onMounted(async () => {
  const { data } = await fetchSysLogEnums();
  if (data) {
    statusOptions.value = data.map(item => ({ label: item.desc, value: item.code }));
  }
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
            placeholder="操作模块/操作人员"
            allow-clear
            @press-enter="handleSearch"
          />
        </AFormItem>
        <AFormItem label="操作状态">
          <ASelect v-model:value="searchParams.status" placeholder="请选择" allow-clear class="w-140px">
            <ASelectOption v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
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
      <div class="mb-16px flex justify-between">
        <AButton danger @click="handleClean">清空日志</AButton>
        <AButton @click="getData">刷新</AButton>
      </div>
      <ATable
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        size="small"
        :scroll="{ x: 1100 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'requestMethod'">
            <ATag :color="methodColor((record as Api.SysLog.SysLogVO).requestMethod)">
              {{ (record as Api.SysLog.SysLogVO).requestMethod }}
            </ATag>
          </template>
          <template v-else-if="column.key === 'statusText'">
            <ATag :color="(record as Api.SysLog.SysLogVO).status === 1 ? 'success' : 'error'">
              {{ (record as Api.SysLog.SysLogVO).statusText }}
            </ATag>
          </template>
          <template v-else-if="column.key === 'costTime'">{{ (record as Api.SysLog.SysLogVO).costTime }} ms</template>
          <template v-else-if="column.key === 'action'">
            <ASpace>
              <AButton type="link" size="small" @click="openDetail(record as Api.SysLog.SysLogVO)">详情</AButton>
              <AButton type="link" size="small" danger @click="handleDelete(record as Api.SysLog.SysLogVO)">
                删除
              </AButton>
            </ASpace>
          </template>
        </template>
      </ATable>
    </ACard>

    <OperlogDetailDrawer v-model:visible="detailState.visible" :row="detailState.row" />
  </div>
</template>

<style scoped></style>
