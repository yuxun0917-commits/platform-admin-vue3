<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import type { FormInstance, SelectProps } from 'ant-design-vue';
import { fetchJobAdd, fetchJobEdit, fetchJobEnums, fetchJobView } from '@/service/api';

defineOptions({
  name: 'SystemJobModal'
});

interface Props {
  visible: boolean;
  type: 'add' | 'edit';
  row?: Api.Job.SysJobVO | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const title = () => (props.type === 'add' ? '新增任务' : '编辑任务');

const formRef = ref<FormInstance>();
const formModel = reactive<Partial<Api.Job.SysJobSaveVO & Api.Job.SysJobEditVO>>({
  id: undefined,
  jobName: '',
  jobGroup: '',
  invokeTarget: '',
  cronExpression: '',
  misfirePolicy: undefined,
  concurrent: undefined,
  status: undefined,
  remark: ''
});

const loading = ref(false);
const jobStatusOptions = ref<SelectProps['options']>([]);
const misfirePolicyOptions = ref<SelectProps['options']>([]);
const concurrentOptions = ref<SelectProps['options']>([]);

async function loadEnums() {
  const { data, error } = await fetchJobEnums();
  if (!error && data) {
    jobStatusOptions.value = (data.jobStatus || []).map(item => ({ value: item.code, label: item.desc }));
    misfirePolicyOptions.value = (data.misfirePolicy || []).map(item => ({ value: item.code, label: item.desc }));
    concurrentOptions.value = (data.concurrent || []).map(item => ({ value: item.code, label: item.desc }));
  }
}

function resetForm() {
  formModel.id = undefined;
  formModel.jobName = '';
  formModel.jobGroup = '';
  formModel.invokeTarget = '';
  formModel.cronExpression = '';
  formModel.misfirePolicy = undefined;
  formModel.concurrent = undefined;
  formModel.status = undefined;
  formModel.remark = '';
  formRef.value?.resetFields();
}

const viewLoading = ref(false);

async function loadJobView() {
  if (!props.row?.id) return;
  viewLoading.value = true;
  const { error, data } = await fetchJobView(props.row.id);
  viewLoading.value = false;
  if (!error && data) {
    formModel.id = data.id;
    formModel.jobName = data.jobName;
    formModel.jobGroup = data.jobGroup;
    formModel.invokeTarget = data.invokeTarget;
    formModel.cronExpression = data.cronExpression;
    formModel.misfirePolicy = data.misfirePolicy;
    formModel.concurrent = data.concurrent;
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
        loadJobView();
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
    const { error } = await fetchJobAdd(formModel as Api.Job.SysJobSaveVO);
    if (!error) {
      window.$message?.success('新增成功');
      emit('submitted');
      emit('update:visible', false);
    }
  } else {
    const { error } = await fetchJobEdit(formModel as Api.Job.SysJobEditVO);
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
    width="640px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <ASpin :spinning="viewLoading">
      <AForm ref="formRef" :model="formModel" :label-col="{ span: 5 }" :wrapper-col="{ span: 17 }">
        <AFormItem label="任务名称" name="jobName" :rules="[{ required: true, message: '请输入任务名称' }]">
          <AInput v-model:value="formModel.jobName" placeholder="请输入任务名称" />
        </AFormItem>
        <AFormItem label="任务组名" name="jobGroup">
          <AInput v-model:value="formModel.jobGroup" placeholder="留空默认 DEFAULT" />
        </AFormItem>
        <AFormItem label="调用目标" name="invokeTarget" :rules="[{ required: true, message: '请输入调用目标' }]">
          <ATextarea v-model:value="formModel.invokeTarget" :rows="2" placeholder="如 ryTask.ryParams('ry')" />
        </AFormItem>
        <AFormItem label="cron表达式" name="cronExpression" :rules="[{ required: true, message: '请输入cron表达式' }]">
          <AInput v-model:value="formModel.cronExpression" placeholder="如 0/10 * * * * ?" />
        </AFormItem>
        <AFormItem label="错失策略" name="misfirePolicy" :rules="[{ required: true, message: '请选择错失触发策略' }]">
          <ASelect
            v-model:value="formModel.misfirePolicy"
            :options="misfirePolicyOptions"
            placeholder="请选择错失触发策略"
          />
        </AFormItem>
        <AFormItem label="是否并发" name="concurrent" :rules="[{ required: true, message: '请选择是否并发' }]">
          <ASelect v-model:value="formModel.concurrent" :options="concurrentOptions" placeholder="请选择是否并发" />
        </AFormItem>
        <AFormItem label="状态" name="status" :rules="[{ required: true, message: '请选择状态' }]">
          <ASelect v-model:value="formModel.status" :options="jobStatusOptions" placeholder="请选择状态" />
        </AFormItem>
        <AFormItem label="备注" name="remark">
          <ATextarea v-model:value="formModel.remark" :rows="2" placeholder="请输入备注" />
        </AFormItem>
      </AForm>
    </ASpin>
  </AModal>
</template>

<style scoped></style>
