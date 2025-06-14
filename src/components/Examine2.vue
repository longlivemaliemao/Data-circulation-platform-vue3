<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {handleCommand, handleSelect} from '@/router.js'
import { update, fetchApplications } from '@/service/Examine2Service.js'
import { useMenu } from '@/service/useMenu.js'
import { jwtDecode } from 'jwt-decode'
import {Expand, Fold} from "@element-plus/icons-vue";
const activeMenu = ref('5');
const token = sessionStorage.getItem('authToken');
const decoded = jwtDecode(token);  // 解析 JWT Token
const username = decoded.sub;
const userRole = decoded.role;  // 获取当前用户角色
// 分页相关数据
const tableData = ref([]);
const currentPage = ref(1); // 当前页
const pageSize = ref(6); // 每页显示条数
const rowStatus = ref({});
// 用户角色对应的可访问菜单项
const { availableMenus } = useMenu(userRole);
onMounted(async () => {
  tableData.value = await fetchApplications();
  console.log(tableData.value);

  // 初始化每一行的状态
  tableData.value.forEach(item => {
    rowStatus.value[item.id] = {
      isEditing: false, // 是否在编辑状态
      rejectReason: ''   // 拒绝理由
    };
  });
});

const toggleReject = (id) => {
  rowStatus.value[id].isEditing = true; // 设置为编辑状态
};


// 计算分页后的数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return tableData.value.slice(start, end);
});

// 点击“取消”时的操作
const onCancel = (id) => {
  rowStatus.value[id].isEditing = false; // 退出编辑模式，恢复“同意”和“拒绝”按钮
  rowStatus.value[id].rejectReason = ''; // 清空拒绝理由
};

// 同意申请
const onAgree = async (id, Type, username) => {
  if(Type === '签名') {
    await update(username, id, tableData, '等待数据提供方审核', '');
  }else{
    await update(username, id, tableData, '申请已通过', '等待验证');
  }
};

// 拒绝申请
const onReject = async (id, username) => {
  const reason = rowStatus.value[id].rejectReason || '';
  await update(username, id, tableData, '平台审核未通过', reason);

  // 移除该行并退出编辑模式
  tableData.value = tableData.value.filter(item => item.id !== id);
  onCancel(id); // 操作完成后退出编辑模式
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
            <el-col :span="1"/>
            <el-col :span="22">
              <el-card class="main-card">
                <div class="sign">待处理的申请</div>
                <el-divider />
                <div class="table-container">
                  <el-table height="66vh" :data="paginatedData" border style="width: 100%" :header-cell-style="{'text-align': 'center'}">
                    <el-table-column prop="applicationTime" label="申请时间" align="center"/>、
                    <el-table-column prop="username" label="用户名" align="center"/>
                    <el-table-column prop="applicationType" label="申请类型" align="center"/>
                    <el-table-column label="申请内容" width="380">
                      <template #default="scope">
                        <div v-if="scope.row.applicationType === '签名'">
                          <div>需求：{{ scope.row.text }}</div>
                          <div >时间：{{ scope.row.startDate }} - {{ scope.row.endDate }}</div>
                        </div>
                        <div v-if="scope.row.applicationType === '确权'">
                          <div>需求：对任务ID为 {{ scope.row.text }} ，文件名为“{{ scope.row.fileName }}”的流转数据进行确权</div>
                        </div>
                        <div v-if="scope.row.applicationType === '仲裁'">
                          <div>需求：对任务ID为 {{ scope.row.text }} ，文件名为“{{ scope.row.fileName }}”的流转数据进行仲裁</div>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" align="center" width="280">
                      <template #default="scope">
                        <!-- 如果当前行处于编辑模式，显示输入框和确定/取消按钮，否则显示同意/拒绝按钮 -->
                        <div v-if="rowStatus[scope.row.id].isEditing" style="display: flex; align-items: center; gap: 8px; white-space: nowrap;">


                          <el-input v-model="rowStatus[scope.row.id].rejectReason" placeholder="请输入拒绝理由" style="flex: 1; min-width: 100px;" />

                          <el-button type="primary" size="small" @click="onReject(scope.row.id, scope.row.username)">
                            确定
                          </el-button>
                          <el-button style="margin-left: -10px; margin-right: 10px;" type="text" size="small" @click="onCancel(scope.row.id)">
                            取消
                          </el-button>



                        </div>
                        <div v-else style="white-space: nowrap;">
                          <el-button type="primary" size="small" @click="onAgree(scope.row.id, scope.row.applicationType, scope.row.username)">
                            同意
                          </el-button>
                          <el-button type="primary" size="small" @click="toggleReject(scope.row.id)">
                            拒绝
                          </el-button>
                        </div>
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