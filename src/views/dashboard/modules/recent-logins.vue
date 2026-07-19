<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fetchDashboardRecentLogins } from '@/service/api/dashboard';
import { $t } from '@/locales';

defineOptions({
  name: 'RecentLogins'
});

const records = ref<Api.Dashboard.LoginLog[]>([]);
const loading = ref(false);

async function loadLogins() {
  loading.value = true;
  try {
    const { data, error } = await fetchDashboardRecentLogins();
    if (!error && data) {
      records.value = data;
    }
  } finally {
    loading.value = false;
  }
}

/** 登录是否成功：status === 1 成功，0 失败（与后端 LoginLogStatusEnum 对齐） */
function isSuccess(item: Api.Dashboard.LoginLog): boolean {
  return item.status === 1;
}

/** 取时间中的时分（yyyy-MM-ddTHH:mm:ss -> HH:mm） */
function formatTime(time?: string): string {
  if (!time) return '';
  return time.slice(11, 16);
}

onMounted(loadLogins);
</script>

<template>
  <ACard :bordered="false" :title="$t('page.dashboard.recentLogins')" class="card-wrapper">
    <ASpin :spinning="loading">
      <AList :data-source="records" :split="false">
        <template #renderItem="{ item }">
          <AListItem class="px-0">
            <div class="w-full flex items-center justify-between">
              <div>
                <div class="text-14px font-medium">{{ item.username }} · {{ item.loginIp }}</div>
              </div>
              <div class="flex items-center gap-8px">
                <ATag :color="isSuccess(item) ? 'success' : 'error'" size="small">
                  {{ isSuccess(item) ? $t('page.dashboard.success') : $t('page.dashboard.failed') }}
                </ATag>
                <span class="text-13px text-#999">{{ formatTime(item.loginTime) }}</span>
              </div>
            </div>
          </AListItem>
        </template>
      </AList>
    </ASpin>
  </ACard>
</template>

<style scoped>
:deep(.ant-list-item) {
  padding-left: 0;
  padding-right: 0;
}
</style>
