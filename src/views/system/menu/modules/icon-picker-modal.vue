<script setup lang="ts">
import { computed, ref } from 'vue';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { ANT_DESIGN_ICONS } from './ant-design-icons';

interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'select', iconName: string): void;
  (e: 'cancel'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const keyword = ref('');

const filteredIcons = computed(() => {
  const k = keyword.value.trim().toLowerCase();
  if (!k) return ANT_DESIGN_ICONS;
  return ANT_DESIGN_ICONS.filter(name => name.toLowerCase().includes(k));
});

function handleSelect(name: string) {
  emit('select', `ant-design:${name}`);
}

function handleCancel() {
  emit('cancel');
}
</script>

<template>
  <AModal :open="visible" title="选择 Ant Design 图标" width="1040px" :footer="null" @cancel="handleCancel">
    <div class="mb-12px flex items-center gap-12px">
      <AInput v-model:value="keyword" placeholder="搜索图标名称，如 user / setting" allow-clear class="flex-1" />
      <span class="text-12px text-gray-500">共 {{ filteredIcons.length }} 个</span>
    </div>

    <div class="icon-grid">
      <button
        v-for="name in filteredIcons"
        :key="name"
        type="button"
        class="icon-cell"
        :title="name"
        @click="handleSelect(name)"
      >
        <SvgIcon :icon="`ant-design:${name}`" style="font-size: 22px" />
        <span class="icon-name">{{ name }}</span>
      </button>
    </div>
  </AModal>
</template>

<style scoped>
.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
  max-height: 580px;
  overflow-y: auto;
  padding: 4px;
}

.icon-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px;
  border: 1px solid var(--border-color, #f0f0f0);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  color: inherit;
}

.icon-cell:hover {
  border-color: var(--primary-color, #1677ff);
  background: rgba(22, 119, 255, 0.06);
}

.icon-name {
  font-size: 11px;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}
</style>
