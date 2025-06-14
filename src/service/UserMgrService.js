import { get, post } from '@/utils/request.js'; // 导入 POST 请求函数
import { ElMessage } from 'element-plus'

export const fetchUser = async () => {
  try {
    const response = await get('/allUsers');
    if (response.success) {
      return response.data; // 返回用户信息
    } else {
      throw new Error(response.message); // 如果请求失败，抛出错误
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
    throw error; // 将错误抛出，以便在调用该方法时处理
  }
};

// 删除用户的方法
export const onDelete = async (username) => {
  try {
    const confirmed = confirm(`确定要删除用户 ${username} 吗？`);
    if (confirmed) {
      const response = await post('/delete-user', { username });
      if (response.success) {
        ElMessage.success('用户删除成功');
        await fetchUser(); // 删除成功后重新加载用户列表
      } else {
        throw new Error(response.message); // 如果请求失败，抛出错误
      }
    }
  } catch (error) {
    ElMessage.error('删除用户失败');
    console.error('删除用户失败:', error);
    throw error;
  }
};

// 更新用户信息的方法
export const updateUser = async (user) => {
  try {
    const response = await post('/update-user', user); // 更新用户信息的 API

    if (response.success) {
      ElMessage.success('更新用户信息成功');
      await fetchUser(); // 更新成功后重新加载用户列表
    } else {
      throw new Error(response.message); // 抛出错误信息
    }
  } catch (error) {
    ElMessage.error('更新用户信息失败:');
    console.error('更新用户信息失败:', error);
    throw error;
  }
  window.location.reload(); // 刷新当前页面
};

export default {
  fetchUser,
  onDelete,
  updateUser,
};