<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import { Modal } from 'ant-design-vue';
import {
  fetchSysLoginLogClean,
  fetchSysLoginLogDelete,
  fetchSysLoginLogEnums,
  fetchSysLoginLogPage
} from '@/service/api';
import LoginlogDetailDrawer from './modules/detail-drawer.vue';

defineOptions({
  name: 'LogLoginlog'
});

const searchParams = reactive<{ keyword: string; loginType: number | undefined; status: number | undefined }>({
  keyword: '',
  loginType: undefined,
  status: undefined
});

const loginTypeOptions = ref<{ label: string; value: number }[]>([]);
const statusOptions = ref<{ label: string; value: number }[]>([]);

const tableData = ref<Api.SysLoginLog.SysLoginLogVO[]>([]);
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
  const { data, error } = await fetchSysLoginLogPage({
    page: pagination.current ?? 1,
    pageSize: pagination.pageSize ?? 10,
    keyword: searchParams.keyword || undefined,
    loginType: searchParams.loginType,
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
  searchParams.loginType = undefined;
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
  row: null as Api.SysLoginLog.SysLoginLogVO | null
});

function openDetail(row: Api.SysLoginLog.SysLoginLogVO) {
  detailState.row = row;
  detailState.visible = true;
}

function handleDelete(row: Api.SysLoginLog.SysLoginLogVO) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除该条登录日志吗？此操作不可恢复。`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      const { error } = await fetchSysLoginLogDelete(row.id);
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
    content: '确定清空全部登录日志吗？此操作不可恢复。',
    okType: 'danger',
    okText: '确认清空',
    cancelText: '取消',
    async onOk() {
      const { error } = await fetchSysLoginLogClean();
      if (!error) {
        window.$message?.success('清空成功');
        pagination.current = 1;
        getData();
      }
    }
  });
}

function loginTypeColor(type: number) {
  if (type === 1) return 'blue'; // 登录
  if (type === 2) return 'cyan'; // 登出
  if (type === 3) return 'orange'; // 踢下线
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
    title: '登录用户',
    dataIndex: 'username',
    key: 'username',
    align: 'center' as const,
    width: 120,
    ellipsis: true
  },
  {
    title: '登录类型',
    dataIndex: 'loginTypeText',
    key: 'loginTypeText',
    align: 'center' as const,
    width: 110
  },
  {
    title: '登录状态',
    dataIndex: 'statusText',
    key: 'statusText',
    align: 'center' as const,
    width: 100
  },
  {
    title: '登录 IP',
    dataIndex: 'loginIp',
    key: 'loginIp',
    align: 'center' as const,
    width: 170,
    ellipsis: true
  },
  {
    title: '登录地点',
    dataIndex: 'loginLocation',
    key: 'loginLocation',
    align: 'center' as const,
    width: 120,
    ellipsis: true
  },
  {
    title: '浏览器',
    dataIndex: 'browser',
    key: 'browser',
    align: 'center' as const,
    width: 110
  },
  {
    title: '操作系统',
    dataIndex: 'os',
    key: 'os',
    align: 'center' as const,
    width: 110
  },
  {
    title: '登录时间',
    dataIndex: 'loginTime',
    key: 'loginTime',
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
  const { data } = await fetchSysLoginLogEnums();
  if (data) {
    loginTypeOptions.value = (data.loginType || []).map(item => ({ label: item.desc, value: item.code }));
    statusOptions.value = (data.status || []).map(item => ({ label: item.desc, value: item.code }));
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
            placeholder="登录用户/登录IP"
            allow-clear
            @press-enter="handleSearch"
          />
        </AFormItem>
        <AFormItem label="登录类型">
          <ASelect v-model:value="searchParams.loginType" placeholder="请选择" allow-clear class="w-140px">
            <ASelectOption v-for="opt in loginTypeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </ASelectOption>
          </ASelect>
        </AFormItem>
        <AFormItem label="登录状态">
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
        :scroll="{ x: 1240 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'loginTypeText'">
            <ATag :color="loginTypeColor((record as Api.SysLoginLog.SysLoginLogVO).loginType)">
              {{ (record as Api.SysLoginLog.SysLoginLogVO).loginTypeText }}
            </ATag>
          </template>
          <template v-else-if="column.key === 'statusText'">
            <ATag :color="(record as Api.SysLoginLog.SysLoginLogVO).status === 1 ? 'success' : 'error'">
              {{ (record as Api.SysLoginLog.SysLoginLogVO).statusText }}
            </ATag>
          </template>
          <template v-else-if="column.key === 'action'">
            <ASpace>
              <AButton type="link" size="small" @click="openDetail(record as Api.SysLoginLog.SysLoginLogVO)">
                详情
              </AButton>
              <AButton type="link" size="small" danger @click="handleDelete(record as Api.SysLoginLog.SysLoginLogVO)">
                删除
              </AButton>
            </ASpace>
          </template>
        </template>
      </ATable>
    </ACard>

    <LoginlogDetailDrawer v-model:visible="detailState.visible" :row="detailState.row" />
  </div>
</template>

<style scoped></style>
