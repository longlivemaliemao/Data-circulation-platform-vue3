<script setup>
import {ref, computed, onMounted, onBeforeUnmount, watch} from 'vue'
import {handleCommand, handleSelect} from '@/router.js'
import {
  Download,
  fetchApplications,
  fetchDataOwners,
  onSubmit, onSubmit1,
  fetchProcessStatus
} from '@/service/ApplicationService.js'
import {CircleCheckFilled, CircleCloseFilled, Clock, Expand, Fold, Loading, WarningFilled} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useMenu } from '@/service/useMenu.js'
import { jwtDecode } from 'jwt-decode'

const token = sessionStorage.getItem('authToken');
const decoded = jwtDecode(token);  // 解析 JWT Token
const username = decoded.sub;
const userRole = decoded.role;  // 获取当前用户角色

const activeMenu = ref('2');
const selectedForm = ref('');  // 用于跟踪用户选择的表单
const formSelected = ref(false); // 标记是否选择了表单
const options = ref([]); // 用于存储从后端获取的用户数据
const taskId = ref('');

// 新增筛选相关的响应式数据
const filterType = ref('');
const filterStatus = ref(''); // <--- 新增：状态筛选模型
const filterDateRange = ref([]);

// <--- 新增：定义所有状态选项
// 注意：根据您的描述，第三条规则看起来更像是针对“仲裁”类型，这里我们做此假设
const allStatusOptions = {
  '签名': [
    '等待平台审核',
    '等待数据提供方审核',
    '平台审核未通过',
    '数据提供方审核未通过',
    '申请已通过',
    '签名失败',
    '签名已完成'
  ],
  '确权': [
    '等待平台审核',
    '平台审核未通过',
    '申请已通过',
    '确权失败',
    '确权验证失败',
    '确权验证成功'
  ],
  '仲裁': [
    '等待平台审核',
    '平台审核未通过',
    '申请已通过',
    '第一次验证失败，进行下一步验证',
    '第二次验证失败，进行下一步验证',
    '仲裁验证完成'
  ]
};

// <--- 新增：根据申请类型动态计算状态选项
const statusOptions = computed(() => {
  return allStatusOptions[filterType.value] || [];
});


// 分页相关数据
let tableData = ref([]);
const currentPage = ref(1); // 当前页
const pageSize = ref(5); // 每页显示条数

// 用户角色对应的可访问菜单项
const { availableMenus } = useMenu(userRole);
// 用于根据选择显示对应的卡片
function showForm(type) {
  selectedForm.value = type;
  formSelected.value = true; // 设置为true以隐藏按钮卡片并显示表单卡片
  formData.value.type = type;
}

const formData = ref({
  dataUser:'',
  text: '', // 用户提交的申请文本
  type:'',
  dateTimeRange: [] // 用户选择的日期和时间范围
});

const loading = ref(true);  // 数据加载状态

onMounted(async () => {
  const messages = JSON.parse(sessionStorage.getItem('reloadMessages') || '[]');
  messages.forEach(msg => {
    ElMessage[msg.type](msg.message);
  });
  sessionStorage.removeItem('reloadMessages'); // 显示后清除
  try {
    tableData.value = await fetchApplications(username);
    options.value = await fetchDataOwners();
  } catch (error) {
    console.error("数据加载失败", error);
  } finally {
    loading.value = false;  // 数据加载完成，更新 loading 状态
  }
});

const filteredData = computed(() => {
  let data = tableData.value;

  // 1. 按申请类型筛选
  if (filterType.value) {
    data = data.filter(item => item.applicationType === filterType.value);
  }

  // <--- 新增：2. 按状态筛选
  if (filterStatus.value) {
    data = data.filter(item => item.status === filterStatus.value);
  }

  // 3. 按申请时间范围筛选
  if (filterDateRange.value && filterDateRange.value.length === 2) {
    const [startTime, endTime] = filterDateRange.value;
    if (startTime && endTime) {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      data = data.filter(item => {
        if (!item.applicationTime) return false;
        const itemTime = new Date(item.applicationTime).getTime();
        return itemTime >= start && itemTime <= end;
      });
    }
  }

  return data;
});

const paginatedData = computed(() => {
  if (loading.value) {
    return [];  // 如果还在加载中，返回空数组
  }
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
});

// <--- 修改：监听筛选条件变化，重置到第一页 (加入 filterStatus)
watch([filterType, filterDateRange, filterStatus], () => {
  currentPage.value = 1;
});

// <--- 新增：监听申请类型变化，重置状态筛选器
watch(filterType, () => {
  filterStatus.value = '';
});

// 对话框显示控制
const dialogVisible = ref(false);
// 对话框内容
const dialogContent = ref('');

// 流程状态对话框
const processDialogVisible = ref(false);
const processDialogContent = ref([]);
const processDialogLoading = ref(false);

const getIconForStatus = (status) => {
  switch (status) {
    case 'pending':
      return Clock;
    case 'in_progress':
      return Loading;
    case 'completed':
      return CircleCheckFilled;
    case 'stop':
      return Clock;
    case 'error':
      return WarningFilled;
    default:
      return Clock; // 默认为等待图标
  }
};

const getIconColor = (status) => {
  switch (status) {
    case 'completed':
      return 'var(--el-color-success)';
    case 'stop':
      return 'var(--el-color-info)';
    case 'in_progress':
      return 'var(--el-color-primary)';
    case 'error':
      return 'var(--el-color-warning)';
    default:
      return 'var(--el-color-info)';
  }
};

const getContentForActivity = (activity) => {
  if (!activity || !activity.username || !activity.status || !activity.role) {
    return '未知状态';
  }
  switch (activity.status) {
    case 'pending':
      return `用户${activity.username}等待中`;
    case 'stop':
      return `用户${activity.username}等待中`;
    case 'in_progress':
      return `用户${activity.username}正在处理中...`;
    case 'completed':
      return `用户${activity.username}已处理完成`;
    case 'error':
      return `流程在用户${activity.username}处中断`;
    default:
      return `用户${activity.username}- 状态未知`;
  }
};

const openProcessDialog = async (row) => {
  processDialogVisible.value = true;
  processDialogLoading.value = true;
  processDialogContent.value = [];
  try {
    const data = await fetchProcessStatus(row.applicationType, row.id);
    if (data && Array.isArray(data)) {
      processDialogContent.value = [...data].sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  } catch (error) {
    // The service already shows an error toast.
  } finally {
    processDialogLoading.value = false;
  }
};

// 打开对话框并显示 explanation 内容
const openDialog = (explanation) => {
  dialogContent.value = explanation || '无详细说明';
  dialogVisible.value = true;
  console.log(dialogVisible.value);
};


// 重置签名表单
const onReset = () => {
  formData.value.text = '';
  formData.value.dataUser = null;
  formData.value.dateTimeRange = null;
};

// 重置确权表单
const onReset1 = () => {
  taskId.value = null;
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

const downloadTooltipContent = (row) => {
  if (row.explanation === '不允许下载该数据') {
    return '确权验证失败，无法继续下载该数据';
  }
  if (row.authEndTime && new Date(row.authEndTime) < Date.now()) {
    return '授权已过期，无法下载该数据';
  }
  return '';
};

const isDownloadDisabled = (row) => {
  if (row.explanation === '不允许下载该数据') return true;
  if (row.authEndTime && new Date(row.authEndTime) < Date.now()) return true;
  return false;
};

const DISABLED_PROCESS_STATUSES = [
  '等待数据提供方审核',
  '等待平台审核',
  '平台审核未通过',
  '数据提供方审核未通过'
];

const isProcessDisabled = (row) => DISABLED_PROCESS_STATUSES.includes(row.status);

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
            <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
              <el-card class="main-card">
                <div class="sign">申请记录</div>
                <!-- v--- 修改此处的布局和内容 ---v -->
                <el-row :gutter="20" style="margin-top: 1rem; align-items: center;">
                  <el-col :span="6">
                    <el-select v-model="filterType" placeholder="按申请类型筛选" clearable style="width: 100%;">
                      <el-option label="签名" value="签名" />
                      <el-option label="确权" value="确权" />
                      <el-option label="仲裁" value="仲裁" />
                    </el-select>
                  </el-col>
                  <!-- 新增的状态筛选框 -->
                  <el-col :span="6">
                    <el-select
                        v-model="filterStatus"
                        placeholder="按状态筛选"
                        clearable
                        style="width: 100%;"
                        :disabled="!filterType"
                    >
                      <el-option
                          v-for="status in statusOptions"
                          :key="status"
                          :label="status"
                          :value="status"
                      />
                    </el-select>
                  </el-col>
                  <el-col :span="12">
                    <el-date-picker
                        v-model="filterDateRange"
                        type="datetimerange"
                        range-separator="至"
                        start-placeholder="开始日期"
                        end-placeholder="结束日期"
                        format="YYYY-MM-DD HH:mm:ss"
                        value-format="YYYY-MM-DD HH:mm:ss"
                        style="width: 100%;"
                        clearable
                    />
                  </el-col>
                </el-row>
                <!-- ^--- 修改此处的布局和内容 ---^ -->
                <el-divider />
                <div class="table-container">
                  <el-table height="66vh" :data="paginatedData" border style="width: 100%" :header-cell-style="{'text-align': 'center'}">
                    <el-table-column prop="applicationTime" label="申请时间" align="center" width = "165" :show-overflow-tooltip="true"/>
                    <el-table-column prop="applicationType" label="申请类型" align="center" width = "85"/>
                    <el-table-column label="状态" align="center">
                      <template #default="scope">
                        <div class="status-cell">
                          <span>{{ scope.row.status }}</span>
                          <el-icon v-if="scope.row.status.includes('未通过')|| scope.row.status.includes('失败')" class="status-icon error"><CircleCloseFilled /></el-icon>
                          <el-icon v-else-if="scope.row.status.includes('已') || scope.row.status.includes('成功') || scope.row.status.includes('完成')" class="status-icon success"><CircleCheckFilled /></el-icon>
                          <el-icon v-else style="margin-left: 8px;"><Clock /></el-icon>
                        </div>
                        <el-button
                            link
                            type="primary"
                            size="small"
                            @click="openProcessDialog(scope.row)"
                            class="action-btn"
                            :disabled="isProcessDisabled(scope.row)"
                        >
                          查看详细流程
                        </el-button>
                      </template>
                    </el-table-column>
                    <el-table-column  prop="text" label="申请内容" width = "200" >
                      <template #default="scope">
                        <div v-if="scope.row.applicationType === '签名'" class="application-content">
                          <div class="content-text">需求：{{ scope.row.text }}</div>
                          <div class="content-date">授权结束时间：{{ scope.row.authEndTime || '未知' }}</div>
                        </div>
                        <div v-if="scope.row.applicationType === '确权'" class="application-content">
                          <div class="content-text">需求：对任务ID为 {{ scope.row.text }} ，文件名为"{{ scope.row.fileName }}"的流转数据进行确权</div>
                        </div>
                        <div v-if="scope.row.applicationType === '仲裁'" class="application-content">
                          <div class="content-text">需求：对任务ID为 {{ scope.row.text }} ，文件名为"{{ scope.row.fileName }}"的流转数据进行仲裁</div>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column label="其他" align="center" width = "70" >
                      <template #default="scope">

                        <el-tooltip
                            :disabled="!isDownloadDisabled(scope.row)"
                            :content="downloadTooltipContent(scope.row)"
                            placement="top"
                        >
                          <el-button
                              v-if="scope.row.explanation === '已允许下载该数据' || scope.row.explanation === '不允许下载该数据'"
                              link
                              type="primary"
                              size="small"
                              :disabled="isDownloadDisabled(scope.row)"
                              @click="Download(scope.row)"
                              class="action-btn"
                          >
                            下载
                          </el-button>
                          <el-button
                              v-else
                              link
                              type="primary"
                              size="small"
                              :disabled="!scope.row.explanation || scope.row.explanation === ''"
                              @click="openDialog(scope.row.explanation)"
                              class="action-btn"
                          >
                            详情
                          </el-button>
                        </el-tooltip>

                      </template>
                    </el-table-column>
                  </el-table>
                </div>

                <!-- 分页控件 -->
                <el-pagination
                    background
                    layout="prev, pager, next"
                    :total="filteredData.length"
                    :page-size="pageSize"
                    v-model:currentPage="currentPage"
                    class="pagination"
                />
              </el-card>
              <!-- 对话框 -->
              <el-dialog title="详细信息"  v-model="dialogVisible" :width="isMobile ? '90%' : '30%'" custom-class="detail-dialog">
                <p>{{ dialogContent }}</p>
                <template #footer>
                  <el-button @click="dialogVisible = false">关闭</el-button>
                </template>
              </el-dialog>
              <!-- 流程状态对话框 -->
              <el-dialog title="详细流程" v-model="processDialogVisible" :width="isMobile ? '90%' : '40%'" custom-class="process-dialog">
                <div v-loading="processDialogLoading" style="min-height: 200px;">
                  <el-timeline v-if="processDialogContent.length > 0">
                    <el-timeline-item
                        v-for="(activity, index) in processDialogContent"
                        :key="index"
                    >
                      <template #dot>
                        <div class="tl-dot">
                          <el-icon :size="20" :color="getIconColor(activity.status)">
                            <component :is="getIconForStatus(activity.status)" :class="{ 'is-loading': activity.status === 'in_progress' }" />
                          </el-icon>
                        </div>
                      </template>
                      {{ getContentForActivity(activity) }}
                    </el-timeline-item>
                  </el-timeline>
                  <el-empty v-else description="暂无流程信息" />
                </div>
                <template #footer>
                  <el-button @click="processDialogVisible = false">关闭</el-button>
                </template>
              </el-dialog>
            </el-col>
            <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
              <!-- 按钮卡片，点击按钮后隐藏 -->
              <el-card v-if="!formSelected"
                       class="form-select-card"
                       :class="{ 'mobile-form-card': isMobile }"
              >

                <!-- 按钮排列 -->
                <div class="form-btn-wrapper">
                  <el-row :gutter="20" type="flex" justify="center">
                    <el-col :span="24">
                      <el-button type="primary" @click="showForm('签名')" class="form-select-btn">
                        <span class="btn-icon">✍️</span>
                        <span class="btn-text">数据申请</span>
                      </el-button>
                    </el-col>
                  </el-row>
                  <el-row :gutter="20" type="flex" justify="center">
                    <el-col :span="24">
                      <el-button type="primary" @click="showForm('确权')" class="form-select-btn">
                        <span class="btn-icon">🔍</span>
                        <span class="btn-text">确权申请</span>
                      </el-button>
                    </el-col>
                  </el-row>
                  <el-row :gutter="20" type="flex" justify="center">
                    <el-col :span="24">
                      <el-button type="primary" @click="showForm('仲裁')" class="form-select-btn">
                        <span class="btn-icon">⚖️</span>
                        <span class="btn-text">仲裁申请</span>
                      </el-button>
                    </el-col>
                  </el-row>
                </div>
              </el-card>


              <!-- 根据选择显示对应的表单卡片 -->

              <el-card v-if="formSelected" class="form-card"
                       :class="{ 'mobile-form-card': isMobile }" >
                <el-button
                    type="text"
                    class="close-form-btn"
                    @click="formSelected = false"
                >×</el-button>

                <!-- 根据选择的表单类型显示不同的内容 -->
                <div v-if="selectedForm === '签名'" class="form-content">
                  <div class = "sign">
                    提交签名申请
                  </div>
                  <el-divider />
                  <el-form>
                    <el-form-item label="选择数据提供方：" :rules="{required: true}">
                      <el-select placeholder="请选择" v-model="formData.dataUser" class="form-input">
                        <!-- 动态生成选项 -->
                        <el-option
                            v-for="username in options"
                            :key="username"
                            :label="username"
                            :value="username"
                        />
                      </el-select>

                    </el-form-item>
                    <el-form-item :rules="{required: true}">
                      <el-input class="form-textarea" type="textarea" :rows="10" placeholder="说明此次申请具体要求，包括申请的数据、数据产生的时间、数据的有效期限等"  v-model="formData.text"/>
                    </el-form-item>
                    <el-divider />
                  </el-form>

                  <el-row class="form-actions">
                    <el-col :span="24" class="btn-sr">
                      <el-button type="primary" @click="onSubmit(formData, username); onReset();" class="submit-btn">提交</el-button>
                      <el-button @click="onReset()" class="reset-btn">重置</el-button>
                    </el-col>
                  </el-row>
                </div>

                <div v-else-if="selectedForm === '确权'" class="form-content">
                  <!-- 确权申请表单内容 -->
                  <div class = "sign">
                    提交确权申请
                  </div>
                  <el-divider />
                  <el-form>
                    <el-form-item label="输入要确权的任务ID：" :rules="{required: true}">
                      <el-input v-model="taskId" class="form-input"/>
                    </el-form-item>
                    <el-divider />
                  </el-form>

                  <el-row class="form-actions">
                    <el-col :span="24" class="btn-sr">
                      <el-button type="primary" @click="onSubmit1(taskId, '确权',username); onReset1();" class="submit-btn">提交</el-button>
                      <el-button @click="onReset1()">重置</el-button>
                    </el-col>
                  </el-row>
                </div>
                <div v-else-if="selectedForm === '仲裁'" class="form-content">
                  <!-- 仲裁申请表单内容 -->
                  <div class = "sign">
                    提交仲裁申请
                  </div>
                  <el-divider />
                  <el-form>
                    <el-form-item label="输入要仲裁的任务ID：" :rules="{required: true}">
                      <el-input v-model="taskId" class="form-input"/>
                    </el-form-item>
                    <el-divider />
                  </el-form>

                  <el-row class="form-actions">
                    <el-col :span="24" class="btn-sr">
                      <el-button type="primary" @click="onSubmit1(taskId, '仲裁',username); onReset1();" class="submit-btn">提交</el-button>
                      <el-button @click="onReset1()" class="reset-btn">重置</el-button>
                    </el-col>
                  </el-row>
                </div>
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