<script setup lang="ts">
import { computed } from 'vue';
import { ConfigProvider } from 'ant-design-vue';
import type { WatermarkProps } from 'ant-design-vue';
import { useAppStore } from './store/modules/app';
import { useThemeStore } from './store/modules/theme';
import { antdLocales } from './locales/antd';
import ForceChangePwdModal from './views/_builtin/force-change-pwd-modal.vue';

defineOptions({
  name: 'App'
});

const appStore = useAppStore();
const themeStore = useThemeStore();

const antdLocale = computed(() => {
  return antdLocales[appStore.locale];
});

const watermarkProps = computed(() => {
  const props: WatermarkProps = {
    content: themeStore.watermark.text,
    width: 120,
    height: 120,
    font: {
      fontSize: 16
    },
    offset: [12, 60],
    rotate: -15,
    zIndex: 9999
  };

  return props;
});
</script>

<template>
  <ConfigProvider :theme="themeStore.antdTheme" :locale="antdLocale">
    <AppProvider>
      <RouterView class="bg-layout" />
      <AWatermark
        v-if="themeStore.watermark.visible"
        v-bind="watermarkProps"
        class="pointer-events-none size-full absolute-lt!"
      />
      <!-- 强制改密弹窗：登录后 /user/info 返回 20006 时在首页弹出，不允许关闭 -->
      <ForceChangePwdModal />
    </AppProvider>
  </ConfigProvider>
</template>

<style scoped></style>
