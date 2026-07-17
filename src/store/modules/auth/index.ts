import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { fetchCaptcha, fetchGetUserInfo, fetchLogin, fetchLogout } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import { localStg } from '@/utils/storage';
import { SetupStoreId } from '@/enum';
import { $t } from '@/locales';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { clearAuthStorage, getToken } from './shared';

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const route = useRoute();
  const routeStore = useRouteStore();
  const tabStore = useTabStore();
  const { toLogin, redirectFromLogin } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const token = ref(getToken());

  /** Current captcha key (returned by `/captcha/get`, sent back on login) */
  const captchaKey = ref('');
  /** Current captcha Base64 image */
  const captchaImage = ref('');

  async function getCaptcha() {
    const { data, error } = await fetchCaptcha();
    if (!error && data) {
      captchaKey.value = data.captchaKey;
      captchaImage.value = data.base64Image;
    }
    return { captchaKey: captchaKey.value, captchaImage: captchaImage.value };
  }

  const userInfo: Api.Auth.UserInfo = reactive({
    user: {
      id: 0,
      username: '',
      nickname: '',
      status: 1
    },
    roles: [],
    permissions: [],
    menus: []
  });

  /** is super role in static route */
  const isStaticSuper = computed(() => {
    const { VITE_AUTH_ROUTE_MODE, VITE_STATIC_SUPER_ROLE } = import.meta.env;

    return (
      VITE_AUTH_ROUTE_MODE === 'static' && userInfo.roles.map(role => role.roleCode).includes(VITE_STATIC_SUPER_ROLE)
    );
  });

  /** Is login */
  const isLogin = computed(() => Boolean(token.value));

  /** Reset auth store */
  async function resetStore() {
    const authStore = useAuthStore();

    // notify backend to invalidate the current session before clearing local state
    await fetchLogout().catch(() => {});

    clearAuthStorage();

    authStore.$reset();

    if (!route.meta.constant) {
      await toLogin();
    }

    tabStore.cacheTabs();
    routeStore.resetStore();
  }

  /**
   * Login
   *
   * @param userName User name
   * @param password Password
   * @param options.redirect Whether to redirect after login. Default is `true`
   * @param options.captchaKey Captcha key returned by `/captcha/get`
   * @param options.captchaCode Captcha code input by user
   */
  async function login(
    userName: string,
    password: string,
    options?: { redirect?: boolean; captchaKey?: string; captchaCode?: string }
  ) {
    startLoading();

    const { redirect = true, captchaKey: captchaKeyValue = '', captchaCode = '' } = options ?? {};

    const { data: loginToken, error } = await fetchLogin(userName, password, {
      captchaKey: captchaKeyValue,
      captchaCode
    });

    if (!error) {
      const pass = await loginByToken(loginToken);

      if (pass) {
        await redirectFromLogin(redirect);

        window.$notification?.success({
          message: $t('page.login.common.loginSuccess'),
          description: $t('page.login.common.welcomeBack', { userName: userInfo.user.username })
        });
      }
    } else {
      resetStore();
    }

    endLoading();
  }

  async function loginByToken(loginToken: Api.Auth.LoginToken) {
    // 1. stored in the localStorage, the later requests need it in headers
    localStg.set('token', loginToken);

    // 2. get user info
    const pass = await getUserInfo();

    if (pass) {
      token.value = loginToken;

      return true;
    }

    return false;
  }

  async function getUserInfo() {
    const { data: info, error } = await fetchGetUserInfo();

    if (!error) {
      // update store
      Object.assign(userInfo, info);

      return true;
    }

    return false;
  }

  async function initUserInfo() {
    const hasToken = getToken();

    if (hasToken) {
      const pass = await getUserInfo();

      if (!pass) {
        resetStore();
      }
    }
  }

  return {
    token,
    userInfo,
    captchaKey,
    captchaImage,
    isStaticSuper,
    isLogin,
    loginLoading,
    resetStore,
    getCaptcha,
    login,
    initUserInfo
  };
});
