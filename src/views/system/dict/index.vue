<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import { Modal } from 'ant-design-vue';
import { fetchDictDelete, fetchDictPage } from '@/service/api';
import DictModal from './modules/dict-modal.vue';
import DictItemDrawer from './modules/dict-item-drawer.vue';

defineOptions({
  name: 'SystemDict'
});

const searchParams = reactive<{ keyword: string; status: Api.Common.EnableStatus | undefined }>({
  keyword: '',
  status: undefined
});

const tableData = ref<Api.Dict.DictVO[]>([]);
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
  const { data, error } = await fetchDictPage({
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
  row: null as Api.Dict.DictVO | null
});

function openAdd() {
  modalState.type = 'add';
  modalState.row = null;
  modalState.visible = true;
}

const drawerState = reactive({
  visible: false,
  dict: null as Api.Dict.DictVO | null
});
function openItems(row: Api.Dict.DictVO) {
  drawerState.dict = row;
  drawerState.visible = true;
}

function openEdit(row: Api.Dict.DictVO) {
  modalState.type = 'edit';
  modalState.row = row;
  modalState.visible = true;
}

function handleDelete(row: Api.Dict.DictVO) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除字典 "${row.dictName}" 吗？`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      const { error } = await fetchDictDelete(row.id);
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
    title: '字典名称',
    dataIndex: 'dictName',
    key: 'dictName',
    align: 'center' as const,
    width: 160
  },
  {
    title: '字典类型',
    dataIndex: 'dictType',
    key: 'dictType',
    align: 'center' as const,
    width: 200
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
    width: 240
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
            placeholder="字典名称/类型"
            allow-clear
            @press-enter="handleSearch"
          />
        </AFormItem>
        <AFormItem label="状态">
          <ASelect v-model:value="searchParams.status" placeholder="请选择状态" allow-clear class="w-140px">
            <ASelectOption :value="1">正常</ASelectOption>
            <ASelectOption :value="0">禁用</ASelectOption>
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
        <AButton type="primary" @click="openAdd">新增字典</AButton>
      </div>
      <ATable
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        size="small"
        :scroll="{ x: 1060 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ ((pagination.current ?? 1) - 1) * (pagination.pageSize ?? 10) + index + 1 }}
          </template>
          <template v-if="column.key === 'status'">
            <ATag :color="(record as Api.Dict.DictVO).status === 1 ? 'success' : 'default'">
              {{ (record as Api.Dict.DictVO).status === 1 ? '正常' : '禁用' }}
            </ATag>
          </template>
          <template v-if="column.key === 'action'">
            <ASpace>
              <AButton type="link" size="small" @click="openItems(record as Api.Dict.DictVO)">字典项</AButton>
              <AButton type="link" size="small" @click="openEdit(record as Api.Dict.DictVO)">编辑</AButton>
              <AButton type="link" size="small" danger @click="handleDelete(record as Api.Dict.DictVO)">删除</AButton>
            </ASpace>
          </template>
        </template>
      </ATable>
    </ACard>

    <DictModal
      v-model:visible="modalState.visible"
      :type="modalState.type"
      :row="modalState.row"
      @submitted="getData"
    />

    <DictItemDrawer v-model:visible="drawerState.visible" :dict="drawerState.dict" />
  </div>
</template>

<style scoped></style>
