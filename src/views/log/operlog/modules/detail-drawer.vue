<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  visible: boolean;
  row: Api.SysLog.SysLogVO | null;
}
const props = defineProps<Props>();
const emit = defineEmits<{ 'update:visible': [boolean] }>();

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
  const m = (props.row?.requestMethod || '').toUpperCase();
  if (m === 'GET') return 'green';
  if (m === 'POST') return 'blue';
  if (m === 'PUT') return 'orange';
  if (m === 'DELETE') return 'red';
  return 'default';
});
</script>

<template>
  <ADrawer :open="visible" title="操作日志详情" width="720px" @close="close">
    <template v-if="row">
      <ADescriptions bordered :column="1" size="small">
        <ADescriptionsItem label="日志编号">{{ row.id }}</ADescriptionsItem>
        <ADescriptionsItem label="操作模块">{{ row.title }}</ADescriptionsItem>
        <ADescriptionsItem label="操作人员">{{ row.operName || '-' }}</ADescriptionsItem>
        <ADescriptionsItem label="请求方式">
          <ATag :color="methodColor">{{ row.requestMethod }}</ATag>
        </ADescriptionsItem>
        <ADescriptionsItem label="请求地址">{{ row.requestUrl || '-' }}</ADescriptionsItem>
        <ADescriptionsItem label="操作状态">
          <ATag :color="row.status === 1 ? 'success' : 'error'">{{ row.statusText }}</ATag>
        </ADescriptionsItem>
        <ADescriptionsItem label="操作地点">{{ row.operLocation || '-' }}</ADescriptionsItem>
        <ADescriptionsItem label="操作 IP">{{ row.operIp || '-' }}</ADescriptionsItem>
        <ADescriptionsItem label="浏览器">{{ row.browser || '-' }}</ADescriptionsItem>
        <ADescriptionsItem label="操作系统">{{ row.os || '-' }}</ADescriptionsItem>
        <ADescriptionsItem label="耗时">{{ row.costTime }} ms</ADescriptionsItem>
        <ADescriptionsItem label="操作时间">{{ row.operTime || '-' }}</ADescriptionsItem>
        <ADescriptionsItem label="异常信息">
          <span v-if="row.errorMsg" style="color: #f5222d">{{ row.errorMsg }}</span>
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
          >{{ prettyJson(row.requestParam) || '-' }}</pre>
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
          >{{ prettyJson(row.responseData) || '-' }}</pre>
      </ACard>
    </template>
    <template v-else>
      <div class="text-center text-#999">暂无数据</div>
    </template>
  </ADrawer>
</template>

<style scoped></style>
