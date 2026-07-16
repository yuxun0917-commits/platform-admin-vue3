<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Modal } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import { fetchUserDelete, fetchUserEditStatus, fetchUserEnums, fetchUserPage } from '@/service/api';
import UserModal from './modules/user-modal.vue';
import PasswordModal from './modules/password-modal.vue';

defineOptions({
  name: 'SystemUser'
});

interface SearchParams {
  keyword: string;
  status: number | undefined;
}

const searchParams = reactive<SearchParams>({
  keyword: '',
  status: undefined
});

const tableData = ref<Api.User.UserVO[]>([]);
const loading = ref(false);
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: total => `共 ${total} 条`
});

const statusOptions = ref<{ value: number; label: string }[]>([]);

async function loadStatusOptions() {
  const { data, error } = await fetchUserEnums();
  if (!error && data) {
    statusOptions.value = data.map(item => ({ value: item.code, label: item.desc }));
  }
}

async function getData() {
  loading.value = true;
  const { data, error } = await fetchUserPage({
    page: pagination.current,
    pageSize: pagination.pageSize,
    keyword: searchParams.keyword || undefined,
    status: searchParams.status as Api.User.Status | undefined
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
  row: null as Api.User.UserVO | null
});

function handleAdd() {
  modalState.type = 'add';
  modalState.row = null;
  modalState.visible = true;
}

function handleEdit(row: Api.User.UserVO) {
  modalState.type = 'edit';
  modalState.row = row;
  modalState.visible = true;
}

function handleDelete(row: Api.User.UserVO) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除用户 "${row.username}" 吗？`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      const { error } = await fetchUserDelete(row.id);
      if (!error) {
        window.$message?.success('删除成功');
        getData();
      }
    }
  });
}

async function handleStatusChange(row: Api.User.UserVO, checked: boolean) {
  const { error } = await fetchUserEditStatus(row.id);
  if (!error) {
    window.$message?.success('状态切换成功');
    row.status = checked ? 1 : 0;
    row.statusText = checked ? '正常' : '禁用';
  }
}

const passwordModalState = reactive({
  visible: false,
  userId: null as number | null
});

function handleChangePassword(row: Api.User.UserVO) {
  passwordModalState.userId = row.id;
  passwordModalState.visible = true;
}

const columns = [
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
    align: 'center' as const,
    width: 120
  },
  {
    title: '昵称',
    dataIndex: 'nickname',
    key: 'nickname',
    align: 'center' as const,
    width: 120
  },
  {
    title: '性别',
    dataIndex: 'gender',
    key: 'gender',
    align: 'center' as const,
    width: 80
  },
  {
    title: '手机号',
    dataIndex: 'phone',
    key: 'phone',
    align: 'center' as const,
    width: 130
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    align: 'center' as const,
    width: 180
  },
  {
    title: '部门',
    dataIndex: 'deptName',
    key: 'deptName',
    align: 'center' as const,
    width: 140
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
    width: 240
  }
];

const genderMap: Record<number, string> = { 0: '未知', 1: '男', 2: '女' };

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
            placeholder="用户名/昵称/部门"
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
        <AButton type="primary" @click="handleAdd">新增用户</AButton>
      </div>
      <ATable
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        size="small"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'gender'">
            {{ genderMap[record.gender ?? 0] }}
          </template>
          <template v-if="column.key === 'status'">
            <ASwitch
              :checked="record.status === 1"
              @change="(checked: any) => handleStatusChange(record as Api.User.UserVO, Boolean(checked))"
            />
          </template>
          <template v-if="column.key === 'action'">
            <ASpace>
              <AButton type="link" size="small" @click="handleEdit(record as Api.User.UserVO)">编辑</AButton>
              <AButton type="link" size="small" @click="handleChangePassword(record as Api.User.UserVO)">
                修改密码
              </AButton>
              <AButton type="link" size="small" danger @click="handleDelete(record as Api.User.UserVO)">删除</AButton>
            </ASpace>
          </template>
        </template>
      </ATable>
    </ACard>

    <UserModal
      v-model:visible="modalState.visible"
      :type="modalState.type"
      :row="modalState.row"
      @submitted="getData"
    />

    <PasswordModal
      v-model:visible="passwordModalState.visible"
      :user-id="passwordModalState.userId"
      @submitted="getData"
    />
  </div>
</template>

<style scoped></style>
