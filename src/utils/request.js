import { getSharedKey } from '@/utils/cryptoUtils.js';

const baseURL = '/dataflow/api';
const sharedKey = await getSharedKey();

// 判断是否需要加密或解密的辅助函数
const isEncryptionRequired = (url) => {
  return !url.includes('/exchange-keys') && !url.includes('/find-username');
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

    if (typeof response.json !== 'function') {
      throw new Error('response.json 不是函数，response对象可能异常');
    }

    const apiResponse = await response.json();

    const decryptedData = isEncryptionRequired(url) && apiResponse.encryptedData
      ? await decryptData(sharedKey, apiResponse.encryptedData)
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