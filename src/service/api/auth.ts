import { request } from '../request';

/**
 * Get graphical captcha
 *
 * @returns captcha key and Base64 image
 */
export function fetchCaptcha() {
  return request<Api.Auth.Captcha>({
    url: '/captcha/get',
    method: 'get'
  });
}

/**
 * Login
 *
 * @param userName User name
 * @param password Password
 * @param captcha Captcha key returned by `/captcha/get` and the code input by user
 */
export function fetchLogin(userName: string, password: string, captcha: { captchaKey: string; captchaCode: string }) {
  return request<Api.Auth.LoginToken>({
    url: '/auth/login',
    method: 'post',
    data: {
      username: userName,
      password,
      captchaKey: captcha.captchaKey,
      captchaCode: captcha.captchaCode
    }
  });
}

/** Get user info */
export function fetchGetUserInfo() {
  return request<Api.Auth.UserInfo>({ url: '/user/info' });
}

/**
 * Refresh token
 *
 * @param refreshToken Refresh token
 */
export function fetchRefreshToken(refreshToken: string) {
  return request<Api.Auth.LoginToken>({
    url: '/auth/refreshToken',
    method: 'post',
    data: {
      refreshToken
    }
  });
}

/**
 * Logout
 *
 * Calls backend `POST /auth/logout` to invalidate the current session/token.
 */
export function fetchLogout() {
  return request({ url: '/auth/logout', method: 'post' });
}

/**
 * return custom backend error
 *
 * @param code error code
 * @param msg error message
 */
export function fetchCustomBackendError(code: string, msg: string) {
  return request({ url: '/auth/error', params: { code, msg } });
}
