<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fetchDashboardNotices } from '@/service/api/dashboard';
import { $t } from '@/locales';

defineOptions({
  name: 'LatestAnnouncements'
});

const announcements = ref<Api.Dashboard.Notice[]>([]);
const loading = ref(false);

async function loadNotices() {
  loading.value = true;
  try {
    const { data, error } = await fetchDashboardNotices();
    if (!error && data) {
      announcements.value = data;
    }
  } finally {
    loading.value = false;
  }
}

onMounted(loadNotices);
</script>

<template>
  <ACard :bordered="false" :title="$t('page.dashboard.latestAnnouncements')" class="card-wrapper">
    <ASpin :spinning="loading">
      <div
        v-for="item in announcements"
        :key="item.id"
        class="border-b border-#f0f0f0 py-12px last:border-b-0 dark:border-#333"
      >
        <span class="mr-8px text-#999 dark:text-#666">·</span>
        <span
          class="cursor-pointer text-14px text-#333 transition-colors dark:text-#fff hover:text-primary dark:hover:text-primary"
        >
          {{ item.title }}
        </span>
      </div>
    </ASpin>
  </ACard>
</template>

<style scoped></style>
