<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';

defineOptions({
  name: 'SystemOverview'
});

const title = computed(() => $t('page.dashboard.title'));
const subtitle = computed(() => {
  const date = dayjs().format('YYYY-MM-DD dddd');
  return `${date} · ${$t('page.dashboard.subtitle')}`;
});
</script>

<template>
  <ACard :bordered="false" class="card-wrapper">
    <div class="flex items-center justify-between">
      <div class="flex-y-center">
        <AAvatar :size="56" class="bg-primary text-22px text-white font-semibold">P</AAvatar>
        <div class="ml-16px">
          <h3 class="m-0 text-18px font-semibold">{{ title }}</h3>
          <p class="m-0 mt-4px text-#666">{{ subtitle }}</p>
        </div>
      </div>
      <div class="flex items-center text-success">
        <span class="mr-8px inline-block size-8px rd-1/2 bg-success"></span>
        <span class="text-14px font-medium">{{ $t('page.dashboard.serviceStatus') }}</span>
      </div>
    </div>
  </ACard>
</template>

<style scoped></style>
