declare namespace Api {
  namespace SecondFactor {
    /** POST /auth/second-factor/verify 入参 */
    interface SecondFactorVerifyParams {
      /** RSA 加密后的当前用户密码（Base64 密文） */
      password: string;
    }
  }
}
