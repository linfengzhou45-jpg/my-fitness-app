<template>
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

      <el-form-item label="描述" style="margin-top: 15px;">
        <el-input v-model="foodForm.analysis" type="textarea" :rows="2" placeholder="食物描述或 AI 分析结果..." />
      </el-form-item>
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
      <p class="ai-res-txt"><el-icon><ChatDotRound /></el-icon> {{ aiResult.analysis || aiResult.description }}</p>

      <div class="meal-selector-ai">
        <span class="label">添加到:</span>
        <el-select v-model="selectedMealType" placeholder="选择餐次" size="small" style="width: 120px;">
          <el-option label="早餐" value="breakfast" />
          <el-option label="午餐" value="lunch" />
          <el-option label="晚餐" value="dinner" />
          <el-option label="加餐" value="snack" />
        </el-select>
      </div>
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
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDietStore } from '../stores/diet'
import { ElMessage } from 'element-plus'
import { MagicStick, Plus, ChatDotRound, Edit, Food, CircleCheck } from '@element-plus/icons-vue'

const router = useRouter()
const dietStore = useDietStore()

const addDrawerVisible = ref(false)
const manualDialogVisible = ref(false)
const aiDialogVisible = ref(false)
const isSubmitting = ref(false)
const addContext = reactive({ date: null, mealType: null })

function open(context = {}) {
  addContext.date = context.date || null
  addContext.mealType = context.mealType || null
  dietStore.setPendingContext(addContext.mealType, addContext.date)
  addDrawerVisible.value = true
}

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

// Edit support
const isEditing = ref(false)
const editingContext = reactive({ mealType: null, index: -1 })
const foodForm = reactive({ name: '', calories: 0, carbs: 0, protein: 0, fat: 0, analysis: '' })

function openEdit(mealType, index, food) {
  isEditing.value = true
  editingContext.mealType = mealType
  editingContext.index = index
  Object.assign(foodForm, { ...food, analysis: food.analysis || '' })
  manualDialogVisible.value = true
}

// Expose methods for parent to call via ref
defineExpose({ open, openEdit })

function openManualAdd() {
  isEditing.value = false
  Object.assign(foodForm, { name: '', calories: 0, carbs: 0, protein: 0, fat: 0, analysis: '' })
  addDrawerVisible.value = false
  manualDialogVisible.value = true
}

function triggerAiFromMenu() {
  addDrawerVisible.value = false
  aiDialogVisible.value = true
  aiResult.value = null
  aiDescription.value = ''
}

function goToRecipeLibrary() {
  addDrawerVisible.value = false
  dietStore.setPendingContext(addContext.mealType, addContext.date)
  router.push('/recipes')
}

async function handleManualSubmit() {
  if (!foodForm.name) return ElMessage.warning('请输入名称')
  isSubmitting.value = true
  try {
    if (isEditing.value) {
      dietStore.updateFood(editingContext.mealType, editingContext.index, { ...foodForm }, addContext.date)
    } else {
      dietStore.addFood(addContext.mealType, { ...foodForm }, addContext.date)
    }
    manualDialogVisible.value = false
  } finally {
    isSubmitting.value = false
  }
}

// AI analysis
const aiDescription = ref('')
const aiLoading = ref(false)
const aiResult = ref(null)
const currentLoadingText = ref('AI 正在分析...')
const selectedMealType = ref('breakfast')

watch([aiDialogVisible, () => addContext.mealType], ([visible, mealType]) => {
  if (visible) {
    selectedMealType.value = mealType || 'breakfast'
  }
})

async function handleAiAnalyze() {
  if (!aiDescription.value) return ElMessage.warning('描述一下你吃的食物吧')
  aiLoading.value = true
  try {
    aiResult.value = await dietStore.analyzeFoodWithAI(aiDescription.value)
  } catch (e) {
    ElMessage.error('分析失败')
  } finally {
    aiLoading.value = false
  }
}

async function applyAiResult() {
  if (!aiResult.value) return
  isSubmitting.value = true
  try {
    dietStore.addFood(selectedMealType.value, aiResult.value, addContext.date)
    aiDialogVisible.value = false
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
/* Drawer */
.modern-drawer { background: transparent !important; }
.add-options-wrapper { background: #1e293b; border-top-left-radius: 25px; border-top-right-radius: 25px; padding: 20px 20px 40px; }
.drawer-handle { width: 40px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin: 0 auto 15px; }
.option-card { display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 15px; margin-bottom: 10px; cursor: pointer; }
.icon-wrap { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); color: var(--primary); }
.o-title { font-weight: 800; display: block; }
.o-desc { font-size: 12px; color: #94a3b8; }

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
</style>
