<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import { Modal } from 'ant-design-vue';
import { fetchSysConfigDelete, fetchSysConfigPage } from '@/service/api';
import { useTableScrollY } from '@/hooks/common/use-table-scroll-y';
import { useAuth } from '@/hooks/business/auth';
import SysConfigModal from './modules/config-modal.vue';

const tableScrollRef = ref<HTMLElement | null>(null);
const { tableScrollY } = useTableScrollY(tableScrollRef);

defineOptions({
  name: 'SystemSysConfig'
});

const { hasAuth } = useAuth();

const searchParams = reactive<{ keyword: string; configType: number | undefined }>({
  keyword: '',
  configType: undefined
});

const tableData = ref<Api.SysConfig.SysConfigVO[]>([]);
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
  const { data, error } = await fetchSysConfigPage({
    page: pagination.current ?? 1,
    pageSize: pagination.pageSize ?? 10,
    keyword: searchParams.keyword || undefined,
    configType: searchParams.configType
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
  searchParams.configType = undefined;
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
  row: null as Api.SysConfig.SysConfigVO | null
});

function openAdd() {
  modalState.type = 'add';
  modalState.row = null;
  modalState.visible = true;
}

function openEdit(row: Api.SysConfig.SysConfigVO) {
  modalState.type = 'edit';
  modalState.row = row;
  modalState.visible = true;
}

function handleDelete(row: Api.SysConfig.SysConfigVO) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除参数 "${row.configName}" 吗？`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      const { error } = await fetchSysConfigDelete(row.id);
      if (!error) {
        window.$message?.success('删除成功');
        getData();
      }
    }
  });
}

const columns = [
  {
    title: '序号',
    key: 'index',
    align: 'center' as const,
    width: 70
  },
  {
    title: '参数名称',
    dataIndex: 'configName',
    key: 'configName',
    align: 'center' as const,
    width: 160
  },
  {
    title: '参数键名',
    dataIndex: 'configKey',
    key: 'configKey',
    align: 'center' as const,
    width: 220
  },
  {
    title: '参数值',
    dataIndex: 'configValue',
    key: 'configValue',
    align: 'center' as const,
    width: 180,
    ellipsis: true
  },
  {
    title: '是否内置',
    dataIndex: 'configType',
    key: 'configType',
    align: 'center' as const,
    width: 110
  },
  {
    title: '备注',
    dataIndex: 'remark',
    key: 'remark',
    align: 'center' as const,
    width: 200,
    ellipsis: true
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
            placeholder="参数名称/键名"
            allow-clear
            @press-enter="handleSearch"
          />
        </AFormItem>
        <AFormItem label="是否内置">
          <ASelect v-model:value="searchParams.configType" placeholder="请选择" allow-clear class="w-140px">
            <ASelectOption :value="1">是</ASelectOption>
            <ASelectOption :value="0">否</ASelectOption>
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

    <ACard :bordered="false" class="config-card flex-1-hidden card-wrapper">
      <div class="mb-16px">
        <AButton v-if="hasAuth('system:config:add')" type="primary" @click="openAdd">新增参数</AButton>
      </div>
      <div ref="tableScrollRef" class="flex-1 overflow-hidden">
        <ATable
          :columns="columns"
          :data-source="tableData"
          :loading="loading"
          :pagination="pagination"
          row-key="id"
          size="small"
          :scroll="{ x: 1170, y: tableScrollY }"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'index'">
              {{ ((pagination.current ?? 1) - 1) * (pagination.pageSize ?? 10) + index + 1 }}
            </template>
            <template v-if="column.key === 'configType'">
              <ATag :color="(record as Api.SysConfig.SysConfigVO).configType === 1 ? 'processing' : 'default'">
                {{ (record as Api.SysConfig.SysConfigVO).configType === 1 ? '是' : '否' }}
              </ATag>
            </template>
            <template v-if="column.key === 'action'">
              <ASpace>
                <AButton
                  v-if="hasAuth('system:config:edit')"
                  type="link"
                  size="small"
                  @click="openEdit(record as Api.SysConfig.SysConfigVO)"
                >
                  编辑
                </AButton>
                <AButton
                  v-if="hasAuth('system:config:delete')"
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(record as Api.SysConfig.SysConfigVO)"
                >
                  删除
                </AButton>
              </ASpace>
            </template>
          </template>
        </ATable>
      </div>
    </ACard>

    <SysConfigModal
      v-model:visible="modalState.visible"
      :type="modalState.type"
      :row="modalState.row"
      @submitted="getData"
    />
  </div>
</template>

<style scoped>
.config-card :deep(.ant-card-body) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
