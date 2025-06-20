<!--Examine1.vue-->
<script setup>
import { ref, computed, onMounted, h, onBeforeUnmount, nextTick } from 'vue'
import {handleCommand, handleSelect} from '@/router.js'
import {
  onSubmit,
  addMember,
  fetchApplications,
  encryptCsvFileWithProgress,
  fetchFiles, onReject,
} from '@/service/Examine1Service.js'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { useMenu } from '@/service/useMenu.js'
import { jwtDecode } from 'jwt-decode'
import {Expand, Fold} from "@element-plus/icons-vue";
const activeMenu = ref('4');
const token = sessionStorage.getItem('authToken');
const decoded = jwtDecode(token);  // 解析 JWT Token
const username = decoded.sub;
const userRole = decoded.role;  // 获取当前用户角色
const formData = ref({
  signer: {
    members: []
  },
  selectFile: '',
  taskType: '签名',
  status:'',
  username:'',
  applicationId:'',
  usagePolicy:'',
  authEndTime: '', // 授权结束时间字段(重命名)
});

const files = ref([]);

// 分页相关数据
let tableData = ref([]);
const currentPage = ref(1); // 当前页
const pageSize = ref(6); // 每页显示条数
const fileName = ref();
const fileOutline = ref();

// 计算分页后的数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return tableData.value.slice(start, end);
});

onMounted(async () => {
  tableData.value = await fetchApplications(username);
  files.value = await fetchFiles(username);
  const messages = JSON.parse(sessionStorage.getItem('reloadMessages') || '[]');
  messages.forEach(msg => {
    ElMessage[msg.type](msg.message);
  });
  sessionStorage.removeItem('reloadMessages'); // 显示后清除
});

// 用户角色对应的可访问菜单项
const { availableMenus } = useMenu(userRole);

// 控制详情卡片显示
const isCardVisible = ref(false);
const selectedRow = ref(null); // 存储被点击行的数据

// 点击处理按钮时触发，显示详情卡片并存储当前行的数据
const showDetails = (row) => {
  selectedRow.value = row;
  isCardVisible.value = true; // 设置为 true 显示详情卡片
};

const memberSearch = ref(null);

// 删除成员
const removeMember = (member) => {
  console.log(formData.value.signer.members);
  const index = formData.value.signer.members.findIndex(m => m.username === member.username);
  if (index !== -1) {
    formData.value.signer.members.splice(index, 1);
  }
};


// 控制进度条状态
const isProcessing = ref(false);
const progress = ref(0);
const showUpload = ref(false);

// 存储选择的文件
const selectedFile = ref(null);


// 文件选择
const handleBeforeUpload = (file) => {
  // 检查文件是否存在
  if (!file) {
    ElMessage.error('请选择文件');
    return false;
  }

  // 检查文件大小是否为0
  if (file.size === 0) {
    ElMessage.error('文件内容不能为空');
    return false;
  }

  selectedFile.value = file; // 选择的文件存储
  showUpload.value = true;
  ElMessage.success('已选中数据文件');
  return false; // 阻止自动上传，等待加密后再上传
};

const estimatedTime = ref(''); // 用于存储预计剩余时间



// 加密和上传文件
const encryptAndUpload = async () => {

  if (!fileName.value) {
    ElMessage.error("还未给数据命名");
    return;
  }
  isProcessing.value = true; // 显示进度条
  const startTime = Date.now(); // 记录开始时间
  await encryptCsvFileWithProgress(
    selectedFile.value,
    startTime,
    isProcessing.value,
    showUpload.value,
    estimatedTime,
    progress,
    fileName.value,
    username,
    fileOutline.value,
  );
};

// 提示
const open = () => {
  ElNotification({
    title: '注意',
    message: h('i', { style: 'color: teal' }, '请确认文件已经成功加密上传后再点击提交'),
  })
};

// 重置表单
const onReset = () => {
  formData.value = {
    signer: {
      members: []
    },
    selectFile: null
  };
};

// 解释拒绝原因的表单
const onExplain = (id) => {
  // 使用 ElMessageBox.prompt 来提示用户输入拒绝原因
  ElMessageBox.prompt('请输入拒绝原因', '拒绝原因', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /.+/, // 确保输入不为空
    inputErrorMessage: '拒绝原因不能为空'
  }).then(async ({ value }) => {
    // 用户输入了拒绝原因并点击了确定
    ElMessage({
      type: 'success',
      message: `已提交拒绝原因: ${value}`
    });

    // 调用 onReject 函数，传入拒绝原因
    await onReject(value, id);
  }).catch(() => {
    // 用户取消了输入框
    ElMessage({
      type: 'info',
      message: '已取消操作'
    });
  });
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

const endTimePicker = ref(null);
const originalEndTime = ref(''); // 保存原始授权结束时间

const onEndPickerVisible = (visible) => {
  if (visible) {
    // 记录原始值
    originalEndTime.value = formData.value.authEndTime;
    nextTick(() => {
      // 通过 popper-class 定位到面板
      const panel = document.querySelector('.custom-end-datepicker');
      if (!panel) return;
      const nowBtn = panel.querySelector('.el-picker-panel__link-btn');
      if (nowBtn) {
        nowBtn.textContent = '取消';
        // 防止多次绑定
        nowBtn.onclick = () => {
          // 恢复原始值，关闭面板
          formData.value.authEndTime = originalEndTime.value;
          endTimePicker.value.handleClose();
        };
      }
    });
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
            <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
              <el-card class="main-card">
                <div class="sign">待处理的申请</div>
                <el-divider />
                <div class="table-container">
                  <el-table height="66vh" :data="paginatedData" border style="width: 100%" :header-cell-style="{'text-align': 'center'}">
                    <el-table-column prop="applicationTime" label="申请时间" align="center"/>
                    <el-table-column prop="id" label="申请ID" align="center"/>
                    <el-table-column prop="username" label="用户名" align="center" width="100"/>
                    <el-table-column prop="text" label="申请内容" width="300">
                      <template #default="scope">
                        <div class="application-content">
                          <div>需求：{{ scope.row.text }}</div>
                          <div>时间范围：{{ scope.row.startDate }} - {{ scope.row.endDate }}</div>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" align="center" width="100">
                      <template #default="scope">
                        <el-button type="primary" size="small" @click="open(); showDetails(scope.row)">
                          处理
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
                    class="pagination"
                />
              </el-card>
            </el-col>


            <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8" v-if="!isCardVisible">
              <el-card class="form-select-card" style="justify-content: flex-start"
                       :class="{ 'mobile-form-card': isMobile }">
                <div class="sign">上传新数据</div>
                <el-divider />
                <el-row class="form-content" :gutter="20">
                  <el-col :span="24">
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                      <!-- Dataset Name -->
                      <div style="display: flex; align-items: center;">
                        <el-col :span="6" class="label-text">数据集名称：</el-col>
                        <el-col :span="18">
                          <el-input v-model="fileName" />
                        </el-col>
                      </div>

                      <!-- Dataset Description -->
                      <div style="display: flex;">
                        <el-col :span="6" class="label-text">数据集描述：</el-col>
                        <el-col :span="18">
                          <el-input style="width: 100%;" :rows="4" type="textarea" v-model="fileOutline"/>
                        </el-col>
                      </div>
                    </div>
                  </el-col>
                </el-row>

                <!-- File upload section with proper spacing -->
                <div style="margin-top: 30px; display: flex; flex-direction: column; gap: 20px; align-items: center;">
                  <!-- File selection and upload buttons -->
                  <div style="display: flex; justify-content: center; gap: 20px; width: 100%;">
                    <el-upload
                        :before-upload="handleBeforeUpload"
                        :show-file-list="true"
                    >
                      <el-button type="primary">选择数据文件</el-button>
                    </el-upload>

                    <el-button
                        v-if="showUpload"
                        type="success"
                        @click="encryptAndUpload"
                    >
                      加密并且上传
                    </el-button>
                  </div>

                  <!-- Progress indicators -->
                  <div v-if="isProcessing && progress !== 100" style="width: 100%;">
                    <el-progress
                        :text-inside="true"
                        :stroke-width="18"
                        :percentage="progress"
                        style="width: 100%"
                    />
                    <p style="text-align: center; margin-top: 8px;">预计剩余时间：{{ estimatedTime }}</p>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8"  v-if="isCardVisible">
              <el-card class="form-card">
                <el-button
                    type="text"
                    class="close-form-btn"
                    @click="isCardVisible = false"
                >×</el-button>

                <div class="sign">{{ selectedRow?.username }}的申请</div>
                <el-divider />
                <el-form label-width="100px" >
                  <el-row class="form-content" :gutter="20">
                    <el-col :span="24">
                      <div style="display: flex; flex-direction: column; gap: 20px;">
                        <!-- 数据选择 -->
                        <div style="display: flex; align-items: center;">
                          <el-col :span="6" class="label-text">数据选择：</el-col>
                          <el-col :span="24">
                            <el-select
                                v-model="formData.selectFile"
                                style="width: 73%"
                            >
                              <el-option
                                  v-for="(file, index) in files"
                                  :key="index"
                                  :label="file"
                                  :value="file"
                              ></el-option>
                            </el-select>
                          </el-col>
                        </div>
                        <!-- 授权细则 -->
                        <div style="display: flex;">
                          <el-col :span="6" class="label-text">授权细则：</el-col>
                          <el-col :span="18" class="input-col">
                            <el-input style="height: 6vh" :rows="2" type="textarea" v-model="formData.usagePolicy"/>
                          </el-col>
                        </div>
                        <!-- 授权结束时间 -->
                        <div style="display: flex;">
                          <el-col :span="6" class="label-text">授权结束时间：</el-col>
                          <el-col :span="18" class="input-col">
                            <el-date-picker
                              ref="endTimePicker"
                              popper-class="custom-end-datepicker"
                              v-model="formData.authEndTime"
                              type="datetime"
                              placeholder="选择授权结束时间"
                              format="YYYY-MM-DD HH:mm:ss"
                              value-format="YYYY-MM-DD HH:mm:ss"
                              :show-now="true"
                              @visible-change="onEndPickerVisible"
                              :disabled-date="(time) => time.getTime() < Date.now()"
                              :disabled-time="(date) => {
                                if (date.getTime() < Date.now()) {
                                  return {
                                    hours: Array.from({ length: 24 }, (_, i) => i),
                                    minutes: Array.from({ length: 60 }, (_, i) => i),
                                    seconds: Array.from({ length: 60 }, (_, i) => i)
                                  }
                                }
                                return {
                                  hours: [],
                                  minutes: [],
                                  seconds: []
                                }
                              }"
                              style="width: 100%"
                            />
                          </el-col>
                        </div>
                        <!-- 参与成员 -->
                        <div style="display: flex;">
                          <el-col :span="6" class="label-text">参与成员：</el-col>
                          <el-col :span="15" class="input-col">
                            <el-input v-model="memberSearch" placeholder="输入用户名"></el-input>
                          </el-col>
                          <el-col :span="5" >
                            <el-button class="button-col" type="primary" @click="addMember(memberSearch, formData.signer); memberSearch = null">添加</el-button>
                          </el-col>
                        </div>
                        <!-- 参与成员部分 -->
                        <div style="height: 32vh; display: flex;" >
                          <el-table height="32vh" :data="formData.signer.members" border style="width: 100%" :header-cell-style="{'text-align': 'center'}">
                            <el-table-column prop="username" label="成员名称" align="center" />
                            <el-table-column fixed="right" label="操作" align="center">
                              <template #default="scope">
                                <el-button type="text" size="small" @click="removeMember(scope.row)">删除</el-button>
                              </template>
                            </el-table-column>
                          </el-table>
                        </div>

                      </div>
                    </el-col>
                  </el-row>



                  <el-divider />
                  <el-row class="form-actions">
                    <el-col :span="24" class="btn-sr">
                      <el-button type="primary" @click="onSubmit(formData,selectedRow.id, selectedRow.username); onReset()">提交</el-button>
                      <el-button type="danger" @click="onExplain(selectedRow.id)">拒绝</el-button>
                      <el-button @click="onReset">重置</el-button>
                    </el-col>
                  </el-row>
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