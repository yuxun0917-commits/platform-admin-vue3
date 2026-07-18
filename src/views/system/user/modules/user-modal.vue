<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { FormInstance, SelectProps } from 'ant-design-vue';
import {
  fetchDeptSelectList,
  fetchPostSelectList,
  fetchRoleSelectList,
  fetchUserAdd,
  fetchUserEdit,
  fetchUserView
} from '@/service/api';

defineOptions({
  name: 'UserModal'
});

interface Props {
  visible: boolean;
  type: 'add' | 'edit';
  row?: Api.User.UserVO | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const title = computed(() => (props.type === 'add' ? '新增用户' : '编辑用户'));

const formRef = ref<FormInstance>();
const formModel = reactive<Partial<Api.User.UserSaveVO & Api.User.UserEditVO>>({
  username: '',
  nickname: '',
  gender: 0,
  birthday: undefined,
  email: '',
  phone: '',
  deptId: undefined,
  rIds: [],
  pIds: [],
  remark: ''
});

const deptOptions = ref<Api.Dept.DeptSelectVO[]>([]);
const roleOptions = ref<Api.Role.RoleSelectVO[]>([]);
const postOptions = ref<Api.Post.PostSelectVO[]>([]);
const loading = ref(false);

async function loadDeptOptions(keyword?: string) {
  const { data, error } = await fetchDeptSelectList({ page: 1, pageSize: 100, keyword: keyword || undefined });
  if (!error && data) {
    deptOptions.value = data.records ?? [];
  }
}

async function loadRoleOptions(keyword?: string) {
  const { data, error } = await fetchRoleSelectList({ page: 1, pageSize: 100, keyword: keyword || undefined });
  if (!error && data) {
    roleOptions.value = data.records;
  }
}

async function loadPostOptions(keyword?: string) {
  const { data, error } = await fetchPostSelectList({ page: 1, pageSize: 100, keyword: keyword || undefined });
  if (!error && data) {
    postOptions.value = data.records;
  }
}

async function loadSelectOptions() {
  await Promise.all([loadDeptOptions(), loadRoleOptions(), loadPostOptions()]);
}

let deptSearchTimer: ReturnType<typeof setTimeout> | null = null;
let roleSearchTimer: ReturnType<typeof setTimeout> | null = null;
let postSearchTimer: ReturnType<typeof setTimeout> | null = null;

function handleDeptSearch(keyword: string) {
  if (deptSearchTimer) clearTimeout(deptSearchTimer);
  deptSearchTimer = setTimeout(() => loadDeptOptions(keyword), 300);
}

function handleRoleSearch(keyword: string) {
  if (roleSearchTimer) clearTimeout(roleSearchTimer);
  roleSearchTimer = setTimeout(() => loadRoleOptions(keyword), 300);
}

function handlePostSearch(keyword: string) {
  if (postSearchTimer) clearTimeout(postSearchTimer);
  postSearchTimer = setTimeout(() => loadPostOptions(keyword), 300);
}

function resetForm() {
  formModel.username = '';
  formModel.nickname = '';
  formModel.gender = 0;
  formModel.birthday = undefined;
  formModel.email = '';
  formModel.phone = '';
  formModel.deptId = undefined;
  formModel.rIds = [];
  formModel.pIds = [];
  formModel.remark = '';
  formRef.value?.resetFields();
}

function setFormFromData(data: Api.User.UserVO) {
  formModel.id = data.id;
  formModel.username = data.username;
  formModel.nickname = data.nickname;
  formModel.gender = data.gender ?? 0;
  formModel.birthday = data.birthday;
  formModel.email = data.email ?? '';
  formModel.phone = data.phone ?? '';
  formModel.deptId = data.deptId;
  formModel.rIds = data.rIds ?? [];
  formModel.pIds = data.pIds ?? [];
  formModel.remark = data.remark ?? '';
}

const detailLoading = ref(false);

watch(
  () => props.visible,
  async visible => {
    if (visible) {
      resetForm();
      if (props.type === 'edit' && props.row) {
        detailLoading.value = true;
        const { data, error } = await fetchUserView(props.row.id);
        detailLoading.value = false;
        if (!error && data) {
          setFormFromData(data);
        } else if (props.row) {
          // 详情拉取失败时降级使用表格行数据
          setFormFromData(props.row);
        }
      }
    }
  }
);

onMounted(() => {
  loadSelectOptions();
});

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;

  if (props.type === 'add') {
    const { error } = await fetchUserAdd(formModel as Api.User.UserSaveVO);
    if (!error) {
      window.$message?.success('新增成功');
      emit('submitted');
      emit('update:visible', false);
    }
  } else {
    const { error } = await fetchUserEdit(formModel as Api.User.UserEditVO);
    if (!error) {
      window.$message?.success('编辑成功');
      emit('submitted');
      emit('update:visible', false);
    }
  }

  loading.value = false;
}

function handleCancel() {
  emit('update:visible', false);
}

const genderOptions: SelectProps['options'] = [
  { value: 0, label: '未知' },
  { value: 1, label: '男' },
  { value: 2, label: '女' }
];
</script>

<template>
  <AModal
    :open="visible"
    :title="title"
    :confirm-loading="loading"
    width="760px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <ASpin :spinning="detailLoading">
      <AForm ref="formRef" :model="formModel" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <div class="form-grid">
          <AFormItem label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
            <AInput v-model:value="formModel.username" placeholder="请输入用户名" :disabled="type === 'edit'" />
          </AFormItem>
          <AFormItem label="昵称" name="nickname" :rules="[{ required: true, message: '请输入昵称' }]">
            <AInput v-model:value="formModel.nickname" placeholder="请输入昵称" />
          </AFormItem>
          <AFormItem label="性别" name="gender">
            <ASelect v-model:value="formModel.gender" :options="genderOptions" placeholder="请选择性别" />
          </AFormItem>
          <AFormItem label="出生日期" name="birthday">
            <ADatePicker
              v-model:value="formModel.birthday"
              value-format="YYYY-MM-DD"
              placeholder="请选择出生日期"
              class="w-full"
            />
          </AFormItem>
          <AFormItem label="邮箱" name="email">
            <AInput v-model:value="formModel.email" placeholder="请输入邮箱" />
          </AFormItem>
          <AFormItem label="手机号" name="phone">
            <AInput v-model:value="formModel.phone" placeholder="请输入手机号" />
          </AFormItem>
          <AFormItem label="部门" name="deptId" :rules="[{ required: true, message: '请选择部门' }]">
            <ASelect
              v-model:value="formModel.deptId"
              placeholder="请选择部门（可搜索）"
              allow-clear
              show-search
              :filter-option="false"
              @search="handleDeptSearch"
            >
              <ASelectOption v-for="item in deptOptions" :key="item.id" :value="item.id">
                {{ item.deptName }}
              </ASelectOption>
            </ASelect>
          </AFormItem>
          <AFormItem label="角色" name="rIds">
            <ASelect
              v-model:value="formModel.rIds"
              mode="multiple"
              placeholder="请选择角色（可搜索）"
              allow-clear
              show-search
              :filter-option="false"
              @search="handleRoleSearch"
            >
              <ASelectOption v-for="item in roleOptions" :key="item.id" :value="item.id">
                {{ item.roleName }}
              </ASelectOption>
            </ASelect>
          </AFormItem>
          <AFormItem label="岗位" name="pIds">
            <ASelect
              v-model:value="formModel.pIds"
              mode="multiple"
              placeholder="请选择岗位（可搜索）"
              allow-clear
              show-search
              :filter-option="false"
              @search="handlePostSearch"
            >
              <ASelectOption v-for="item in postOptions" :key="item.id" :value="item.id">
                {{ item.postName }}
              </ASelectOption>
            </ASelect>
          </AFormItem>
          <AFormItem label="备注" name="remark" class="form-item-full">
            <ATextarea v-model:value="formModel.remark" :rows="3" placeholder="请输入备注" />
          </AFormItem>
        </div>
      </AForm>
    </ASpin>
  </AModal>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 16px;
}

.form-item-full {
  grid-column: 1 / -1;
}

.form-item-full :deep(.ant-form-item-label) {
  flex: 0 0 calc(5 / 48 * 100%) !important;
}
</style>
