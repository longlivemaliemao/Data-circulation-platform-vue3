import { get, post } from '@/utils/request.js'
import { modInv, modPow } from 'bigint-mod-arith';
import { ElMessage } from 'element-plus'
const p = BigInt('132165373947571709001890899559578394061572732290158236845675979056783176833192189640519330577968623712019753279011546461561086378291703395170828826203868040544703192493236905634659492348075654172349595065574318562378095706622284475060330389667603958501055142626804746804365447731489915179943331725842802927799');
const q = BigInt('66082686973785854500945449779789197030786366145079118422837989528391588416596094820259665288984311856009876639505773230780543189145851697585414413101934020272351596246618452817329746174037827086174797532787159281189047853311142237530165194833801979250527571313402373402182723865744957589971665862921401463899');
const g = BigInt('436921')
export async function fetchTask(userName) {
  try {

    // 在请求中传递 creatorName 作为查询参数
    const response = await get(`/task/getTask?userName=${encodeURIComponent(userName)}`);

    // 检查响应是否成功
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to fetch Tasks');
    }
  } catch (error) {
    console.error('Error fetching Tasks:', error);
    throw error; // 抛出错误，便于调用方捕获
  }
}

export async function calculateSign(file, Data, username) {
  const startTime = performance.now();

  const messages = [];

  try {
    let y = BigInt(Data.y);
    let b = BigInt(Data.b);

    const pemContent = await readFileContent(file);
    const privateKey = BigInt(await extractKeyFromPem(pemContent));

    y = modPow(y, privateKey, p);
    b = modPow(b, privateKey, p);
    const b1 = modPow(g, privateKey, p);

    const response = await post('/task/signUpdate', {
      taskId: Data.taskId,
      username: username,
      y: y.toString(),
      b: b.toString(),
      b1: b1.toString(),
      timestamp: new Date().toISOString()
    });

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    await TransferTestingTime(username, Data.taskId, executionTime);

    if (response.success) {
      messages.push({ type: 'success', message: '计算完成' });
    } else {
      messages.push({ type: 'error', message: '计算出错' });
    }

  } catch (error) {
    console.error('calculateSign error:', error);
    messages.push({ type: 'error', message: '计算过程中出错' });
  } finally {
    sessionStorage.setItem('reloadMessages', JSON.stringify(messages));
    window.location.reload();
  }
}


export async function calculateConfirm(file, Data, username) {
  const startTime = performance.now(); // 开始计时
  const messages = []; // 用于收集消息

  try {
    const pemContent = await readFileContent(file);
    const privateKey = BigInt(await extractKeyFromPem(pemContent));

    const c = BigInt(Data.d);
    const a_inv = modInv(privateKey, q);
    const d = modPow(c, a_inv, p);
    const b1 = modPow(g, privateKey, p);

    const response = await post('/task/confirmUpdate', {
      taskId: Data.taskId,
      username: username,
      d: d.toString(),
      b1: b1.toString(),
      timestamp: new Date().toISOString()
    });

    const endTime = performance.now(); // 结束计时
    const executionTime = endTime - startTime;

    await TransferTestingTime(username, Data.taskId, executionTime);

    if (response.success) {
      messages.push({ type: 'success', message: '计算完成' });
    } else {
      messages.push({ type: 'error', message: '计算出错' });
    }
  } catch (error) {
    console.error('calculateConfirm error:', error);
    messages.push({ type: 'error', message: '计算过程中出错' });
  } finally {
    sessionStorage.setItem('reloadMessages', JSON.stringify(messages));
    window.location.reload();
  }
}


export async function calculateArbitration(file, Data, username) {
  const startTime = performance.now();
  const messages = []; // 用于收集消息

  try {
    const pemContent = await readFileContent(file);
    const privateKey = BigInt(await extractKeyFromPem(pemContent));
    let c, d = 0n, d1 = 0n, a_inv, t = 0n;
    let t1 = 0n, t2 = 0n, r = 0n, delta = 0n;
    let s = 0n, ch;

    if (Data.num === '1') {
      c = BigInt(Data.d);
      a_inv = modInv(privateKey, q);
      d = modPow(c, a_inv, p);
      r = generateRandom1024BitBigInt();
      delta = generateRandom1024BitBigInt();
      t = modPow(g, r, p);
      t1 = modPow(d, r, p);
      t2 = modPow(g, delta, p);
    } else if (Data.num === '2') {
      c = BigInt(Data.d1);
      a_inv = modInv(privateKey, q);
      d1 = modPow(c, a_inv, p);
    } else {
      r = BigInt(Data.r);
      ch = BigInt(Data.ch);
      s = r - ch * privateKey;
    }

    const response = await post('/task/arbitrationUpdate', {
      taskId: Data.taskId,
      username: username,
      d: d.toString(),
      d1: d1.toString(),
      t: t.toString(),
      t1: t1.toString(),
      t2: t2.toString(),
      r: r.toString(),
      delta: delta.toString(),
      s: s.toString(),
      num: Data.num,
      timestamp: new Date().toISOString()
    });

    const endTime = performance.now();
    const executionTime = endTime - startTime;
    await TransferTestingTime(username, Data.taskId, executionTime);

    if (response.success) {
      messages.push({ type: 'success', message: '计算完成' });
    } else {
      messages.push({ type: 'error', message: response.data || '计算出错' });
    }
  } catch (error) {
    console.error('calculateArbitration error:', error);
    messages.push({ type: 'error', message: '计算过程中出错' });
  } finally {
    sessionStorage.setItem('reloadMessages', JSON.stringify(messages));
    window.location.reload();
  }
}

async function TransferTestingTime(username, taskId, executionTime){

  const params = new URLSearchParams();
  params.append('username', username);
  params.append('taskId', taskId);
  params.append('executionTime', executionTime);

  const response = await post('/task/testTime', params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  if (response.success === 200) {
    // console.log("记录耗时成功");
  } else {
    console.log(response.data);
  }

}

// 用于读取文件内容的异步函数
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result); // 成功读取文件，返回文件内容
    };

    reader.onerror = (error) => {
      reject(error); // 如果读取出错，拒绝 Promise
    };

    // 读取文件内容为文本
    reader.readAsText(file);
  });
}

async function extractKeyFromPem (pem) {
  // 去除 PEM 的头和尾部分
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, ''); // 移除所有空白字符（换行、空格）

  return pemContents; // 返回密钥的字节数组，或者你可以根据需要进一步处理
}

async function modularExponentiation(base, exponent, modulus) {

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

function generateRandom1024BitBigInt() {
  const byteArray = new Uint8Array(128); // 128 字节 = 1024 位
  window.crypto.getRandomValues(byteArray); // 生成随机数并填充到数组

  // 将每个字节转为十六进制字符串并连接，然后转换为 BigInt
  const hexString = Array.from(byteArray, byte => byte.toString(16).padStart(2, '0')).join('');
  return BigInt('0x' + hexString);
}