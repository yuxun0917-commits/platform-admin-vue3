import { type Ref, onMounted, onUnmounted, ref } from 'vue';

/**
 * 固定高度卡片内的表格纵向滚动方案。
 *
 * 观察 targetRef 元素尺寸变化，动态计算 ATable 的 scroll.y，
 * 保证表头与分页条始终可见、底部行不被截断（与 system/user 模块一致）。
 *
 * 用法：
 *   const tableScrollRef = ref<HTMLElement | null>(null);
 *   const { tableScrollY } = useTableScrollY(tableScrollRef);
 *   <div ref="tableScrollRef" class="flex-1 overflow-hidden">
 *     <ATable :scroll="{ x: 1200, y: tableScrollY }" />
 *   </div>
 *
 * 注意：带拖拽排序的表格（role/post/dept/menu）不能给 ATable 设 scroll.y（会分离表体破坏拖拽），
 * 这类表格改用 CSS 容器滚动（max-height + overflow-y:auto），不使用本 composable。
 *
 * @param targetRef 表格滚动容器（需为卡片内 flex-1 且 overflow-hidden 的元素）
 * @param reserved  预留高度（表头 + 分页条 + 安全边距），默认 96
 */
export function useTableScrollY(targetRef: Ref<HTMLElement | null | undefined>, reserved = 96) {
  const tableScrollY = ref(400);
  let observer: ResizeObserver | null = null;

  function update() {
    if (!targetRef.value) return;
    tableScrollY.value = Math.max(200, targetRef.value.clientHeight - reserved);
  }

  function start() {
    update();
    if (typeof ResizeObserver === 'undefined' || !targetRef.value) return;
    observer = new ResizeObserver(update);
    observer.observe(targetRef.value);
  }

  function stop() {
    observer?.disconnect();
    observer = null;
  }

  onMounted(start);
  onUnmounted(stop);

  return { tableScrollY };
}
