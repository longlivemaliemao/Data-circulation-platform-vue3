// 导入 request.js 请求工具
import request from '@/utils/request.js';

// 提供调用注册接口的函数
export const userRegisterService = async (registerData) => {
  console.log(registerData);
  try {
    const response = await request.post('/user/register', registerData);
    console.log('Register response:', response);
    return response;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

// 提供调用登录接口的函数
export const userLoginService = async (loginData) => {
  try {
    const response = await request.post('/user/login', loginData);
    console.log('Login response:', response);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// 提供调用检查用户名是否存在的接口的函数
export const checkUserExists = async (username) => {
  try {
    const response = await request.get(`/user/exists?username=${encodeURIComponent(username)}`);
    console.log('Check user exists response:', response);
    return response;
  } catch (error) {
    console.error('Check user exists error:', error);
    throw error;
  }
};

// 提供调用申请提交接口的函数
export const submitApplication = async (applicationData) => {
  try {
    const response = await request.post('/application/submit', applicationData);
    console.log('Application submit response:', response);
    return response;
  } catch (error) {
    console.error('Application submit error:', error);
    throw error;
  }
};

// 调用后端同意/拒绝申请接口的函数
export const Application = async (application) => {
  return request.post(`/application/updateApplication`, application);
};

// 调用后端获取所有申请记录
export const getApplications = async () => {
  return request.get('/application/pending');
};

// 调用后端获取用户申请状态的函数
export const getApplicationStatus = async (username) => {
  try {
    const response = await request.get(`/application/status?username=${username}`);
    console.log('Get application status response:', response);
    return response;
  } catch (error) {
    console.error('Get application status error:', error);
    throw error;
  }
};

// 获取历史签名者的函数
export const getHistoricalSigners = async (dataId) => {
  try {
    const response = await request.get(`/application/getSigners?data_id=${dataId}`);
    console.log('Historical signers response:', response);
    return response;
  } catch (error) {
    console.error('Error fetching historical signers:', error);
    throw error;
  }
};

// 启动签名流程
export const startSignProcess = async (signProcessData) => {
  try {
    const response = await request.post('/process/init', signProcessData);
    console.log('Sign process start response:', response);
    return response;
  } catch (error) {
    console.error('Error starting sign process:', error);
    throw error;
  }
};

// 提交签名结果
export const submitSignature = async (signatureData) => {
  try {
    const response = await request.post('/process/submit', signatureData);
    console.log('Submit signature response:', response);
    return response;
  } catch (error) {
    console.error('Error submitting signature:', error);
    throw error;
  }
};

// 查询任务状态
export const getTaskStatus = async (taskId) => {
  try {
    const response = await request.get(`/process/status/${taskId}`);
    console.log('Get task status response:', response);
    return response;
  } catch (error) {
    console.error('Error getting task status:', error);
    throw error;
  }
};

// 上传文件
export const uploadFile = async (taskId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await request.post(`/process/upload/${taskId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('File upload response:', response);
    return response;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

// 下载文件
export const downloadFile = async (taskId) => {
  try {
    const response = await request.get(`/process/download/${taskId}`, {
      responseType: 'blob', // 确保文件以 Blob 格式接收
    });

    // 创建一个临时链接用于下载
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `file_${taskId}.txt`); // 假设文件是 txt 类型，你可以根据实际情况修改
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('File download response:', response);
    return response;
  } catch (error) {
    console.error('File download error:', error);
    throw error;
  }
};

// 获取 update 表所有记录的函数
export const getAllUpdateRecords = async () => {
  try {
    const response = await request.get('/data/records');
    console.log('All update records response:', response);
    return response;
  } catch (error) {
    console.error('Error fetching update records:', error);
    throw error;
  }
};

// 获取指定数据的查看权限
export const getUserPermissions = async (username, dataId) => {
  try {
    const response = await request.get(`/user/permissions?username=${encodeURIComponent(username)}&dataId=${dataId}`);
    console.log('Get user permissions response:', response);
    return response;
  } catch (error) {
    console.error('Get user permissions error:', error);
    throw error;
  }
};



