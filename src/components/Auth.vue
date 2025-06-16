<script setup>
import { onMounted, ref } from 'vue'
import { onLogin, onRegister, validateToken,validateResetCode } from '@/service/AuthService.js'
import '@/assets/login_bg.jpg'
import { ElMessage } from 'element-plus'
import '@element-plus/icons-vue'
import {User} from "@element-plus/icons-vue";
// 控制注册与登录表单的显示，默认显示登录
const isRegister = ref(false);
const isLogin = ref(true);
const isForget = ref(false);
const formRef = ref(null);
const form = ref(null);
const forgetFormRef = ref(null);
const rememberMe = ref(false);
const countdown = ref(0); // 验证码倒计时

// 定义数据模型
const registerData = ref({
  username: '',
  password: '',
  rePassword: '',
  public_key: '',
  role:'普通用户',
  securityQuestion:'',
  securityAnswer:''
});

const forgetData = ref({
  username:'',
  code: '',
  newPassword: '',
  securityQuestion:'',
  securityAnswer:'',
  confirmPassword: ''
});

const loginData = ref({
  username: '',
  password: ''
});



onMounted(async () => {
  const token = localStorage.getItem('authToken');
  console.log(token);
  if(token){
    await validateToken(token);
  }
});

// 去除用户名空格
const trimUsername = (username) => {
  return username.replace(/\s+/g, '');
};

// 密码复杂度验证
const validatePassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'));
    return;
  }

  // 去除空格
  const trimmedValue = value.trim();

  // 长度至少8位
  if (trimmedValue.length < 8) {
    callback(new Error('密码长度至少8位'));
    return;
  }

  // 包含数字
  if (!/\d/.test(trimmedValue)) {
    callback(new Error('密码必须包含数字'));
    return;
  }

  // 包含特殊字符
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(trimmedValue)) {
    callback(new Error('密码必须包含特殊字符'));
    return;
  }

  callback();
};

// 二次校验密码的函数
const checkRePassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次确认密码'));
  } else if (value !== registerData.value.password) {
    callback(new Error('二次确认密码不相同请重新输入'));
  } else {
    callback();
  }
};

// 用户名验证
const validateUsername = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入用户名'));
    return;
  }

  // 去除空格
  const trimmedValue = value.replace(/\s+/g, '');

  // 长度验证
  if (trimmedValue.length < 5 || trimmedValue.length > 16) {
    callback(new Error('用户名长度应为5-16个字符'));
    return;
  }

  // 更新去除空格后的用户名
  if (isRegister.value) {
    registerData.value.username = trimmedValue;
  } else {
    loginData.value.username = trimmedValue;
  }

  callback();
};

// 确认密码验证（用于忘记密码）
const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'));
  } else if (value !== forgetData.value.newPassword) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

function validateSecurityQuestion(rule, value, callback) {
  if (value === '') {
    callback(new Error('请选择密保问题'));
  } else {
    callback();
  }
}

const handleSelectVisibleChange1 = (visible) => {
  if (!visible) {
    formRef.value?.validateField('securityQuestion');
  }
};

const handleSelectVisibleChange2 = (visible) => {
  if (!visible) {
    forgetFormRef.value?.validateField('securityQuestion');
  }
};

const rules = ref({
  username: [
    { required: true, validator: validateUsername, trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ],
  rePassword: [{ validator: checkRePassword, trigger: 'blur' }],
  securityQuestion: [
    { validator: validateSecurityQuestion, trigger: ['change', 'blur'] }
  ],
  securityAnswer: [
    { required: true, message: '请填写密保答案', trigger: 'blur' },
    { min: 2, max: 50, message: '密保答案长度应为2-50个字符', trigger: 'blur' }
  ],
});

const loginRules = ref({
  username: [
    { required: true, validator: validateUsername, trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ],
});

const forgetRules = ref({
  username: [
    { required: true, validator: validateUsername, trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ],
  securityQuestion: [
    { validator: validateSecurityQuestion, trigger: ['change', 'blur'] }
  ],
  securityAnswer: [
    { required: true, message: '请填写密保答案', trigger: 'blur' },
    { min: 2, max: 50, message: '密保答案长度应为2-50个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
});
const register = async () => {
  try {
    const valid = await formRef.value.validate(); // 直接 await 返回校验结果

    if (valid) {
      registerData.value.username = trimUsername(registerData.value.username);

      const success = await onRegister(registerData.value);
      if (success) {
        clearRegisterData();
        toLogin();
      }
    } else {
      console.log('表单验证未通过');
    }
  } catch (error) {
    console.error('注册失败', error);
  }
};


const ResetCode = async (forgetData) => {
  try {
    const valid = await forgetFormRef.value.validate(); // await 简洁写法

    if (valid) {
      const data = await validateResetCode(forgetData);

      if (data === "修改密码成功") {
        ElMessage.success("修改密码成功");
        clearForgetData();
        toLogin();
      } else {
        ElMessage.error("修改密码失败，" + data);
      }

    } else {
      console.warn("表单校验未通过");
    }
  } catch (error) {
    console.error('修改密码报错', error);
  }
};


const login = async () => {
  try {
    const valid = await form.value.validate();

    if (valid) {
      // 提交前去除用户名空格
      loginData.value.username = trimUsername(loginData.value.username);
      await onLogin(loginData.value, rememberMe.value);
    } else {
      console.warn("表单校验未通过");
    }
  } catch (error) {
    console.error("登录校验出错", error);
  }
};


// 清空数据模型
const clearRegisterData = () => {
  registerData.value = {
    username: '',
    password: '',
    rePassword: '',
    public_key: '',
    role:'普通用户',
    securityQuestion:'',
    securityAnswer:''
  };
};

// 清空忘记密码数据
const clearForgetData = () => {
  forgetData.value = {
    securityQuestion: '',
    securityAnswer:'',
    code: '',
    newPassword: '',
    confirmPassword: ''
  };
  countdown.value = 0;
};

const toRegister = () => {
  isRegister.value = true;
  isLogin.value = false;
  isForget.value = false;
  clearForgetData();
};

const toLogin = () => {
  isRegister.value = false;
  isLogin.value = true;
  isForget.value = false;
  clearForgetData();
};

const toForget = () => {
  isRegister.value = false;
  isLogin.value = false;
  isForget.value = true;
  clearRegisterData();
};

const questionOptions = [
  "您母亲的姓名是？",
  "您父亲的出生地是？",
  "您的出生城市是？",
  "您小学班主任的名字是？",
  "您的第一所学校的名字是？",
  "您的第一份工作是在哪里？",
  "您最喜欢的一本书是？",
  "您最喜欢的电影是？",
  "您的宠物名字是？",
  "您大学期间最好的朋友名字是？",
  "您的配偶名字是？",
  "您最喜欢的食物是？",
  "您高中班主任的名字是？",
  "您第一次出国去的国家是？",
  "您小时候最喜欢的玩具是？",
  "您第一个手机的品牌是？",
  "您最喜欢的运动是？",
  "您最喜欢的明星是？",
  "您小时候住的街道名称是？",
  "您最喜欢的颜色是？"
];
</script>


<template>
    <div id="login-body" class="loginish dark-background">
      <div class="desktop-hd">
        <span class="column">
         <a href="">
<!--            <img src="" alt="Yahoo" class="logo" width="" height="36">-->
<!--            <img src="" alt="Yahoo" class="dark-mode-logo logo " width="" height="36">-->
        </a>
        </span>
        <div class="desktop-universal-header">
          <a href="" > </a>
          <a href="" class="universal-header-links"> </a>
          <a href="" class="universal-header-links privacy-link"></a>
        </div>
      </div>
      <div class="login-box-container">
        <!-- 注册表单 -->
        <el-form class="login-box center" ref="formRef" size="large" autocomplete="off" v-if="isRegister" :model="registerData" :rules="rules">
          <!--标题-->
          <el-form-item class="login-hd">
            <h1 class="title">宁波市民卡联合确权<br>数据流转平台</h1>
            <hr class="divider">
            <h2 class="heading">注册</h2>

          </el-form-item>

          <!--用户名-->
          <el-form-item prop="username">
            <label for="username" class="reg-log_name">用户名</label>
            <el-input
                class="underline-input"
                placeholder="输入用户名"
                v-model="registerData.username"
                prefix-icon="User"

            />

          </el-form-item>

          <!--密保问题-->
          <el-form-item prop="securityQuestion">
            <label for="securityQuestion" class="center-input">密保问题</label>
            <el-select

                class="underline-input"
                v-model="registerData.securityQuestion"
                placeholder="请选择密保问题"
                clearable
                @visible-change="handleSelectVisibleChange1"
            >
              <el-option
                  v-for="item in questionOptions"
                  :key="item"
                  :label="item"
                  :value="item"
              />
            </el-select>
          </el-form-item>
          <!--密保答案-->
          <el-form-item prop="securityAnswer" class="reg-log">
            <label for="securityAnswer" class="reg-log_name">密保答案</label>
            <el-input class="underline-input" placeholder="输入密保答案" v-model="registerData.securityAnswer" prefix-icon="help"></el-input>
          </el-form-item>

          <!--密码-->
          <el-form-item prop="password" class="reg-log">
            <label for="password" class="reg-log_name">密码</label>
            <el-input
                maxlength="128"
                aria-label="密码"
                autocomplete="new-password"
                type="password"
                placeholder="请输入密码"
                aria-required="true"
                v-model="registerData.password"
                show-password
                class="underline-input"
                prefix-icon="unlock"

            ></el-input>
          </el-form-item>

          <!--重复密码-->
          <el-form-item prop="rePassword" class="reg-log">
            <label for="rePassword" class="reg-log_name">确认密码</label>
            <el-input class="underline-input" type="password" placeholder="请再次输入密码" v-model="registerData.rePassword" prefix-icon="unlock"></el-input>
          </el-form-item>

          <!-- 注册按钮 -->
          <el-form-item class="btn-container">
            <el-button class="btn-login" type="primary" auto-insert-space @click="register">
              注册
            </el-button>
          </el-form-item>

          <!-- 其他按钮 -->
          <el-form-item>
            <div class="add-tip">
              已有帐户？
              <el-link class="tip-link" type="primary" :underline="false" @click="toLogin">
                返回登录
              </el-link>
            </div>
          </el-form-item>
        </el-form>

        <!-- 登录表单 -->

        <el-form class="login-box center" ref="form" size="large" autocomplete="off" v-if="isLogin" :model="loginData" :rules="loginRules" @submit.prevent="login">
          <el-form-item class="login-hd">
            <h1 class="title">宁波市民卡联合确权<br>数据流转平台</h1>
            <hr class="divider">
            <h2 class="heading">登入</h2>
          </el-form-item>

          <el-form-item prop="username">
            <label for="username">用户名</label>
            <el-input class="underline-input" placeholder="输入用户名" v-model="loginData.username" prefix-icon="User"></el-input>
          </el-form-item>

          <el-form-item prop="password">
            <label for="password">密码</label>
            <el-input class="underline-input" type="password" placeholder="请输入密码" v-model="loginData.password" prefix-icon="unlock"></el-input>
          </el-form-item>

          <el-form-item class="remember-form-item">
            <div class="remember-container">
              <el-checkbox v-model="rememberMe" class="remember-checkbox">记住我</el-checkbox>
              <div class="spacer"></div> <!-- 弹性间隔 -->
              <el-link type="primary" :underline="false" @click="toForget" class="forget-link">忘记密码？</el-link>
            </div>
          </el-form-item>

          <!-- 登录按钮 -->
          <el-form-item class="button-wrapper">
            <el-button class="btn-login" type="primary" auto-insert-space @click="login">登录</el-button>
          </el-form-item>

          <el-form-item>
            <div class="add-tip">
              首次使用？
              <el-link type="primary" :underline="false" @click="toRegister">
                点我注册
              </el-link>
            </div>
          </el-form-item>

        </el-form>

        <!-- 忘记密码表单 -->
        <el-form class="login-box center" ref="forgetFormRef" size="large" autocomplete="off" v-if="isForget" :model="forgetData" :rules="forgetRules">
          <el-form-item class="login-hd">
            <h1 class="title">宁波市民卡联合确权<br>数据流转平台</h1>
            <hr class="divider">
            <h2 class="heading">找回账户</h2>
          </el-form-item>
          <el-form-item prop="username">
            <label for="username">用户名</label>
            <el-input class="underline-input" placeholder="输入用户名" v-model="forgetData.username" prefix-icon="User"></el-input>
          </el-form-item>
          <el-form-item prop="securityQuestion">
            <label for="securityQuestion">密保问题</label>
            <el-select
                class="underline-input"
                v-model="forgetData.securityQuestion"
                placeholder="请选择密保问题"
                @visible-change="handleSelectVisibleChange2"
                clearable
            >
              <el-option
                  v-for="item in questionOptions"
                  :key="item"
                  :label="item"
                  :value="item"
              />
            </el-select>
          </el-form-item>

          <el-form-item prop="securityAnswer">
            <label for="securityAnswer">密保答案</label>
            <el-input class="underline-input" placeholder="输入密保答案" v-model="forgetData.securityAnswer" prefix-icon="help"></el-input>
          </el-form-item>

          <el-form-item prop="newPassword" class="reg-log">
            <label for="newPassword" class="reg-log_name">新密码</label>
            <el-input
                class="underline-input"
                type="password"
                placeholder="请输入新密码"
                v-model="forgetData.newPassword"
                show-password
                prefix-icon="unlock"
            >
            </el-input>
          </el-form-item>

          <el-form-item prop="confirmPassword" class="reg-log">
            <label for="confirmPassword" class="reg-log_name">确认密码</label>
            <el-input
                class="underline-input"
                type="password"
                placeholder="请再次输入新密码"
                v-model="forgetData.confirmPassword"
                show-password
                prefix-icon="unlock"
            >
            </el-input>
          </el-form-item>

          <el-form-item class="button-wrapper">
            <el-button
                class="btn-login"
                type="primary"
                auto-insert-space
                @click="ResetCode(forgetData) ">提交
            </el-button>
          </el-form-item>

          <el-form-item >
            <div class="add-tip">
              <el-link type="primary" :underline="false" @click="toLogin" class="reg-flex">
                返回登录
              </el-link>
            </div>
          </el-form-item>
        </el-form>

      </div>
      <div class="login-bg-outer">
        <div class="login-bg-inner">

        </div>
      </div>

    </div>











</template>



<style scoped src="@/css/main.css">

</style>
