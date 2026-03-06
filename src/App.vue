<template>
  <div v-if="showLayout" class="app-aurora-bg">
      <div class="orb-global orb-1"></div>
      <div class="orb-global orb-2"></div>
      <div class="orb-global orb-3"></div>
  </div>
  
  <div class="mobile-wrapper">
      <div v-if="!showLayout" class="full-height">
        <router-view />
      </div>
      
      <div v-else class="app-layout">
        <main class="main-content">
          <div class="content-scroll">
            <router-view v-slot="{ Component }">
              <transition name="fade-slide" mode="out-in">
                <div :key="$route.path" class="view-container">
                    <component :is="Component" />
                </div>
              </transition>
            </router-view>
          </div>
        </main>

        <!-- Bottom Dock -->
        <nav class="mobile-dock">
          <router-link to="/dashboard" class="dock-item" active-class="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
          </router-link>
          <router-link to="/" class="dock-item" active-class="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
          </router-link>
          
          <div class="dock-center-action">
              <div class="dock-add-btn" @click="openGlobalAdd()">
                  <el-icon :size="24"><Plus /></el-icon>
              </div>
          </div>

          <router-link to="/recipes" class="dock-item" active-class="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </router-link>
          <router-link to="/profile" class="dock-item" active-class="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </router-link>
        </nav>

        <!-- Add Options Drawer -->
        <el-drawer v-model="addDrawerVisible" :with-header="false" direction="btt" size="auto" class="modern-drawer">
            <div class="add-options-wrapper">
                <div class="drawer-handle"></div>
                <div class="add-options">
                    <div class="option-card" @click="useRecommendation">
                        <div class="icon-wrap"><el-icon :size="24"><CircleCheck /></el-icon></div>
                        <div class="option-text">
                            <span class="o-title">{{ recommendationAvailable ? '直接使用推荐' : '暂无推荐' }}</span>
                            <span class="o-desc">{{ recommendationAvailable ? '一键录入计划菜品' : '请先在仪表盘制订计划' }}</span>
                        </div>
                    </div>
                    <div class="option-card" @click="openManualAdd">
                        <div class="icon-wrap"><el-icon :size="24"><Edit /></el-icon></div>
                        <div class="option-text"><span class="o-title">手动记录</span><span class="o-desc">手动输入食物成分</span></div>
                    </div>
                    <div class="option-card" @click="triggerAiFromMenu">
                        <div class="icon-wrap"><el-icon :size="24"><MagicStick /></el-icon></div>
                        <div class="option-text"><span class="o-title">AI 智能分析</span><span class="o-desc">对话式智能录入</span></div>
                    </div>
                    <div class="option-card" @click="goToRecipeLibrary">
                        <div class="icon-wrap"><el-icon :size="24"><Food /></el-icon></div>
                        <div class="option-text"><span class="o-title">健康食谱</span><span class="o-desc">浏览推荐饮食</span></div>
                    </div>
                </div>
            </div>
        </el-drawer>

        <!-- Manual Add Dialog -->
        <el-dialog v-model="manualDialogVisible" :title="isEditing ? '修改食物' : '自定义食物'" width="90%" class="glass-dialog" center>
             <el-form :model="foodForm" label-position="top">
                <el-form-item label="名称">
                    <el-input v-model="foodForm.name" placeholder="例如: 燕麦拿铁" size="large" />
                </el-form-item>
                <el-form-item label="热量 (kcal)">
                    <el-input-number v-model="foodForm.calories" :min="0" style="width: 100%" size="large" />
                </el-form-item>
                
                <div class="macro-grid-layout">
                    <div class="macro-col">
                        <div class="m-label">碳水(g)</div>
                        <el-input-number v-model="foodForm.carbs" :min="0" :controls="false" />
                    </div>
                    <div class="macro-col">
                        <div class="m-label">蛋白质(g)</div>
                        <el-input-number v-model="foodForm.protein" :min="0" :controls="false" />
                    </div>
                    <div class="macro-col">
                        <div class="m-label">脂肪(g)</div>
                        <el-input-number v-model="foodForm.fat" :min="0" :controls="false" />
                    </div>
                </div>
            </el-form>
            <template #footer>
                <el-button @click="manualDialogVisible = false" round>取消</el-button>
                <el-button type="primary" :loading="isSubmitting" @click="handleManualSubmit" round>保存</el-button>
            </template>
        </el-dialog>

        <!-- AI Dialog -->
        <el-dialog v-model="aiDialogVisible" title="✨ AI 智能分析" width="90%" class="glass-dialog" center>
             <el-input v-model="aiDescription" :rows="4" type="textarea" placeholder="描述你的饮食..." class="ai-textarea" />
             <div v-if="aiLoading" class="ai-loading-view">
                 <div class="loading-orb"></div>
                 <p>{{ currentLoadingText }}</p>
             </div>
             <div v-if="aiResult" class="ai-result-card animate-pop-in">
                <div class="ai-res-head">
                    <span class="name">{{ aiResult.name }}</span>
                    <span class="cal">{{ aiResult.calories }} kcal</span>
                </div>
                <div class="ai-res-macros">
                    <span>碳 {{ aiResult.carbs }}g</span>
                    <span>蛋 {{ aiResult.protein }}g</span>
                    <span>脂 {{ aiResult.fat }}g</span>
                </div>
                <p class="ai-res-txt"><el-icon><ChatDotRound /></el-icon> {{ aiResult.analysis }}</p>
             </div>
             <template #footer>
                <div class="dialog-actions">
                    <el-button v-if="!aiResult" type="primary" :loading="aiLoading" @click="handleAiAnalyze" round class="w-100">开始分析</el-button>
                    <template v-else>
                         <el-button @click="aiResult = null" round>重试</el-button>
                         <el-button type="success" :loading="isSubmitting" @click="applyAiResult" round>确认添加</el-button>
                    </template>
                </div>
             </template>
        </el-dialog>
      </div>
  </div>
</template>

<script setup>
import { computed, ref, reactive, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from './stores/user'
import { useDietStore } from './stores/diet'
import { ElMessage } from 'element-plus'
import { MagicStick, User, Plus, ChatDotRound, Edit, Food, CircleCheck } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const dietStore = useDietStore()

const showLayout = computed(() => !['Login', 'Register'].includes(route.name))

const addDrawerVisible = ref(false)
const manualDialogVisible = ref(false)
const aiDialogVisible = ref(false)
const isSubmitting = ref(false)
const addContext = reactive({ date: null, mealType: null })

function openGlobalAdd(context = {}) {
    addContext.date = context.date || null
    addContext.mealType = context.mealType || null
    addDrawerVisible.value = true
}
provide('openGlobalAdd', openGlobalAdd)

// Recommendation logic
const recommendationAvailable = computed(() => {
    if (!addContext.mealType) return false
    const plans = dietStore.getTodayPlans()
    return !!(plans && plans[addContext.mealType])
})

function useRecommendation() {
    if (!recommendationAvailable.value) {
        return ElMessage.info('暂无推荐，请先在仪表盘制订计划')
    }
    const plans = dietStore.getTodayPlans()
    const plan = plans[addContext.mealType]
    
    const foodToAdd = {
        name: typeof plan === 'object' ? plan.food : plan,
        calories: plan.calories || 0,
        carbs: plan.carbs || 0,
        protein: plan.protein || 0,
        fat: plan.fat || 0
    }
    
    dietStore.addFood(addContext.mealType, foodToAdd, addContext.date)
    addDrawerVisible.value = false
    ElMessage.success(`已记录推荐的${foodToAdd.name}`)
}

const isEditing = ref(false)
const editingContext = reactive({ mealType: null, index: -1 })
const foodForm = reactive({ name: '', calories: 0, carbs: 0, protein: 0, fat: 0 })

function openEditFood(mealType, index, food) {
    isEditing.value = true; editingContext.mealType = mealType; editingContext.index = index;
    Object.assign(foodForm, food); manualDialogVisible.value = true;
}
provide('openEditFood', openEditFood)

function openManualAdd() {
    isEditing.value = false; Object.assign(foodForm, { name: '', calories: 0, carbs: 0, protein: 0, fat: 0 });
    addDrawerVisible.value = false; manualDialogVisible.value = true;
}
function triggerAiFromMenu() { addDrawerVisible.value = false; aiDialogVisible.value = true; aiResult.value = null; aiDescription.value = ''; }
function goToRecipeLibrary() { addDrawerVisible.value = false; router.push('/recipes'); }

async function handleManualSubmit() {
    if (!foodForm.name) return ElMessage.warning('请输入名称')
    isSubmitting.value = true
    try {
        if (isEditing.value) dietStore.updateFood(editingContext.mealType, editingContext.index, { ...foodForm })
        else dietStore.addFood(addContext.mealType, { ...foodForm }, addContext.date)
        manualDialogVisible.value = false
    } finally { isSubmitting.value = false }
}

const aiDescription = ref(''); const aiLoading = ref(false); const aiResult = ref(null);
const currentLoadingText = ref('AI 正在分析...');

async function handleAiAnalyze() {
    if (!aiDescription.value) return ElMessage.warning('描述一下你吃的食物吧')
    aiLoading.value = true
    try { aiResult.value = await dietStore.analyzeFoodWithAI(aiDescription.value) } 
    catch (e) { ElMessage.error('分析失败') } 
    finally { aiLoading.value = false }
}
async function applyAiResult() {
    isSubmitting.value = true
    try {
        const food = { name: aiResult.value.name, calories: Number(aiResult.value.calories), carbs: Number(aiResult.value.carbs), protein: Number(aiResult.value.protein), fat: Number(aiResult.value.fat) }
        dietStore.addFood(addContext.mealType, food, addContext.date)
        aiDialogVisible.value = false
    } finally { isSubmitting.value = false }
}
</script>

<style>
:root { --primary: #8e7dff; --bg-dark: #0f172a; }
body { margin: 0; font-family: sans-serif; background-color: var(--bg-dark); color: white; overflow: hidden; display: flex; justify-content: center; }

/* 全局滚动条美化 */
::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(142, 125, 255, 0.3); /* 鼠标悬停时呈现淡紫色 */
}

/* 针对火狐浏览器的优化 */
* {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.05) transparent;
}

.app-aurora-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
.orb-global { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.3; }
.orb-1 { width: 400px; height: 400px; background: #6c5ce7; top: -50px; left: -50px; }
.orb-2 { width: 300px; height: 300px; background: #00cec9; bottom: -50px; right: -50px; }
.mobile-wrapper { width: 100%; max-width: 480px; height: 100vh; position: relative; z-index: 10; border-left: 1px solid rgba(255,255,255,0.05); border-right: 1px solid rgba(255,255,255,0.05); }
.app-layout { display: flex; flex-direction: column; height: 100%; }
.main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.content-scroll { flex: 1; overflow-y: auto; padding: 15px 15px 20px; }
.mobile-dock { height: 70px; background: rgba(15, 23, 42, 0.9); display: flex; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-bottom: env(safe-area-inset-bottom); }
.dock-item { flex: 1; height: 100%; display: flex; align-items: center; justify-content: center; color: #636e72; text-decoration: none; transition: all 0.2s ease; }
.dock-item.active { color: var(--primary); }
.dock-center-action { flex: 1.2; display: flex; justify-content: center; align-items: center; position: relative; }
.dock-add-btn { 
    width: 48px; 
    height: 48px; 
    background: var(--primary); 
    color: white; 
    border-radius: 16px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    box-shadow: 0 4px 15px rgba(142, 125, 255, 0.4);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.dock-add-btn:active { transform: scale(0.9) rotate(90deg); }

/* Manual Add Grid */
.macro-grid-layout { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px; }
.macro-col { display: flex; flex-direction: column; align-items: center; }
.m-label { font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 8px; }
.macro-col :deep(.el-input-number) { width: 100% !important; }

/* AI UI */
.ai-loading-view { text-align: center; padding: 20px 0; }
.loading-orb { width: 40px; height: 40px; background: var(--primary); border-radius: 50%; filter: blur(10px); margin: 0 auto 10px; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 0.4; transform: scale(0.8); } 50% { opacity: 0.8; transform: scale(1.1); } }
.ai-result-card { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); margin-top: 15px; }
.ai-res-head { display: flex; justify-content: space-between; font-weight: 800; margin-bottom: 10px; }
.ai-res-macros { display: flex; gap: 15px; font-size: 12px; color: #94a3b8; margin-bottom: 10px; }

.glass-dialog { border-radius: 25px !important; background: rgba(30, 41, 59, 0.9) !important; backdrop-filter: blur(20px) !important; border: 1px solid rgba(255,255,255,0.1) !important; }
/* 页面切换动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.view-container {
    width: 100%;
    height: 100%;
}

.modern-drawer { background: transparent !important; }
.add-options-wrapper { background: #1e293b; border-top-left-radius: 25px; border-top-right-radius: 25px; padding: 20px 20px 40px; }
.option-card { display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 15px; margin-bottom: 10px; cursor: pointer; }
.icon-wrap { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); color: var(--primary); }
.o-title { font-weight: 800; display: block; }
.o-desc { font-size: 12px; color: #94a3b8; }
.drawer-handle { width: 40px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin: 0 auto 15px; }
</style>