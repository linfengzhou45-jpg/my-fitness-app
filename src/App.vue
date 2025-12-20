<template>
  <!-- 全局极光背景 (仅在非登录注册页显示，因为它们自带背景) -->
  <div v-if="showLayout" class="app-aurora-bg">
      <div class="orb-global orb-1"></div>
      <div class="orb-global orb-2"></div>
      <div class="orb-global orb-3"></div>
  </div>
  
  <div class="mobile-wrapper">
      <!-- No Layout View (Login/Register) -->
      <div v-if="!showLayout" class="full-height">
        <router-view />
      </div>
      
      <!-- Main App Layout -->
      <div v-else class="app-layout">
        
        <!-- Main Content -->
        <main class="main-content">
          <!-- Mobile Header -->
          <header class="mobile-header">
             <span class="page-title">{{ $route.meta.title || 'FitLife' }}</span>
             <div class="avatar-mini" @click="$router.push('/profile')">
                 <img v-if="userStore.avatar" :src="userStore.avatar" />
                 <el-icon v-else><User /></el-icon>
             </div>
          </header>

          <div class="content-scroll">
            <router-view v-slot="{ Component }">
              <transition name="fade-slide" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </div>
        </main>

        <!-- FAB (AI Only) -->
        <div v-if="['Diet', 'Dashboard', 'Recipes'].includes($route.name)" class="fab-container animate-bounce-in">
            <el-tooltip 
                content="AI 智能分析" 
                placement="left" 
                effect="customized" 
                popper-class="glass-tooltip"
            >
                <button class="fab-btn ai-fab" @click="openAiDialog">
                    <el-icon :size="24"><MagicStick /></el-icon>
                </button>
            </el-tooltip>
        </div>

        <!-- Bottom Dock -->
        <nav class="mobile-dock">
          <router-link to="/dashboard" class="dock-item" active-class="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
          </router-link>
          <router-link to="/" class="dock-item" active-class="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
          </router-link>
          
          <!-- Center Add Button -->
          <div class="dock-indicator-wrap">
              <div class="dock-add-btn" @click="addDrawerVisible = true">
                  <el-icon :size="28"><Plus /></el-icon>
              </div>
          </div>

          <router-link to="/recipes" class="dock-item" active-class="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </router-link>
          <router-link to="/profile" class="dock-item" active-class="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </router-link>
        </nav>

        <!-- Dialogs -->
        <el-drawer v-model="addDrawerVisible" :with-header="false" direction="btt" size="auto" class="modern-drawer">
            <div class="drawer-handle"></div>
            <div class="add-options">
                <div class="option-card manual" @click="openManualAdd">
                    <div class="icon-wrap">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    </div>
                    <div class="option-text">
                        <span class="o-title">手动记录</span>
                        <span class="o-desc">快捷录入热量数据</span>
                    </div>
                </div>
                
                <div class="option-card recipes" @click="goToRecipeLibrary">
                    <div class="icon-wrap">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    </div>
                    <div class="option-text">
                        <span class="o-title">食谱库</span>
                        <span class="o-desc">发现健康饮食灵感</span>
                    </div>
                </div>
            </div>
        </el-drawer>

        <!-- Reuse Existing Dialogs with New Classes -->
        <el-dialog v-model="manualDialogVisible" :title="isEditing ? '修改食物' : '自定义食物'" width="90%" class="glass-dialog" center>
             <el-form :model="foodForm" label-position="top">
                <el-form-item label="名称">
                    <el-input v-model="foodForm.name" placeholder="例如: 燕麦拿铁" size="large" />
                </el-form-item>
                <el-form-item label="热量 (kcal)">
                    <el-input-number v-model="foodForm.calories" :min="0" style="width: 100%" size="large" />
                </el-form-item>
                <div class="macro-inputs">
                     <div class="macro-input">
                        <label>碳水</label>
                        <el-input-number v-model="foodForm.carbs" :min="0" :controls="false" />
                     </div>
                     <div class="macro-input">
                        <label>蛋白质</label>
                        <el-input-number v-model="foodForm.protein" :min="0" :controls="false" />
                     </div>
                     <div class="macro-input">
                        <label>脂肪</label>
                        <el-input-number v-model="foodForm.fat" :min="0" :controls="false" />
                     </div>
                </div>
            </el-form>
            <template #footer>
                <el-button @click="manualDialogVisible = false" size="large" round>取消</el-button>
                <el-button type="primary" :loading="isSubmitting" @click="handleManualSubmit" size="large" round>保存</el-button>
            </template>
        </el-dialog>

        <el-dialog v-model="aiDialogVisible" title="✨ AI 智能分析" width="90%" class="glass-dialog" center>
             <div class="ai-input-area">
                <el-input
                    v-model="aiDescription"
                    :rows="4"
                    type="textarea"
                    placeholder="告诉我你吃了什么？例如：一碗牛肉面，少油..."
                    class="ai-textarea"
                />
             </div>
             <div v-if="aiResult" class="ai-result-card animate-pop-in">
                <div class="ai-header">
                    <div class="ai-score">{{ aiResult.calories }} <small>kcal</small></div>
                    <div class="ai-macros">
                        <span>C: {{ aiResult.carbs }}</span>
                        <span>P: {{ aiResult.protein }}</span>
                        <span>F: {{ aiResult.fat }}</span>
                    </div>
                </div>
                <p class="ai-text">{{ aiResult.analysis }}</p>
             </div>
             <template #footer>
                <div class="dialog-actions">
                    <el-button v-if="!aiResult" type="primary" :loading="aiLoading" @click="handleAiAnalyze" size="large" round class="w-100 linear-btn">
                        <el-icon class="mr-1"><MagicStick /></el-icon> 开始分析
                    </el-button>
                    <template v-else>
                         <el-button @click="aiResult = null" round size="large">重试</el-button>
                         <el-button type="success" :loading="isSubmitting" @click="applyAiResult" round size="large">添加记录</el-button>
                    </template>
                </div>
             </template>
        </el-dialog>
      </div>
  </div>
</template>

<script setup>
import { computed, ref, reactive, nextTick, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from './stores/user'
import { useDietStore } from './stores/diet'
import { ElMessage } from 'element-plus'
import { MagicStick, User, Plus } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const dietStore = useDietStore()

const showLayout = computed(() => {
  return !['Login', 'Register'].includes(route.name)
})

// --- Global FAB & Dialog Logic ---

const addDrawerVisible = ref(false)
const manualDialogVisible = ref(false)
const aiDialogVisible = ref(false)
const isSubmitting = ref(false)

// Edit Mode State
const isEditing = ref(false)
const editingContext = reactive({ mealType: null, index: -1 })

const foodForm = reactive({ name: '', image: '', calories: 0, carbs: 0, protein: 0, fat: 0 })

// Provided function for children to call
function openEditFood(mealType, index, food) {
    isEditing.value = true
    editingContext.mealType = mealType
    editingContext.index = index
    Object.assign(foodForm, food)
    manualDialogVisible.value = true
}

provide('openEditFood', openEditFood)

function openManualAdd() {
    isEditing.value = false
    Object.assign(foodForm, { name: '', calories: 0, carbs: 0, protein: 0, fat: 0 })
    addDrawerVisible.value = false
    manualDialogVisible.value = true
}

async function handleManualSubmit() {
    if (!foodForm.name) return ElMessage.warning('请输入名称')
    if (isSubmitting.value) return
    isSubmitting.value = true
    try {
        if (isEditing.value) {
            dietStore.updateFood(editingContext.mealType, editingContext.index, { ...foodForm })
            ElMessage.success('修改成功')
        } else {
            dietStore.addFood(null, { ...foodForm })
            ElMessage.success('添加成功')
        }
        manualDialogVisible.value = false
        await nextTick()
    } finally {
        isSubmitting.value = false
    }
}

function goToRecipeLibrary() {
    addDrawerVisible.value = false
    if (route.name === 'Recipes') {
        ElMessage.info('您已经在食谱库啦')
    } else {
        router.push('/recipes')
    }
}

// AI Logic
const aiDescription = ref('')
const aiLoading = ref(false)
const aiResult = ref(null)
const usePresets = ref(false)
const greasiness = ref('medium')

function openAiDialog() {
    aiDescription.value = ''
    aiResult.value = null
    aiDialogVisible.value = true
}

async function handleAiAnalyze() {
    if (!aiDescription.value) return ElMessage.warning('请描述食物')
    
    let prompt = aiDescription.value
    if (usePresets.value) {
        prompt += `，油腻程度：${greasiness.value}`
    }

    aiLoading.value = true
    try {
        const res = await dietStore.analyzeFoodWithAI(prompt)
        aiResult.value = res
    } catch (e) {
        ElMessage.error('分析失败')
    } finally {
        aiLoading.value = false
    }
}

async function applyAiResult() {
    if (isSubmitting.value) return
    isSubmitting.value = true
    try {
        const food = {
            name: aiResult.value.name,
            calories: Number(aiResult.value.calories),
            carbs: Number(aiResult.value.carbs),
            protein: Number(aiResult.value.protein),
            fat: Number(aiResult.value.fat)
        }
        dietStore.addFood(null, food)
        aiDialogVisible.value = false
        ElMessage.success('已添加')
        await nextTick()
    } finally {
        isSubmitting.value = false
    }
}
</script>

<style>
/* Reset & Base */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

:root {
  /* Dark Theme Palette */
  --primary: #8e7dff; /* Lighter purple for dark mode */
  --primary-glow: rgba(142, 125, 255, 0.4);
  --secondary: #00cec9;
  --accent: #ffeaa7;
  --dark: #dfe6e9; /* Reversing roles: 'Dark' var now holds light text color */
  --bg-dark: #0f172a; /* Deep Aurora Blue */
  
  --glass: rgba(30, 41, 59, 0.7); /* Dark Glass */
  --glass-highlight: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.15); /* 稍微增强边框 */
  
  --shadow-lg: 0 20px 40px -10px rgba(0,0,0,0.5), 0 0 2px rgba(255,255,255,0.05);
  --shadow-glow: 0 0 20px var(--primary-glow);
  --radius-xl: 28px;
}

body {
  margin: 0;
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
  background-color: var(--bg-dark);
  color: #ecf0f1; /* Global Light Text */
  letter-spacing: -0.02em;
  overflow: hidden;
  display: flex;
  justify-content: center;
  -webkit-font-smoothing: antialiased; /* 字体锐化 */
  -moz-osx-font-smoothing: grayscale;
}

/* Custom Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }

/* Global Aurora Background */
.app-aurora-bg {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    z-index: 0; pointer-events: none;
    overflow: hidden;
}
.orb-global {
    position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.4;
    animation: float 25s infinite ease-in-out;
}
.orb-1 { width: 500px; height: 500px; background: #6c5ce7; top: -100px; left: -100px; }
.orb-2 { width: 400px; height: 400px; background: #00b894; bottom: -100px; right: -100px; animation-delay: -5s; }
.orb-3 { width: 300px; height: 300px; background: #e17055; top: 40%; left: 50%; transform: translate(-50%, -50%); animation-delay: -10s; opacity: 0.3; }

/* Mobile Wrapper */
.mobile-wrapper {
    width: 100%;
    max-width: 480px;
    height: 100vh;
    background: transparent; /* Transparent to show aurora */
    position: relative;
    box-shadow: 0 0 100px rgba(0,0,0,0.5);
    overflow: hidden;
    border-left: 1px solid rgba(255,255,255,0.05);
    border-right: 1px solid rgba(255,255,255,0.05);
}

/* Layout Grid */
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
}

/* Main Content */
.main-content {
  flex: 1; height: 100%; display: flex; flex-direction: column; position: relative; z-index: 1;
}

.content-scroll {
  flex: 1; overflow-y: auto; padding: 0 20px 100px 20px; scroll-behavior: smooth;
}
.content-scroll::-webkit-scrollbar { width: 0px; background: transparent; }

/* Mobile Header - Dark Glass */
.mobile-header {
  height: 60px;
  background: rgba(15, 23, 42, 0.6); 
  backdrop-filter: blur(20px);
  display: grid; 
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 20px;
  position: sticky; top: 0; z-index: 50;
  border-bottom: 1px solid var(--glass-border);
}
.page-title { 
    grid-column: 2;
    font-weight: 800; font-size: 18px; letter-spacing: -0.5px; color: white; text-align: center;
}
.avatar-mini {
  grid-column: 3;
  justify-self: end;
  width: 36px; height: 36px; border-radius: 12px; background: rgba(255,255,255,0.1); 
  overflow: hidden; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2);
}
.avatar-mini img { width: 100%; height: 100%; object-fit: cover; }

/* Mobile Bottom Dock - Dark Glass */
.mobile-dock {
  position: absolute; bottom: 0; left: 0; width: 100%; height: 75px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(30px) saturate(180%);
  display: flex; align-items: center; justify-content: space-around;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -10px 40px rgba(0,0,0,0.3);
  z-index: 1000;
  border-top: 1px solid var(--glass-border);
}

.dock-item {
  color: #636e72; width: 50px; height: 50px;
  display: flex; align-items: center; justify-content: center; border-radius: 18px;
  transition: all 0.3s;
}
.dock-item.active { 
    color: var(--primary);
    background: rgba(142, 125, 255, 0.15);
    box-shadow: 0 0 15px rgba(142, 125, 255, 0.2);
}

/* Center Action Wrap */
.dock-indicator-wrap {
    position: relative; width: 60px; height: 60px; margin-top: -35px;
}
.dock-add-btn {
    width: 60px; height: 60px;
    background: white; /* Contrast pop */
    color: #0f172a;
    border-radius: 22px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 10px 25px rgba(0,0,0,0.4);
    border: 4px solid #1e293b;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.dock-add-btn:active { transform: scale(0.9) rotate(90deg); }

/* FAB */
.fab-container {
    position: absolute; bottom: 100px; right: 25px; 
    display: flex; flex-direction: column; gap: 16px; z-index: 100;
    pointer-events: none; /* 让容器不阻挡点击，按钮单独开启 */
}
.fab-btn {
    pointer-events: auto;
    width: 56px; height: 56px; 
    border-radius: 50%; /* 正圆 */
    border: none; color: white;
    cursor: pointer; 
    display: flex; align-items: center; justify-content: center;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    position: relative;
}

/* AI 极光灵球风格 */
.ai-fab { 
    background: linear-gradient(135deg, #6c5ce7, #00cec9);
    border: 2px solid rgba(255, 255, 255, 0.2);
    box-shadow: 
        0 10px 25px rgba(108, 92, 231, 0.5), /* 主投影 */
        inset 0 0 10px rgba(255, 255, 255, 0.3); /* 内发光 */
    animation: fabFloat 6s ease-in-out infinite; /* 呼吸悬浮动画 */
}

.ai-fab:hover { 
    transform: scale(1.15) rotate(15deg); 
    box-shadow: 
        0 15px 35px rgba(0, 206, 201, 0.6), 
        0 0 20px rgba(255, 255, 255, 0.4);
    background: linear-gradient(135deg, #a29bfe, #55efc4);
    border-color: white;
}

.ai-fab:active { transform: scale(0.95); }

@keyframes fabFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
}

/* Dialog & Drawers - Dark Glass Mode */
.glass-dialog {
    border-radius: 30px !important;
    background: rgba(30, 41, 59, 0.85) !important;
    backdrop-filter: blur(25px) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    box-shadow: 0 25px 50px rgba(0,0,0,0.5) !important;
}
.glass-dialog .el-dialog__title { color: white !important; }
.glass-dialog .el-form-item__label { color: #cbd5e1 !important; }

.modern-drawer :deep(.el-drawer__body) { padding: 0; background: transparent; }
.add-options {
    background: #1e293b; /* Dark Slate */
    border-top-left-radius: 32px; border-top-right-radius: 32px;
    padding: 30px 24px 50px; display: flex; flex-direction: column; gap: 16px;
    box-shadow: 0 -15px 50px rgba(0,0,0,0.3);
    border-top: 1px solid rgba(255,255,255,0.1);
}
.option-card {
    display: flex; align-items: center; gap: 20px;
    padding: 20px; background: rgba(255,255,255,0.05); 
    border-radius: 24px; cursor: pointer;
    transition: all 0.3s;
    border: 1px solid transparent;
}
.option-card:hover { transform: translateY(-4px); background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }

.icon-wrap {
    width: 60px; height: 60px; border-radius: 18px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.1) !important; 
}
.option-card.manual .icon-wrap { color: #ff7675; }
.option-card.recipes .icon-wrap { color: #a29bfe; }
.o-title { font-size: 17px; font-weight: 800; color: white; letter-spacing: -0.5px; }
.o-desc { font-size: 13px; color: #94a3b8; font-weight: 500; }

.drawer-handle {
    width: 40px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; margin: 10px auto;
}

/* AI Specific */
.ai-textarea :deep(.el-textarea__inner) {
    border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); padding: 15px; 
    background: rgba(0,0,0,0.3); color: white;
    box-shadow: none !important; transition: all 0.3s;
}
.ai-textarea :deep(.el-textarea__inner):focus {
    border-color: var(--primary); background: rgba(0,0,0,0.5);
}
.ai-result-card {
    background: rgba(255,255,255,0.05);
    padding: 25px; border-radius: 20px; margin-top: 20px; 
    border: 1px solid rgba(255,255,255,0.1);
}
.ai-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 15px; }
.ai-score { font-size: 32px; font-weight: 800; color: var(--primary); text-shadow: 0 0 20px rgba(142, 125, 255, 0.4); }
.ai-macros { font-family: monospace; color: #cbd5e1; background: rgba(255,255,255,0.1); padding: 5px 10px; border-radius: 8px; }
.ai-text { color: #e2e8f0; line-height: 1.6; }

/* Global overrides for Element Plus Dark Mode Adaptation */
.el-button { border-radius: 12px !important; font-weight: 600 !important; border: none; }
.el-input__wrapper { 
    border-radius: 12px !important; box-shadow: none !important; 
    background: rgba(255,255,255,0.05) !important; 
    border: 1px solid rgba(255,255,255,0.1) !important; 
}
.el-input__inner { color: white !important; }
.el-input__wrapper.is-focus { 
    border-color: var(--primary) !important; 
    background: rgba(255,255,255,0.1) !important; 
    box-shadow: 0 0 10px var(--primary-glow) !important; 
}
.el-card { 
    border-radius: 24px !important; border: 1px solid rgba(255,255,255,0.1) !important; 
    background: rgba(30, 41, 59, 0.6) !important;
    backdrop-filter: blur(15px);
    color: white !important;
}

/* Animations */
.animate-pop-in { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.animate-bounce-in { animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
@keyframes popIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
@keyframes bounceIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes float { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(30px, -30px); } }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }

/* Global Tooltip Customization */
.glass-tooltip {
    background: rgba(30, 41, 59, 0.9) !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(255,255,255,0.2) !important;
    color: white !important;
    border-radius: 8px !important;
    padding: 8px 12px !important;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
    font-weight: 600 !important;
}
.glass-tooltip .el-popper__arrow::before {
    background: rgba(30, 41, 59, 0.9) !important;
    border: 1px solid rgba(255,255,255,0.2) !important;
}
</style>