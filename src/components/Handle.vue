<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {handleCommand, handleSelect} from '@/router.js'

import { calculateArbitration, calculateConfirm, calculateSign, fetchTask } from '@/service/HandleService.js'
import { useMenu } from '@/service/useMenu.js'
import { jwtDecode } from 'jwt-decode'
import {Expand, Fold} from "@element-plus/icons-vue";
import { ElMessage } from 'element-plus'
const activeMenu = ref('3');
const token = sessionStorage.getItem('authToken');
const decoded = jwtDecode(token);  // 解析 JWT Token
const username = decoded.sub;
const userRole = decoded.role;  // 获取当前用户角色
const formData = ref({
  dataUser:'',
  text: '', // 用户提交的申请文本
  type:'',
  dateTimeRange: [] // 用户选择的日期和时间范围
});

// 用户角色对应的可访问菜单项
const { availableMenus } = useMenu(userRole);
// 分页相关数据1
let tableData = ref([]);
const currentPage = ref(1); // 当前页
const pageSize = ref(9); // 每页显示条数

onMounted(async () => {
  tableData.value = await fetchTask(username);
  const messages = JSON.parse(sessionStorage.getItem('reloadMessages') || '[]');
  messages.forEach(msg => {
    ElMessage[msg.type](msg.message);
  });
  sessionStorage.removeItem('reloadMessages'); // 显示后清除
});

// 计算分页后的数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return tableData.value.slice(start, end);
});

const privateKey = ref(null);

// 文件选择
const handleBeforeUpload = async (file, rowData) => {
  privateKey.value = file;
  // console.log(rowData.taskType);
  if(rowData.taskType === '签名'){
    await calculateSign(privateKey.value, rowData, username);
  } else if(rowData.taskType === '确权'){
    await calculateConfirm(privateKey.value, rowData, username);
  } else {
    await calculateArbitration(privateKey.value, rowData, username);
  }


  // 阻止自动上传，等待其他操作完成后再上传
  return false;
};

// 重置表单
const onReset = () => {
  formData.value.text = '';
  formData.value.dataUser = null;
  formData.value.dateTimeRange = null;
};

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
        <el-main width="100%" style="padding: 20px;">
          <el-row :gutter="20">
            <el-col :span="3"/>
            <el-col :span="18">
              <el-card class="main-card">
                <div class="sign">待处理流程</div>
                <el-divider />
                <div style="height: 66vh;">
                  <el-table height="66vh" :data="paginatedData" border style="width: 100%" :header-cell-style="{'text-align': 'center'}">
                    <el-table-column prop="completedAt" label="时间" align="center" />
                    <el-table-column prop="taskId" label="任务ID" align="center" />
                    <el-table-column prop="fileName" label="数据名" align="center" />
                    <el-table-column prop="taskType" label="类型" align="center" />
                    <el-table-column prop="status" label="状态" align="center" />
                    <el-table-column label="操作" align="center" width="100">
                      <template #default="scope">
                        <!-- 文件选择 -->
                        <el-upload
                            :before-upload="(file) => handleBeforeUpload(file, scope.row)"
                            :show-file-list="true"
                        >
                          <el-button type="primary" size="small" :disabled="scope.row.status !== 'in_progress' && scope.row.status !== '私钥无效，请重新提交'">
                            添加私钥
                          </el-button>
                        </el-upload>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>

                <!-- 分页控件 -->
                <el-pagination
                    background
                    layout="prev, pager, next"
                    :total="tableData.length"
                    :page-size="pageSize"
                    v-model:currentPage="currentPage"
                    class="pagination"
                />

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