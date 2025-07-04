<script setup>
import { ref, computed, onMounted, onBeforeUnmount, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus';
import {handleCommand, handleSelect} from '@/router.js'
import { fetchDataRecord, searchUsernamesAPI, toSavePrivateKey } from '@/service/HomeService.js'
import { get, post } from '@/utils/request.js'
import {Expand, Fold, Search} from '@element-plus/icons-vue'
import { useMenu } from '@/service/useMenu.js'
import { jwtDecode } from 'jwt-decode'
import { string } from 'sockjs-client/lib/utils/random.js'

const activeMenu = ref('1');
const token = sessionStorage.getItem('authToken');
const decoded = jwtDecode(token);  // 解析 JWT Token
const username = decoded.sub;
const userRole = decoded.role;  // 获取当前用户角色

// 定义用户名建议列表
const usernameSuggestions = ref([]);
const name = ref();

// 用户角色对应的可访问菜单项
const { availableMenus } = useMenu(userRole);

// 分页相关数据
const tableData = ref([]);
const currentPage = ref(1); // 当前页
const pageSize = ref(7); // 每页显示条数

// 查询条件
const query = reactive({
  taskId: '',
  fileName: '',
  creatorName: '',
  dateRange: [] // [beginTimestamp, endTimestamp]
});

// 详情对话框的可见性和选中的行数据
const dialogVisible = ref(false);
const Outline = ref('');

// 计算分页后的数据
const formattedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return tableData.value.slice(start, end).map(record => {
    return {
      ...record,
      usageTimeFormatted: formatDate(record.time),
      dataIdShortened: shortenDataId(record.dataId)
    };
  });
});

// 统一获取并设置数据的函数
const fetchAndSetData = async (params = {}) => {
  const rawData = await fetchDataRecord(params);
  if (rawData && rawData.length > 0) {
    rawData.sort((a, b) => new Date(b.time) - new Date(a.time));
  }
  tableData.value = rawData || [];
};

onMounted(async () => {
  await fetchAndSetData();
  await savePrivateKey();
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
  // Outline.value = row.outline;
  Outline.value = "数据信息：" + row.outline + '\n' + "授权细则：" + row.usagePolicy;

  console.log(row.outline);
};

// 复制到剪贴板
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板');
  }).catch(() => {
    ElMessage.error('复制失败');
  });
};

// 缩短数据ID中间部分的方法
function shortenDataId(dataId) {
  const maxLength = 6; // 显示的字符总长度（首尾各5个字符）
  if (dataId.length <= maxLength) return dataId;
  const start = dataId.slice(0, 2);
  const end = dataId.slice(-3);
  return `${start}...${end}`;
}

// 用户名模糊查询
const searchUsernames = async () => {
  if (name === '') {
    usernameSuggestions.value = [];  // 清空建议列表
    return;
  }

  try {
    const response = await searchUsernamesAPI(name.value); // 调用后端接口获取匹配用户名
    usernameSuggestions.value = response.data || [];
    console.log(usernameSuggestions.value);
  } catch (error) {
    console.error("用户名查询失败", error);
  }
};

const savePrivateKey = async () => {
  try {
    document.body.classList.add('blur-active');
    // 1. 检查后端是否已记录私钥下载状态
    const response = await post(`/user/key-status?username=${encodeURIComponent(username)}`);

    // 2. 如果未下载过私钥，强制弹窗要求下载
    if (!response.success) {
      await ElMessageBox.confirm(
        '安全警告：您必须下载私钥文件才能继续使用系统',
        '强制下载',
        {
          confirmButtonText: '立即下载',
          cancelButtonText: '退出登录',
          type: 'error',
          closeOnClickModal: false,  // 禁止点击遮罩关闭
          closeOnPressEscape: false,  // 禁止ESC键关闭
          showClose: false,           // 隐藏关闭按钮
          lockScroll: true,          // 锁定页面滚动
          beforeClose: async (action, instance, done) => {
            if (action === 'confirm') {
              instance.confirmButtonLoading = true;
              try {
                const isSaved = await toSavePrivateKey(username);
                if (!isSaved) {
                  ElMessage.warning('您必须保存私钥才能继续使用系统');
                  instance.confirmButtonLoading = false;
                  return; // 阻止弹窗关闭
                }
                ElMessage.success('私钥下载完成！');
                done();
              } catch (err) {
                ElMessage.error(`下载失败: ${err.message}`);
                instance.confirmButtonLoading = false;
              }
            } else {
              done();
              handleCommand('logout');
            }
          }
        }
      );
    }
  } catch (error) {
    // 3. 网络请求失败的兜底处理
    await ElMessageBox.alert(
      '系统无法验证您的私钥状态，请重新登录后下载',
      '网络错误',
      {
        type: 'error',
        callback: async () => {
          handleCommand('logout');
        }
      }
    );
  }finally {
    // 无论成功或失败，都移除模糊效果
    document.body.classList.remove('blur-active');
  }
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

// 执行查询
const handleQuery = async () => {
  // 日期范围校验：必须同时选择或同时不选择
  if (query.dateRange.length === 1) {
    ElMessage.warning('请同时选择开始时间和结束时间');
    return;
  }

  const params = {};
  if (query.taskId) params.taskId = query.taskId;
  if (query.fileName) params.fileName = query.fileName;
  if (query.creatorName) params.creatorName = query.creatorName;
  if (query.dateRange && query.dateRange.length === 2) {
    params.begin = query.dateRange[0];
    params.end = query.dateRange[1];
  }

  await fetchAndSetData(params);
  currentPage.value = 1;
};

// 重置查询条件
const handleReset = async () => {
  query.taskId = '';
  query.fileName = '';
  query.creatorName = '';
  query.dateRange = [];
  await fetchAndSetData();
  currentPage.value = 1;
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
        <el-main width="100%">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
              <el-card class="main-card">
                <div class="sign">数据流转记录</div>
                <el-divider />

                      <!-- 查询条件表单 -->
                      <el-form :model="query" class="filter-form" style="margin-bottom: 20px;">
                        <el-row :gutter="20" align="middle">
                          <el-col :span="7">
                            <el-form-item label="任务ID">
                              <el-input v-model="query.taskId" placeholder="任务ID"/>
                            </el-form-item>
                          </el-col>
                          <el-col :span="10">
                            <el-form-item label="数据名称">
                              <el-input v-model="query.fileName" placeholder="数据名称"/>
                            </el-form-item>
                          </el-col>
                          <el-col :span="7">
                            <el-form-item>
                              <el-button type="primary" @click="handleQuery">查询</el-button>
                            </el-form-item>
                          </el-col>
                        </el-row>
                        <el-row :gutter="20" align="middle">
                          <el-col :span="7">
                            <el-form-item label="数据提供方">
                              <el-input v-model="query.creatorName" placeholder="数据提供方"/>
                            </el-form-item>
                          </el-col>
                          <el-col :span="10">
                            <el-form-item label="时间范围">
                              <el-date-picker
                                v-model="query.dateRange"
                                type="datetimerange"
                                range-separator="至"
                                start-placeholder="开始时间"
                                end-placeholder="结束时间"
                                value-format="YYYY-MM-DD HH:mm:ss"
                                style="width: 100%;"
                              />
                            </el-form-item>
                          </el-col>
                          <el-col :span="7">
                            <el-form-item>
                              <el-button @click="handleReset">重置</el-button>
                            </el-form-item>
                          </el-col>
                        </el-row>
                      </el-form>
                <div class="table-container">
                  <el-table height="66vh" :data="formattedTableData" border style="width: 100%" :header-cell-style="{'text-align': 'center'}">
                    <el-table-column prop="time" label="流转时间" align="center" />
                    <el-table-column prop="taskId" label="任务ID" align="center"/>
                    <el-table-column prop="fileName" label="数据名称" align="center" width="200px" />
                    <!--                    <el-table-column prop="dataId" label="数据ID" align="center" width="70">-->
                    <!--                      <template #default="scope">-->
                    <!--                        <el-tooltip :content="scope.row.dataId" placement="top">-->
                    <!--                          <span>{{ scope.row.dataIdShortened }}</span>-->
                    <!--                        </el-tooltip>-->
                    <!--                      </template>-->
                    <!--                    </el-table-column>-->

                    <el-table-column prop="creator" label="数据提供方" align="center"/>
                    <!--                    <el-table-column prop="b" label="联合公钥" align="center">-->
                    <!--                      <template #default="scope">-->
                    <!--                        <el-button link type="primary" size="small" @click="copyToClipboard(scope.row.b)">复制公钥</el-button>-->
                    <!--                      </template>-->
                    <!--                    </el-table-column>-->
                    <!--                    <el-table-column prop="y" label="联合签名" align="center">-->
                    <!--                      <template #default="scope">-->
                    <!--                        <el-button link type="primary" size="small" @click="copyToClipboard(scope.row.y)">复制签名</el-button>-->
                    <!--                      </template>-->
                    <!--                    </el-table-column>-->

                    <el-table-column  label="数据概要" align="center" >
                      <template #default="scope">
                        <el-button link type="primary" size="small" @click="onCheck(scope.row)">查看</el-button>
                      </template>
                    </el-table-column>
                  </el-table>

                  <!-- 详情对话框 -->
                  <el-dialog
                      v-model="dialogVisible"
                      title="数据大纲"
                      width="50%"
                      @close="dialogVisible = false"
                      :append-to-body="true"
                  >
                    <el-descriptions header="详细信息" :title="Outline" style="white-space: pre-wrap;">
                      {{Outline}}
                    </el-descriptions>
                    <span slot="footer" class="dialog-footer">
                      <el-button @click="dialogVisible = false">关闭</el-button>
                    </span>
                  </el-dialog>

                </div>

                <!-- 分页控件 -->
                <div style="margin-top: 20px; overflow-x: auto;">  <!-- 新增容器 -->
                  <el-pagination
                      background
                      layout="prev, pager, next"
                      :total="tableData.length"
                      :page-size="pageSize"
                      v-model:currentPage="currentPage"
                      class="pagination"
                      :small="isMobile"
                      :pager-count="isMobile ? 3 : 5"
                  />
                </div>
              </el-card>
            </el-col>


            <el-col :md="8" :lg="8" :xl="8">
              <el-card class="form-select-card" style="justify-content: flex-start"
                       :class="{ 'mobile-form-card': isMobile }">
                <div style="display: flex; justify-content: center;">
                  <div style="display: flex; align-items: center; gap: 10px; margin-top: 40px; white-space: nowrap;">
                    <label style="white-space: nowrap;">搜索用户：</label>
                    <el-input v-model="name" placeholder="输入用户名" style=" width: 150px;"/>
                    <el-button :icon="Search" type="primary" @click="searchUsernames"></el-button>
                  </div>
                </div>

                <!-- 显示模糊搜索到的用户 -->
                <el-table :data="usernameSuggestions" style="width: 100%" v-if="usernameSuggestions.length > 0" stripe :header-cell-style="{'text-align': 'center'}">
                  <el-table-column label="用户名" prop="USERNAME"  align="center"/>
                  <el-table-column label="角色" prop="ROLE"  align="center"/>
                  <el-table-column label="公钥" prop="PUBLIC_KEY"  align="center">
                    <template #default="scope">
                      <el-button link type="primary" size="small" @click="copyToClipboard(scope.row.PUBLIC_KEY)">复制公钥</el-button>
                    </template>
                  </el-table-column>
                </el-table>
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
