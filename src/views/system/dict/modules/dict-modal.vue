<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, SelectProps } from 'ant-design-vue';
import { fetchDictAdd, fetchDictEdit, fetchDictView } from '@/service/api';

defineOptions({
  name: 'DictModal'
});

interface Props {
  visible: boolean;
  type: 'add' | 'edit';
  row?: Api.Dict.DictVO | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const title = computed(() => (props.type === 'add' ? '新增字典' : '编辑字典'));

const formRef = ref<FormInstance>();
const formModel = reactive<Partial<Api.Dict.DictSaveVO & Api.Dict.DictEditVO>>({
  dictName: '',
  dictType: '',
  status: 1,
  remark: ''
});

const loading = ref(false);
const statusOptions: SelectProps['options'] = [
  { value: 1, label: '正常' },
  { value: 0, label: '禁用' }
];

function resetForm() {
  formModel.id = undefined;
  formModel.dictName = '';
  formModel.dictType = '';
  formModel.status = 1;
  formModel.remark = '';
  formRef.value?.resetFields();
}

const viewLoading = ref(false);

async function loadDictView() {
  if (!props.row?.id) return;
  viewLoading.value = true;
  const { error, data } = await fetchDictView(props.row.id);
  viewLoading.value = false;
  if (!error && data) {
    formModel.id = data.id;
    formModel.dictName = data.dictName;
    formModel.dictType = data.dictType;
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
        loadDictView();
      }
    }
  }
);

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;

  if (props.type === 'add') {
    const { error } = await fetchDictAdd(formModel as Api.Dict.DictSaveVO);
    if (!error) {
      window.$message?.success('新增成功');
      emit('submitted');
      emit('update:visible', false);
    }
  } else {
    const { error } = await fetchDictEdit(formModel as Api.Dict.DictEditVO);
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
        <AFormItem label="字典名称" name="dictName" :rules="[{ required: true, message: '请输入字典名称' }]">
          <AInput v-model:value="formModel.dictName" placeholder="请输入字典名称" />
        </AFormItem>
        <AFormItem label="字典类型" name="dictType" :rules="[{ required: true, message: '请输入字典类型' }]">
          <AInput v-model:value="formModel.dictType" placeholder="如 sys_user_gender" :disabled="type === 'edit'" />
        </AFormItem>
        <AFormItem label="状态" name="status">
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
