import { getSharedKey } from '@/utils/cryptoUtils.js';
import { encryptData, decryptData } from '@/service/cryptoWorkerService.js';

const baseURL = '/dataflow/api';

// 判断是否需要加密或解密的辅助函数
const isEncryptionRequired = (url) => {
  return !url.includes('/exchange-keys') && !url.includes('/find-username');
};

// 判断是否需要对请求体进行签名
const isSignRequired = (url, method) => {
  return method === 'POST' && !url.includes('/exchange-keys') && !url.includes('/upload-chunk');
};

const request = async (url, options = {}) => {
  const isFormData = options.body instanceof FormData;

  const headers = isFormData
    ? { ...options.headers } // 不设置 Content-Type
    : {
      'Content-Type': 'application/json',
      ...options.headers,
    };

  // 检查 sessionStorage 中是否存在 JWT，并将其添加到请求头中
  const jwt = sessionStorage.getItem('authToken');
  if (jwt) {
    headers['authToken'] = jwt;
  }

  options.headers = headers;

  // 在签名之前，若 body 为 undefined，则初始化为空对象，方便后续添加字段
  if (isSignRequired(url, options.method)) {
    if (!options.body) {
      options.body = {};
    }

    const timestamp = Date.now();
    const sharedKey = await getSharedKey();

    try {
      // 准备需要签名的数据副本，不能包含 sign 字段
      let dataForSign;
      if (isFormData) {
        dataForSign = Object.fromEntries(options.body.entries());
      } else {
        dataForSign = { ...options.body };
      }
      dataForSign.timestamp = timestamp;

      // 使用排序后的对象进行签名
      dataForSign = JSON.stringify(dataForSign);

      const payloadUint8 = new TextEncoder().encode(dataForSign);
      const signature = await encryptData(sharedKey, payloadUint8);

      // 将签名添加到请求体
      if (isFormData) {
        options.body.append('sign', signature);
        options.body.append('timestamp', timestamp);
      } else {
        options.body.sign = signature;
        options.body.timestamp = timestamp;
      }
    } catch (err) {
      console.error('签名生成失败:', err);
      throw err;
    }
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof Blob)) {
    const contentType = headers['Content-Type'] || '';

    if (contentType && contentType.includes('application/json')) {
      options.body = JSON.stringify(options.body);
    } else if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams();
      for (const key in options.body) {
        params.append(key, options.body[key]);
      }
      options.body = params.toString();
    } else if (contentType.includes('application/octet-stream')) {
      if (!(options.body instanceof ArrayBuffer ||
        ArrayBuffer.isView(options.body) ||
        options.body instanceof Blob)) {
        throw new Error('application/octet-stream 类型下 body 必须是二进制数据');
      }
    }
  }

  try {
    const response = await fetch(baseURL + url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (options.method === 'GET' && options.responseType === 'blob') {
      const blob = await response.blob();
      return {
        success: true,
        data: blob,
      };
    }

    const responseText = await response.text();
    let apiResponse;
    try {
      apiResponse = JSON.parse(responseText);
    } catch (e) {
      // 如果 JSON 解析失败，检查是否是登出请求
      if (url.includes('/logout')) {
        // 登出请求收到非 JSON 响应（可能是 HTML），我们将其视为成功
        return { success: true, message: 'Logout successful.' };
      }
      // 如果是其他请求，则抛出原始错误
      throw new Error(`Failed to parse JSON response: ${responseText}`);
    }

    const currentSharedKey = await getSharedKey();
    const decryptedData = isEncryptionRequired(url) && apiResponse.encryptedData
      ? await decryptData(currentSharedKey, apiResponse.encryptedData)
      : apiResponse.data;

    const data = typeof decryptedData === 'string' && decryptedData.startsWith('{')
      ? JSON.parse(decryptedData)
      : decryptedData;

    if (apiResponse.code === 200) {
      return {
        success: true,
        data,
        message: apiResponse.message,
      };
    } else {
      console.error(`Error ${apiResponse.code}: ${apiResponse.message}`);
      return {
        success: false,
        data,
        message: apiResponse.message,
      };
    }
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

// POST 封装
export const post = (url, data, customOptions = {}) => {
  return request(url, {
    method: 'POST',
    body: data,
    ...customOptions,
  });
};

// GET 封装
export const get = (url, customOptions = {}) => {
  return request(url, {
    method: 'GET',
    ...customOptions,
  });
};

export default {
  post,
  get,
};