<template>
  <div class="login-wrapper">
    <!-- 动态背景层 -->
    <div class="aurora-bg">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>

    <!-- 注册卡片 -->
    <div class="login-container animate-entry">
      <div class="brand-header">
        <div class="logo-box register-theme">
          <el-icon :size="36" class="logo-icon"><Trophy /></el-icon>
        </div>
        <div class="text-group">
          <h1 class="brand-title">加入 FitLife</h1>
          <p class="brand-slogan">开启您的智能健康之旅</p>
        </div>
      </div>

      <div class="glass-card">
        <h2 class="welcome-text">创建账号</h2>
        <p class="welcome-sub">填写基本信息以完成注册</p>

        <el-form :model="form" class="login-form" @submit.prevent="handleRegister">
          <div class="input-group">
            <el-form-item>
              <el-input 
                v-model="form.username" 
                placeholder="用户名" 
                :prefix-icon="User"
                class="modern-input"
                @keyup.enter="emailInput?.focus()"
              />
            </el-form-item>

            <el-form-item>
              <el-input 
                v-model="form.email" 
                placeholder="电子邮箱 (可选)" 
                :prefix-icon="Message"
                class="modern-input"
                ref="emailInput"
                @keyup.enter="passwordInput?.focus()"
              />
            </el-form-item>
            
            <el-form-item>
              <el-input 
                v-model="form.password" 
                type="password" 
                placeholder="设置密码" 
                show-password 
                :prefix-icon="Lock"
                class="modern-input"
                ref="passwordInput"
                @keyup.enter="confirmPasswordInput?.focus()"
              />
            </el-form-item>

             <el-form-item>
              <el-input 
                v-model="form.confirmPassword" 
                type="password" 
                placeholder="确认密码" 
                show-password 
                :prefix-icon="CircleCheck"
                class="modern-input"
                ref="confirmPasswordInput"
                @keyup.enter="handleRegister"
              />
            </el-form-item>
          </div>

          <div class="actions">
            <el-button 
              type="primary" 
              @click="handleRegister" 
              :loading="loading" 
              class="login-btn register-btn"
              round
            >
              注 册
              <el-icon class="el-icon--right"><ArrowRight /></el-icon>
            </el-button>
          </div>

          <div class="footer-links">
            <span>已有账号?</span>
            <router-link to="/login" class="register-link">立即登录</router-link>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { User, Lock, Trophy, ArrowRight, Message, CircleCheck } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const emailInput = ref(null)
const passwordInput = ref(null)
const confirmPasswordInput = ref(null)

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
    ElMessage.success({
      message: '注册成功，欢迎加入 FitLife！',
      type: 'success',
      duration: 3000
    })
    router.push('/login')
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '注册失败，请稍后再试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 容器与布局 - 保持与 Login.vue 一致 */
.login-wrapper {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-x: hidden;
  background: #0f172a;
  font-family: 'Plus Jakarta Sans', sans-serif;
  padding: 40px 0; /* 注册页表单较长，增加垂直边距 */
}

/* 极光背景动画 */
.aurora-bg {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 0;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: float 20s infinite ease-in-out;
}

.orb-1 {
  width: 400px; height: 400px;
  background: linear-gradient(135deg, #00b894, #55efc4); /* 注册页主色调微调为绿/青色 */
  top: -100px; left: -100px;
  animation-delay: 0s;
}

.orb-2 {
  width: 300px; height: 300px;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  bottom: -50px; right: -50px;
  animation-delay: -5s;
}

.orb-3 {
  width: 200px; height: 200px;
  background: linear-gradient(135deg, #fdcb6e, #ffeaa7);
  top: 40%; left: 40%;
  transform: translate(-50%, -50%);
  animation-delay: -10s;
  opacity: 0.4;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

/* 内容区 */
.login-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.animate-entry {
  animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 品牌头部 */
.brand-header {
  display: flex;
  align-items: center;
  gap: 15px;
  padding-left: 10px;
}

.logo-box {
  width: 50px; height: 50px;
  background: linear-gradient(135deg, #fff, #dfe6e9);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  color: #00b894;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}
.logo-box.register-theme { color: #00b894; }

.text-group { color: white; }
.brand-title { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
.brand-slogan { margin: 0; font-size: 13px; opacity: 0.8; font-weight: 500; }

/* 玻璃卡片 */
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  padding: 35px 30px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.15);
}

.welcome-text {
  margin: 0 0 5px;
  color: white;
  font-size: 26px;
  font-weight: 700;
}

.welcome-sub {
  margin: 0 0 25px;
  color: rgba(255,255,255,0.6);
  font-size: 14px;
}

/* 表单样式 */
.input-group {
  display: flex; flex-direction: column; gap: 0; margin-bottom: 20px;
}

/* 覆盖 Element Plus 输入框样式 */
.modern-input :deep(.el-input__wrapper) {
  background: rgba(0, 0, 0, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: none !important;
  border-radius: 16px;
  padding: 8px 15px;
  transition: all 0.3s;
}

.modern-input :deep(.el-input__inner) {
  color: white;
  height: 40px;
  font-size: 15px;
}
.modern-input :deep(.el-input__inner)::placeholder {
  color: rgba(255,255,255,0.4);
}

.modern-input :deep(.el-input__wrapper.is-focus) {
  background: rgba(0, 0, 0, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  box-shadow: 0 0 15px rgba(255,255,255,0.1) !important;
}

.modern-input :deep(.el-input__icon) {
  color: rgba(255,255,255,0.7);
}

/* 按钮样式 */
.login-btn {
  width: 100%;
  height: 50px;
  background: white;
  color: #6c5ce7;
  font-size: 16px;
  font-weight: 800;
  border: none;
  transition: all 0.3s;
}
.register-btn { color: #00b894; }

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(255,255,255,0.2);
  background: #f8f9fa;
}

.login-btn:active {
  transform: scale(0.98);
}

/* 底部链接 */
.footer-links {
  margin-top: 25px;
  text-align: center;
  font-size: 14px;
  color: rgba(255,255,255,0.6);
}

.register-link {
  color: white;
  font-weight: 700;
  text-decoration: none;
  margin-left: 8px;
  position: relative;
}

.register-link::after {
  content: '';
  position: absolute; bottom: -2px; left: 0; width: 0%; height: 2px;
  background: #fff;
  transition: width 0.3s;
}

.register-link:hover::after {
  width: 100%;
}

@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 适配小屏幕 */
@media (max-width: 480px) {
  .login-wrapper { padding: 20px 0; }
  .login-container { max-width: 100%; }
}
</style>