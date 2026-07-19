<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, SelectProps } from 'ant-design-vue';
import { fetchRoleAdd, fetchRoleEdit, fetchRoleView } from '@/service/api';

defineOptions({
  name: 'RoleModal'
});

interface Props {
  visible: boolean;
  type: 'add' | 'edit';
  row?: Api.Role.RoleVO | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const title = computed(() => (props.type === 'add' ? '新增角色' : '编辑角色'));

const formRef = ref<FormInstance>();
const formModel = reactive<Partial<Api.Role.RoleSaveVO & Api.Role.RoleEditVO>>({
  roleName: '',
  roleCode: '',
  status: 1,
  remark: ''
});

const loading = ref(false);
const statusOptions: SelectProps['options'] = [
  { value: 1, label: '正常' },
  { value: 0, label: '禁用' }
];

const viewLoading = ref(false);

function resetForm() {
  formModel.roleName = '';
  formModel.roleCode = '';
  formModel.status = 1;
  formModel.remark = '';
  formRef.value?.resetFields();
}

async function loadRoleView() {
  if (!props.row?.id) return;
  viewLoading.value = true;
  const { error, data } = await fetchRoleView(props.row.id);
  viewLoading.value = false;
  if (!error && data) {
    formModel.id = data.id;
    formModel.roleName = data.roleName;
    formModel.roleCode = data.roleCode;
    formModel.status = data.status;
    formModel.remark = data.remark ?? '';
  }
}

watch(
  () => props.visible,
  visible => {
    if (visible) {
      resetForm();
      if (props.type === 'edit' && props.row) {
        loadRoleView();
      }
    }
  }
);

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;

  if (props.type === 'add') {
    const { error } = await fetchRoleAdd(formModel as Api.Role.RoleSaveVO);
    if (!error) {
      window.$message?.success('新增成功');
      emit('submitted');
      emit('update:visible', false);
    }
  } else {
    const { error } = await fetchRoleEdit(formModel as Api.Role.RoleEditVO);
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
</script>

<template>
  <AModal
    :open="visible"
    :title="title"
    :confirm-loading="loading"
    width="560px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <ASpin :spinning="viewLoading">
      <AForm ref="formRef" :model="formModel" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <AFormItem label="角色名称" name="roleName" :rules="[{ required: true, message: '请输入角色名称' }]">
          <AInput v-model:value="formModel.roleName" placeholder="请输入角色名称" />
        </AFormItem>
        <AFormItem label="角色编码" name="roleCode" :rules="[{ required: true, message: '请输入角色编码' }]">
          <AInput v-model:value="formModel.roleCode" placeholder="请输入角色编码" :disabled="type === 'edit'" />
        </AFormItem>
        <AFormItem v-if="type === 'add'" label="状态" name="status">
          <ASelect v-model:value="formModel.status" :options="statusOptions" placeholder="请选择状态" />
        </AFormItem>
        <AFormItem label="备注" name="remark">
          <ATextarea v-model:value="formModel.remark" :rows="3" placeholder="请输入备注" />
        </AFormItem>
      </AForm>
    </ASpin>
  </AModal>
</template>

<style scoped></style>
