<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, SelectProps } from 'ant-design-vue';
import { fetchDictItemAdd, fetchDictItemEdit } from '@/service/api';

defineOptions({
  name: 'DictItemModal'
});

interface Props {
  visible: boolean;
  type: 'add' | 'edit';
  row?: Api.Dict.DictItemVO | null;
  dict?: Api.Dict.DictVO | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const title = computed(() => (props.type === 'add' ? '新增字典项' : '编辑字典项'));

const formRef = ref<FormInstance>();
const formModel = reactive<Partial<Api.Dict.DictItemSaveVO & Api.Dict.DictItemEditVO>>({
  dictLabel: '',
  dictValue: '',
  cssClass: '',
  displayOrder: undefined,
  status: 1,
  remark: ''
});

const loading = ref(false);
const statusOptions: SelectProps['options'] = [
  { value: 1, label: '正常' },
  { value: 0, label: '禁用' }
];

// antd <ATag> 合法颜色值，限定用户只能选这些，避免存入 danger/primary 等无效值导致不显色
const cssClassOptions: SelectProps['options'] = [
  { value: 'success', label: 'success（绿·成功）' },
  { value: 'processing', label: 'processing（蓝·进行中）' },
  { value: 'error', label: 'error（红·错误）' },
  { value: 'warning', label: 'warning（橙·警告）' },
  { value: 'default', label: 'default（灰·默认）' },
  { value: 'blue', label: 'blue（蓝）' },
  { value: 'red', label: 'red（红）' },
  { value: 'green', label: 'green（绿）' },
  { value: 'orange', label: 'orange（橙）' },
  { value: 'gold', label: 'gold（金）' },
  { value: 'cyan', label: 'cyan（青）' },
  { value: 'purple', label: 'purple（紫）' },
  { value: 'geekblue', label: 'geekblue（蓝）' },
  { value: 'magenta', label: 'magenta（品红）' },
  { value: 'volcano', label: 'volcano（火山红）' },
  { value: 'lime', label: 'lime（青绿）' }
];

function resetForm() {
  formModel.id = undefined;
  formModel.dictId = undefined;
  formModel.dictType = undefined;
  formModel.dictLabel = '';
  formModel.dictValue = '';
  formModel.cssClass = '';
  formModel.displayOrder = 0;
  formModel.status = 1;
  formModel.remark = '';
  formRef.value?.resetFields();
}

function setFormFromRow() {
  if (props.row) {
    formModel.id = props.row.id;
    formModel.dictId = props.row.dictId;
    formModel.dictType = props.row.dictType;
    formModel.dictLabel = props.row.dictLabel;
    formModel.dictValue = props.row.dictValue;
    formModel.cssClass = props.row.cssClass;
    formModel.displayOrder = props.row.displayOrder;
    formModel.status = props.row.status;
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
      } else if (props.dict) {
        formModel.dictId = props.dict.id;
        formModel.dictType = props.dict.dictType;
      }
    }
  }
);

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;

  if (props.type === 'add') {
    const { error } = await fetchDictItemAdd(formModel as Api.Dict.DictItemSaveVO);
    if (!error) {
      window.$message?.success('新增成功');
      emit('submitted');
      emit('update:visible', false);
    }
  } else {
    const { error } = await fetchDictItemEdit(formModel as Api.Dict.DictItemEditVO);
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
    <AForm ref="formRef" :model="formModel" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
      <AFormItem label="字典标签" name="dictLabel" :rules="[{ required: true, message: '请输入字典标签' }]">
        <AInput v-model:value="formModel.dictLabel" placeholder="如 男 / 女 / 登录" />
      </AFormItem>
      <AFormItem label="字典键值" name="dictValue" :rules="[{ required: true, message: '请输入字典键值' }]">
        <AInput v-model:value="formModel.dictValue" placeholder="如 1 / 0 / login" />
      </AFormItem>
      <AFormItem label="样式" name="cssClass">
        <ASelect
          v-model:value="formModel.cssClass"
          :options="cssClassOptions"
          placeholder="选择标签颜色（可选）"
          allow-clear
        />
      </AFormItem>
      <AFormItem label="显示顺序" name="displayOrder">
        <AInputNumber v-model:value="formModel.displayOrder" :min="0" class="w-full" />
      </AFormItem>
      <AFormItem label="状态" name="status">
        <ASelect v-model:value="formModel.status" :options="statusOptions" placeholder="请选择状态" />
      </AFormItem>
      <AFormItem label="备注" name="remark">
        <ATextarea v-model:value="formModel.remark" :rows="3" placeholder="请输入备注" />
      </AFormItem>
    </AForm>
  </AModal>
</template>

<style scoped></style>
