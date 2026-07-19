import type { AxiosResponse } from 'axios';
import { BACKEND_ERROR_CODE, createFlatRequest, createRequest } from '@sa/axios';
import { useAuthStore } from '@/store/modules/auth';
import { localStg } from '@/utils/storage';
import { getServiceBaseURL } from '@/utils/service';
import { $t } from '@/locales';
import { getAuthorization, handleExpiredRequest, showErrorMsg } from './shared';
import type { RequestInstanceState } from './type';

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL, otherBaseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

/** 判断后端业务码是否属于「需要二次认证」（可识别状态，非错误，不应触发登出或错误提示） */
function isSecondFactorCode(code: string): boolean {
  const codes = import.meta.env.VITE_SERVICE_SECOND_FACTOR_CODES?.split(',').filter(Boolean) || [];
  return codes.includes(code);
}

/** 读取 env 中以逗号分隔的权限码列表（避免在每个分支里重复写 `?.split || []`，降低 onBackendFail 复杂度） */
function getCodeList(key: keyof ImportMetaEnv): string[] {
  const raw = import.meta.env[key];
  return typeof raw === 'string' ? raw.split(',').filter(Boolean) : [];
}

/** 无权限 → 跳转 403 兜底页（动态 import 避免循环依赖） */
function redirectTo403() {
  import('@/router').then(({ router }) => {
    if (router.currentRoute.value.name !== '403') {
      router.push({ name: '403' });
    }
  });
}

/** 弹窗式登出提示 */
function showModalLogout(message: string, cleanup: () => void) {
  window.$modal?.error({
    title: $t('common.error'),
    content: message,
    okText: $t('common.confirm'),
    maskClosable: false,
    onOk: cleanup,
    onCancel: cleanup
  });
}

export const request = createFlatRequest<App.Service.Response, RequestInstanceState>(
  {
    baseURL,
    headers: {}
  },
  {
    async onRequest(config) {
      const Authorization = getAuthorization();
      Object.assign(config.headers, { Authorization });

      return config;
    },
    isBackendSuccess(response) {
      // when the backend response code is "0000"(default), it means the request is success
      // to change this logic by yourself, you can modify the `VITE_SERVICE_SUCCESS_CODE` in `.env` file
      return String(response.data.code) === import.meta.env.VITE_SERVICE_SUCCESS_CODE;
    },
    async onBackendFail(response, instance) {
      const authStore = useAuthStore();
      const responseCode = String(response.data.code);
      const requestUrl = response.config.url || '';

      function handleLogout() {
        authStore.resetStore();
      }

      function logoutAndCleanup() {
        handleLogout();
        window.removeEventListener('beforeunload', handleLogout);

        request.state.errMsgStack = request.state.errMsgStack?.filter(msg => msg !== response.data.msg) || [];
      }

      // 登录接口返回任何非成功 code 都不应触发「会话过期」的登出流程，否则失败一次就循环 logout
      if (requestUrl === '/auth/login' || requestUrl.endsWith('/auth/login')) {
        return null;
      }

      // when the backend response code is in `logoutCodes`, it means the user will be logged out and redirected to login page
      const logoutCodes = getCodeList('VITE_SERVICE_LOGOUT_CODES');
      if (logoutCodes.includes(responseCode)) {
        handleLogout();
        return null;
      }

      // when the backend response code is in `modalLogoutCodes`, it means the user will be logged out by displaying a modal
      const modalLogoutCodes = getCodeList('VITE_SERVICE_MODAL_LOGOUT_CODES');
      if (modalLogoutCodes.includes(responseCode) && !request.state.errMsgStack?.includes(responseCode)) {
        request.state.errMsgStack = [...(request.state.errMsgStack || []), response.data.msg];

        // prevent the user from refreshing the page
        window.addEventListener('beforeunload', handleLogout);

        showModalLogout(response.data.msg, logoutAndCleanup);

        return null;
      }

      // when the backend response code is in `noPermissionCodes`, it means the user has no permission to
      // access the resource. Redirect to the 403 no-permission page as a fallback (instead of an error toast).
      const noPermissionCodes = getCodeList('VITE_SERVICE_NO_PERMISSION_CODES');
      if (noPermissionCodes.includes(responseCode)) {
        redirectTo403();
        return null;
      }

      // when the backend response code is in `secondFactorCodes`, it means the current operation needs a
      // second-factor (password) verification. Treat it as a recognizable state (NOT an error): return the
      // response so the caller can branch on `response.data.code`, and skip logout / error toast.
      if (isSecondFactorCode(responseCode)) {
        return response;
      }

      // when the backend response code is in `expiredTokenCodes`, it means the token is expired, and refresh token
      // the api `refreshToken` can not return error code in `expiredTokenCodes`, otherwise it will be a dead loop, should return `logoutCodes` or `modalLogoutCodes`
      const expiredTokenCodes = getCodeList('VITE_SERVICE_EXPIRED_TOKEN_CODES');
      if (expiredTokenCodes.includes(responseCode)) {
        const success = await handleExpiredRequest(request.state);
        if (success) {
          const Authorization = getAuthorization();
          Object.assign(response.config.headers, { Authorization });

          return instance.request(response.config) as Promise<AxiosResponse>;
        }
      }

      return null;
    },
    transformBackendResponse(response) {
      return response.data.data;
    },
    onError(error) {
      // when the request is fail, you can show error message

      let message = error.message;
      let backendErrorCode = '';

      // get backend error message and code
      if (error.code === BACKEND_ERROR_CODE) {
        message = error.response?.data?.msg || message;
        backendErrorCode = String(error.response?.data?.code) || '';
      }

      // the error message is displayed in the modal
      const modalLogoutCodes = import.meta.env.VITE_SERVICE_MODAL_LOGOUT_CODES?.split(',') || [];
      if (modalLogoutCodes.includes(backendErrorCode)) {
        return;
      }

      // when the token is expired, refresh token and retry request, so no need to show error message
      const expiredTokenCodes = import.meta.env.VITE_SERVICE_EXPIRED_TOKEN_CODES?.split(',') || [];
      if (expiredTokenCodes.includes(backendErrorCode)) {
        return;
      }

      // when the backend response code is in `noPermissionCodes`, it is redirected to the 403 page, so no error toast
      const noPermissionCodes = import.meta.env.VITE_SERVICE_NO_PERMISSION_CODES?.split(',') || [];
      if (noPermissionCodes.includes(backendErrorCode)) {
        return;
      }

      showErrorMsg(request.state, message);
    }
  }
);

export const demoRequest = createRequest<App.Service.DemoResponse>(
  {
    baseURL: otherBaseURL.demo
  },
  {
    async onRequest(config) {
      const { headers } = config;

      // set token
      const token = localStg.get('token');
      const Authorization = token ? `Bearer ${token}` : null;
      Object.assign(headers, { Authorization });

      return config;
    },
    isBackendSuccess(response) {
      // when the backend response code is "200", it means the request is success
      // you can change this logic by yourself
      return response.data.status === '200';
    },
    async onBackendFail(_response) {
      // when the backend response code is not "200", it means the request is fail
      // for example: the token is expired, refresh token and retry request
    },
    transformBackendResponse(response) {
      return response.data.result;
    },
    onError(error) {
      // when the request is fail, you can show error message

      let message = error.message;

      // show backend error message
      if (error.code === BACKEND_ERROR_CODE) {
        message = error.response?.data?.message || message;
      }

      window.$message?.error(message);
    }
  }
);
