import { get } from '@/utils/request.js'

export const fetchDataRecord = async (creatorName) => {
  try {
    // 发起请求下载文件
    const response = await get(`/files?creatorName=${encodeURIComponent(creatorName)}`);
    return response.data;
  } catch (error) {
    console.error('Error:', error);
  }
};