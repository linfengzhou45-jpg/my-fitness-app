<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from './stores/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isMobile = ref(false)

const updateIsMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
})

const showLayout = computed(() => {
  return !['Login', 'Register'].includes(route.name)
})

const handleLogout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<template>
  <div v-if="!showLayout" class="full-height">
    <router-view />
  </div>
  
  <el-container v-else class="layout-container">
    <!-- Desktop Sidebar -->
    <el-aside v-if="!isMobile" width="200px">
      <el-menu
        router
        :default-active="$route.path"
        class="el-menu-vertical-demo"
        background-color="#545c64"
        text-color="#fff"
        active-text-color="#ffd04b"
      >
        <el-menu-item index="/">
          <el-icon><DataLine /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/diet">
          <el-icon><Food /></el-icon>
          <span>饮食记录</span>
        </el-menu-item>
        <el-menu-item index="/profile">
          <el-icon><User /></el-icon>
          <span>个人档案</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header>
        <div class="header-content">
          <h2>健身饮食管理系统</h2>
          <el-button type="danger" size="small" @click="handleLogout">
             {{ isMobile ? '退出' : '退出登录' }}
          </el-button>
        </div>
      </el-header>
      
      <el-main :class="{ 'mobile-main': isMobile }">
        <router-view />
      </el-main>

      <!-- Mobile Bottom Nav -->
      <div v-if="isMobile" class="mobile-nav">
        <el-menu
          router
          :default-active="$route.path"
          mode="horizontal"
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#ffd04b"
          class="mobile-menu"
        >
          <el-menu-item index="/" style="flex: 1">
            <el-icon><DataLine /></el-icon>
            <span class="mobile-label">仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/diet" style="flex: 1">
            <el-icon><Food /></el-icon>
            <span class="mobile-label">饮食</span>
          </el-menu-item>
          <el-menu-item index="/profile" style="flex: 1">
             <el-icon><User /></el-icon>
            <span class="mobile-label">我的</span>
          </el-menu-item>
        </el-menu>
      </div>
    </el-container>
  </el-container>
</template>

<style>
body {
  margin: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}
.layout-container {
  height: 100vh;
}
.full-height {
  height: 100vh;
}
.el-menu-vertical-demo {
  height: 100%;
  border-right: none;
}
.el-header {
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  padding: 0 15px; /* Adjust padding for mobile */
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.header-content h2 {
    font-size: 18px; /* Slightly smaller for mobile */
}
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  border-top: 1px solid #eee;
}
.mobile-menu {
  display: flex;
  justify-content: space-around;
  border-bottom: none !important;
}
.mobile-main {
  padding-bottom: 70px !important; /* Make space for bottom nav */
}
.mobile-label {
    font-size: 12px;
    margin-left: 0 !important;
    display: block;
    line-height: 1.2;
    margin-top: -5px;
}
/* Adjust element plus menu item for mobile */
.mobile-nav .el-menu-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60px;
    padding: 0 !important;
}
.mobile-nav .el-icon {
    margin-right: 0 !important;
    font-size: 20px;
    margin-bottom: 2px;
}
</style>