<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import { Modal } from 'ant-design-vue';
import { fetchJobLogClean, fetchJobLogDelete, fetchJobLogPage } from '@/service/api';

interface Props {
  visible: boolean;
  jobId: number | null;
  jobName?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void;
}>();

const status = ref<number | undefined>(undefined);
const statusOptions = [
  { label: '成功', value: 1 },
  { label: '失败', value: 0 }
];

const tableData = ref<Api.JobLog.SysJobLogVO[]>([]);
const loading = ref(false);
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: total => `共 ${total} 条`
});

async function getData() {
  if (!props.jobId) return;
  loading.value = true;
  const { data, error } = await fetchJobLogPage({
    jobId: props.jobId,
    page: pagination.current ?? 1,
    pageSize: pagination.pageSize ?? 10,
    status: status.value
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
  status.value = undefined;
  pagination.current = 1;
  getData();
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 10;
  getData();
}

function handleDelete(row: Api.JobLog.SysJobLogVO) {
  Modal.confirm({
    title: '确认删除',
    content: '确定删除该条执行日志吗？',
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      const { error } = await fetchJobLogDelete(row.id);
      if (!error) {
        window.$message?.success('删除成功');
        getData();
      }
    }
  });
}

function handleClean() {
  if (!props.jobId) return;
  Modal.confirm({
    title: '清空日志',
    content: `确定清空任务 "${props.jobName ?? ''}" 的全部执行日志吗？此操作不可恢复。`,
    okText: '确认',
    cancelText: '取消',
    okButtonProps: { danger: true },
    async onOk() {
      const { error } = await fetchJobLogClean(props.jobId as number);
      if (!error) {
        window.$message?.success('清空成功');
        pagination.current = 1;
        getData();
      }
    }
  });
}

function handleClose() {
  emit('update:visible', false);
}

watch(
  () => props.visible,
  val => {
    if (val && props.jobId) {
      status.value = undefined;
      pagination.current = 1;
      getData();
    }
  }
);

const columns = [
  { title: '日志编号', dataIndex: 'id', key: 'id', align: 'center' as const, width: 90 },
  { title: '任务名称', dataIndex: 'jobName', key: 'jobName', align: 'center' as const, width: 140, ellipsis: true },
  { title: '任务组名', dataIndex: 'jobGroup', key: 'jobGroup', align: 'center' as const, width: 100 },
  {
    title: '调用目标',
    dataIndex: 'invokeTarget',
    key: 'invokeTarget',
    align: 'center' as const,
    width: 200,
    ellipsis: true
  },
  {
    title: '日志信息',
    dataIndex: 'jobMessage',
    key: 'jobMessage',
    align: 'center' as const,
    width: 160,
    ellipsis: true
  },
  { title: '执行状态', dataIndex: 'status', key: 'status', align: 'center' as const, width: 90 },
  { title: '耗时(ms)', dataIndex: 'costTime', key: 'costTime', align: 'center' as const, width: 100 },
  { title: '执行时间', dataIndex: 'createTime', key: 'createTime', align: 'center' as const, width: 170 },
  { title: '操作', key: 'action', align: 'center' as const, fixed: 'right' as const, width: 90 }
];
</script>

<template>
  <ADrawer :open="visible" title="任务执行日志" :width="1500" @close="handleClose">
    <div class="flex-col gap-16px">
      <AForm layout="inline">
        <AFormItem label="执行状态">
          <ASelect v-model:value="status" placeholder="请选择状态" allow-clear class="w-140px">
            <ASelectOption v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </ASelectOption>
          </ASelect>
        </AFormItem>
        <AFormItem>
          <ASpace>
            <AButton type="primary" @click="handleSearch">查询</AButton>
            <AButton @click="handleReset">重置</AButton>
            <AButton danger @click="handleClean">清空日志</AButton>
          </ASpace>
        </AFormItem>
      </AForm>

      <ATable
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        size="small"
        :scroll="{ x: 1140 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <ATag :color="(record as Api.JobLog.SysJobLogVO).status === 1 ? 'success' : 'error'">
              {{ (record as Api.JobLog.SysJobLogVO).statusText }}
            </ATag>
          </template>
          <template v-else-if="column.key === 'action'">
            <AButton type="link" size="small" danger @click="handleDelete(record as Api.JobLog.SysJobLogVO)">
              删除
            </AButton>
          </template>
        </template>
      </ATable>
    </div>
  </ADrawer>
</template>

<style scoped></style>
