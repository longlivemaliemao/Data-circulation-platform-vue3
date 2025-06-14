<script setup>
import {ref, computed, onMounted, onBeforeUnmount} from 'vue'
import {handleCommand, handleSelect} from '@/router.js'
import { fetchUser, onDelete, updateUser } from '@/service/UserMgrService.js'
import { useMenu } from '@/service/useMenu.js'
import { jwtDecode } from 'jwt-decode'
import {Expand, Fold} from "@element-plus/icons-vue";

const activeMenu = ref('6');
const token = sessionStorage.getItem('authToken');
const decoded = jwtDecode(token);  // 解析 JWT Token
const username = decoded.sub;
const userRole = decoded.role;  // 获取当前用户角色
// 分页相关数据
let tableData = ref([]);
const currentPage = ref(1); // 当前页
const pageSize = ref(12); // 每页显示条数
// 用户角色对应的可访问菜单项
const { availableMenus } = useMenu(userRole);


// 存储当前正在编辑的用户信息
const editingUser = ref({
  id: null,
  username: '',
  role: '',
  email: ''
});
const isEditing = ref(false);

onMounted(async () => {
  tableData.value = await fetchUser();
});

// 计算分页后的数据
const paginatedData = computed(() => {
  if (!Array.isArray(tableData.value)) {
    console.error("tableData is not an array:", tableData.value);
    return []; // 如果不是数组，返回空数组
  }

  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return tableData.value.slice(start, end);
});


// 修改用户信息
const onModify = (id) => {
  const user = tableData.value.find(u => u.id === id);
  if (user) {
    editingUser.value = { ...user }; // 深拷贝用户信息到编辑状态
    isEditing.value = true; // 设置编辑状态为 true
  }
};

// 保存修改后的用户信息
const saveChanges = async () => {
  try {
    console.log(editingUser.value);
    await updateUser(editingUser.value);
    isEditing.value = false; // 退出编辑模式
  } catch (error) {
    console.error('更新用户信息时出错:', error);
  }
};

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false; // 退出编辑模式
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
  <el-container style="height: 100vh; width: 100%; overflow: hidden;">
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
                <div class="sign">用户管理</div>
                <el-divider />
                <div class="table-container">
                  <el-table height="66vh" :data="paginatedData" border style="width: 100%" :header-cell-style="{'text-align': 'center'}">
                    <el-table-column prop="id" label="用户ID" align="center" />
                    <el-table-column prop="username" label="用户名" align="center" >
                      <template #default="scope">
                        <el-input v-if="isEditing && editingUser.id === scope.row.id" v-model="editingUser.username" />
                        <span v-else>{{ scope.row.username }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="role" label="用户权限" align="center" >
                      <template #default="scope">
                        <el-select v-if="isEditing && editingUser.id === scope.row.id" v-model="editingUser.role" placeholder="请选择角色">
                          <el-option label="Admin" value="Admin"></el-option>
                          <el-option label="普通用户" value="普通用户"></el-option>
                          <el-option label="数据提供方" value="数据提供方"></el-option>
                          <el-option label="审批员" value="审批员"></el-option>
                          <el-option label="测试账号" value="测试账号"></el-option>
                        </el-select>
                        <span v-else>{{ scope.row.role }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column fixed="right" label="操作" align="center">
                      <template #default="scope">
                        <el-button link type="primary" size="small" @click="onDelete(scope.row.username)">
                          删除
                        </el-button>
                        <el-button link type="primary" size="small" @click="onModify(scope.row.id)" v-if="!isEditing || editingUser.id !== scope.row.id">
                          修改
                        </el-button>
                        <el-button link type="primary" size="small" @click="saveChanges" v-if="isEditing && editingUser.id === scope.row.id">
                          完成
                        </el-button>
                        <el-button link type="primary" size="small" @click="cancelEdit" v-if="isEditing && editingUser.id === scope.row.id">
                          取消
                        </el-button>
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
