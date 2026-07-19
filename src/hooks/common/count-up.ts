import { type Ref, ref, watch } from 'vue';

/**
 * 数字递增动画 Hook
 * @param target 目标数值 Ref
 * @param duration 动画时长（ms），默认 1000
 * @returns 当前动画数值 Ref
 */
export function useCountUp(target: Ref<number>, duration = 1000): Ref<number> {
  const current = ref(0);
  let rafId: number | null = null;
  let startTime: number | null = null;

  function easeOutQuart(t: number) {
    return 1 - (1 - t) ** 4;
  }

  function animate(timestamp: number) {
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuart(progress);

    current.value = Math.round(target.value * eased);

    if (progress < 1) {
      rafId = requestAnimationFrame(animate);
    } else {
      current.value = Math.round(target.value);
    }
  }

  function start() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    startTime = null;
    rafId = requestAnimationFrame(animate);
  }

  watch(target, start, { immediate: true });

  return current;
}
