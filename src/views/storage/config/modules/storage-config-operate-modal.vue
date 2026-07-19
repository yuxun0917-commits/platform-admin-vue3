<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { FormInstance, SelectProps } from 'ant-design-vue';
import {
  fetchStorageConfigAdd,
  fetchStorageConfigEdit,
  fetchStorageConfigEnums,
  fetchStorageConfigView
} from '@/service/api';

defineOptions({
  name: 'StorageConfigOperateModal'
});

interface Props {
  visible: boolean;
  type: 'add' | 'edit';
  row?: Api.StorageConfig.ConfigVO | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const title = computed(() => (props.type === 'add' ? '新增存储配置' : '编辑存储配置'));

const formRef = ref<FormInstance>();
const formModel = reactive<Partial<Api.StorageConfig.ConfigSaveVO & Api.StorageConfig.ConfigEditVO>>({
  configName: '',
  storageType: 1,
  endpoint: '',
  region: '',
  bucket: '',
  accessKey: '',
  secretKey: '',
  basePath: '',
  domain: '',
  isHttps: 0,
  status: 1,
  remark: ''
});

const storageTypeOptions = ref<Api.Common.EnumOption[]>([]);
const loading = ref(false);

async function loadEnums() {
  const { data, error } = await fetchStorageConfigEnums();
  if (!error && data) {
    storageTypeOptions.value = data.storageType;
  }
}

const isLocal = computed(() => formModel.storageType === 1);

onMounted(() => {
  loadEnums();
});

function resetForm() {
  formModel.configName = '';
  formModel.storageType = 1;
  formModel.endpoint = '';
  formModel.region = '';
  formModel.bucket = '';
  formModel.accessKey = '';
  formModel.secretKey = '';
  formModel.basePath = '';
  formModel.domain = '';
  formModel.isHttps = 0;
  formModel.status = 1;
  formModel.remark = '';
  formRef.value?.resetFields();
}

const viewLoading = ref(false);

async function loadStorageConfigView() {
  if (!props.row?.id) return;
  viewLoading.value = true;
  const { error, data } = await fetchStorageConfigView(props.row.id);
  viewLoading.value = false;
  if (!error && data) {
    formModel.id = data.id;
    formModel.configName = data.configName;
    formModel.storageType = data.storageType;
    formModel.endpoint = data.endpoint;
    formModel.region = data.region;
    formModel.bucket = data.bucket;
    // accessKey / secretKey 后端脱敏返回，编辑时留空表示保持不变（后端保留原值）
    formModel.accessKey = '';
    formModel.secretKey = '';
    formModel.basePath = data.basePath;
    formModel.domain = data.domain;
    formModel.isHttps = data.isHttps;
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
        loadStorageConfigView();
      }
    }
  }
);

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;

  // 编辑时仅当用户填写了密钥才提交该字段，避免误清空
  const payload: Record<string, unknown> = { ...formModel };
  if (props.type === 'edit') {
    if (!formModel.accessKey) delete payload.accessKey;
    if (!formModel.secretKey) delete payload.secretKey;
    payload.id = props.row?.id;
  }

  if (props.type === 'add') {
    const { error } = await fetchStorageConfigAdd(formModel as Api.StorageConfig.ConfigSaveVO);
    if (!error) {
      window.$message?.success('新增成功');
      emit('submitted');
      emit('update:visible', false);
    }
  } else {
    const { error } = await fetchStorageConfigEdit(payload as unknown as Api.StorageConfig.ConfigEditVO);
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

const httpsOptions: SelectProps['options'] = [
  { value: 0, label: '否' },
  { value: 1, label: '是' }
];

const statusOptions: SelectProps['options'] = [
  { value: 0, label: '停用' },
  { value: 1, label: '启用' }
];
</script>

<template>
  <AModal
    :open="visible"
    :title="title"
    :confirm-loading="loading"
    width="640px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <ASpin :spinning="viewLoading">
      <AForm ref="formRef" :model="formModel" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <AFormItem label="配置名称" name="configName" :rules="[{ required: true, message: '请输入配置名称' }]">
          <AInput v-model:value="formModel.configName" placeholder="请输入配置名称" :maxlength="100" />
        </AFormItem>
        <AFormItem label="存储类型" name="storageType" :rules="[{ required: true, message: '请选择存储类型' }]">
          <ASelect
            v-model:value="formModel.storageType"
            :options="storageTypeOptions"
            :field-names="{ value: 'code', label: 'desc' }"
            placeholder="请选择存储类型"
          />
        </AFormItem>

        <template v-if="!isLocal">
          <AFormItem label="访问域名" name="endpoint">
            <AInput v-model:value="formModel.endpoint" placeholder="如 oss-cn-hangzhou.aliyuncs.com" :maxlength="255" />
          </AFormItem>
          <AFormItem label="地域" name="region">
            <AInput v-model:value="formModel.region" placeholder="如 cn-hangzhou" :maxlength="100" />
          </AFormItem>
          <AFormItem label="存储桶名" name="bucket">
            <AInput v-model:value="formModel.bucket" placeholder="请输入存储桶名" :maxlength="100" />
          </AFormItem>
          <AFormItem label="AccessKey" name="accessKey">
            <AInput
              v-model:value="formModel.accessKey"
              placeholder="编辑时留空表示保持不变"
              :maxlength="255"
              autocomplete="off"
            />
          </AFormItem>
          <AFormItem label="SecretKey" name="secretKey">
            <AInput
              v-model:value="formModel.secretKey"
              placeholder="编辑时留空表示保持不变"
              :maxlength="255"
              type="password"
              autocomplete="off"
            />
          </AFormItem>
        </template>

        <AFormItem label="根路径/前缀" name="basePath">
          <AInput v-model:value="formModel.basePath" placeholder="本地根路径或对象存储路径前缀" :maxlength="255" />
        </AFormItem>
        <AFormItem label="自定义域名" name="domain">
          <AInput v-model:value="formModel.domain" placeholder="自定义访问域名/CDN(可选)" :maxlength="255" />
        </AFormItem>
        <AFormItem label="是否HTTPS" name="isHttps" :rules="[{ required: true, message: '请选择是否HTTPS' }]">
          <ASelect v-model:value="formModel.isHttps" :options="httpsOptions" placeholder="请选择是否HTTPS" />
        </AFormItem>
        <AFormItem label="状态" name="status" :rules="[{ required: true, message: '请选择状态' }]">
          <ASelect v-model:value="formModel.status" :options="statusOptions" placeholder="请选择状态" />
        </AFormItem>
        <AFormItem label="备注" name="remark">
          <ATextarea v-model:value="formModel.remark" :rows="3" placeholder="请输入备注" :maxlength="255" />
        </AFormItem>
      </AForm>
    </ASpin>
  </AModal>
</template>

<style scoped></style>
