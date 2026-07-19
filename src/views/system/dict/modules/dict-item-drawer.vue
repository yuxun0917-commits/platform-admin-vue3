<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import { Modal } from 'ant-design-vue';
import { fetchDictItemDelete, fetchDictItemPage } from '@/service/api';
import { useAuth } from '@/hooks/business/auth';
import DictItemModal from './dict-item-modal.vue';

defineOptions({
  name: 'DictItemDrawer'
});

const { hasAuth } = useAuth();

interface Props {
  visible: boolean;
  dict?: Api.Dict.DictVO | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const title = computed(() => (props.dict ? `字典项 - ${props.dict.dictName}` : '字典项'));

// 语义色兜底映射：历史数据可能存了 danger/primary/info 等非 antd 色值，统一映射到 antd 合法色
const colorMap: Record<string, string> = {
  danger: 'red',
  primary: 'blue',
  info: 'blue',
  success: 'success',
  warning: 'warning',
  error: 'error'
};
function tagColor(v?: string): string | undefined {
  if (!v) return undefined;
  return colorMap[v] ?? v;
}

const search = reactive<{ keyword: string; status: Api.Common.EnableStatus | undefined }>({
  keyword: '',
  status: undefined
});
const tableData = ref<Api.Dict.DictItemVO[]>([]);
const loading = ref(false);
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (t: number) => `共 ${t} 条`
});

async function loadItems() {
  if (!props.dict) return;
  loading.value = true;
  const { data, error } = await fetchDictItemPage({
    page: pagination.current ?? 1,
    pageSize: pagination.pageSize ?? 10,
    dictId: props.dict.id,
    keyword: search.keyword || undefined,
    status: search.status
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
  loadItems();
}
function handleReset() {
  search.keyword = '';
  search.status = undefined;
  pagination.current = 1;
  loadItems();
}
function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 10;
  loadItems();
}

const itemModal = reactive({
  visible: false,
  type: 'add' as 'add' | 'edit',
  row: null as Api.Dict.DictItemVO | null
});
function openAdd() {
  itemModal.type = 'add';
  itemModal.row = null;
  itemModal.visible = true;
}
function openEdit(row: Api.Dict.DictItemVO) {
  itemModal.type = 'edit';
  itemModal.row = row;
  itemModal.visible = true;
}
function handleDelete(row: Api.Dict.DictItemVO) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除字典项 "${row.dictLabel}" 吗？`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      const { error } = await fetchDictItemDelete(row.id);
      if (!error) {
        window.$message?.success('删除成功');
        loadItems();
      }
    }
  });
}

const columns = [
  { title: '字典标签', dataIndex: 'dictLabel', key: 'dictLabel', align: 'center' as const, width: 160 },
  { title: '字典键值', dataIndex: 'dictValue', key: 'dictValue', align: 'center' as const, width: 160 },
  { title: '样式', dataIndex: 'cssClass', key: 'cssClass', align: 'center' as const, width: 140 },
  { title: '状态', dataIndex: 'status', key: 'status', align: 'center' as const, width: 100 },
  { title: '显示顺序', dataIndex: 'displayOrder', key: 'displayOrder', align: 'center' as const, width: 100 },
  { title: '备注', dataIndex: 'remark', key: 'remark', align: 'center' as const, width: 200 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', align: 'center' as const, width: 200 },
  { title: '操作', key: 'action', align: 'center' as const, fixed: 'right' as const, width: 160 }
];

watch(
  () => props.visible,
  v => {
    if (v) {
      search.keyword = '';
      search.status = undefined;
      pagination.current = 1;
      loadItems();
    }
  }
);
</script>

<template>
  <ADrawer :open="visible" :title="title" width="1280px" @close="emit('update:visible', false)">
    <AForm layout="inline" :model="search">
      <AFormItem label="标签/值">
        <AInput v-model:value="search.keyword" placeholder="字典标签/键值" allow-clear @press-enter="handleSearch" />
      </AFormItem>
      <AFormItem label="状态">
        <ASelect v-model:value="search.status" placeholder="请选择状态" allow-clear class="w-140px">
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

    <div class="mb-12px mt-12px">
      <AButton v-if="hasAuth('system:dict:item:add')" type="primary" @click="openAdd">新增字典项</AButton>
    </div>

    <ATable
      :columns="columns"
      :data-source="tableData"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      size="small"
      :scroll="{ x: 1220 }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'cssClass'">
          <ATag
            v-if="(record as Api.Dict.DictItemVO).cssClass"
            :color="tagColor((record as Api.Dict.DictItemVO).cssClass)"
          >
            {{ (record as Api.Dict.DictItemVO).cssClass }}
          </ATag>
          <span v-else class="text-gray-300">-</span>
        </template>
        <template v-if="column.key === 'status'">
          <ATag :color="(record as Api.Dict.DictItemVO).status === 1 ? 'success' : 'error'">
            {{ (record as Api.Dict.DictItemVO).status === 1 ? '正常' : '禁用' }}
          </ATag>
        </template>
        <template v-if="column.key === 'action'">
          <ASpace>
            <AButton
              v-if="hasAuth('system:dict:item:edit')"
              type="link"
              size="small"
              @click="openEdit(record as Api.Dict.DictItemVO)"
            >
              编辑
            </AButton>
            <AButton
              v-if="hasAuth('system:dict:item:delete')"
              type="link"
              size="small"
              danger
              @click="handleDelete(record as Api.Dict.DictItemVO)"
            >
              删除
            </AButton>
          </ASpace>
        </template>
      </template>
    </ATable>

    <DictItemModal
      v-model:visible="itemModal.visible"
      :type="itemModal.type"
      :row="itemModal.row"
      :dict="dict"
      @submitted="loadItems"
    />
  </ADrawer>
</template>

<style scoped></style>
