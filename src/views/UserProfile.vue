<template>
  <div class="profile-container animate-fade-in">
    <!-- Header Section -->
    <div class="profile-header">
        <el-upload
            class="avatar-uploader"
            action="/api/upload"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
            :headers="{ Authorization: `Bearer ${userStore.token}` }"
        >
            <div v-if="userStore.avatar" class="avatar-wrapper has-img">
                <img :src="userStore.avatar" class="avatar" />
            </div>
            <div v-else class="avatar-wrapper animate-pop-in">
                <el-icon :size="40" color="#fff"><UserFilled /></el-icon>
            </div>
        </el-upload>
        
        <div class="header-info">
            <h2>{{ form.name || '健身达人' }}</h2>
            <div v-if="isEditingMotto" class="motto-edit">
                <el-input 
                    v-model="tempMotto" 
                    size="small" 
                    @blur="saveMotto" 
                    @keyup.enter="saveMotto"
                    ref="mottoInput"
                />
            </div>
            <p v-else @click="startEditMotto" class="motto-text">
                {{ userStore.motto || '致力于更健康的自己' }} <el-icon><Edit /></el-icon>
            </p>
        </div>
    </div>

    <!-- Content Form -->
    <div class="form-sections">
        <!-- Basic Info Card -->
        <el-card class="modern-card section-card" shadow="hover">
            <template #header>
                <div class="section-header">
                    <el-icon class="section-icon"><Postcard /></el-icon>
                    <span>基本资料</span>
                </div>
            </template>
            <el-form :model="form" label-position="top" class="custom-form">
                 <el-form-item label="昵称">
                    <el-input v-model="form.name" placeholder="您的称呼" />
                </el-form-item>

                <el-form-item label="性别">
                    <el-radio-group v-model="form.gender" fill="#409eff">
                        <el-radio-button label="male">男</el-radio-button>
                        <el-radio-button label="female">女</el-radio-button>
                    </el-radio-group>
                </el-form-item>

                <el-row :gutter="20">
                    <el-col :span="12" :xs="24">
                        <el-form-item label="年龄">
                            <el-input-number v-model="form.age" :min="10" :max="100" style="width: 100%" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" :xs="24">
                        <el-form-item label="身高 (cm)">
                            <el-input-number v-model="form.height" :min="100" :max="250" style="width: 100%" />
                        </el-form-item>
                    </el-col>
                </el-row>
                
                <el-row :gutter="20">
                    <el-col :span="12" :xs="24">
                       <el-form-item label="体重 (kg)">
                        <el-input-number v-model="form.weight" :min="30" :max="200" :precision="1" style="width: 100%" />
                      </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
        </el-card>

        <!-- Fitness Goals Card -->
        <el-card class="modern-card section-card" shadow="hover">
             <template #header>
                <div class="section-header">
                    <el-icon class="section-icon"><Aim /></el-icon>
                    <span>健身目标</span>
                </div>
            </template>
            <el-form :model="form" label-position="top" class="custom-form">
                 <el-form-item label="当前阶段">
                    <el-select v-model="form.goal" placeholder="选择目标" style="width: 100%">
                        <el-option label="🔥 减脂 (Cut)" value="cut" />
                        <el-option label="⚖️ 维持 (Maintain)" value="maintain" />
                        <el-option label="💪 增肌 (Bulk)" value="bulk" />
                    </el-select>
                </el-form-item>

                <el-form-item label="每日热量目标 (kcal)">
                    <div style="display: flex; flex-direction: column; width: 100%;">
                        <el-input-number 
                            v-model="form.customCalories" 
                            :min="0" 
                            :step="50"
                            placeholder="留空则自动计算"
                            style="width: 100%" 
                        />
                        <div class="sub-label" style="color: #909399; font-size: 12px; margin-top: 5px;">
                            系统推荐值: <span style="color: #409eff; font-weight: bold;">{{ systemRecCalories }}</span> kcal 
                            (输入 0 或留空以使用推荐值)
                        </div>
                    </div>
                </el-form-item>

                <el-form-item label="每周训练频率 (保守估算)">
                    <el-select v-model="form.activityLevel" placeholder="选择每周运动天数" style="width: 100%">
                        <el-option label="🛌 几乎不运动 (久坐办公)" :value="1.2" />
                        <el-option label="🧘 每周练 1 次" :value="1.25" />
                        <el-option label="🏃 每周练 2 次" :value="1.3" />
                        <el-option label="🏃 每周练 3 次" :value="1.35" />
                        <el-option label="🏋️ 每周练 4 次" :value="1.4" />
                        <el-option label="🏋️ 每周练 5 次" :value="1.45" />
                        <el-option label="🔥 每周练 6 次" :value="1.5" />
                        <el-option label="🏆 天天练 (高强度)" :value="1.55" />
                    </el-select>
                </el-form-item>

                <el-form-item label="过敏/忌口">
                    <el-select
                        v-model="form.allergies"
                        multiple
                        filterable
                        allow-create
                        default-first-option
                        placeholder="输入或选择..."
                        style="width: 100%"
                    >
                        <el-option label="花生" value="peanuts" />
                        <el-option label="海鲜" value="seafood" />
                        <el-option label="乳制品" value="dairy" />
                        <el-option label="麸质" value="gluten" />
                    </el-select>
                </el-form-item>
            </el-form>
        </el-card>

        <div class="action-area">
             <el-button type="primary" size="large" round class="save-btn" @click="saveProfile" :icon="Check">
                保存修改
             </el-button>
             
             <el-button type="danger" plain size="large" round class="logout-btn" @click="handleLogout" :icon="Back">
                退出登录
             </el-button>
        </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, Postcard, Aim, Check, Edit, Back } from '@element-plus/icons-vue'
import { compressImage } from '../utils/compress'

const userStore = useUserStore()
const router = useRouter()
const form = reactive({ ...userStore.profile })

// Motto State
const isEditingMotto = ref(false)
const tempMotto = ref('')
const mottoInput = ref(null)

const systemRecCalories = computed(() => {
    // Replicate store logic for display only (using form values for real-time feedback)
    if (!form.weight || !form.height || !form.age) return 0
    let base = 10 * form.weight + 6.25 * form.height - 5 * form.age
    const bmr = form.gender === 'male' ? base + 5 : base - 161
    const tdee = Math.round(bmr * (form.activityLevel || 1.2))
    
    switch (form.goal) {
      case 'cut': return Math.round(tdee * 0.8);
      case 'bulk': return Math.round(tdee * 1.1);
      default: return tdee;
    }
})

onMounted(() => {
    Object.assign(form, userStore.profile)
})

function saveProfile() {
  userStore.updateProfile(form)
  ElMessage.success('个人资料已更新')
}

// Logout Logic
function handleLogout() {
  ElMessageBox.confirm(
    '确定要退出登录吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      round: true
    }
  ).then(() => {
    userStore.logout()
    ElMessage.success('已成功退出')
    router.push('/login')
  }).catch(() => {})
}

// Avatar Logic
function handleAvatarSuccess(res) {
    userStore.updateAvatar(res.url)
    ElMessage.success('头像上传成功')
}

function beforeAvatarUpload(rawFile) {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('Avatar picture must be JPG or PNG format!')
    return false
  } 
  
  // Always compress to ensure small base64 string
  return compressImage(rawFile, 300, 0.7).then(compressedFile => {
      // Check size again just in case, but it should be small now
      if (compressedFile.size / 1024 / 1024 > 5) {
           ElMessage.error('图片即使压缩后仍过大，请更换图片')
           return false
      }
      return compressedFile
  }).catch(err => {
      console.error(err)
      ElMessage.error('图片处理失败')
      return false
  })
}

// Motto Logic
function startEditMotto() {
    tempMotto.value = userStore.motto
    isEditingMotto.value = true
    nextTick(() => {
        mottoInput.value?.focus()
    })
}

function saveMotto() {
    if (tempMotto.value.trim()) {
        userStore.updateMotto(tempMotto.value)
    }
    isEditingMotto.value = false
}
</script>

<style scoped>
.profile-container {
    padding-bottom: 80px; /* Spacing for bottom nav */
    max-width: 800px;
    margin: 0 auto;
}

/* Header */
.profile-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px 20px;
    background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
    border-radius: 0 0 24px 24px;
    color: white;
    margin-bottom: 30px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(161, 140, 209, 0.4);
}
.avatar-wrapper {
    width: 80px;
    height: 80px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(5px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid rgba(255, 255, 255, 0.5);
    margin-bottom: 15px;
    overflow: hidden;
    cursor: pointer;
}
.avatar { width: 100%; height: 100%; object-fit: cover; }
.header-info h2 { margin: 0 0 5px; font-size: 24px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.motto-text { margin: 0; font-size: 14px; opacity: 0.9; cursor: pointer; display: flex; align-items: center; gap: 5px; }
.motto-text:hover { opacity: 1; text-decoration: underline; }
.motto-edit { width: 200px; }

/* Form Sections */
.form-sections {
    padding: 0 15px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.modern-card {
    border: none;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
}

.section-header {
    display: flex;
    align-items: center;
    font-weight: bold;
    font-size: 16px;
    color: #2c3e50;
}
.section-icon { margin-right: 8px; font-size: 18px; color: #409eff; }

.custom-form :deep(.el-form-item__label) {
    font-weight: 500;
    color: #606266;
}

.action-area {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}
.save-btn, .logout-btn {
    width: 100%;
    max-width: 300px;
    font-weight: bold;
}
.save-btn {
    box-shadow: 0 4px 15px rgba(64, 158, 255, 0.3);
}
.logout-btn {
    margin-left: 0 !important; /* Reset Element Plus margin */
    border-style: dashed;
}

/* Animations */
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
.animate-pop-in { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes popIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
</style>