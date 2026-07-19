<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, SelectProps } from 'ant-design-vue';
import { fetchPostAdd, fetchPostEdit, fetchPostView } from '@/service/api';

defineOptions({
  name: 'PostModal'
});

interface Props {
  visible: boolean;
  type: 'add' | 'edit';
  row?: Api.Post.PostVO | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const title = computed(() => (props.type === 'add' ? '新增岗位' : '编辑岗位'));

const formRef = ref<FormInstance>();
const formModel = reactive<Partial<Api.Post.PostSaveVO & Api.Post.PostEditVO>>({
  postCode: '',
  postName: '',
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
  formModel.postCode = '';
  formModel.postName = '';
  formModel.status = 1;
  formModel.remark = '';
  formRef.value?.resetFields();
}

const viewLoading = ref(false);

async function loadPostView() {
  if (!props.row?.id) return;
  viewLoading.value = true;
  const { error, data } = await fetchPostView(props.row.id);
  viewLoading.value = false;
  if (!error && data) {
    formModel.id = data.id;
    formModel.postCode = data.postCode;
    formModel.postName = data.postName;
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
        loadPostView();
      }
    }
  }
);

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;

  if (props.type === 'add') {
    const { error } = await fetchPostAdd(formModel as Api.Post.PostSaveVO);
    if (!error) {
      window.$message?.success('新增成功');
      emit('submitted');
      emit('update:visible', false);
    }
  } else {
    const { error } = await fetchPostEdit(formModel as Api.Post.PostEditVO);
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
        <AFormItem label="岗位编码" name="postCode" :rules="[{ required: true, message: '请输入岗位编码' }]">
          <AInput v-model:value="formModel.postCode" placeholder="请输入岗位编码" :disabled="type === 'edit'" />
        </AFormItem>
        <AFormItem label="岗位名称" name="postName" :rules="[{ required: true, message: '请输入岗位名称' }]">
          <AInput v-model:value="formModel.postName" placeholder="请输入岗位名称" />
        </AFormItem>
        <AFormItem label="状态" name="status" :rules="[{ required: true, message: '请选择状态' }]">
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
