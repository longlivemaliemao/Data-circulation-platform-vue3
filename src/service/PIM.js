import { ElMessage } from 'element-plus'
import { post } from '@/utils/request.js'
import { encryptData } from '@/service/cryptoWorkerService.js';
import { ref } from 'vue'
import { getSharedKey } from '@/utils/cryptoUtils.js'

export const onSubmit = async (form) => {

  // if(form.username !== '') {
  //   // 发送请求到服务器，检查用户名是否已存在
  //   const response = await post('/find-username', { username: form.username });

  //   // 如果用户名已存在，则不能修改用户名
  //   if (!response.success) {
  //     ElMessage.error('用户名已存在');
  //     return;
  //   }
  // }
  if(form.password !== '')
  {
    const sharedKey = await getSharedKey();
    // 使用生成的共享密钥加密用户的密码和公钥
    form.password = await encryptData(sharedKey, stringToArrayBuffer(form.password));
  }

  if(form.securityQuestion !== '' && form.securityAnswer === '')
  {
    ElMessage.error('选择密保问题后，密保答案不得为空');
    return;
  }

  if(form.username === '' && form.password === '' && form.securityQuestion === ''){
    ElMessage.error('表单不能全为空');
    return;
  }

  try {
    // 调用接口提交数据
    const response = await post('/update-mpi', form);

    if (response.success) {
      ElMessage.success('修改成功');
      const token = response.data;
      sessionStorage.setItem('authToken', token);
      await window.location.reload(); // 刷新当前页面
    }
    else {
      ElMessage.error(response.message);
    }
  } catch (error) {
    console.error('Error:', error);
    ElMessage.error('修改失败');
  }
  
}
function stringToArrayBuffer(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);  // 返回 Uint8Array (ArrayBufferView)
}