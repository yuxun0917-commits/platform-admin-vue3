<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fetchDashboardOpsOverview } from '@/service/api/dashboard';
import { useCountUp } from '@/hooks/common/count-up';
import { $t } from '@/locales';

defineOptions({
  name: 'OpsOverview'
});

interface OpsItem {
  key: string;
  label: string;
  value: number;
  color: string;
}

const ops = ref<Api.Dashboard.OpsOverview | null>(null);
const loading = ref(false);

async function loadOps() {
  loading.value = true;
  try {
    const { data, error } = await fetchDashboardOpsOverview();
    if (!error && data) {
      ops.value = data;
    }
  } finally {
    loading.value = false;
  }
}

const animatedLoginFailures = useCountUp(computed(() => ops.value?.loginFail ?? 0));
const animatedOperateExceptions = useCountUp(computed(() => ops.value?.operateException ?? 0));
const animatedTaskFailures = useCountUp(computed(() => ops.value?.jobFail ?? 0));
const animatedPausedTasks = useCountUp(computed(() => ops.value?.jobPause ?? 0));

const items = computed<OpsItem[]>(() => [
  {
    key: 'loginFailures',
    label: $t('page.dashboard.loginFailures'),
    value: animatedLoginFailures.value,
    color: '#ef4444'
  },
  {
    key: 'operationExceptions',
    label: $t('page.dashboard.operationExceptions'),
    value: animatedOperateExceptions.value,
    color: '#f59e0b'
  },
  {
    key: 'taskFailures',
    label: $t('page.dashboard.taskFailures'),
    value: animatedTaskFailures.value,
    color: '#ef4444'
  },
  { key: 'pausedTasks', label: $t('page.dashboard.pausedTasks'), value: animatedPausedTasks.value, color: '#6b7280' }
]);

onMounted(loadOps);
</script>

<template>
  <ACard :bordered="false" :title="$t('page.dashboard.opsOverview')" class="card-wrapper">
    <ASpin :spinning="loading">
      <ARow :gutter="[16, 16]">
        <ACol v-for="item in items" :key="item.key" :span="12">
          <div class="rd-8px bg-layout px-16px py-16px text-center">
            <div class="mb-4px text-14px text-#666">{{ item.label }}</div>
            <div class="text-26px font-semibold" :style="{ color: item.color }">{{ item.value }}</div>
          </div>
        </ACol>
      </ARow>
    </ASpin>
  </ACard>
</template>

<style scoped></style>
