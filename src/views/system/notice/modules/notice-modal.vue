<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { FormInstance, SelectProps } from 'ant-design-vue';
import { MdEditor } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import { fetchNoticeAdd, fetchNoticeEdit, fetchNoticeEnums } from '@/service/api';
import { useThemeStore } from '@/store/modules/theme';

defineOptions({
  name: 'NoticeModal'
});

const themeStore = useThemeStore();
const editorTheme = computed<'dark' | 'light'>(() => (themeStore.darkMode ? 'dark' : 'light'));

interface Props {
  visible: boolean;
  type: 'add' | 'edit';
  row?: Api.Notice.NoticeVO | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const title = computed(() => (props.type === 'add' ? '新增通知' : '编辑通知'));

const formRef = ref<FormInstance>();
const formModel = reactive<Partial<Api.Notice.NoticeSaveVO & Api.Notice.NoticeEditVO>>({
  title: '',
  content: '',
  position: 1,
  status: 1,
  remark: ''
});

const loading = ref(false);
const statusOptions = ref<SelectProps['options']>([]);
const positionOptions: SelectProps['options'] = [
  { value: 1, label: '后台' },
  { value: 2, label: '前台' }
];

async function loadEnums() {
  const { data, error } = await fetchNoticeEnums();
  if (!error && data) {
    statusOptions.value = data.status.map(item => ({ value: item.code, label: item.desc }));
  }
}

function resetForm() {
  formModel.id = undefined;
  formModel.title = '';
  formModel.content = '';
  formModel.position = 1;
  formModel.status = 1;
  formModel.remark = '';
  formRef.value?.resetFields();
}

function setFormFromRow() {
  if (props.row) {
    formModel.id = props.row.id;
    formModel.title = props.row.title;
    formModel.content = props.row.content;
    formModel.position = props.row.position;
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
    const { error } = await fetchNoticeAdd(formModel as Api.Notice.NoticeSaveVO);
    if (!error) {
      window.$message?.success('新增成功');
      emit('submitted');
      emit('update:visible', false);
    }
  } else {
    const { error } = await fetchNoticeEdit(formModel as Api.Notice.NoticeEditVO);
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
    width="1200px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <AForm ref="formRef" :model="formModel" :label-col="{ span: 5 }" :wrapper-col="{ span: 17 }">
      <AFormItem label="标题" name="title" :rules="[{ required: true, message: '请输入通知标题' }]">
        <AInput v-model:value="formModel.title" placeholder="如 系统升级通知" />
      </AFormItem>
      <AFormItem label="展示位置" name="position" :rules="[{ required: true, message: '请选择展示位置' }]">
        <ASelect v-model:value="formModel.position" :options="positionOptions" placeholder="请选择展示位置" />
      </AFormItem>
      <AFormItem label="内容" name="content" :rules="[{ required: true, message: '请输入通知内容' }]">
        <MdEditor
          v-model="formModel.content"
          :theme="editorTheme"
          :preview="true"
          :toolbars-exclude="['github', 'save']"
          placeholder="支持 Markdown 语法，左侧编辑、右侧实时预览"
          style="height: 520px"
        />
      </AFormItem>
      <AFormItem label="状态" name="status">
        <ASelect v-model:value="formModel.status" :options="statusOptions" placeholder="请选择状态" />
      </AFormItem>
      <AFormItem label="备注" name="remark">
        <ATextarea v-model:value="formModel.remark" :rows="2" placeholder="请输入备注" />
      </AFormItem>
    </AForm>
  </AModal>
</template>

<style scoped></style>
