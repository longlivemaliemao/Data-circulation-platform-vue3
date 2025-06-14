// 导入所需的加密和请求处理工具函数
import {
  clearSharedKey, // 用于清除存储的共享密钥
  initKeyExchange, // 用于初始化密钥交换过程
  clientKeyPair, getSharedKey // 存储客户端的密钥对
} from '@/utils/cryptoUtils.js'

import {
  generatePrivateKey, // 使用 Web Worker 生成私钥的函数
  calculatePublicKey, // 使用 Web Worker 计算公钥的函数
  encryptData, // 使用 Web Worker 加密数据的函数
  decryptData // 使用 Web Worker 解密数据的函数
} from '@/service/cryptoWorkerService.js';

import { post } from '@/utils/request.js'; // 导入用于发送 POST 请求的函数
import router from '@/router.js'; // 导入 Vue 路由器，用于页面跳转
import { ElMessage } from 'element-plus'
import { jwtDecode } from "jwt-decode";

// 处理用户注册请求的函数
export async function onRegister(registerData) {

  // // 验证用户输入的两次密码是否一致
  // if (registerData.password !== registerData.rePassword) {
  //   ElMessage.error('两次输入的密码不一致');
  //   return false; // 如果密码不一致，则停止注册流程
  // }
  //
  // if(registerData.password === '' || registerData.rePassword === '' || registerData.username === '') {
  //   ElMessage.error('用户名或密码不规范');
  //   return false;
  // }

  // 如果客户端密钥对未生成，则先初始化密钥交换
  if (!clientKeyPair) {
    await initKeyExchange();
  }

  // 发送请求到服务器，检查用户名是否已存在
  const response = await post('/find-username', { username: registerData.username });

  // 如果用户名已存在，则停止注册流程
  if (response.data === "用户名已存在") {
    ElMessage.error('用户名已存在');
    return false;
  }

  try {
    const sharedKey = await getSharedKey();
    // 使用生成的共享密钥加密用户的密码和公钥
    const encryptedPassword = await encryptData(sharedKey, stringToArrayBuffer(registerData.password));

    // // 解密加密后的密码以验证加密过程是否正确
    // const decryptedPassword = await decryptData(sharedKey, encryptedPassword);
    // console.log("Decrypted Password:", decryptedPassword);


    // 复制注册数据对象，并用加密后的密码替换原始密码
    const payload = {
      ...registerData,
      password: encryptedPassword, // 加密后的密码
      rePassword: '' // 清空重复密码字段
    };
    //
    // // 验证解密后的密码是否与用户输入的密码一致
    // if (decryptedPassword === registerData.password) {
    //   console.log("解密验证成功，数据一致。");
    // } else {
    //   console.error("解密验证失败，数据不一致！");
    //   return;
    // }

    // 发送注册请求到服务器
    const registerResponse = await post('/register', payload);

    // 如果注册成功，执行以下操作
    if (registerResponse.success) {
      ElMessage.success('注册成功');
      clearSharedKey(); // 清除存储的共享密钥
      return true;
    } else {
      // 如果注册失败，输出错误信息
      ElMessage.error('注册失败');
      console.error('注册失败', registerResponse.message);
      return false;
    }
  } catch (error) {
    // 捕获并处理注册过程中的任何错误
    console.error('注册过程中发生错误:', error);
  }
}

// 处理用户登录请求的函数
export async function onLogin(loginData, rememberMe) {
  // 如果客户端密钥对未生成，则先初始化密钥交换
  if (!clientKeyPair) {
    await initKeyExchange();
  }

  try {

    const encodedData = new TextEncoder().encode(loginData.password); // data 是字符串
    const sharedKey = await getSharedKey();
    // 使用共享密钥加密用户输入的密码
    const encryptedPassword = await encryptData(sharedKey, encodedData);

    console.log("Encrypted Password:", encryptedPassword);

    // 解密加密后的密码以验证加密过程是否正确
    // const decryptedPassword = await decryptData(sharedKey, encryptedPassword);
    // console.log("Decrypted Password:", decryptedPassword);

    // 发送登录请求到服务器，传递加密后的用户名和密码
    const response = await post('/login', {
      username: loginData.username,
      password: encryptedPassword
    });

    // 如果登录成功，执行以下操作
    if (response.success) {
      ElMessage.success('登录成功');

      // 保存服务器返回的身份标识（如角色和 Token）到本地存储
      const token = response.data;
      const decoded = jwtDecode(token);  // 解析 JWT Token
      const role = decoded.role;          // role 是你自定义的字段

      if(rememberMe) {
        localStorage.setItem('authToken', token);
      }
      sessionStorage.setItem('authToken', token);


      // 根据用户角色跳转到相应的页面
      if (role === 'Admin') {
        await router.push({ name: 'UserMgr' });
      } else {
        await router.push({ name: 'Home' });
      }
    } else {
      // 如果登录失败，输出错误信息
      ElMessage.error('登录失败：用户名或密码错误');
    }
  } catch (error) {
    // 捕获并处理登录过程中的任何错误
    console.error('登录过程中发生错误:', error);
  }
}

function stringToArrayBuffer(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);  // 返回 Uint8Array (ArrayBufferView)
}

export async function validateToken(token){
  const response = await post('/validateToken', {
    token: token
  });
  // 如果登录成功，执行以下操作
  if (response.success) {
    ElMessage.success('登录成功');

    // 保存服务器返回的身份标识（如角色和 Token）到本地存储
    const token = response.data;

    const decoded = jwtDecode(token);  // 解析 JWT Token
    const username = decoded.sub;       // 通常在 JWT 中用户名放在 'sub' (subject) 字段
    const role = decoded.role;          // role 是你自定义的字段

    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('role', role);

    // 根据用户角色跳转到相应的页面
    if (role === 'Admin') {
      await router.push({ name: 'UserMgr' });
    } else {
      await router.push({ name: 'Home' });
    }
  } else {
    // 如果登录失败，输出错误信息
    ElMessage.error('登录过期请重新登录');
  }
}

export const validateResetCode = async (forgetData) => {
  try {

  // 发送请求到服务器，检查用户名是否已存在
    const response = await post('/find-username', { username: forgetData.username });

    console.log(response.data);

    // 如果用户名不存在，则停止验证流程
    if (response.data === "用户名不存在") {
      ElMessage.error('用户名不存在');
      return false;
    }
    const response1 = await post('/validate', {
      username:forgetData.username,
      securityQuestion:forgetData.securityQuestion,
      securityAnswer:forgetData.securityAnswer,
    });

    if(response1.data === "验证成功"){
      //修改密码
      await initKeyExchange();
      const sharedKey = await getSharedKey();
      const Password = await encryptData(sharedKey, stringToArrayBuffer(forgetData.newPassword));
      const response2 =await post('/update_password', {username:forgetData.username, password:Password});
      return response2.data;
    } else {
      return response1.data;
    }
  } catch (error) {
    throw new Error(error.response?.data?.message || '');
  }
};