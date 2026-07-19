<script setup lang="ts">
import SystemOverview from './modules/system-overview.vue';
import StatCards from './modules/stat-cards.vue';
import ServerHealth from './modules/server-health.vue';
import LoginTrend from './modules/login-trend.vue';
import OpsOverview from './modules/ops-overview.vue';
import RecentLogins from './modules/recent-logins.vue';
import LatestAnnouncements from './modules/latest-announcements.vue';
</script>

<template>
  <ASpace direction="vertical" :size="16" class="w-full">
    <SystemOverview />

    <ARow :gutter="[16, 16]">
      <ACol :span="24" :lg="16">
        <ASpace direction="vertical" :size="16" class="w-full">
          <StatCards />
          <ServerHealth />
          <LoginTrend />
        </ASpace>
      </ACol>
      <ACol :span="24" :lg="8">
        <ASpace direction="vertical" :size="16" class="w-full">
          <OpsOverview />
          <RecentLogins />
          <LatestAnnouncements />
        </ASpace>
      </ACol>
    </ARow>
  </ASpace>
</template>

<style scoped></style>
