<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { Modal } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import {
  fetchIsNeedSecondFactorVerify,
  fetchUserDelete,
  fetchUserEditStatus,
  fetchUserEnums,
  fetchUserPage
} from '@/service/api';
import { useAuth } from '@/hooks/business/auth';
import UserModal from './modules/user-modal.vue';
import PasswordModal from './modules/password-modal.vue';
import SecondFactorModal from './modules/second-factor-modal.vue';

defineOptions({
  name: 'SystemUser'
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

const tableContainerRef = ref<HTMLElement | null>(null);
const tableScrollY = ref<number>(400);
let tableResizeObserver: ResizeObserver | null = null;

/** 根据容器实际高度动态计算表格 body 可滚动高度，确保表头与分页条始终可见 */
function updateTableScrollY() {
  if (!tableContainerRef.value) return;
  // 预留表头(~40px) + 分页条(~48px) + 安全边距，避免最下面被截断
  const reserved = 96;
  const y = Math.max(200, tableContainerRef.value.clientHeight - reserved);
  tableScrollY.value = y;
}

function startTableResizeObserver() {
  updateTableScrollY();
  if (typeof ResizeObserver === 'undefined' || !tableContainerRef.value) return;
  tableResizeObserver = new ResizeObserver(updateTableScrollY);
  tableResizeObserver.observe(tableContainerRef.value);
}

function stopTableResizeObserver() {
  tableResizeObserver?.disconnect();
  tableResizeObserver = null;
}

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

/** 二次认证弹窗可见性 */
const secondFactorVisible = ref(false);
/** 待修改密码的用户 ID（二次认证通过后使用） */
const pendingUserId = ref<number | null>(null);

function handleChangePassword(row: Api.User.UserVO) {
  pendingUserId.value = row.id;
  openPasswordModalIfNoSecondFactor(row.id);
}

/** 打开修改密码弹窗 */
function openPasswordModal(userId: number) {
  passwordModalState.userId = userId;
  passwordModalState.visible = true;
}

/** 先判断是否需二次认证；200 直接打开，10009 弹出密码认证窗口，其余提示 */
async function openPasswordModalIfNoSecondFactor(userId: number) {
  const { response, error } = await fetchIsNeedSecondFactorVerify();
  const code = response?.data?.code;

  if (code === 200) {
    openPasswordModal(userId);
  } else if (code === 10009) {
    // 需要二次认证：弹出当前用户密码校验窗口
    secondFactorVisible.value = true;
  } else {
    window.$message?.error(error ? '校验失败，请稍后重试' : '操作失败');
  }
}

/** 二次认证通过后再打开修改密码弹窗 */
function handleSecondFactorVerified() {
  if (pendingUserId.value !== null) {
    openPasswordModal(pendingUserId.value);
  }
}

const columns = [
  {
    title: '序号',
    key: 'index',
    align: 'center' as const,
    width: 70
  },
  {
    title: '头像',
    key: 'avatar',
    align: 'center' as const,
    width: 100
  },
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
    title: '更新时间',
    dataIndex: 'updateTime',
    key: 'updateTime',
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
  startTableResizeObserver();
});

onUnmounted(() => {
  stopTableResizeObserver();
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

    <ACard :bordered="false" class="user-card flex-1-hidden card-wrapper">
      <div class="mb-16px">
        <AButton v-if="hasAuth('system:user:add')" type="primary" @click="handleAdd">新增用户</AButton>
      </div>
      <div ref="tableContainerRef" class="flex-1 overflow-hidden">
        <ATable
          :columns="columns"
          :data-source="tableData"
          :loading="loading"
          :pagination="pagination"
          row-key="id"
          size="small"
          :scroll="{ x: 1520, y: tableScrollY }"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'index'">
              {{ ((pagination.current ?? 1) - 1) * (pagination.pageSize ?? 10) + index + 1 }}
            </template>
            <template v-if="column.key === 'avatar'">
              <img
                v-if="(record as Api.User.UserVO).avatarPreviewUrl"
                :src="(record as Api.User.UserVO).avatarPreviewUrl"
                alt="头像"
                class="mx-auto block size-48px rd-1/2 object-cover"
              />
              <SvgIcon v-else icon="ph:user-circle" class="mx-auto block size-48px text-40px" />
            </template>
            <template v-if="column.key === 'gender'">
              {{ genderMap[record.gender ?? 0] }}
            </template>
            <template v-if="column.key === 'status'">
              <ASwitch
                :disabled="!hasAuth('system:user:editStatus')"
                :checked="record.status === 1"
                @change="(checked: any) => handleStatusChange(record as Api.User.UserVO, Boolean(checked))"
              />
            </template>
            <template v-if="column.key === 'action'">
              <ASpace>
                <AButton
                  v-if="hasAuth('system:user:edit')"
                  type="link"
                  size="small"
                  @click="handleEdit(record as Api.User.UserVO)"
                >
                  编辑
                </AButton>
                <AButton
                  v-if="hasAuth('system:user:changePassword')"
                  type="link"
                  size="small"
                  @click="handleChangePassword(record as Api.User.UserVO)"
                >
                  修改密码
                </AButton>
                <AButton
                  v-if="hasAuth('system:user:delete')"
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(record as Api.User.UserVO)"
                >
                  删除
                </AButton>
              </ASpace>
            </template>
          </template>
        </ATable>
      </div>
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

    <SecondFactorModal v-model:visible="secondFactorVisible" @verified="handleSecondFactorVerified" />
  </div>
</template>

<style scoped>
.user-card :deep(.ant-card-body) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
