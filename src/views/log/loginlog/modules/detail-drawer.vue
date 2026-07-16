<script setup lang="ts">
interface Props {
  visible: boolean;
  row: Api.SysLoginLog.SysLoginLogVO | null;
}
defineProps<Props>();
const emit = defineEmits<{ 'update:visible': [boolean] }>();

function close() {
  emit('update:visible', false);
}

function loginTypeColor(type: number) {
  if (type === 1) return 'blue'; // 登录
  if (type === 2) return 'cyan'; // 登出
  if (type === 3) return 'orange'; // 踢下线
  return 'default';
}
</script>

<template>
  <ADrawer :open="visible" title="登录日志详情" width="720px" @close="close">
    <template v-if="row">
      <ADescriptions bordered :column="1" size="small">
        <ADescriptionsItem label="日志编号">{{ row.id }}</ADescriptionsItem>
        <ADescriptionsItem label="用户 ID">{{ row.userId }}</ADescriptionsItem>
        <ADescriptionsItem label="登录用户">{{ row.username || '-' }}</ADescriptionsItem>
        <ADescriptionsItem label="登录类型">
          <ATag :color="loginTypeColor(row.loginType)">{{ row.loginTypeText }}</ATag>
        </ADescriptionsItem>
        <ADescriptionsItem label="登录状态">
          <ATag :color="row.status === 1 ? 'success' : 'error'">{{ row.statusText }}</ATag>
        </ADescriptionsItem>
        <ADescriptionsItem label="登录 IP">{{ row.loginIp || '-' }}</ADescriptionsItem>
        <ADescriptionsItem label="登录地点">{{ row.loginLocation || '-' }}</ADescriptionsItem>
        <ADescriptionsItem label="浏览器">{{ row.browser || '-' }}</ADescriptionsItem>
        <ADescriptionsItem label="操作系统">{{ row.os || '-' }}</ADescriptionsItem>
        <ADescriptionsItem label="登录时间">{{ row.loginTime || '-' }}</ADescriptionsItem>
      </ADescriptions>
    </template>
    <template v-else>
      <div class="text-center text-#999">暂无数据</div>
    </template>
  </ADrawer>
</template>

<style scoped></style>
