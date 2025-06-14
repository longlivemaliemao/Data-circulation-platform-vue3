// cryptoWorkerService.js

// 发送消息到 Web Worker 并返回 Promise
function sendMessageToWorker(message, onProgress = null) {
  const worker = new Worker(new URL('@/utils/cryptoWorker.js', import.meta.url)); // 创建新的 Worker 实例

  return new Promise((resolve, reject) => {
    worker.onmessage = function (e) {
      const { type, data, progress } = e.data;

      if (type === 'progress' && onProgress) {
        onProgress(progress); // 调用进度回调函数，更新进度
      } else if (type === 'error') {
        reject(new Error(data)); // 处理错误
        worker.terminate(); // 发生错误后终止 Worker
      } else {
        resolve(data); // 任务完成，返回结果（ArrayBuffer）
        worker.terminate(); // 任务完成后终止 Worker
      }
    };

    worker.onerror = (error) => {
      reject(error); // 捕获 Worker 错误
      worker.terminate(); // 发生错误后终止 Worker
    };

    // 发送消息到 Worker
    if (message.payload && message.payload.file) {
      // File 对象无法通过 Transferable 传输，直接发送
      worker.postMessage(message);
    } else if (message.payload && message.payload.encryptedDataWithChecksum) {
      // 传输 ArrayBuffer，避免内存复制
      worker.postMessage(message, [message.payload.encryptedDataWithChecksum]);
    } else {
      worker.postMessage(message);
    }
  });
}

// 函数：向 Web Worker 发送生成私钥的请求，并返回生成的私钥
export function generatePrivateKey() {
  return sendMessageToWorker({ type: 'generatePrivateKey' });
}

// 函数：向 Web Worker 发送计算公钥的请求，并返回计算的公钥
export function calculatePublicKey(privateKey) {
  return sendMessageToWorker({ type: 'calculatePublicKey', payload: { privateKey } });
}

// 函数：向 Web Worker 发送加密数据的请求，并返回加密后的数据
export function encryptData(sharedSecret, data) {
  return sendMessageToWorker({ type: 'encryptData', payload: { sharedSecret, data } });
}

// 函数：向 Web Worker 发送解密数据的请求，并返回解密后的数据
export function decryptData(sharedSecret, encryptedData) {
  return sendMessageToWorker({ type: 'decryptData', payload: { sharedSecret, encryptedData } });
}

// 函数：使用 Web Worker 对文件进行分块加密，并在每个分块加密完成时返回进度和加密数据
export function encryptFile(file, sharedSecret, chunkSize, onProgress) {
  return sendMessageToWorker({ type: 'encryptFile', payload: { file, sharedSecret, chunkSize } }, onProgress);
}

// 函数：向 Web Worker 发送解密数据的请求，并返回解密后的数据
export function decryptFile(sharedSecret, encryptedData) {
  return sendMessageToWorker({ type: 'decryptFile', payload: { sharedSecret, encryptedData } });
}
