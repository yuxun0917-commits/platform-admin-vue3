<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import type { FormInstance, SelectProps } from 'ant-design-vue';
import { fetchSysConfigAdd, fetchSysConfigEdit, fetchSysConfigEnums } from '@/service/api';

defineOptions({
  name: 'SysConfigModal'
});

interface Props {
  visible: boolean;
  type: 'add' | 'edit';
  row?: Api.SysConfig.SysConfigVO | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const title = () => (props.type === 'add' ? '新增参数' : '编辑参数');

const formRef = ref<FormInstance>();
const formModel = reactive<Partial<Api.SysConfig.SysConfigSaveVO & Api.SysConfig.SysConfigEditVO>>({
  configName: '',
  configKey: '',
  configValue: '',
  configType: 0,
  remark: ''
});

const loading = ref(false);
const configTypeOptions = ref<SelectProps['options']>([]);

async function loadEnums() {
  const { data, error } = await fetchSysConfigEnums();
  if (!error && data) {
    configTypeOptions.value = data.map(item => ({ value: item.code, label: item.desc }));
  }
}

function resetForm() {
  formModel.id = undefined;
  formModel.configName = '';
  formModel.configKey = '';
  formModel.configValue = '';
  formModel.configType = 0;
  formModel.remark = '';
  formRef.value?.resetFields();
}

function setFormFromRow() {
  if (props.row) {
    formModel.id = props.row.id;
    formModel.configName = props.row.configName;
    formModel.configKey = props.row.configKey;
    formModel.configValue = props.row.configValue;
    formModel.configType = props.row.configType;
    formModel.remark = props.row.remark;
  }
}

watch(
  () => props.visible,
  visible => {
    if (visible) {
      resetForm();
      if (props.type === 'edit' && props.row) {
        setFormFromRow();
      }
    }
  }
);

onMounted(() => {
  loadEnums();
});

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;

  if (props.type === 'add') {
    const { error } = await fetchSysConfigAdd(formModel as Api.SysConfig.SysConfigSaveVO);
    if (!error) {
      window.$message?.success('新增成功');
      emit('submitted');
      emit('update:visible', false);
    }
  } else {
    const { error } = await fetchSysConfigEdit(formModel as Api.SysConfig.SysConfigEditVO);
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
    :title="title()"
    :confirm-loading="loading"
    width="600px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <AForm ref="formRef" :model="formModel" :label-col="{ span: 5 }" :wrapper-col="{ span: 17 }">
      <AFormItem label="参数名称" name="configName" :rules="[{ required: true, message: '请输入参数名称' }]">
        <AInput v-model:value="formModel.configName" placeholder="如 万能验证码" />
      </AFormItem>
      <AFormItem label="参数键名" name="configKey" :rules="[{ required: true, message: '请输入参数键名' }]">
        <AInput v-model:value="formModel.configKey" placeholder="如 sys.bypass.captcha" />
      </AFormItem>
      <AFormItem label="参数值" name="configValue" :rules="[{ required: true, message: '请输入参数值' }]">
        <ATextarea v-model:value="formModel.configValue" :rows="2" placeholder="请输入参数值" />
      </AFormItem>
      <AFormItem label="是否内置" name="configType" :rules="[{ required: true, message: '请选择是否内置' }]">
        <ASelect v-model:value="formModel.configType" :options="configTypeOptions" placeholder="请选择是否内置" />
      </AFormItem>
      <AFormItem label="备注" name="remark">
        <ATextarea v-model:value="formModel.remark" :rows="2" placeholder="请输入备注" />
      </AFormItem>
    </AForm>
  </AModal>
</template>

<style scoped></style>
