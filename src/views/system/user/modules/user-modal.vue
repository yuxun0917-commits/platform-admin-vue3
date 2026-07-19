<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { FormInstance, SelectProps, UploadProps } from 'ant-design-vue';
import { AttachmentBizType } from '@/constants/attachment';
import {
  fetchAttachmentView,
  fetchDeptSelectList,
  fetchPostSelectList,
  fetchRoleSelectList,
  fetchUserAdd,
  fetchUserEdit,
  fetchUserView
} from '@/service/api';
import { uploadFileAuto } from '@/utils/upload/chunk-upload';

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
  remark: '',
  avatarId: undefined
});

/** 头像预览地址（上传后回填附件 fileUrl；编辑时通过 avatarId 反查） */
const previewUrl = ref('');
/** 头像上传中 */
const avatarUploading = ref(false);
/** 头像大小上限 2MB */
const AVATAR_MAX_SIZE = 2 * 1024 * 1024;
/** 头像仅允许图片类型 */
const AVATAR_ACCEPT = /^image\//;

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
  formModel.avatarId = undefined;
  previewUrl.value = '';
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
  formModel.avatarId = data.avatarId;
}

/**
 * 头像上传：校验仅图片类型且 ≤2MB 后调统一上传（bizType=1 头像），回填 avatarId 与预览 URL。
 * 返回 false 阻止 antd 默认自动上传（上传由本函数自行触发）。
 */
const handleAvatarBeforeUpload: UploadProps['beforeUpload'] = async file => {
  if (!AVATAR_ACCEPT.test(file.type)) {
    window.$message?.warning('头像仅支持图片格式');
    return false;
  }
  if (file.size > AVATAR_MAX_SIZE) {
    window.$message?.warning('头像图片不能超过 2MB');
    return false;
  }

  avatarUploading.value = true;
  try {
    const res = await uploadFileAuto(file, {
      bizType: AttachmentBizType.Avatar,
      bizId: props.row?.id ? String(props.row.id) : undefined
    });
    formModel.avatarId = String(res.id);
    previewUrl.value = res.previewUrl || res.fileUrl;
    window.$message?.success('头像上传成功');
  } catch (e) {
    window.$message?.error((e as Error).message || '头像上传失败');
  } finally {
    avatarUploading.value = false;
  }
  return false;
};

function handleRemoveAvatar() {
  formModel.avatarId = undefined;
  previewUrl.value = '';
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
        // 通过 avatarId 反查附件，回填头像预览 URL
        if (formModel.avatarId) {
          const { data: att } = await fetchAttachmentView(formModel.avatarId);
          if (att) previewUrl.value = att.previewUrl || att.fileUrl;
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
          <AFormItem label="头像" name="avatarId" :rules="[{ required: true, message: '请上传头像' }]">
            <div>
              <AUpload :before-upload="handleAvatarBeforeUpload" :show-upload-list="false" accept="image/*">
                <div class="avatar-add-box">
                  <img v-if="previewUrl" :src="previewUrl" alt="头像" class="avatar-add-img" />
                  <SvgIcon v-else icon="ph:plus" class="avatar-add-icon text-24px" />
                  <div v-if="previewUrl" class="avatar-remove" @click.stop="handleRemoveAvatar">
                    <SvgIcon icon="ph:x" class="text-12px" />
                  </div>
                </div>
              </AUpload>
              <p class="avatar-hint">仅限图片，不超过 2MB</p>
            </div>
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
  padding-top: 16px;
}

.form-item-full {
  grid-column: 1 / -1;
}

.form-item-full :deep(.ant-form-item-label) {
  flex: 0 0 calc(5 / 48 * 100%) !important;
}

.avatar-add-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  overflow: hidden;
  background: transparent;
  border: 1px dashed var(--ant-color-border, #8c8c8c);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.avatar-add-box:hover {
  border-color: var(--ant-color-primary, #1677ff);
}

.avatar-add-icon {
  color: var(--ant-color-text-tertiary, #8c8c8c);
  font-size: 24px;
}

.avatar-add-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  font-size: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 50%;
  cursor: pointer;
}

.avatar-hint {
  margin: 4px 0 0;
  color: var(--ant-color-text-tertiary, #999);
  font-size: 12px;
  line-height: 1.2;
}
</style>
