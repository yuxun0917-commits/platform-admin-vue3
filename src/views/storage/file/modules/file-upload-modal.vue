<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { UploadProps } from 'ant-design-vue';
import { CHUNK_UPLOAD_THRESHOLD, uploadFileAuto } from '@/utils/upload/chunk-upload';

defineOptions({
  name: 'FileUploadModal'
});

interface Props {
  visible: boolean;
}
const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'submitted'): void;
}
const emit = defineEmits<Emits>();

const title = '上传文件';
const loading = ref(false);

const fileList = ref<UploadProps['fileList']>([]);
const bizType = ref('');
const progressText = ref('');

/** 已选文件中是否有超过阈值、将走分片上传的文件 */
const hasChunkFile = computed(() =>
  (fileList.value ?? []).some(f => {
    const file = f.originFileObj as File | undefined;
    return (file?.size ?? 0) > CHUNK_UPLOAD_THRESHOLD;
  })
);

/** 阻止自动上传，统一在提交时逐个调 /attachment/upload */
const beforeUpload: UploadProps['beforeUpload'] = () => false;

function resetForm() {
  fileList.value = [];
  bizType.value = '';
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
  if (!fileList.value || fileList.value.length === 0) {
    window.$message?.warning('请先选择文件');
    return;
  }

  loading.value = true;
  let ok = 0;
  let fail = 0;

  for (const item of fileList.value) {
    const file = item.originFileObj as File | undefined;
    if (file) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await uploadFileAuto(file, {
          bizType: bizType.value || undefined,
          onProgress: percent => {
            progressText.value = `${file.name} 上传中 ${percent}%`;
          },
          onStatus: status => {
            progressText.value = `${file.name} ${status}`;
          }
        });
        ok += 1;
      } catch {
        fail += 1;
      }
    }
  }

  loading.value = false;
  progressText.value = '';

  if (fail === 0) {
    window.$message?.success(`上传成功 ${ok} 个文件`);
    emit('submitted');
    emit('update:visible', false);
  } else {
    window.$message?.error(`上传完成：${ok} 成功，${fail} 失败`);
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
    :width="560"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <AForm :label-col="{ span: 5 }" :wrapper-col="{ span: 17 }">
      <AFormItem label="文件" :rules="[{ required: true, message: '请选择文件' }]">
        <AUpload v-model:file-list="fileList" :multiple="true" :before-upload="beforeUpload" list-type="text">
          <AButton>选择文件</AButton>
        </AUpload>
      </AFormItem>
      <div v-if="hasChunkFile" class="upload-tip">
        部分文件大于 {{ CHUNK_UPLOAD_THRESHOLD / 1024 / 1024 }}MB，将自动分片上传（其余走普通上传）
      </div>
      <div v-if="progressText" class="upload-progress">{{ progressText }}</div>
      <AFormItem label="业务类型">
        <AInput v-model:value="bizType" placeholder="可选，如 avatar/article" :maxlength="100" />
      </AFormItem>
    </AForm>
  </AModal>
</template>

<style scoped>
.upload-tip {
  margin: -8px 0 12px 92px;
  color: #faad14;
  font-size: 12px;
}
.upload-progress {
  margin: 4px 0 12px 92px;
  color: #1677ff;
  font-size: 12px;
}
</style>
