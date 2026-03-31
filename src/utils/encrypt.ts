// @ts-ignore
import JSEncrypt from 'jsencrypt'

/**
 * 使用 RSA 公钥加密密码
 * @param password 明文密码
 * @param publicKeyBase64 Base64 编码的公钥
 * @returns 加密后的密码（带 RSA: 前缀）
 */
export function encryptPassword(password: string, publicKeyBase64: string): string {
  const encrypt = new JSEncrypt()
  // 公钥需要 PEM 格式
  const publicKey = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`
  encrypt.setPublicKey(publicKey)
  const encrypted = encrypt.encrypt(password) || ''
  return `RSA:${encrypted}` // 必须添加 RSA: 前缀
}
