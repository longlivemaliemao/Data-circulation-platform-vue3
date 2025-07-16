// Examine1Service.js

import { get, post } from '@/utils/request.js'; // 导入用于发送请求的函数
import { ElMessage } from 'element-plus';
import { getSharedKey } from '@/utils/cryptoUtils.js';
import { encryptFile } from '@/service/cryptoWorkerService.js';

let worker = null;

export function stopEncryptionAndUpload(silent = false) {
  if (worker) {
    worker.terminate();
    worker = null;
    if (!silent) {
      ElMessage.info('上传已停止');
    }
  }
}

export const onSubmit = async (formData, id, username) => {
  if (formData.signer.members.length < 3) {
    ElMessage.error('联合签名成员最少添加三人');
    return;
  }

  if (!formData.authEndTime) {
    ElMessage.error('请选择授权结束时间');
    return;
  }

  const Data = {
    id: id,
    status: '申请已通过',
    explanation: '请在处理界面完成私钥计算',
    fileName: formData.selectFile,
  };
  formData.username = username;
  formData.applicationId = id;

  const response = await post('/task/create', formData);
  const response1 = await post('/application/update', Data);

  let messages = [];

  if (response.success) {
    messages.push({ type: 'success', message: '签名任务已创建' });
  } else {
    messages.push({ type: 'error', message: '签名任务创建失败' });
  }

  if (response1.success) {
    messages.push({ type: 'success', message: '申请已更新' });
    window.location.reload(); // 刷新页面
  } else {
    messages.push({ type: 'error', message: '申请更新失败' });
  }

  // 存入 sessionStorage
  sessionStorage.setItem('reloadMessages', JSON.stringify(messages));


};


export const onReject = async (explanation, id) => {
  try {
    const Data = {
      id: id,
      status: '数据提供方审核未通过',
      explanation: explanation,
      fileName:'',
    };
    // 将 explanation 和 id 作为请求体发送给后端
    const response = await post('/application/update', Data);

    // 根据后端返回的结果执行后续操作
    if (response && response.success) {
      console.log('拒绝操作成功:', response.data);
      // 可以在这里处理成功的逻辑，比如显示提示消息或刷新页面
      window.location.reload(); // 刷新当前页面
    } else {
      console.error('拒绝操作失败:', response.message);
    }
  } catch (error) {
    console.error('请求发生错误:', error);
  }

};


export const addMember = async (memberSearch, signer) => {

  if(memberSearch === null){
    ElMessage.error('用户名不得为空');
    return;
  }
  if (memberSearch && signer.members.find(m => m.username === memberSearch)) {
    ElMessage.error('用户名已在列表');
    return;
  }

  // 发送请求到服务器，检查用户名是否已存在
  const response = await post('/find-username', { username: memberSearch });

  if (response.data === '用户名不存在') {
    // 如果用户名不存在，无法添加到签名人列表
    ElMessage.error('用户名不存在');
  } else {
    signer.members.push({ username: memberSearch });
    ElMessage.success('用户已添加');
  }
};

export async function fetchFiles(creatorName) {
  try {
    // 在请求中传递 creatorName 作为查询参数
    const response = await get(`/filesName?creatorName=${encodeURIComponent(creatorName)}`);

    // 检查响应是否成功
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to fetch files');
    }
  } catch (error) {
    console.error('Error fetching files:', error);
    throw error; // 抛出错误，便于调用方捕获
  }
}

/**
 * 获取需要数据所有方审核的申请记录
 * @returns {Promise<Array<Object>>} 返回包含该用户所有申请记录的数组
 */
export async function fetchApplications(username) {
  try {
    const response = await get(`/application/pending1?username=${encodeURIComponent(username)}`);
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to fetch pending applications');
    }
  } catch (error) {
    // 判断错误类型
    if (error.message === '未找到等待数据提供方审核的申请记录') {
      ElMessage.success('暂无数据');
    } else {
      ElMessage.error('获取等待数据提供方审核的申请记录失败');
    }

    console.error('Error fetching pending applications:', error);
    throw error;
  }
}

const getFileId = async () => {
  try {
    const response = await get('/start-upload');

    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || '获取文件ID失败');
    }
  } catch (error) {

    console.error('获取文件ID时发生错误:', error);
    throw error;
  }
};

export const encryptCsvFileWithProgress = async (
  file,
  startTime,
  onProgress,
  onComplete,
  onError,
  fileName,
  creator_name,
  fileOutline
) => {
  if (worker) {
    worker.terminate();
  }
  const subsequentChunkSize = 1024 * 1024;
  const FileId = await getFileId();

  try {
    const sharedSecret = await getSharedKey();
    worker = new Worker(new URL('@/utils/cryptoWorker.js', import.meta.url));

    const uploadQueue = new Map();
    let nextExpectedChunk = 0;

    worker.onmessage = async (e) => {
      const { type, chunkWithLength, currentChunk, totalChunks } = e.data;

      if (type === 'encryptedChunk') {
        uploadQueue.set(currentChunk, { chunkWithLength });

        while (uploadQueue.has(nextExpectedChunk)) {
          const { chunkWithLength: chunk } = uploadQueue.get(nextExpectedChunk);
          uploadQueue.delete(nextExpectedChunk);

          try {
            const response = await uploadEncryptedChunk(
              chunk.slice(0),
              nextExpectedChunk,
              totalChunks,
              FileId,
              fileName,
              creator_name,
              fileOutline
            );

            const percent = ((nextExpectedChunk + 1) / totalChunks) * 100;
            const now = Date.now();
            const elapsedSec = (now - startTime) / 1000;
            const avgPerChunk = elapsedSec / (nextExpectedChunk + 1);
            const remainingChunks = totalChunks - (nextExpectedChunk + 1);
            const remainSec = Math.ceil(avgPerChunk * remainingChunks);
            const min = Math.floor(remainSec / 60);
            const sec = remainSec % 60;
            const estimatedTime = `${min} 分 ${sec} 秒`;

            onProgress({ progress: Number(percent.toFixed(2)), estimatedTime });

            if (response.data === '所有块上传并合并成功') {
              if (onComplete) onComplete();
              stopEncryptionAndUpload(true);
            }

            nextExpectedChunk++;
          } catch (uploadError) {
            console.error(`上传第 ${nextExpectedChunk} 块出错:`, uploadError);
            if (onError) onError(uploadError);
            stopEncryptionAndUpload();
            return;
          }
        }
      } else if (type === 'done') {
        console.log('文件加密完成');
      }
    };

    worker.onerror = (err) => {
      console.error('Worker error:', err);
      if (onError) onError(err);
      stopEncryptionAndUpload();
    };

    worker.postMessage({
      type: 'encryptFile',
      payload: {
        file,
        sharedSecret,
        chunkSize: subsequentChunkSize,
      },
    });
  } catch (error) {
    ElMessage.error(`加密过程失败: ${error.message}`);
    if (onError) onError(error);
    throw error;
  }
};




// 上传加密块到服务器的方法
async function uploadEncryptedChunk(chunk, currentChunk, totalChunks, fileId, fileName, creatorName, fileOutline) {

  // 创建 FormData 实例，用于存放要上传的块和其他元数据
  const formData = new FormData();

  // 添加加密块，类型为 'application/octet-stream' 表示为二进制数据
  formData.append('chunk', new Blob([chunk], { type: 'application/octet-stream' }));

  // 将块的索引（块编号）和总块数作为元数据传递给后端
  formData.append('chunkIndex', currentChunk); // 当前上传的块编号
  formData.append('totalChunks', totalChunks); // 总的块数，便于后端知道这是第几块
  formData.append("fileId", fileId);
  formData.append("fileName", fileName);
  formData.append("creatorName", creatorName);
  formData.append("fileOutline", fileOutline);
  try {

    const response = await post('/upload-chunk', formData);


    // 如果上传成功，处理响应
    if(response.data === '所有块上传并合并成功'){
      console.log(`分片 ${currentChunk + 1}/${totalChunks} 上传成功`);
      ElMessage.success('文件上传成功');
    }
    else if (response.success) {
      console.log(`分片 ${currentChunk + 1}/${totalChunks} 上传成功`);
    } else {
      // 上传失败时，记录错误信息
      const errorMsg = response?.message || '未知错误';
      console.error(`分片 ${currentChunk + 1} 上传失败: ${errorMsg}`);
      ElMessage.error("文件上传失败，" + response?.message);
      throw new Error(`分片 ${currentChunk} 上传失败: ${errorMsg}`);
    }
    return response;
  } catch (error) {
    // 捕获网络错误或其他异常情况
    console.error(`上传分片 ${currentChunk + 1} 时发生错误:`, error);

    // 如果有必要，可以在此添加重试逻辑或进一步的错误处理
    throw new Error(`分片 ${currentChunk + 1} 上传过程中出错: ${error.message}`);
  }
}

// 格式化剩余时间（秒转为 分钟:秒 格式）
const formatTime = (timeInSeconds) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes} 分 ${seconds} 秒`;
};
