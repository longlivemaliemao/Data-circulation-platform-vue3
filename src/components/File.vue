<script setup>
import {ref, computed, onMounted, onBeforeUnmount} from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus';
import {handleCommand, handleSelect} from '@/router.js'
import { fetchDataRecord } from '@/service/FileService.js'
import { useMenu } from '@/service/useMenu.js'
import { jwtDecode } from 'jwt-decode'
import {Expand, Fold} from "@element-plus/icons-vue";

const activeMenu = ref('8');
const token = sessionStorage.getItem('authToken');
const decoded = jwtDecode(token);  // 解析 JWT Token
const username = decoded.sub;
const userRole = decoded.role;  // 获取当前用户角色

// 用户角色对应的可访问菜单项
const { availableMenus } = useMenu(userRole);

// 分页相关数据
const tableData = ref([]);
const currentPage = ref(1); // 当前页
const pageSize = ref(7); // 每页显示条数

// 详情对话框的可见性和选中的行数据
const dialogVisible = ref(false);
const Outline = ref(null);

// 计算分页后的数据
const formattedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return tableData.value.slice(start, end).map(record => {
    return {
      ...record,
      usageTimeFormatted: formatDate(record.usageTime),
    };
  });
});

onMounted(async () => {

  const rawData = await fetchDataRecord(username);

  if (rawData && rawData.length > 0) {
    rawData.sort((a, b) => {

      return new Date(b.usageTime) - new Date(a.usageTime); // 从新到旧
    });
  }

  // 3. 赋值给响应式变量（触发视图更新）
  tableData.value = rawData;
  console.log(tableData.value);
});


function formatDate(dateString) {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString(); // 日期部分
  const formattedTime = date.toLocaleTimeString(); // 时间部分
  return `${formattedDate}\n${formattedTime}`;
}

// 点击查看按钮的处理函数
const onCheck = async (row) => {
  dialogVisible.value = true;
  Outline.value = row.fileOutline;
  console.log(row.fileOutline);
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
        <el-main width="100%" style="padding: 1.5rem;">
          <el-row :gutter="20">
            <el-col :span="3"/>
            <el-col :span="18">
              <el-card class="main-card">
                <div class="sign">已上传数据管理</div>
                <el-divider />
                <div style="height: 66vh;">
                  <el-table height="66vh" :data="formattedTableData" border style="width: 100%" :header-cell-style="{'text-align': 'center'}">
                    <el-table-column prop="usageTime" label="上传时间" align="center" />
                    <el-table-column prop="fileName" label="数据名" align="center"/>
                    <el-table-column  label="数据信息" align="center" >
                      <template #default="scope">
                        <el-button link type="primary" size="small" @click="onCheck(scope.row)">查看</el-button>
                      </template>
                    </el-table-column>
                  </el-table>

                  <!-- 详情对话框 -->
                  <el-dialog
                      v-model="dialogVisible"
                      title="数据信息"
                      width="50%"
                      @close="dialogVisible = false"
                      :append-to-body="true"
                  >
                    <el-descriptions header="详细信息" :title="Outline" >
                      {{Outline}}
                    </el-descriptions>
                    <span slot="footer" class="dialog-footer">
                      <el-button @click="dialogVisible = false">关闭</el-button>
                    </span>
                  </el-dialog>

                </div>

                <!-- 分页控件 -->
                <el-pagination
                    background
                    layout="prev, pager, next"
                    :total="tableData.length"
                    :page-size="pageSize"
                    v-model:currentPage="currentPage"
                    style="margin-top: 20px; text-align: center; display: flex; justify-content: center;"
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

<style scoped>
/* 基本设置 */
body, html {
  font-family: 'Arial', sans-serif;
  color: #333;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-size: 14px; /* 设置基础字体大小，方便整体适配 */
}

/* 全局容器 */
.el-container {
  background-color: #f0f2f5;
  min-height: 100vh;
}

/* 侧边栏 */
.custom-aside {
  background: linear-gradient(135deg, #1f2f47, #304156);
  color: #fff;
}

.logo {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  text-align: center;
  padding: 20px 0;
  border-bottom: 1px solid #3a4a5f;
  letter-spacing: 1px;
}

.custom-menu {
  background-color: transparent;
  font-size: 15px; /* 侧边栏菜单字体大小适中 */
}

.custom-menu .el-menu-item {
  color: #c0c4cc;
  padding: 15px 20px;
  transition: all 0.3s ease;
}

.custom-menu .el-menu-item:hover {
  color: #ffd04b;
  background-color: rgba(255, 208, 75, 0.1);
}

.custom-menu .el-menu-item.is-active {
  background-color: #ffd04b;
  color: #333;
  font-weight: bold;
  border-radius: 5px;
}

/* 顶部栏 */
.el-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
  height: 60px;
}

.el-avatar {
  cursor: pointer;
  font-weight: bold;
  color: #409eff;
  font-size: 15px; /* 顶部栏头像文字大小 */
  transition: color 0.3s ease;
}

.el-avatar:hover {
  color: #ffd04b;
}

/* 内容区 */
.sign {
  font-size: 16px; /* 调整内容区标题大小 */
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.el-divider {
  margin: 15px 0;
}

/* 卡片 */
.el-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background-color: #fff;
  transition: all 0.3s ease;
}

.el-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
}

.el-table th, .el-table td {
  font-size: 13px; /* 表格内容字体小而精炼 */
}

/* 表单 */
.form-row {
  margin-top: 15px;
}

.label-col {
  font-size: 14px;
  font-weight: bold;
  text-align: right;
  color: #333;
}

.input-col {
  padding-left: 10px;
}

.el-input,
.el-select {
  width: 100%;
  transition: border-color 0.3s ease;
}

.el-input:focus,
.el-select:focus {
  border-color: #ffd04b;
}

.button-col {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.el-button {
  font-size: 14px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 上传部分 */
.el-upload .el-button {
  margin-right: 10px;
}

.el-progress {
  width: 100%;
  font-size: 13px; /* 调整进度条文字大小 */
}

/* 分页 */
.el-pagination {
  margin-top: 20px;
  font-size: 13px; /* 分页文字适配 */
}

/* 弹出卡片 */
.el-card .close-btn {
  font-size: 24px;
  color: #409eff;
  position: absolute;
  right: 15px;
  top: 10px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.el-card .close-btn:hover {
  color: #ffd04b;
}

/* 按钮颜色 */
.el-button--primary {
  background-color: white;
  border-color: #409eff;
  font-size: 14px;
}

.el-button--primary:hover {
  background-color: #ffd04b;
  border-color: #ffd04b;
  color: #333;
}
/* 模糊化效果 + 遮罩层 */
.blur-active .el-container {
  filter: blur(5px);
  transition: filter 0.3s ease;
  pointer-events: none; /* 阻止交互 */
}

/* 半透明遮罩层（增强聚焦效果） */
.blur-active::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  z-index: 999; /* 确保遮罩在内容之上、弹窗之下 */
}

/* 确保 Element UI 弹窗在遮罩层之上 */
.el-message-box {
  z-index: 1000 !important;
}
</style>
