<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  visible: boolean;
  url: string;
  name: string;
  downloadName: string;
  contentType: string;
}
const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
}
const emit = defineEmits<Emits>();

function handleClose() {
  emit('update:visible', false);
}

const isImage = computed(() => props.contentType.startsWith('image/'));
const isPdf = computed(() => props.contentType === 'application/pdf');
</script>

<template>
  <AModal :open="visible" :footer="null" :width="1100" wrap-class-name="file-preview-modal" @cancel="handleClose">
    <template #title>
      <span class="text-left" :title="name">{{ name || '文件预览' }}</span>
    </template>
    <div class="flex justify-center">
      <img v-if="isImage" :src="url" :alt="name" class="max-h-80vh max-w-full object-contain" />
      <iframe v-else-if="isPdf" :src="url" title="PDF 预览" class="h-80vh w-full border-0" />
      <div v-else class="py-40px text-center">
        <p class="mb-16px text-14px text-gray-500">该文件类型不支持在线预览，请下载后查看。</p>
        <a :href="url" :download="downloadName || name" class="ant-btn ant-btn-primary">下载文件</a>
      </div>
    </div>
  </AModal>
</template>

<style scoped></style>
