<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fetchSysLogView } from '@/service/api';

interface Props {
  visible: boolean;
  row: Api.SysLog.SysLogVO | null;
}
const props = defineProps<Props>();
const emit = defineEmits<{ 'update:visible': [boolean] }>();

const detail = ref<Api.SysLog.SysLogVO | null>(null);
const loading = ref(false);

function close() {
  emit('update:visible', false);
}

function prettyJson(str: string) {
  if (!str) return '';
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

const methodColor = computed(() => {
  const m = (detail.value?.requestMethod || '').toUpperCase();
  if (m === 'GET') return 'green';
  if (m === 'POST') return 'blue';
  if (m === 'PUT') return 'orange';
  if (m === 'DELETE') return 'red';
  return 'default';
});

watch(
  () => props.visible,
  visible => {
    if (visible && props.row?.id) {
      loading.value = true;
      detail.value = null;
      fetchSysLogView(props.row.id).then(({ error, data }) => {
        loading.value = false;
        if (!error && data) {
          detail.value = data;
        }
      });
    }
  }
);
</script>

<template>
  <ADrawer :open="visible" title="操作日志详情" width="720px" @close="close">
    <ASpin :spinning="loading">
      <template v-if="detail">
        <ADescriptions bordered :column="1" size="small">
          <ADescriptionsItem label="日志编号">{{ detail.id }}</ADescriptionsItem>
          <ADescriptionsItem label="操作模块">{{ detail.title }}</ADescriptionsItem>
          <ADescriptionsItem label="操作人员">{{ detail.operName || '-' }}</ADescriptionsItem>
          <ADescriptionsItem label="请求方式">
            <ATag :color="methodColor">{{ detail.requestMethod }}</ATag>
          </ADescriptionsItem>
          <ADescriptionsItem label="请求地址">{{ detail.requestUrl || '-' }}</ADescriptionsItem>
          <ADescriptionsItem label="操作状态">
            <ATag :color="detail.status === 1 ? 'success' : 'error'">{{ detail.statusText }}</ATag>
          </ADescriptionsItem>
          <ADescriptionsItem label="操作地点">{{ detail.operLocation || '-' }}</ADescriptionsItem>
          <ADescriptionsItem label="操作 IP">{{ detail.operIp || '-' }}</ADescriptionsItem>
          <ADescriptionsItem label="浏览器">{{ detail.browser || '-' }}</ADescriptionsItem>
          <ADescriptionsItem label="操作系统">{{ detail.os || '-' }}</ADescriptionsItem>
          <ADescriptionsItem label="耗时">{{ detail.costTime }} ms</ADescriptionsItem>
          <ADescriptionsItem label="操作时间">{{ detail.operTime || '-' }}</ADescriptionsItem>
          <ADescriptionsItem label="异常信息">
            <span v-if="detail.errorMsg" style="color: #f5222d">{{ detail.errorMsg }}</span>
            <span v-else>-</span>
          </ADescriptionsItem>
        </ADescriptions>

        <ACard title="请求参数" size="small" class="mt-12px">
          <pre
            style="
              white-space: pre-wrap;
              word-break: break-all;
              font-size: 12px;
              line-height: 1.5;
              max-height: 260px;
              overflow: auto;
              margin: 0;
            "
            >{{ prettyJson(detail.requestParam) || '-' }}</pre>
        </ACard>
        <ACard title="响应数据" size="small" class="mt-12px">
          <pre
            style="
              white-space: pre-wrap;
              word-break: break-all;
              font-size: 12px;
              line-height: 1.5;
              max-height: 280px;
              overflow: auto;
              margin: 0;
            "
            >{{ prettyJson(detail.responseData) || '-' }}</pre>
        </ACard>
      </template>
      <template v-else>
        <div class="text-center text-#999">暂无数据</div>
      </template>
    </ASpin>
  </ADrawer>
</template>

<style scoped></style>
