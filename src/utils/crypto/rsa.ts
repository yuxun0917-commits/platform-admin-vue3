import JSEncrypt from 'jsencrypt';
import { fetchRsaPublicKey } from '@/service/api';

/**
 * RSA 加密工具
 *
 * 与后端 `RsaComponent` 对齐：`RSA/ECB/PKCS1Padding`（即 RSAES-PKCS1-V1_5），
 * 公钥为 Base64 编码的 X.509 DER，加密结果以 Base64 返回（后端 `decryptByPrivateKey` 接收 Base64 密文）。
 */

/** 公钥缓存（服务端重启会换新密钥，加密失败时清空重试） */
let cachedPublicKey: string | null = null;

/** 将后端返回的裸 Base64 公钥包装为 jsencrypt 需要的 PEM 格式 */
function toPem(base64: string): string {
  if (base64.includes('BEGIN PUBLIC KEY')) {
    return base64;
  }
  return `-----BEGIN PUBLIC KEY-----\n${base64}\n-----END PUBLIC KEY-----`;
}

/** 获取 RSA 公钥（带缓存） */
async function getPublicKey(): Promise<string | null> {
  if (cachedPublicKey) {
    return cachedPublicKey;
  }
  const { data, error } = await fetchRsaPublicKey();
  if (!error && data) {
    cachedPublicKey = data;
  }
  return cachedPublicKey;
}

/** 清空公钥缓存（如服务端已重启换密钥） */
export function clearRsaPublicKeyCache() {
  cachedPublicKey = null;
}

/**
 * 用 RSA 公钥加密明文
 *
 * @param plainText 待加密的明文（用户名 / 密码）
 * @returns Base64 密文；拿不到公钥或加密失败时返回 `false`
 */
export async function encryptByRsa(plainText: string): Promise<string | false> {
  const key = await getPublicKey();
  if (!key) {
    return false;
  }

  const doEncrypt = (k: string) => {
    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(toPem(k));
    return encryptor.encrypt(plainText);
  };

  let encrypted = doEncrypt(key);
  if (!encrypted) {
    // 公钥可能已失效（服务端重启换密钥），清空缓存重试一次
    clearRsaPublicKeyCache();
    const retryKey = await getPublicKey();
    if (!retryKey) {
      return false;
    }
    encrypted = doEncrypt(retryKey);
  }

  return encrypted;
}
