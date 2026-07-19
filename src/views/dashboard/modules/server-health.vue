<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { fetchDashboardHealth } from '@/service/api/dashboard';
import { useThemeStore } from '@/store/modules/theme';
import { $t } from '@/locales';

defineOptions({
  name: 'ServerHealth'
});

interface HealthMetric {
  key: string;
  label: string;
  value: number;
  color: string;
  /** 后端返回 null 时（环境不支持）显示「不支持」 */
  unsupported?: boolean;
}

const POLL_INTERVAL = 5000;

const themeStore = useThemeStore();
const isDark = computed(() => themeStore.themeScheme === 'dark');

const health = ref<Api.Dashboard.Health | null>(null);
const loading = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

async function loadHealth(showLoading = true) {
  if (showLoading) loading.value = true;
  try {
    const { data, error } = await fetchDashboardHealth();
    if (!error && data) {
      health.value = data;
    }
  } finally {
    if (showLoading) loading.value = false;
  }
}

function startPolling() {
  loadHealth(true);
  timer = setInterval(() => loadHealth(false), POLL_INTERVAL);
}

function stopPolling() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

const metrics = computed<HealthMetric[]>(() => [
  { key: 'cpu', label: $t('page.dashboard.cpu'), value: health.value?.cpuUsage ?? 0, color: '#3b82f6' },
  { key: 'memory', label: $t('page.dashboard.memory'), value: health.value?.memoryUsage ?? 0, color: '#10b981' },
  { key: 'disk', label: $t('page.dashboard.disk'), value: health.value?.diskUsage ?? 0, color: '#f59e0b' },
  {
    key: 'network',
    label: $t('page.dashboard.networkUsage'),
    value: health.value?.networkUsage ?? 0,
    color: '#8b5cf6',
    unsupported: health.value?.networkUsage === null
  }
]);

onMounted(startPolling);
onUnmounted(stopPolling);
</script>

<template>
  <ACard :bordered="false" :title="$t('page.dashboard.serverHealth')" class="card-wrapper">
    <ASpin :spinning="loading">
      <ARow :gutter="[32, 24]">
        <ACol v-for="item in metrics" :key="item.key" :span="24" :md="12">
          <div class="mb-4px text-14px text-#666 dark:text-#bbb">{{ item.label }}</div>
          <template v-if="item.unsupported">
            <div class="text-24px text-#999 font-semibold dark:text-#666">{{ $t('page.dashboard.notSupported') }}</div>
          </template>
          <template v-else>
            <div class="text-24px font-semibold" :style="{ color: item.color }">{{ Math.round(item.value) }}%</div>
            <AProgress
              :percent="Math.round(item.value)"
              :show-info="false"
              :stroke-color="item.color"
              :trail-color="isDark ? '#444' : '#e5e7eb'"
              class="mt-8px"
            />
          </template>
        </ACol>
      </ARow>
    </ASpin>
  </ACard>
</template>

<style scoped>
:deep(.ant-progress-inner) {
  border-radius: 999px;
}
:deep(.ant-progress-bg) {
  border-radius: 999px;
}
</style>
