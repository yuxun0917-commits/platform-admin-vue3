import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { fetchCaptcha, fetchGetUserInfo, fetchLogin, fetchLogout } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import { localStg } from '@/utils/storage';
import { encryptByRsa } from '@/utils/crypto/rsa';
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

  /** Whether the current user must change password (set when `/user/info` returns the force-change-pwd code, e.g. new user) */
  const needChangePassword = ref(false);
  /** Backend message carried by the force-change-pwd response (e.g. "新用户需要修改密码！" / "密码过期，请修改密码！") */
  const needChangePasswordMsg = ref('');

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

    // 没有 token 时无需通知后端登出，避免登录失败等场景触发 logout 循环
    if (getToken()) {
      await fetchLogout().catch(() => {});
    }

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

    // 用户名、密码用 RSA 公钥加密后再提交
    const [encryptedUser, encryptedPwd] = await Promise.all([encryptByRsa(userName), encryptByRsa(password)]);
    if (!encryptedUser || !encryptedPwd) {
      window.$message?.error($t('page.login.common.encryptFail'));
      await getCaptcha();
      endLoading();
      return;
    }

    const { data: loginToken, error } = await fetchLogin(encryptedUser, encryptedPwd, {
      captchaKey: captchaKeyValue,
      captchaCode
    });

    if (!error && loginToken) {
      const pass = await loginByToken(loginToken);

      if (pass) {
        // 先跳转仪表盘首页；/user/info（用户信息 + 菜单）由路由守卫 initAuthRoute 兜底拉取并渲染侧边栏
        await redirectFromLogin(redirect);

        window.$notification?.success({
          message: $t('page.login.common.loginSuccess'),
          description: $t('page.login.common.welcomeBack', { userName })
        });
      } else {
        // token 已写入但 userInfo 拉取失败，清除半成品登录态
        resetStore();
      }
    } else {
      // 登录失败：刷新验证码即可，不要 resetStore 触发 logout 循环
      await getCaptcha();
    }

    endLoading();
  }

  async function loginByToken(loginToken: Api.Auth.LoginToken) {
    // 1. stored in the localStorage, the later requests need it in headers
    localStg.set('token', loginToken);

    // 2. 写入 token 即视为登录成功，用户信息（含菜单）的拉取延后到跳转后的路由守卫里触发，
    //    实现「登录成功先跳转仪表盘，再调用 /user/info 渲染菜单」
    token.value = loginToken;

    return true;
  }

  async function getUserInfo() {
    const { data: info, error, response } = await fetchGetUserInfo();

    // 后端强制改密（如新用户 / 密码过期，业务码 20006）：视为可识别状态而非登录失败，
    // 不登出、不弹错误，置位 needChangePassword 交由首页弹窗引导用户改密。
    if (String(response?.data?.code) === import.meta.env.VITE_SERVICE_FORCE_CHANGE_PWD_CODES) {
      needChangePassword.value = true;
      // 后端按场景返回不同提示：新用户"新用户需要修改密码！"、密码过期"密码过期，请修改密码！"
      needChangePasswordMsg.value = response?.data?.msg ?? '';
      return false;
    }

    if (!error && info) {
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

      // 仅在「非强制改密」且拉取失败时才清除登录态，避免强制改密场景下被登出
      if (!pass && !needChangePassword.value) {
        resetStore();
      }
    }
  }

  /** 强制改密弹窗提交成功后：清除标记并全量刷新页面（以最新会话重新初始化菜单与数据） */
  function finishForceChangePwd() {
    needChangePassword.value = false;

    // 强制改密期间所有已登录请求都被后端拦截返回 20006，仅置位标记无法让已挂载的页面恢复。
    // 直接整页刷新：token 持久化在 localStorage，刷新后路由守卫重新拉取 /user/info（此时已放行）、
    // 渲染菜单并加载仪表盘等数据，得到干净的最终状态。
    window.location.reload();
  }

  return {
    token,
    userInfo,
    captchaKey,
    captchaImage,
    needChangePassword,
    needChangePasswordMsg,
    isStaticSuper,
    isLogin,
    loginLoading,
    resetStore,
    getCaptcha,
    login,
    initUserInfo,
    finishForceChangePwd
  };
});
