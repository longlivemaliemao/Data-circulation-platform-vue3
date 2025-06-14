// cryptoWorker.js
console.log('Web Worker is running');

// 处理来自主线程的消息事件，根据消息类型执行相应的加密或解密任务
onmessage = async function (e) {
  const { type, payload } = e.data;

  switch (type) {
    case 'generatePrivateKey':
      // 生成私钥，并将结果发送回主线程
      postMessage({
        type: 'privateKey',
        data: generatePrivateKey(),
      });
      break;

    case 'calculatePublicKey':
      // 计算公钥，并将结果发送回主线程
      const publicKey = calculatePublicKey(BigInt(payload.privateKey));
      postMessage({
        type: 'publicKey',
        data: publicKey,
      });
      break;

    case 'encryptData':
      // 加密数据，并将加密后的数据发送回主线程
      const encryptedData = await encryptData(payload.sharedSecret, payload.data);
      postMessage({
        type: 'encryptedData',
        data: encryptedData,
      });
      break;

    case 'decryptData':
      // 解密数据，并将解密后的数据发送回主线程
      const decryptedData = await decryptData(payload.sharedSecret, payload.encryptedData);
      postMessage({
        type: 'decryptedData',
        data: decryptedData,
      });
      break;

    case 'encryptFile':
      // 处理文件分块加密的逻辑
      await encryptFile(payload.file, payload.sharedSecret, payload.chunkSize);
      break;

    case 'decryptFile':
      const decryptedFile = await decryptFile(payload.sharedSecret, payload.encryptedData);
      postMessage({
        type: 'decryptedFile',
        data: decryptedFile,
      });
      break;

    default:
      // 处理未知命令类型的情况
      postMessage({ type: 'error', message: 'Unknown command' });
  }
};

// 生成 1024 位的随机私钥
function generatePrivateKey() {
  const randomBytes = new Uint8Array(128); // 128字节 = 1024位
  crypto.getRandomValues(randomBytes); // 使用 Web Crypto API 生成安全随机数

  let hexString = '';
  for (let i = 0; i < randomBytes.length; i++) {
    hexString += randomBytes[i].toString(16).padStart(2, '0');
  }

  return BigInt('0x' + hexString); // 返回 BigInt 格式的私钥
}


// 计算公钥，使用大素数 p 和基数 g 进行模幂运算
function calculatePublicKey(privateKey) {
  const p = BigInt('132165373947571709001890899559578394061572732290158236845675979056783176833192189640519330577968623712019753279011546461561086378291703395170828826203868040544703192493236905634659492348075654172349595065574318562378095706622284475060330389667603958501055142626804746804365447731489915179943331725842802927799');
  const g = BigInt('436921');
  return modularExponentiation(g, privateKey, p);
}

// 模幂运算函数，用于计算 (base ^ exponent) % modulus
function modularExponentiation(base, exponent, modulus) {
  let result = BigInt(1);
  base = base % modulus;

  while (exponent > 0) {
    if (exponent % BigInt(2) === BigInt(1)) {
      result = (result * base) % modulus;
    }
    exponent = exponent >> BigInt(1); // 将指数右移一位（等同于除以2）
    base = (base * base) % modulus;
  }
  return result;
}

// 使用共享密钥加密数据
async function encryptData(sharedSecret, data) {
  const iv = crypto.getRandomValues(new Uint8Array(16)); // 生成随机 IV，AES-CTR 通常使用 16 字节的 IV

  const encryptedData = await crypto.subtle.encrypt({
    name: 'AES-CTR',
    counter: iv, // 使用生成的 IV 作为计数器
    length: 64 // 计数器长度为 64 位
  }, sharedSecret, data);

  // 将 IV 和加密数据合并为一个 Uint8Array
  const encryptedDataWithIv = new Uint8Array(iv.length + encryptedData.byteLength);
  encryptedDataWithIv.set(iv); // 将 IV 放在前 16 字节
  encryptedDataWithIv.set(new Uint8Array(encryptedData), iv.length); // 将加密数据跟在 IV 之后

  // 返回 Base64 编码的字符串
  return arrayBufferToBase64(encryptedDataWithIv.buffer);
}


// 使用共享密钥解密数据
async function decryptData(sharedSecret, encryptedDataWithIvBase64) {
  const encryptedDataWithIv = base64ToArrayBuffer(encryptedDataWithIvBase64);

  // 将 ArrayBuffer 转换为 Uint8Array 以便使用 slice 方法分割 IV 和加密数据
  const encryptedDataArray = new Uint8Array(encryptedDataWithIv);
  const iv = encryptedDataArray.slice(0, 16); // 提取前 16 字节为 IV
  const encryptedData = encryptedDataArray.slice(16); // 剩余部分为加密数据

  // 解密数据
  const decryptedData = await crypto.subtle.decrypt({
    name: 'AES-CTR',
    counter: iv, // 使用相同的 IV
    length: 64 // 计数器长度为 64 位
  }, sharedSecret, encryptedData);

  // 返回解密后的字符串
  return new TextDecoder().decode(decryptedData);
}


// 加密文件
async function encryptFile(file, sharedSecret, chunkSize) {
  const totalChunks = Math.ceil(file.size / chunkSize);
  let offset = 0;
  let currentChunk = 0;

  while (offset < file.size) {
    const chunkBlob = file.slice(offset, offset + chunkSize);
    const chunkArrayBuffer = await chunkBlob.arrayBuffer();

    const encryptedChunkBase64 = await encryptData(sharedSecret, new Uint8Array(chunkArrayBuffer));
    const encryptedChunkArrayBuffer = base64ToArrayBuffer(encryptedChunkBase64);

    const lengthPrefix = new Uint32Array([encryptedChunkArrayBuffer.byteLength]).buffer;
    const chunkWithLength = concatenateArrayBuffers([lengthPrefix, encryptedChunkArrayBuffer]);

    postMessage({
      type: 'encryptedChunk',
      chunkWithLength,
      currentChunk,
      totalChunks,
      progress: Number(((currentChunk + 1) / totalChunks * 100).toFixed(2)),
    }, [chunkWithLength]);

    currentChunk++;
    offset += chunkSize;
  }

  postMessage({ type: 'done', progress: 100, message: 'File encryption completed' });
}


async function decryptFile(sharedSecret, encryptedDataArrayBuffer) {
  // 将 ArrayBuffer 转换为 Uint8Array 以便使用 slice 方法分割 IV 和加密数据
  const encryptedDataArray = new Uint8Array(encryptedDataArrayBuffer);
  const iv = encryptedDataArray.slice(0, 16); // 提取前 16 字节为 IV
  const encryptedData = encryptedDataArray.slice(16); // 剩余部分为加密数据
  console.log('IV:', iv);
  console.log('Encrypted Data:', encryptedData);

  // 解密数据
  const decryptedData = await crypto.subtle.decrypt({
    name: 'AES-CTR',
    counter: iv, // 使用相同的 IV
    length: 64 // 计数器长度为 64 位
  }, sharedSecret, encryptedData);

  // 返回解密后的 ArrayBuffer
  return decryptedData; // 返回 ArrayBuffer，用于后续处理
}


// 辅助函数：连接多个 ArrayBuffer
function concatenateArrayBuffers(buffers) {
  let totalLength = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
  let temp = new Uint8Array(totalLength);
  let offset = 0;
  for (let buffer of buffers) {
    temp.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  return temp.buffer;
}

// 辅助函数：将 ArrayBuffer 转换为 Base64 字符串
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// 辅助函数：将 Base64 字符串转换为 ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
