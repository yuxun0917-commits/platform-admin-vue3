<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Modal } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import {
  fetchStorageConfigDelete,
  fetchStorageConfigEditStatus,
  fetchStorageConfigEnums,
  fetchStorageConfigPage,
  fetchStorageConfigSetDefault
} from '@/service/api';
import { useAuth } from '@/hooks/business/auth';
import StorageConfigOperateModal from './modules/storage-config-operate-modal.vue';

defineOptions({
  name: 'StorageConfig'
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

const tableData = ref<Api.StorageConfig.ConfigVO[]>([]);
const loading = ref(false);
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: total => `共 ${total} 条`
});

const statusOptions = ref<Api.Common.EnumOption[]>([]);
const storageTypeOptions = ref<Api.Common.EnumOption[]>([]);

/** code -> desc 映射，来自 /storage-config/enums 的 storageType */
const storageTypeMap = computed<Record<number, string>>(() => {
  const map: Record<number, string> = {};
  for (const item of storageTypeOptions.value) map[item.code] = item.desc;
  return map;
});

/** 存储类型对应的 Tag 颜色 */
const storageTypeColorMap: Record<number, string> = {
  1: 'green',
  2: 'orange',
  3: 'cyan',
  4: 'purple'
};

async function loadEnums() {
  const { data, error } = await fetchStorageConfigEnums();
  if (!error && data) {
    statusOptions.value = data.status;
    storageTypeOptions.value = data.storageType;
  }
}

async function getData() {
  loading.value = true;
  const { data, error } = await fetchStorageConfigPage({
    page: pagination.current,
    pageSize: pagination.pageSize,
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
  row: null as Api.StorageConfig.ConfigVO | null
});

function handleAdd() {
  modalState.type = 'add';
  modalState.row = null;
  modalState.visible = true;
}

function handleEdit(row: Api.StorageConfig.ConfigVO) {
  modalState.type = 'edit';
  modalState.row = row;
  modalState.visible = true;
}

function handleDelete(row: Api.StorageConfig.ConfigVO) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除存储配置 "${row.configName}" 吗？`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      const { error } = await fetchStorageConfigDelete(row.id);
      if (!error) {
        window.$message?.success('删除成功');
        getData();
      }
    }
  });
}

async function handleStatusChange(row: Api.StorageConfig.ConfigVO, checked: boolean) {
  const { error } = await fetchStorageConfigEditStatus(row.id, checked ? 1 : 0);
  if (!error) {
    window.$message?.success('状态切换成功');
    row.status = checked ? 1 : 0;
    row.statusText = checked ? '启用' : '停用';
  }
}

function handleDefaultChange(row: Api.StorageConfig.ConfigVO, checked: boolean) {
  // 已是默认不允许取消（必须始终有一个默认存储）
  if (!checked) return;

  Modal.confirm({
    title: '设为默认',
    content: `确定将 "${row.configName}" 设为默认存储吗？`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      const { error } = await fetchStorageConfigSetDefault(row.id);
      if (!error) {
        window.$message?.success('已设为默认');
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
    title: '配置名称',
    dataIndex: 'configName',
    key: 'configName',
    align: 'center' as const,
    width: 140
  },
  {
    title: '存储类型',
    dataIndex: 'storageType',
    key: 'storageType',
    align: 'center' as const,
    width: 120
  },
  {
    title: '默认',
    dataIndex: 'isDefault',
    key: 'isDefault',
    align: 'center' as const,
    width: 80
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    align: 'center' as const,
    width: 90
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
    width: 140
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
            placeholder="配置名称/接入点"
            allow-clear
            @press-enter="handleSearch"
          />
        </AFormItem>
        <AFormItem label="状态">
          <ASelect v-model:value="searchParams.status" placeholder="请选择状态" allow-clear class="w-140px">
            <ASelectOption v-for="item in statusOptions" :key="item.code" :value="item.code">
              {{ item.desc }}
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
        <AButton v-if="hasAuth('system:storage:add')" type="primary" @click="handleAdd">新增配置</AButton>
      </div>
      <ATable
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        size="small"
        :scroll="{ x: 810 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ ((pagination.current ?? 1) - 1) * (pagination.pageSize ?? 10) + index + 1 }}
          </template>
          <template v-if="column.key === 'storageType'">
            <ATag :color="storageTypeColorMap[(record as Api.StorageConfig.ConfigVO).storageType] || 'default'">
              {{
                storageTypeMap[(record as Api.StorageConfig.ConfigVO).storageType] ||
                (record as Api.StorageConfig.ConfigVO).storageTypeText
              }}
            </ATag>
          </template>
          <template v-if="column.key === 'isDefault'">
            <ASwitch
              :checked="(record as Api.StorageConfig.ConfigVO).isDefault === 1"
              :disabled="
                (record as Api.StorageConfig.ConfigVO).isDefault === 1 || !hasAuth('system:storage:setDefault')
              "
              @change="(checked: any) => handleDefaultChange(record as Api.StorageConfig.ConfigVO, Boolean(checked))"
            />
          </template>
          <template v-if="column.key === 'status'">
            <ASwitch
              :disabled="!hasAuth('system:storage:edit')"
              :checked="(record as Api.StorageConfig.ConfigVO).status === 1"
              @change="(checked: any) => handleStatusChange(record as Api.StorageConfig.ConfigVO, Boolean(checked))"
            />
          </template>
          <template v-if="column.key === 'action'">
            <ASpace>
              <AButton
                v-if="hasAuth('system:storage:edit')"
                type="link"
                size="small"
                @click="handleEdit(record as Api.StorageConfig.ConfigVO)"
              >
                编辑
              </AButton>
              <AButton
                v-if="hasAuth('system:storage:delete')"
                type="link"
                size="small"
                danger
                @click="handleDelete(record as Api.StorageConfig.ConfigVO)"
              >
                删除
              </AButton>
            </ASpace>
          </template>
        </template>
      </ATable>
    </ACard>

    <StorageConfigOperateModal
      v-model:visible="modalState.visible"
      :type="modalState.type"
      :row="modalState.row"
      @submitted="getData"
    />
  </div>
</template>

<style scoped></style>
