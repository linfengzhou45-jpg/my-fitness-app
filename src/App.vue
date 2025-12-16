<script setup>
import { computed, ref, reactive, onMounted, onUnmounted, nextTick, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from './stores/user'
import { useDietStore } from './stores/diet'
import { ElMessage } from 'element-plus'
import { 
  DataLine, Food, User, Reading, Aim, 
  Plus, Edit, StarFilled, Star, Search, MagicStick 
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const dietStore = useDietStore()

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

// --- Global FAB & Dialog Logic ---

const addDrawerVisible = ref(false)
const manualDialogVisible = ref(false)
const favoritesDialogVisible = ref(false)
const aiDialogVisible = ref(false)
const isSubmitting = ref(false)

// Edit Mode State
const isEditing = ref(false)
const editingContext = reactive({ mealType: null, index: -1 })

const foodForm = reactive({ name: '', calories: 0, carbs: 0, protein: 0, fat: 0 })

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

// Favorites Logic
const searchQuery = ref('')
const filteredFavorites = computed(() => {
    if (!searchQuery.value) return dietStore.favorites
    return dietStore.favorites.filter(f => f.name.includes(searchQuery.value))
})

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
        <el-menu-item index="/dashboard">
          <el-icon><Aim /></el-icon>
          <span>健康</span>
        </el-menu-item>
        <el-menu-item index="/">
          <el-icon><Food /></el-icon>
          <span>饮食记录</span>
        </el-menu-item>
        <el-menu-item index="/recipes">
          <el-icon><Reading /></el-icon>
          <span>食谱库</span>
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

      <!-- Global FAB (Visible on Health, Diet, Recipes) -->
      <div v-if="['Diet', 'Dashboard', 'Recipes'].includes($route.name)" class="fab-container">
        <el-tooltip content="AI 智能分析" placement="top">
            <el-button type="warning" class="fab-btn ai-fab" @click="openAiDialog">
                <el-icon><MagicStick /></el-icon>
            </el-button>
        </el-tooltip>
        <el-tooltip content="添加食物" placement="top">
            <el-button type="success" class="fab-btn add-fab" @click="addDrawerVisible = true">
                <el-icon><Plus /></el-icon>
            </el-button>
        </el-tooltip>
      </div>

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
          :ellipsis="false"
        >
          <el-menu-item index="/dashboard" style="flex: 1">
            <el-icon><Aim /></el-icon>
            <span class="mobile-label">健康</span>
          </el-menu-item>
          <el-menu-item index="/" style="flex: 1">
            <el-icon><Food /></el-icon>
            <span class="mobile-label">饮食</span>
          </el-menu-item>
           <el-menu-item index="/recipes" style="flex: 1">
            <el-icon><Reading /></el-icon>
            <span class="mobile-label">食谱</span>
          </el-menu-item>
          <el-menu-item index="/profile" style="flex: 1">
             <el-icon><User /></el-icon>
            <span class="mobile-label">我的</span>
          </el-menu-item>
        </el-menu>
      </div>
    </el-container>
  </el-container>

  <!-- Global Dialogs -->
    <el-drawer v-model="addDrawerVisible" title="添加饮食" direction="btt" size="40%">
        <div class="add-options">
            <div class="option-card" @click="openManualAdd">
                <div class="icon-box"><el-icon><Edit /></el-icon></div>
                <span>自定义添加</span>
            </div>
            <div class="option-card" @click="goToRecipeLibrary">
                <div class="icon-box"><el-icon><Reading /></el-icon></div>
                <span>去食谱库看看</span>
            </div>
        </div>
    </el-drawer>

    <el-dialog v-model="manualDialogVisible" :title="isEditing ? '修改食物' : '自定义食物'" width="90%" class="responsive-dialog">
         <el-form :model="foodForm" label-width="80px">
            <el-form-item label="名称">
                <el-input v-model="foodForm.name" placeholder="例如: 燕麦拿铁" />
            </el-form-item>
            <el-form-item label="热量">
                <el-input-number v-model="foodForm.calories" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="营养素">
                <el-row :gutter="10">
                    <el-col :span="8"><el-input-number v-model="foodForm.carbs" :min="0" placeholder="碳水" :controls="false" style="width: 100%" /><div class="sub-label">碳水</div></el-col>
                    <el-col :span="8"><el-input-number v-model="foodForm.protein" :min="0" placeholder="蛋白" :controls="false" style="width: 100%" /><div class="sub-label">蛋白</div></el-col>
                    <el-col :span="8"><el-input-number v-model="foodForm.fat" :min="0" placeholder="脂肪" :controls="false" style="width: 100%" /><div class="sub-label">脂肪</div></el-col>
                </el-row>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="manualDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="isSubmitting" @click="handleManualSubmit">确认{{ isEditing ? '修改' : '添加' }}</el-button>
        </template>
    </el-dialog>

    <el-dialog v-model="favoritesDialogVisible" title="常吃食物库" width="90%" class="responsive-dialog">
        <div class="search-bar">
            <el-input v-model="searchQuery" placeholder="搜索收藏..." :prefix-icon="Search" clearable />
        </div>
        <div class="favorites-list">
            <div v-for="item in filteredFavorites" :key="item.name + item.calories" class="favorite-item" @click="selectFavorite(item)">
                <div class="fav-info">
                    <div class="fav-name">{{ item.name }}</div>
                    <div class="fav-meta">{{ item.calories }} kcal</div>
                </div>
                <el-button type="primary" link :icon="Plus">添加</el-button>
            </div>
            <el-empty v-if="filteredFavorites.length === 0" description="没有找到相关食物" />
        </div>
    </el-dialog>

    <el-dialog v-model="aiDialogVisible" title="AI 智能分析" width="90%" class="responsive-dialog">
         <el-input
            v-model="aiDescription"
            :rows="4"
            type="textarea"
            placeholder="描述你的食物，例如：一碗牛肉面..."
        />
         <div class="ai-presets">
             <el-checkbox v-model="usePresets">显示高级选项</el-checkbox>
             <div v-if="usePresets" class="preset-controls animate-fade-in">
                 <el-radio-group v-model="greasiness" size="small">
                    <el-radio-button label="light">清淡</el-radio-button>
                    <el-radio-button label="medium">适中</el-radio-button>
                    <el-radio-button label="heavy">油腻</el-radio-button>
                 </el-radio-group>
             </div>
         </div>

         <div v-if="aiResult" class="ai-result">
            <div class="ai-summary">
                <span class="highlight">{{ aiResult.calories }} kcal</span>
                <span>{{ aiResult.carbs }}C / {{ aiResult.protein }}P / {{ aiResult.fat }}F</span>
            </div>
            <p>{{ aiResult.analysis }}</p>
         </div>

         <template #footer>
            <el-button v-if="!aiResult" type="primary" :loading="aiLoading" @click="handleAiAnalyze" style="width: 100%">开始分析</el-button>
            <template v-else>
                 <el-button @click="aiResult = null" style="width: 45%">重试</el-button>
                 <el-button type="success" :loading="isSubmitting" @click="applyAiResult" style="width: 45%">添加</el-button>
            </template>
         </template>
    </el-dialog>
</template>

<style>
body {
  margin: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: #f5f7fa;
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
  padding: 0 15px;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.header-content h2 {
    font-size: 18px;
    margin: 0;
    color: #303133;
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
  padding-bottom: 70px !important;
}
.mobile-label {
    font-size: 12px;
    margin-left: 0 !important;
    display: block;
    line-height: 1.2;
    margin-top: -5px;
}
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

/* Global FAB Styles */
.fab-container {
    position: fixed;
    bottom: 80px; 
    right: 20px;
    display: flex;
    flex-direction: row;
    gap: 12px;
    z-index: 999;
    
    /* Box container styling (Version 2) */
    background-color: #fff;
    padding: 10px 15px;
    border-radius: 50px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    border: 1px solid #f0f0f0;
}
.fab-btn {
    width: 56px !important;
    height: 56px !important;
    min-width: 56px !important;
    min-height: 56px !important;
    max-width: 56px !important;
    max-height: 56px !important;
    font-size: 24px;
    padding: 0 !important;
    margin: 0 !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    border-radius: 50% !important;
    flex-shrink: 0 !important;
}

/* Dialog Styles */
.add-options {
    display: flex;
    justify-content: space-around;
    padding: 20px;
}
.option-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    padding: 15px;
    border-radius: 8px;
    transition: background 0.2s;
}
.option-card:active { background: #f5f7fa; }
.icon-box {
    font-size: 32px;
    margin-bottom: 8px;
    color: #409eff;
}
.search-bar { margin-bottom: 15px; }
.favorite-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #eee;
}
.fav-name { font-weight: bold; }
.fav-meta { font-size: 12px; color: #666; }
.ai-result {
    background: #f0f9eb;
    padding: 15px;
    border-radius: 8px;
    margin-top: 15px;
}
.ai-summary {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    margin-bottom: 10px;
}
.highlight { color: #67c23a; font-size: 18px; }
.sub-label { text-align: center; font-size: 12px; color: #909399; margin-top: 5px; }

@media (max-width: 768px) {
    .responsive-dialog { width: 95% !important; }
}
</style>