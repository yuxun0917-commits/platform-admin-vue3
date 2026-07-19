<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, SelectProps } from 'ant-design-vue';
import { fetchDeptAdd, fetchDeptEdit, fetchDeptView } from '@/service/api';

defineOptions({
  name: 'DeptModal'
});

interface Props {
  visible: boolean;
  type: 'add' | 'edit';
  row?: Api.Dept.DeptVO | null;
  /** 完整部门树，用于上级部门选择 */
  tree?: Api.Dept.DeptVO[];
  /** 新增时的默认父级（新增子项时传入） */
  defaultParentId?: number;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const title = computed(() => (props.type === 'add' ? '新增部门' : '编辑部门'));

const formRef = ref<FormInstance>();
const formModel = reactive<Partial<Api.Dept.DeptSaveVO & Api.Dept.DeptEditVO>>({
  parentId: 0,
  deptName: '',
  leader: '',
  phone: '',
  email: '',
  status: 1,
  remark: ''
});

const loading = ref(false);
const statusOptions: SelectProps['options'] = [
  { value: 1, label: '正常' },
  { value: 0, label: '禁用' }
];

/** 上级部门树（编辑时排除自身及其子孙，避免环） */
const parentTreeData = computed(() => {
  const excludeId = props.type === 'edit' && props.row ? props.row.id : -1;
  const map = (nodes: Api.Dept.DeptVO[]): any[] =>
    nodes
      .filter(n => n.id !== excludeId)
      .map(n => ({
        value: n.id,
        title: n.deptName,
        children: map(n.children || [])
      }));
  return [
    {
      value: 0,
      title: '根目录',
      children: map(props.tree || [])
    }
  ];
});

function resetForm() {
  formModel.parentId = props.defaultParentId ?? 0;
  formModel.deptName = '';
  formModel.leader = '';
  formModel.phone = '';
  formModel.email = '';
  formModel.status = 1;
  formModel.remark = '';
  formRef.value?.resetFields();
}

const viewLoading = ref(false);

async function loadDeptView() {
  if (!props.row?.id) return;
  viewLoading.value = true;
  const { error, data } = await fetchDeptView(props.row.id);
  viewLoading.value = false;
  if (!error && data) {
    formModel.id = data.id;
    formModel.parentId = data.parentId;
    formModel.deptName = data.deptName;
    formModel.leader = data.leader ?? '';
    formModel.phone = data.phone ?? '';
    formModel.email = data.email ?? '';
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
        loadDeptView();
      }
    }
  }
);

function buildDeptPayload() {
  return {
    parentId: formModel.parentId ?? 0,
    deptName: (formModel.deptName ?? '').trim(),
    leader: (formModel.leader ?? '').trim() || undefined,
    phone: (formModel.phone ?? '').trim() || undefined,
    email: (formModel.email ?? '').trim() || undefined,
    status: (formModel.status as Api.Dept.Status) ?? 1,
    remark: (formModel.remark ?? '').trim() || undefined
  };
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;

  const base = buildDeptPayload();

  if (props.type === 'add') {
    const { error } = await fetchDeptAdd(base as Api.Dept.DeptSaveVO);
    if (!error) {
      window.$message?.success('新增成功');
      emit('submitted');
      emit('update:visible', false);
    }
  } else {
    const payload = { ...base, id: props.row?.id } as Api.Dept.DeptEditVO;
    const { error } = await fetchDeptEdit(payload);
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
        <AFormItem label="上级部门" name="parentId" :rules="[{ required: true, message: '请选择上级部门' }]">
          <ATreeSelect
            v-model:value="formModel.parentId"
            :tree-data="parentTreeData"
            :tree-default-expand-all="true"
            placeholder="请选择上级部门"
            allow-clear
          />
        </AFormItem>
        <AFormItem label="部门名称" name="deptName" :rules="[{ required: true, message: '请输入部门名称' }]">
          <AInput v-model:value="formModel.deptName" placeholder="请输入部门名称" />
        </AFormItem>
        <AFormItem label="负责人" name="leader">
          <AInput v-model:value="formModel.leader" placeholder="请输入负责人" />
        </AFormItem>
        <AFormItem label="联系电话" name="phone">
          <AInput v-model:value="formModel.phone" placeholder="请输入联系电话" />
        </AFormItem>
        <AFormItem label="邮箱" name="email">
          <AInput v-model:value="formModel.email" placeholder="请输入邮箱" />
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
