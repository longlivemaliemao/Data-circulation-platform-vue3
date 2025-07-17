// ApplicationService.js

import { get, post } from '@/utils/request.js'
import { ElMessage } from 'element-plus'
/**
 * 获取所有数据所有方的名字列表
 * @returns {Promise<Array<string>>} 包含所有数据所有方名字的数组
 */
export async function fetchDataOwners() {
  try {
    const response = await get(`/data-owners`);

    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to fetch data owners');
    }
  } catch (error) {
    console.error('Error fetching data owners:', error);
    throw error;
  }
}

/**
 * 获取指定用户的所有申请记录
 * @returns {Promise<Array<Object>>} 返回包含该用户所有申请记录的数组
 */
export async function fetchApplications(username) {
  try {
    const response = await get(`/application/user/${username}`);
    if (response.success) {
      return response.data;
    } else {
      ElMessage.success('暂无记录');
    }
  } catch (error) {
    console.error('Error fetching applications:', error);
    ElMessage.error('获取申请记录失败');
    throw error;
  }
}

export const fetchProcessStatus = async (applicationType, id) => {
  try {
    const response = await post('/application/getProcessStatus', { applicationType, id });
    if (response.success) {
      return response.data;
    } else {
      ElMessage.error(response.message || '获取流程状态失败');
      return null;
    }
  } catch (error) {
    console.error('Error fetching process status:', error);
    ElMessage.error('获取流程状态失败，请稍后重试');
    throw error;
  }
};

export const onSubmit = async (formData, username) => {

  // 检查表单内容是否已填写完整
  if (!formData.dataUser) {
    ElMessage.warning('请选择数据所有方');
    return;
  }

  if (!formData.text) {
    ElMessage.warning('请输入申请说明');
    return;
  }

  // 准备要上传的数据
  const applicationData = {
    username: username,
    text: formData.text,
    dataUser:formData.dataUser,
    explanation:'',
    startDate: '',
    endDate: '',
    applicationType: formData.type,
    status: '等待平台审核'
  };

  try {
    // 调用接口提交数据
    const response = await post('/application/add', applicationData);
    if(response.success) {
      ElMessage.success('申请提交成功');
      window.location.reload(); // 刷新当前页面
    } else {
      ElMessage.error('申请提交失败,' + response.message);
    }
  } catch (error) {
    console.error('Error:', error);
    ElMessage.error('申请提交失败:' + error);
  }
  
}

export const onSubmit1 = async (taskId, type, username) => {
  const messages = [];
  try {
    // 调用接口提交数据
    const response = await get(`/task/find_task?taskId=${taskId}`);
    if(response.success) {

      // 准备要上传的数据
      const applicationData = {
        username: username,
        text: taskId,
        dataUser:'',
        explanation:'',
        startDate: '',
        endDate: '',
        applicationType: type,
        status: '等待平台审核',
        fileName:'',
      };
      try {
        // 调用接口提交数据
        const response = await post('/application/add', applicationData);
        if(response.success) {
          messages.push({ type: 'success', message: '申请提交成功' });
          window.location.reload(); // 刷新当前页面
        } else {
          messages.push({ type: 'error', message: response.message });
        }

      } catch (error) {
        console.error('Error:', error);
        messages.push({ type: 'error', message: error });
      }

    }else{
      messages.push({ type: 'error', message: '没有找到对应的任务ID,请重新输入ID' });
    }
  } catch (error) {
    messages.push({ type: 'error', message: '申请提交失败' });
  }
  sessionStorage.setItem('reloadMessages', JSON.stringify(messages));
}

export const Download = async (row) => {
  const { fileName, id: applicationId } = row;
  try {
    // 1. 先向后端申请带签名的下载令牌
    const signResp = await get(`/getDownloadSign?fileName=${encodeURIComponent(fileName)}&applicationId=${applicationId}`);

    if (!signResp.success) {
      ElMessage.error(signResp.message || '获取下载链接失败');
      return;
    }

    const signedToken = signResp.data; // 后端返回的 token 字符串

    // 2. 无需携带 authToken，直接请求下载接口，并对 token 进行 URL 编码
    const basePath = '/dataflow/api';
    const downloadUrl = `${basePath}/download/${encodeURIComponent(signedToken)}`;

    // 直接触发浏览器的原生下载，让浏览器自己显示进度
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.setAttribute('download', fileName + '.csv');
    document.body.appendChild(a);
    a.click();
    a.remove();
    ElMessage.success('下载开始，您可以在浏览器下载栏查看进度');
    // 如需统计耗时，可在后端日志或浏览器下载完成事件中查看
  } catch (error) {
    console.error('下载错误:', error);
    ElMessage.error('下载失败');
  }
};



