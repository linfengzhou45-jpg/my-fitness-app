<template>
  <div class="auth-container">
    <!-- 装饰背景圆 -->
    <div class="bg-circle circle-1"></div>
    <div class="bg-circle circle-2"></div>

    <div class="auth-content">
      <div class="brand-section">
        <div class="logo-circle">
          <el-icon :size="40" color="#fff"><Trophy /></el-icon>
        </div>
        <h1 class="app-title">健身饮食管家</h1>
        <p class="app-subtitle">Fitness & Diet Manager</p>
      </div>

      <el-card class="auth-card">
        <template #header>
          <div class="card-header">
            <h3>欢迎回来</h3>
            <p class="login-tip">请登录您的账号以继续</p>
          </div>
        </template>
        <el-form :model="form" size="large" @submit.prevent="handleLogin">
          <el-form-item>
            <el-input 
              v-model="form.username" 
              placeholder="用户名" 
              :prefix-icon="User"
            />
          </el-form-item>
          <el-form-item>
            <el-input 
              v-model="form.password" 
              type="password" 
              placeholder="密码" 
              show-password 
              :prefix-icon="Lock"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleLogin" :loading="loading" class="submit-btn" round>
              立即登录
            </el-button>
          </el-form-item>
          <div class="auth-links">
            <span>还没有账号? <router-link to="/register" class="link-text">立即注册</router-link></span>
          </div>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { User, Lock, Trophy } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const handleLogin = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  
  loading.value = true
  try {
    await userStore.login(form)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow: hidden;
}

/* 动态背景装饰 */
.bg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.6;
  z-index: 0;
}
.circle-1 {
  width: 300px;
  height: 300px;
  background: #409eff;
  top: -50px;
  right: -50px;
}
.circle-2 {
  width: 400px;
  height: 400px;
  background: #67c23a;
  bottom: -100px;
  left: -100px;
}

.auth-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  animation: slideUp 0.6s ease-out;
}

.brand-section {
  text-align: center;
}

.logo-circle {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.4);
}

.app-title {
  font-size: 28px;
  color: #303133;
  margin: 0 0 5px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.app-subtitle {
  font-size: 14px;
  color: #606266;
  margin: 0;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.auth-card {
  width: 380px;
  border: none;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.card-header {
  text-align: center;
  padding: 10px 0 0;
}

.card-header h3 {
  margin: 0 0 8px;
  font-size: 22px;
  color: #303133;
}

.login-tip {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.submit-btn {
  width: 100%;
  font-weight: bold;
  height: 44px;
  font-size: 16px;
  margin-top: 10px;
  background: linear-gradient(90deg, #409eff 0%, #3a8ee6 100%);
  border: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.3);
}

.auth-links {
  text-align: center;
  font-size: 14px;
  color: #606266;
  margin-top: 5px;
}

.link-text {
  color: #409eff;
  text-decoration: none;
  font-weight: 600;
  margin-left: 5px;
  transition: color 0.2s;
}

.link-text:hover {
  color: #66b1ff;
  text-decoration: underline;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式调整 */
@media (max-width: 480px) {
  .auth-card {
    width: 90%;
    margin: 0 20px;
  }
}
</style>