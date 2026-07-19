<script setup lang="ts">
import { ref, watch } from 'vue';
import { fetchSysLoginLogView } from '@/service/api';

interface Props {
  visible: boolean;
  row: Api.SysLoginLog.SysLoginLogVO | null;
}
const props = defineProps<Props>();
const emit = defineEmits<{ 'update:visible': [boolean] }>();

const detail = ref<Api.SysLoginLog.SysLoginLogVO | null>(null);
const loading = ref(false);

function close() {
  emit('update:visible', false);
}

function loginTypeColor(type: number) {
  if (type === 1) return 'blue'; // 登录
  if (type === 2) return 'cyan'; // 登出
  if (type === 3) return 'orange'; // 踢下线
  return 'default';
}

watch(
  () => props.visible,
  visible => {
    if (visible && props.row?.id) {
      loading.value = true;
      detail.value = null;
      fetchSysLoginLogView(props.row.id).then(({ error, data }) => {
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
  <ADrawer :open="visible" title="登录日志详情" width="720px" @close="close">
    <ASpin :spinning="loading">
      <template v-if="detail">
        <ADescriptions bordered :column="1" size="small">
          <ADescriptionsItem label="日志编号">{{ detail.id }}</ADescriptionsItem>
          <ADescriptionsItem label="用户 ID">{{ detail.userId }}</ADescriptionsItem>
          <ADescriptionsItem label="登录用户">{{ detail.username || '-' }}</ADescriptionsItem>
          <ADescriptionsItem label="登录类型">
            <ATag :color="loginTypeColor(detail.loginType)">{{ detail.loginTypeText }}</ATag>
          </ADescriptionsItem>
          <ADescriptionsItem label="登录状态">
            <ATag :color="detail.status === 1 ? 'success' : 'error'">{{ detail.statusText }}</ATag>
          </ADescriptionsItem>
          <ADescriptionsItem label="登录 IP">{{ detail.loginIp || '-' }}</ADescriptionsItem>
          <ADescriptionsItem label="登录地点">{{ detail.loginLocation || '-' }}</ADescriptionsItem>
          <ADescriptionsItem label="浏览器">{{ detail.browser || '-' }}</ADescriptionsItem>
          <ADescriptionsItem label="操作系统">{{ detail.os || '-' }}</ADescriptionsItem>
          <ADescriptionsItem label="登录时间">{{ detail.loginTime || '-' }}</ADescriptionsItem>
        </ADescriptions>
      </template>
      <template v-else>
        <div class="text-center text-#999">暂无数据</div>
      </template>
    </ASpin>
  </ADrawer>
</template>

<style scoped></style>
