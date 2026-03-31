/**
 * 简单的加密解密工具函数
 * 使用 Base64 编码进行简单加密（可根据需要替换为更安全的加密方式）
 */

/**
 * 加密字符串
 * @param str 需要加密的字符串
 * @returns 加密后的字符串
 */
export function encrypt(str: string): string {
  try {
    return btoa(encodeURIComponent(str))
  } catch (error) {
    console.error('加密失败:', error)
    return str
  }
}

/**
 * 解密字符串
 * @param str 需要解密的字符串
 * @returns 解密后的字符串
 */
export function decrypt(str: string): string {
  try {
    return decodeURIComponent(atob(str))
  } catch (error) {
    console.error('解密失败:', error)
    return str
  }
}
