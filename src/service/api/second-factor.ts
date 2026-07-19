import { request } from '../request';

/**
 * GET /auth/is-need/second-factor/verify
 *
 * 判断当前操作是否需要二次认证（输入密码校验）。
 * 返回业务码 200 表示不需要；10009（SECOND_FACTOR_REQUIRED）表示需要。
 * 注：10009 已在请求层 `onBackendFail` 中按「可识别状态」处理（不弹错误、不登出），
 * 调用方通过 `response.data.code` 判断，故失败时 `error` 为 null。
 */
export function fetchIsNeedSecondFactorVerify() {
  return request<null>({
    url: '/auth/is-need/second-factor/verify',
    method: 'get'
  });
}

/**
 * POST /auth/second-factor/verify
 *
 * 二次认证：校验当前登录用户的密码（RSA 公钥加密后的密文）。
 * 返回业务码 200 表示认证通过。
 *
 * @param data.password RSA 加密后的密码 Base64 密文
 */
export function fetchSecondFactorVerify(data: Api.SecondFactor.SecondFactorVerifyParams) {
  return request<null>({
    url: '/auth/second-factor/verify',
    method: 'post',
    data
  });
}
