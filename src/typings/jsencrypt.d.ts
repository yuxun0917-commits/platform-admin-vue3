declare module 'jsencrypt' {
  export default class JSEncrypt {
    constructor(options?: Record<string, unknown>);
    /** 设置 RSA 公钥（PEM 或裸 Base64 X.509） */
    setPublicKey(key: string): void;
    /** 设置 RSA 私钥 */
    setPrivateKey(key: string): void;
    /** 用公钥加密明文，返回 Base64 密文；失败返回 false */
    encrypt(text: string): string | false;
    /** 用私钥解密 Base64 密文，返回明文；失败返回 false */
    decrypt(text: string): string | false;
  }
}
