import { get, post } from '@/utils/request.js'
import { ElMessage } from 'element-plus'
import { getSharedKey } from '@/utils/cryptoUtils.js'
import {
  generatePrivateKey, // 使用 Web Worker 生成私钥的函数
  calculatePublicKey, // 使用 Web Worker 计算公钥的函数
  encryptData, // 使用 Web Worker 加密数据的函数
} from '@/service/cryptoWorkerService.js';

export const fetchDataRecord = async () => {
  try {
    
    const response = await get(`/task/getCompletedData`);
    return response.data;
  } catch (error) {
    console.error('Error:', error);
  }
};

export async function searchUsernamesAPI(username) {
  const response = await get(`/user/search?username=${encodeURIComponent(username)}`);
  if (response.success) {
    return response;
  }
}

// 将私钥保存到指定位置的函数
export async function toSavePrivateKey(username) {
    // 使用 Web Worker 生成私钥
    const privateKey = await generatePrivateKey();

    // 使用生成的私钥计算相应的公钥
    const publicKey = await calculatePublicKey(privateKey);

    const sharedKey = await getSharedKey();
    const encryptedPublicKey = await encryptData(sharedKey, stringToArrayBuffer(publicKey));

    // 设置文件保存对话框的选项
    const options = {
      types: [
        {
          description: 'PEM file',
          accept: {
            'application/x-pem-file': ['.pem'],
          },
        },
      ],
      excludeAcceptAllOption: true,
    };

    try {
      // 显示文件保存对话框并获取文件句柄
      const handle = await window.showSaveFilePicker(options);
      const writable = await handle.createWritable();

      // 将私钥写入指定位置的文件中
      await writable.write(privateKey);
      await writable.close();
      const response = await post('/user/update-publicKey', {
          username: username,
          public_key: encryptedPublicKey,
        }
      );
      return true;
    } catch (error) {
      return false;
    }

}

function stringToArrayBuffer(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);  // 返回 Uint8Array (ArrayBufferView)
}