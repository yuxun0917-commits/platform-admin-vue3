<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import { Modal } from 'ant-design-vue';
import { fetchJobChangeStatus, fetchJobDelete, fetchJobEnums, fetchJobPage, fetchJobRun } from '@/service/api';
import JobModal from './modules/job-modal.vue';
import JobLogDrawer from './modules/job-log-drawer.vue';

defineOptions({
  name: 'SystemJob'
});

const searchParams = reactive<{ keyword: string; status: number | undefined }>({
  keyword: '',
  status: undefined
});

const statusOptions = ref<{ label: string; value: number }[]>([]);

const tableData = ref<Api.Job.SysJobVO[]>([]);
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
  const { data, error } = await fetchJobPage({
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
  row: null as Api.Job.SysJobVO | null
});

function handleAdd() {
  modalState.type = 'add';
  modalState.row = null;
  modalState.visible = true;
}

function handleEdit(row: Api.Job.SysJobVO) {
  modalState.type = 'edit';
  modalState.row = row;
  modalState.visible = true;
}

function handleDelete(row: Api.Job.SysJobVO) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除定时任务 "${row.jobName}" 吗？`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      const { error } = await fetchJobDelete(row.id);
      if (!error) {
        window.$message?.success('删除成功');
        getData();
      }
    }
  });
}

async function handleStatusChange(row: Api.Job.SysJobVO, checked: boolean) {
  const { error } = await fetchJobChangeStatus(row.id);
  if (!error) {
    window.$message?.success(checked ? '任务已启用' : '任务已暂停');
    row.status = checked ? 1 : 0;
    row.statusText = checked ? '正常' : '暂停';
  }
}

async function handleRun(row: Api.Job.SysJobVO) {
  const { error } = await fetchJobRun(row.id);
  if (!error) {
    window.$message?.success('任务已触发执行一次');
  }
}

const logDrawerState = reactive({
  visible: false,
  jobId: null as number | null,
  jobName: ''
});

function handleViewLog(row: Api.Job.SysJobVO) {
  logDrawerState.jobId = row.id;
  logDrawerState.jobName = row.jobName;
  logDrawerState.visible = true;
}

const columns = [
  {
    title: '任务编号',
    dataIndex: 'id',
    key: 'id',
    align: 'center' as const,
    width: 90
  },
  {
    title: '任务名称',
    dataIndex: 'jobName',
    key: 'jobName',
    align: 'center' as const,
    width: 140,
    ellipsis: true
  },
  {
    title: '任务组名',
    dataIndex: 'jobGroup',
    key: 'jobGroup',
    align: 'center' as const,
    width: 110,
    ellipsis: true
  },
  {
    title: '调用目标',
    dataIndex: 'invokeTarget',
    key: 'invokeTarget',
    align: 'center' as const,
    width: 220,
    ellipsis: true
  },
  {
    title: 'cron表达式',
    dataIndex: 'cronExpression',
    key: 'cronExpression',
    align: 'center' as const,
    width: 160,
    ellipsis: true
  },
  {
    title: '错失策略',
    dataIndex: 'misfirePolicyText',
    key: 'misfirePolicyText',
    align: 'center' as const,
    width: 110
  },
  {
    title: '并发',
    dataIndex: 'concurrentText',
    key: 'concurrentText',
    align: 'center' as const,
    width: 100
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
    width: 250
  }
];

onMounted(async () => {
  const { data } = await fetchJobEnums();
  if (data) {
    statusOptions.value = (data.jobStatus || []).map(item => ({ label: item.desc, value: item.code }));
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
            placeholder="任务名称/任务组名"
            allow-clear
            @press-enter="handleSearch"
          />
        </AFormItem>
        <AFormItem label="状态">
          <ASelect v-model:value="searchParams.status" placeholder="请选择状态" allow-clear class="w-140px">
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
      <div class="mb-16px">
        <AButton type="primary" @click="handleAdd">新增任务</AButton>
      </div>
      <ATable
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        size="small"
        :scroll="{ x: 1490 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <ASwitch
              :checked="(record as Api.Job.SysJobVO).status === 1"
              @change="(checked: any) => handleStatusChange(record as Api.Job.SysJobVO, Boolean(checked))"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <ASpace>
              <AButton type="link" size="small" @click="handleEdit(record as Api.Job.SysJobVO)">编辑</AButton>
              <AButton type="link" size="small" @click="handleRun(record as Api.Job.SysJobVO)">执行一次</AButton>
              <AButton type="link" size="small" @click="handleViewLog(record as Api.Job.SysJobVO)">日志</AButton>
              <AButton type="link" size="small" danger @click="handleDelete(record as Api.Job.SysJobVO)">删除</AButton>
            </ASpace>
          </template>
        </template>
      </ATable>
    </ACard>

    <JobModal v-model:visible="modalState.visible" :type="modalState.type" :row="modalState.row" @submitted="getData" />
    <JobLogDrawer
      v-model:visible="logDrawerState.visible"
      :job-id="logDrawerState.jobId"
      :job-name="logDrawerState.jobName"
    />
  </div>
</template>

<style scoped></style>
