<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance } from 'ant-design-vue';
import { fetchUserChangePassword } from '@/service/api';
import { encryptByRsa } from '@/utils/crypto/rsa';

defineOptions({
  name: 'PasswordModal'
});

interface Props {
  visible: boolean;
  userId?: number | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const title = computed(() => '修改密码');

const formRef = ref<FormInstance>();
const formModel = reactive<Partial<Api.User.UserPasswordVO>>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});
const loading = ref(false);

function resetForm() {
  formModel.oldPassword = '';
  formModel.newPassword = '';
  formModel.confirmPassword = '';
  formRef.value?.resetFields();
}

watch(
  () => props.visible,
  visible => {
    if (visible) {
      resetForm();
    }
  }
);

async function validateConfirmPassword(_rule: unknown, value: string) {
  if (value && value !== formModel.newPassword) {
    return Promise.reject(new Error('两次输入的密码不一致'));
  }
  return Promise.resolve();
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  if (!props.userId) {
    window.$message?.error('未选择用户');
    return;
  }

  loading.value = true;

  const [oldEnc, newEnc, confirmEnc] = await Promise.all([
    encryptByRsa(formModel.oldPassword!),
    encryptByRsa(formModel.newPassword!),
    encryptByRsa(formModel.confirmPassword!)
  ]);

  if (oldEnc === false || newEnc === false || confirmEnc === false) {
    window.$message?.error('密码加密失败，请重试');
    loading.value = false;
    return;
  }

  const { error } = await fetchUserChangePassword({
    id: props.userId,
    oldPassword: oldEnc,
    newPassword: newEnc,
    confirmPassword: confirmEnc
  });

  if (!error) {
    window.$message?.success('密码修改成功');
    emit('submitted');
    emit('update:visible', false);
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
    width="480px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <AForm ref="formRef" :model="formModel" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
      <AFormItem label="旧密码" name="oldPassword" :rules="[{ required: true, message: '请输入旧密码' }]">
        <AInputPassword v-model:value="formModel.oldPassword" placeholder="请输入旧密码" />
      </AFormItem>
      <AFormItem label="新密码" name="newPassword" :rules="[{ required: true, message: '请输入新密码' }]">
        <AInputPassword v-model:value="formModel.newPassword" placeholder="请输入新密码" />
      </AFormItem>
      <AFormItem
        label="确认密码"
        name="confirmPassword"
        :rules="[
          { required: true, message: '请确认新密码' },
          { validator: validateConfirmPassword, trigger: 'change' }
        ]"
      >
        <AInputPassword v-model:value="formModel.confirmPassword" placeholder="请确认新密码" />
      </AFormItem>
    </AForm>
  </AModal>
</template>

<style scoped></style>
