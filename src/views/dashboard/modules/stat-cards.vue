<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fetchDashboardCoreMetrics } from '@/service/api/dashboard';
import { useCountUp } from '@/hooks/common/count-up';
import { $t } from '@/locales';

defineOptions({
  name: 'StatCards'
});

interface StatItem {
  key: string;
  title: string;
  value: number;
  prefix?: string;
  color: string;
  icon: string;
}

const metrics = ref<Api.Dashboard.CoreMetrics | null>(null);
const loading = ref(false);

async function loadMetrics() {
  loading.value = true;
  try {
    const { data, error } = await fetchDashboardCoreMetrics();
    if (!error && data) {
      metrics.value = data;
    }
  } finally {
    loading.value = false;
  }
}

const animatedNewUsers = useCountUp(computed(() => metrics.value?.weekNewUser ?? 0));
const animatedLoginsToday = useCountUp(computed(() => metrics.value?.todayLogin ?? 0));
const animatedOnlineUsers = useCountUp(computed(() => metrics.value?.onlineUser ?? 0));
const animatedAnnouncements = useCountUp(computed(() => metrics.value?.noticeCount ?? 0));

const stats = computed<StatItem[]>(() => [
  {
    key: 'newUsersThisWeek',
    title: $t('page.dashboard.newUsersThisWeek'),
    value: animatedNewUsers.value,
    prefix: '+',
    color: '#3b82f6',
    icon: 'ep:user'
  },
  {
    key: 'loginsToday',
    title: $t('page.dashboard.loginsToday'),
    value: animatedLoginsToday.value,
    color: '#10b981',
    icon: 'ep:calendar'
  },
  {
    key: 'onlineUsers',
    title: $t('page.dashboard.onlineUsers'),
    value: animatedOnlineUsers.value,
    color: '#f59e0b',
    icon: 'ep:monitor'
  },
  {
    key: 'systemAnnouncements',
    title: $t('page.dashboard.systemAnnouncements'),
    value: animatedAnnouncements.value,
    color: '#8b5cf6',
    icon: 'ep:notification'
  }
]);

onMounted(loadMetrics);
</script>

<template>
  <ACard :bordered="false" class="card-wrapper">
    <ARow :gutter="[16, 16]">
      <ACol v-for="item in stats" :key="item.key" :span="12" :lg="12">
        <div class="rd-8px bg-layout px-16px py-16px">
          <div class="mb-8px text-14px text-#666">{{ item.title }}</div>
          <div class="flex items-center justify-between">
            <span class="text-28px font-semibold" :style="{ color: item.color }">
              {{ item.prefix || '' }}{{ item.value }}
            </span>
            <SvgIcon :icon="item.icon" :style="{ color: item.color }" class="text-32px opacity-80" />
          </div>
        </div>
      </ACol>
    </ARow>
  </ACard>
</template>

<style scoped></style>
