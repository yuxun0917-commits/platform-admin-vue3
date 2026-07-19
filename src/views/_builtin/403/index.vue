<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouterPush } from '@/hooks/common/router';

defineOptions({ name: 'Exception403' });

const { routerPushByKey } = useRouterPush();

/** 倒计时秒数，结束后自动回首页 */
const countdown = ref(5);
let timer: ReturnType<typeof setInterval> | null = null;

function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

onMounted(() => {
  timer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      clearTimer();
      routerPushByKey('root');
    }
  }, 1000);
});

onBeforeUnmount(clearTimer);
</script>

<template>
  <ExceptionBase type="403">
    <template #extra>
      <span class="text-14px text-gray-500">{{ countdown }} 秒后自动返回首页</span>
    </template>
  </ExceptionBase>
</template>

<style scoped></style>
