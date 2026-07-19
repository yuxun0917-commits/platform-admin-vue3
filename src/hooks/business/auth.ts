import { useAuthStore } from '@/store/modules/auth';

export function useAuth() {
  const authStore = useAuthStore();

  function hasAuth(codes: string | string[]) {
    if (!authStore.isLogin) {
      return false;
    }

    // 超管角色（R_SUPER / 静态超管）拥有全部权限，与路由守卫 isStaticSuper 放行保持一致
    if (authStore.isStaticSuper) {
      return true;
    }

    if (typeof codes === 'string') {
      return authStore.userInfo.permissions.includes(codes);
    }

    return codes.some(code => authStore.userInfo.permissions.includes(code));
  }

  return {
    hasAuth
  };
}
