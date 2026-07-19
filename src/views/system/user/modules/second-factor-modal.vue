<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { FormInstance } from 'ant-design-vue';
import { fetchSecondFactorVerify } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { encryptByRsa } from '@/utils/crypto/rsa';
import { $t } from '@/locales';

defineOptions({
  name: 'SecondFactorModal'
});

interface Props {
  visible: boolean;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
  /** 二次认证通过 */
  (e: 'verified'): void;
}

const emit = defineEmits<Emits>();

const authStore = useAuthStore();

const title = computed(() => '安全验证');
const currentUsername = computed(() => authStore.userInfo.user.username);

const formRef = ref<FormInstance>();
const password = ref('');
const loading = ref(false);

function resetForm() {
  password.value = '';
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

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  const encrypted = await encryptByRsa(password.value);
  if (!encrypted) {
    window.$message?.error($t('page.login.common.encryptFail'));
    return;
  }

  loading.value = true;
  const { error } = await fetchSecondFactorVerify({ password: encrypted });
  loading.value = false;

  if (!error) {
    window.$message?.success('验证通过');
    emit('verified');
    emit('update:visible', false);
  }
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
    <AForm ref="formRef" :model="{ password }" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
      <p class="mb-16px text-14px">
        为保障账户安全，操作敏感信息前需验证当前登录用户（
        <b>{{ currentUsername }}</b>
        ）的密码。
      </p>
      <AFormItem label="密码" name="password" :rules="[{ required: true, message: '请输入当前用户密码' }]">
        <AInputPassword v-model:value="password" placeholder="请输入当前用户密码" @press-enter="handleSubmit" />
      </AFormItem>
    </AForm>
  </AModal>
</template>

<style scoped></style>
