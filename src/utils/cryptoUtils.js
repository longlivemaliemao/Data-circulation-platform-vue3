// 导入所需的加密和请求处理工具函数
import { post } from '@/utils/request.js'; // 导入用于发送 POST 请求的函数
import { saveSharedKey, loadSharedKey, deleteSharedKey } from '@/utils/keyStore.js';

// 用于存储共享密钥和密钥对的全局变量
export let sharedKey = null;
export let clientKeyPair = null;
export let serverPublicKey = null;

/**
 * 初始化密钥交换过程
 * 生成客户端的 ECDH 密钥对，交换公钥并生成共享密钥
 */
export async function initKeyExchange() {
  // 生成客户端的 ECDH 密钥对
  clientKeyPair = await generateECDHKeyPair();

  // 将客户端的公钥发送到服务器，接收服务器返回的公钥并生成共享密钥
  const serverPublicKeyBase64 = await exchangeKeys(clientKeyPair.publicKey);
  await generateSharedECDHSecret(clientKeyPair.privateKey, serverPublicKeyBase64);

  // 获取生成的共享密钥
  sharedKey = await getSharedKey();
}

// 交换密钥：发送客户端公钥到服务器，接收并返回服务器的公钥
async function exchangeKeys(publicKey) {
  // 将客户端的公钥导出为 SPKI 格式的 ArrayBuffer
  const exportedPublicKey = await window.crypto.subtle.exportKey('spki', publicKey);

  // 将 ArrayBuffer 转换为 Base64 编码的字符串
  const publicKeyBase64 = arrayBufferToBase64(exportedPublicKey);

  // 发送客户端公钥到服务器，并接收服务器返回的公钥
  const response = await post('/exchange-keys', { clientPublicKey: publicKeyBase64 });

  // 如果密钥交换成功，返回服务器的公钥
  if (response.success) {
    return response.data;
  } else {
    // 如果密钥交换失败，抛出错误
    throw new Error('密钥交换失败');
  }
}

/**
 * 设置共享密钥并存储在 sessionStorage 中
 * @param {CryptoKey} key - 共享密钥
 */
export async function setSharedKey(key) {
  sharedKey = key;
  // 持久化到 IndexedDB，CryptoKey 为不可导出对象，安全性更高
  await saveSharedKey(key);
}

/**
 * 从 sessionStorage 中获取共享密钥并重新导入
 * @returns {CryptoKey} - 共享密钥
 */
export async function getSharedKey() {
  if (sharedKey) return sharedKey;
  sharedKey = await loadSharedKey();
  return sharedKey;
}

/**
 * 清除共享密钥和密钥对
 */
export function clearSharedKey() {
  sharedKey = null;
  clientKeyPair = null;
  serverPublicKey = null;
  deleteSharedKey();
}

/**
 * 生成 ECDH 密钥对
 * @returns {CryptoKeyPair} - 客户端的 ECDH 密钥对
 */
export async function generateECDHKeyPair() {
  clientKeyPair = await window.crypto.subtle.generateKey({
    name: "ECDH",
    namedCurve: "P-256" // 使用 P-256 椭圆曲线
  }, true, ["deriveKey", "deriveBits"]);
  return clientKeyPair;
}

/**
 * 生成共享密钥并存储
 * @param {CryptoKey} clientPrivateKey - 客户端的私钥
 * @param {string} serverPublicKeyBase64 - 服务器的公钥（Base64 编码）
 */
export async function generateSharedECDHSecret(clientPrivateKey, serverPublicKeyBase64) {
  // 将服务器公钥从 Base64 转换为 ArrayBuffer
  const serverPublicKeyArrayBuffer = await base64ToArrayBuffer(serverPublicKeyBase64);

  // 导入服务器公钥
  serverPublicKey = await window.crypto.subtle.importKey(
    "spki",
    serverPublicKeyArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  // 使用 AES-CTR 模式生成共享密钥
  const secretKey = await window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: serverPublicKey
    },
    clientPrivateKey,
    {
      name: "AES-CTR", // 改为 AES-CTR 模式
      length: 256
    },
    false, // 不可导出，提升安全
    ["encrypt", "decrypt"]
  );

  // 设置并存储共享密钥（不会暴露原始字节）
  await setSharedKey(secretKey);
}

/**
 * 辅助函数：将 Base64 字符串转换为 ArrayBuffer
 * @param {string} base64 - Base64 编码的字符串
 * @returns {ArrayBuffer} - 转换后的 ArrayBuffer
 */
export function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 辅助函数：将 ArrayBuffer 转换为 Base64 字符串
 * @param {ArrayBuffer} buffer - 要转换的 ArrayBuffer
 * @returns {string} - 转换后的 Base64 字符串
 */
export function arrayBufferToBase64(buffer) {
  const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
  return window.btoa(binary);
}
