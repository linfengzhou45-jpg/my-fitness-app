<template>
  <div class="auth-container">
    <!-- 装饰背景圆 (位置稍微错开一点，增加变化) -->
    <div class="bg-circle circle-1"></div>
    <div class="bg-circle circle-2"></div>

    <div class="auth-content">
      <div class="brand-section">
        <div class="logo-circle">
          <el-icon :size="40" color="#fff"><Trophy /></el-icon>
        </div>
        <h1 class="app-title">加入我们</h1>
        <p class="app-subtitle">开启您的健康之旅</p>
      </div>

      <el-card class="auth-card">
        <template #header>
          <div class="card-header">
            <h3>创建账号</h3>
            <p class="login-tip">填写以下信息完成注册</p>
          </div>
        </template>
        <el-form :model="form" size="large" @submit.prevent="handleRegister">
          <el-form-item>
            <el-input 
              v-model="form.username" 
              placeholder="用户名" 
              :prefix-icon="User"
            />
          </el-form-item>
          <el-form-item>
            <el-input 
              v-model="form.email" 
              placeholder="电子邮箱 (可选)" 
              :prefix-icon="Message"
            />
          </el-form-item>
          <el-form-item>
            <el-input 
              v-model="form.password" 
              type="password" 
              placeholder="设置密码" 
              show-password 
              :prefix-icon="Lock"
            />
          </el-form-item>
          <el-form-item>
            <el-input 
              v-model="form.confirmPassword" 
              type="password" 
              placeholder="确认密码" 
              show-password 
              :prefix-icon="CircleCheck"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleRegister" :loading="loading" class="submit-btn" round>
              立即注册
            </el-button>
          </el-form-item>
          <div class="auth-links">
            <span>已有账号? <router-link to="/login" class="link-text">直接登录</router-link></span>
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
import { User, Message, Lock, CircleCheck, Trophy } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const handleRegister = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  if (form.password !== form.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  
  loading.value = true
  try {
    await userStore.register({
        username: form.username,
        password: form.password,
        email: form.email
    })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '注册失败')
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
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow: hidden;
  padding: 20px; /* 防止小屏幕贴边 */
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
  width: 350px;
  height: 350px;
  background: #67c23a; /* 注册页用一点绿色呼应 */
  top: -80px;
  left: -80px;
}
.circle-2 {
  width: 450px;
  height: 450px;
  background: #409eff;
  bottom: -120px;
  right: -120px;
}

.auth-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 25px;
  animation: slideUp 0.6s ease-out;
  width: 100%;
  max-width: 420px;
}

.brand-section {
  text-align: center;
}

.logo-circle {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #67c23a 0%, #409eff 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  box-shadow: 0 8px 20px rgba(103, 194, 58, 0.4);
}

.app-title {
  font-size: 26px;
  color: #303133;
  margin: 0 0 5px;
  font-weight: 700;
}

.app-subtitle {
  font-size: 13px;
  color: #606266;
  margin: 0;
  letter-spacing: 1px;
}

.auth-card {
  width: 100%;
  border: none;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.card-header {
  text-align: center;
  padding: 5px 0 0;
}

.card-header h3 {
  margin: 0 0 5px;
  font-size: 20px;
  color: #303133;
}

.login-tip {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.submit-btn {
  width: 100%;
  font-weight: bold;
  height: 44px;
  font-size: 16px;
  margin-top: 5px;
  background: linear-gradient(90deg, #67c23a 0%, #409eff 100%);
  border: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(103, 194, 58, 0.3);
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
</style>