<script setup lang="ts">
import { watch } from 'vue';
import { fetchDashboardLoginTrend } from '@/service/api/dashboard';
import { useAppStore } from '@/store/modules/app';
import { useEcharts } from '@/hooks/common/echarts';
import { $t } from '@/locales';

defineOptions({
  name: 'LoginTrend'
});

const appStore = useAppStore();

const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'line' }
  },
  grid: {
    left: '2%',
    right: '3%',
    bottom: '3%',
    top: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: [] as string[],
    axisLine: { lineStyle: { color: '#9ca3af' } },
    axisLabel: { color: '#6b7280' }
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
    axisLabel: { color: '#6b7280' }
  },
  series: [
    {
      name: $t('page.dashboard.loginsToday'),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#3b82f6', width: 3 },
      itemStyle: { color: '#3b82f6', borderWidth: 2, borderColor: '#fff' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(59, 130, 246, 0.35)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
          ]
        }
      },
      data: [] as number[]
    }
  ]
}));

async function loadData() {
  const { data, error } = await fetchDashboardLoginTrend();
  if (error || !data) return;

  const days: string[] = [];
  const values: number[] = [];
  for (const item of data) {
    days.push(item.loginDate.slice(5)); // yyyy-MM-dd -> MM-dd
    values.push(item.count);
  }

  updateOptions(opts => {
    opts.xAxis.data = days;
    opts.series[0].data = values;
    return opts;
  });
}

function updateLocale() {
  updateOptions((opts, factory) => {
    const originOpts = factory();
    opts.series[0].name = originOpts.series[0].name;
    return opts;
  });
}

loadData();

watch(
  () => appStore.locale,
  () => {
    updateLocale();
  }
);
</script>

<template>
  <ACard :bordered="false" :title="$t('page.dashboard.loginTrend')" class="card-wrapper">
    <div ref="domRef" class="h-280px overflow-hidden"></div>
  </ACard>
</template>

<style scoped></style>
