<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { useAntdForm, useFormRules } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'PwdLogin'
});

const authStore = useAuthStore();
const { formRef, validate } = useAntdForm();

interface FormModel {
  userName: string;
  password: string;
  captchaCode: string;
}

const model: FormModel = reactive({
  userName: 'admin',
  password: 'Yx20011102!',
  captchaCode: ''
});

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  // inside computed to make locale reactive, if not apply i18n, you can define it without computed
  const { formRules } = useFormRules();

  return {
    userName: formRules.userName,
    password: formRules.pwd,
    captchaCode: [{ required: true, message: $t('page.login.common.captchaPlaceholder') }]
  };
});

/** Load a fresh captcha and store its key in authStore */
async function refreshCaptcha() {
  await authStore.getCaptcha();
}

onMounted(refreshCaptcha);

async function handleSubmit() {
  await validate();
  await authStore.login(model.userName, model.password, {
    captchaKey: authStore.captchaKey,
    captchaCode: model.captchaCode
  });
}
</script>

<template>
  <AForm ref="formRef" :model="model" :rules="rules" @keyup.enter="handleSubmit">
    <AFormItem name="userName">
      <AInput v-model:value="model.userName" size="large" :placeholder="$t('page.login.common.userNamePlaceholder')" />
    </AFormItem>
    <AFormItem name="password">
      <AInputPassword
        v-model:value="model.password"
        size="large"
        :placeholder="$t('page.login.common.passwordPlaceholder')"
      />
    </AFormItem>
    <AFormItem name="captchaCode">
      <div class="w-full flex-y-center gap-12px">
        <AInput
          v-model:value="model.captchaCode"
          size="large"
          class="flex-1"
          :placeholder="$t('page.login.common.captchaPlaceholder')"
        />
        <img
          v-if="authStore.captchaImage"
          :src="authStore.captchaImage"
          alt="captcha"
          class="border-border h-40px w-120px cursor-pointer border rounded-4px"
          :title="$t('page.login.common.refreshCaptcha')"
          @click="refreshCaptcha"
        />
        <AButton v-else size="large" class="h-40px w-120px" :loading="authStore.loginLoading" @click="refreshCaptcha">
          {{ $t('page.login.common.refreshCaptcha') }}
        </AButton>
      </div>
    </AFormItem>
    <ASpace direction="vertical" size="large" class="w-full">
      <ACheckbox>{{ $t('page.login.pwdLogin.rememberMe') }}</ACheckbox>
      <AButton type="primary" block size="large" shape="round" :loading="authStore.loginLoading" @click="handleSubmit">
        {{ $t('common.confirm') }}
      </AButton>
    </ASpace>
  </AForm>
</template>

<style scoped></style>
