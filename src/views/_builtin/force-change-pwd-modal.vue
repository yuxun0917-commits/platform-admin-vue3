<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance } from 'ant-design-vue';
import { fetchUserResetPwd } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { encryptByRsa } from '@/utils/crypto/rsa';

defineOptions({
  name: 'ForceChangePwdModal'
});

const authStore = useAuthStore();

/** 弹窗可见性由 store 的「强制改密」标记驱动：置位即弹出，改密成功后自动关闭 */
const visible = computed(() => authStore.needChangePassword);

/** 弹窗提示：优先使用后端返回的业务信息（新用户/密码过期两种文案），缺省给通用提示 */
const tipMessage = computed(() => authStore.needChangePasswordMsg || '出于安全考虑，请修改密码后继续。');

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

watch(visible, val => {
  if (val) {
    resetForm();
  }
});

async function validateConfirmPassword(_rule: unknown, value: string) {
  if (value && value !== formModel.newPassword) {
    return Promise.reject(new Error('两次输入的密码不一致'));
  }
  return Promise.resolve();
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

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

  // 后端 /user/reset-pwd 自主改密：用户ID取自登录态，忽略前端传入，故传 0 即可
  const { error } = await fetchUserResetPwd({
    id: authStore.userInfo.user.id || 0,
    oldPassword: oldEnc,
    newPassword: newEnc,
    confirmPassword: confirmEnc
  });

  if (!error) {
    window.$message?.success('密码修改成功，正在为您加载系统菜单');
    // 改密成功后：清除标记、重新拉取 /user/info（后端已放行）、渲染侧边栏菜单；弹窗随之关闭
    await authStore.finishForceChangePwd();
  }

  loading.value = false;
}
</script>

<template>
  <AModal
    :open="visible"
    title="修改密码"
    :confirm-loading="loading"
    width="480px"
    :closable="false"
    :mask-closable="false"
    :keyboard="false"
    @ok="handleSubmit"
  >
    <AAlert class="mb-16px" type="warning" show-icon :message="tipMessage" />
    <AForm ref="formRef" :model="formModel" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
      <AFormItem label="旧密码" name="oldPassword" :rules="[{ required: true, message: '请输入旧密码' }]">
        <AInputPassword v-model:value="formModel.oldPassword" placeholder="请输入旧密码" />
      </AFormItem>
      <AFormItem label="新密码" name="newPassword" :rules="[{ required: true, message: '请输入新密码' }]">
        <AInputPassword v-model:value="formModel.newPassword" placeholder="请输入新密码（6~64 个字符）" />
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
    <template #footer>
      <AButton type="primary" :loading="loading" @click="handleSubmit">确认修改</AButton>
    </template>
  </AModal>
</template>

<style scoped></style>
