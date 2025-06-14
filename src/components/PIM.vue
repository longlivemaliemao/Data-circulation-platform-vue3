<script setup>
import {ref, computed, onMounted, onBeforeUnmount} from 'vue'
import {handleCommand, handleSelect} from '@/router.js'
import { fetchUser, updateUser } from '@/service/UserMgrService.js'
import { useMenu } from '@/service/useMenu.js'
import { jwtDecode } from 'jwt-decode'
import { onSubmit } from '@/service/PIM.js'
import {Expand, Fold} from "@element-plus/icons-vue";

const activeMenu = ref('7');
const token = sessionStorage.getItem('authToken');
const decoded = jwtDecode(token);  // 解析 JWT Token
const username = decoded.sub;
const userRole = decoded.role;  // 获取当前用户角色
const userId = decoded.id;  // 获取当前用户角色
// 分页相关数据
let tableData = ref([]);
// 用户角色对应的可访问菜单项
const { availableMenus } = useMenu(userRole);

onMounted(async () => {
  tableData.value = await fetchUser();
});

const formData = ref({
  id:userId,
  username:'',
  password:'',
  securityQuestion:'',
  securityAnswer:'',
});
// 去除用户名空格
const trimUsername = (username) => {
  return username.replace(/\s+/g, '');
};

// 密码复杂度验证
const validatePassword = (rule, value, callback) => {
  if(value!=='') {
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
  }
  callback();
};
// 用户名验证
const validateUsername = (rule, value, callback) => {
  if(value!==''){
    // 去除空格
    const trimmedValue = value.replace(/\s+/g, '');

    // 长度验证
    if (trimmedValue.length < 5 || trimmedValue.length > 16) {
      callback(new Error('用户名长度应为5-16个字符'));
      return;
    }

    // 更新去除空格后的用户名
    if (formData.value) {
      formData.value.username = trimmedValue;
    } else {
      formData.value.username = trimmedValue;
    }
  }
  callback();
};
const rules = ref({
  username: [
    { required: true, validator: validateUsername, trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ],
});
const isCollapse = ref(false); // 侧边栏折叠状态
const isMobile = ref(false); // 是否移动设备
const asideWidth = ref('240px'); // 动态侧边栏宽度

// 切换侧边栏折叠状态
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
  asideWidth.value = isCollapse.value ? '80px' : '240px'
}

onMounted(async () => {
  handleResize();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});


const handleResize = () => {
  const width = window.innerWidth;
  isMobile.value = width < 768;
  if (width < 768) {
    asideWidth.value = '64px';
    isCollapse.value = true;
  } else if (width < 992) {
    asideWidth.value = '180px';
    isCollapse.value = true;
  } else if (width < 1200) {
    asideWidth.value = '240px';
    isCollapse.value = false;
  } else {
    asideWidth.value = '240px';
    isCollapse.value = false;
  }
};
</script>

<template>
  <el-container style="height: 100vh; width: 100%;overflow: hidden;">
    <!-- 侧边栏 -->
    <el-aside :width="asideWidth" class="custom-aside" :class="{ 'is-collapse': isCollapse }">
      <div class="sidebar-header">
        <transition name="fade">
          <span class="logo-text" v-if="!isCollapse">宁波市民卡联合确权数据流转平台</span>
        </transition>

      </div>
      <el-menu
          :default-active="activeMenu"
          class="custom-menu"
          @select="handleSelect"
          :collapse="isCollapse"
          :collapse-transition="false"
      >
        <!-- 动态渲染菜单项 -->
        <el-menu-item
            v-for="menu in availableMenus"
            :key="menu.index"
            :index="menu.index"
        >
          <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
          <span v-if="!isCollapse">{{ menu.name }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧内容区 -->
    <el-container>
      <!-- 顶部栏 -->
      <el-header class="app-header">

          <el-button @click="toggleCollapse" :icon="isCollapse ? Expand : Fold" circle />

        <div class="header-spacer" />
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <el-check-tag type="primary" size="large" checked>{{username}}</el-check-tag>
            <template v-slot:dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">登出</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-tag :disable-transitions="true" type="danger" effect="dark">{{userRole}}</el-tag>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-container>
        <el-main width="100%" style="padding: 1.5rem;">
          <el-row :gutter="20">
            <el-col :span="6" />
            <el-col :span="10">
              <el-card class="main-card">
                <div class="sign">个人信息管理</div>
                <el-divider />
                <el-form :model="formData" :rules="rules" >
                  <div style="height: 66vh;">
                    <el-form-item label="修改用户名：" prop="username">
                      <el-input v-model="formData.username"/>
                    </el-form-item>

                    <el-form-item label="修改新密码：" prop="password">
                      <el-input v-model="formData.password"/>
                    </el-form-item>
                    <el-form-item prop="securityQuestion" label="修改密保问题：">
                      <el-select
                          class="enter"
                          v-model="formData.securityQuestion"
                          placeholder="请选择密保问题"
                          clearable
                      >
                        <el-option label="您母亲的姓名是？" value="您母亲的姓名是？" />
                        <el-option label="您父亲的出生地是？" value="您父亲的出生地是？" />
                        <el-option label="您的出生城市是？" value="您的出生城市是？" />
                        <el-option label="您小学班主任的名字是？" value="您小学班主任的名字是？" />
                        <el-option label="您的第一所学校的名字是？" value="您的第一所学校的名字是？" />
                        <el-option label="您的第一份工作是在哪里？" value="您的第一份工作是在哪里？" />
                        <el-option label="您最喜欢的一本书是？" value="您最喜欢的一本书是？" />
                        <el-option label="您最喜欢的电影是？" value="您最喜欢的电影是？" />
                        <el-option label="您的宠物名字是？" value="您的宠物名字是？" />
                        <el-option label="您大学期间最好的朋友名字是？" value="您大学期间最好的朋友名字是？" />
                        <el-option label="您的配偶名字是？" value="您的配偶名字是？" />
                        <el-option label="您最喜欢的食物是？" value="您最喜欢的食物是？" />
                        <el-option label="您高中班主任的名字是？" value="您高中班主任的名字是？" />
                        <el-option label="您第一次出国去的国家是？" value="您第一次出国去的国家是？" />
                        <el-option label="您小时候最喜欢的玩具是？" value="您小时候最喜欢的玩具是？" />
                        <el-option label="您第一个手机的品牌是？" value="您第一个手机的品牌是？" />
                        <el-option label="您最喜欢的运动是？" value="您最喜欢的运动是？" />
                        <el-option label="您最喜欢的明星是？" value="您最喜欢的明星是？" />
                        <el-option label="您小时候住的街道名称是？" value="您小时候住的街道名称是？" />
                        <el-option label="您最喜欢的颜色是？" value="您最喜欢的颜色是？" />
                      </el-select>
                    </el-form-item>

                    <el-form-item v-if="formData.securityQuestion" label="修改密保答案：" prop="securityAnswer" >
                      <el-input v-model="formData.securityAnswer"/>
                    </el-form-item>
                    <el-row class="form-row">
                      <el-col :span="24" class="input-col" style="text-align: right;">
                        <el-button type="primary" @click="onSubmit(formData)">提交</el-button>
                      </el-col>
                    </el-row>

                  </div>
                </el-form>
              </el-card>
            </el-col>

          </el-row>

        </el-main>
      </el-container>
    </el-container>
  </el-container>
</template>

<style scoped src="@/css/main.css">

</style>
