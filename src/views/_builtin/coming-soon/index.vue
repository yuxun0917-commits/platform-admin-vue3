<script setup lang="ts">
defineOptions({
  name: 'ComingSoon'
});
</script>

<template>
  <div class="h-full flex-col-center gap-16px">
    <SvgIcon icon="ant-design:build-outlined" class="text-64px text-primary" />
    <h2 class="text-20px text-primary font-semibold">页面建设中</h2>
    <p class="text-14px text-[#999]">该菜单对应的前端页面尚未开发（后端组件路径未匹配到 src/views 下的文件）。</p>
  </div>
</template>

<style scoped></style>
