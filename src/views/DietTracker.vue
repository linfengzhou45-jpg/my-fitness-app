<template>
  <div class="diet-container">
    <!-- Date Picker & Header -->
    <div class="date-header">
       <el-date-picker
        v-model="currentDate"
        type="date"
        placeholder="选择日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        :disabled-date="(time) => time.getTime() > Date.now()"
        @change="handleDateChange"
      />
      <div class="daily-summary" v-if="currentDate === today">
          <span>今日摄入: {{ dayIntake.calories }} kcal</span>
      </div>
    </div>

    <!-- Main Content Area -->
    <div v-if="canShowDetails">
        <el-card v-for="meal in meals" :key="meal.key" class="meal-card" shadow="hover">
            <template #header>
                <div class="meal-header">
                    <span>{{ meal.label }}</span>
                    <span class="meal-cals">{{ getMealCalories(meal.key) }} kcal</span>
                </div>
            </template>
            
            <el-table :data="currentLog[meal.key]" style="width: 100%" :show-header="false" empty-text="暂无记录">
                <el-table-column min-width="120">
                    <template #default="{ row }">
                        <div class="food-info">
                            <span class="food-name">{{ row.name }}</span>
                            <span class="food-macros">{{ row.calories }}kcal · {{ row.carbs }}C {{ row.protein }}P {{ row.fat }}F</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column width="100" align="right">
                    <template #default="scope">
                        <el-button 
                            :type="dietStore.isFavorite(scope.row) ? 'danger' : 'info'" 
                            :icon="dietStore.isFavorite(scope.row) ? StarFilled : Star" 
                            circle 
                            plain
                            size="small" 
                            @click="dietStore.toggleFavorite(scope.row)" 
                        />
                        <el-button type="danger" :icon="Delete" circle size="small" @click="dietStore.removeFood(meal.key, scope.$index)" />
                    </template>
                </el-table-column>
            </el-table>
        </el-card>
        
        <div class="empty-state" v-if="isDayEmpty">
            <el-empty description="今天还没有记录饮食哦" />
        </div>
    </div>

    <!-- Historical Summary View (For older dates) -->
    <div v-else class="history-summary-view">
        <el-card class="summary-card">
            <h3>{{ currentDate }} 饮食概览</h3>
            <div class="summary-badge" :class="historyBalance >= 0 ? 'green' : 'red'">
                {{ historyBalance >= 0 ? `剩余额度 ${historyBalance} kcal` : `超标摄入 ${Math.abs(historyBalance)} kcal` }}
            </div>
            <p class="history-note">详细记录已归档，仅展示核心指标。</p>
        </el-card>
    </div>

    <!-- Floating Action Buttons -->
    <div class="fab-container">
        <el-tooltip content="AI 智能分析" placement="left">
            <el-button type="warning" circle class="fab-btn ai-fab" @click="openAiDialog">
                ✨
            </el-button>
        </el-tooltip>
        <el-tooltip content="添加食物" placement="left">
            <el-button type="success" circle class="fab-btn add-fab" @click="addDrawerVisible = true">
                <el-icon><Plus /></el-icon>
            </el-button>
        </el-tooltip>
    </div>

    <!-- Add Food Drawer/Sheet -->
    <el-drawer v-model="addDrawerVisible" title="添加饮食" direction="btt" size="50%">
        <div class="add-options">
            <div class="option-card" @click="openManualAdd">
                <div class="icon-box"><el-icon><Edit /></el-icon></div>
                <span>自定义添加</span>
            </div>
            <div class="option-card" @click="openFavorites">
                <div class="icon-box"><el-icon><StarFilled /></el-icon></div>
                <span>常吃收藏库</span>
            </div>
        </div>
    </el-drawer>

    <!-- Manual Add Dialog -->
    <el-dialog v-model="manualDialogVisible" title="自定义食物" width="90%" class="responsive-dialog">
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
            <el-button type="primary" :loading="isSubmitting" @click="handleManualAdd">确认添加</el-button>
        </template>
    </el-dialog>

    <!-- Favorites Dialog -->
    <el-dialog v-model="favoritesDialogVisible" title="常吃食物库" width="90%" class="responsive-dialog">
        <div class="search-bar">
            <el-input v-model="searchQuery" placeholder="搜索收藏..." prefix-icon="Search" clearable />
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

    <!-- AI Dialog (Reused logic) -->
    <el-dialog v-model="aiDialogVisible" title="AI 智能分析" width="90%" class="responsive-dialog">
         <el-input
            v-model="aiDescription"
            :rows="4"
            type="textarea"
            placeholder="描述你的食物，例如：一碗牛肉面..."
        />
        <!-- AI Presets (Simplified for mobile) -->
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

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useDietStore } from '../stores/diet'
import { useUserStore } from '../stores/user'
import { Plus, Delete, Edit, Star, StarFilled, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const dietStore = useDietStore()
const userStore = useUserStore()

// State
const currentDate = ref(dietStore.today)
const addDrawerVisible = ref(false)
const manualDialogVisible = ref(false)
const favoritesDialogVisible = ref(false)
const aiDialogVisible = ref(false)
const isSubmitting = ref(false)

// Data
const meals = [
    { key: 'breakfast', label: '早餐' },
    { key: 'lunch', label: '午餐' },
    { key: 'dinner', label: '晚餐' },
    { key: 'snack', label: '加餐/零食' }
]

const today = computed(() => dietStore.today)
const currentLog = computed(() => dietStore.logs[currentDate.value] || { breakfast: [], lunch: [], dinner: [], snack: [] })

const dayIntake = computed(() => {
    let total = 0
    Object.values(currentLog.value).forEach(list => {
        list.forEach(i => total += Number(i.calories))
    })
    return { calories: total }
})

const isDayEmpty = computed(() => {
    return Object.values(currentLog.value).every(list => list.length === 0)
})

// Date Logic for History Limit
const canShowDetails = computed(() => {
    const d = new Date(currentDate.value)
    const t = new Date(today.value)
    const diffTime = Math.abs(t - d)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
    // allow today (0) and yesterday (1)
    return diffDays <= 1
})

const historyBalance = computed(() => {
    // Estimate target (using current target)
    return userStore.targetCalories - dayIntake.value.calories
})

function handleDateChange(val) {
    if (!val) currentDate.value = today.value
}

function getMealCalories(mealKey) {
    return currentLog.value[mealKey]?.reduce((acc, curr) => acc + Number(curr.calories), 0) || 0
}

// Add Food Logic
const foodForm = reactive({ name: '', calories: 0, carbs: 0, protein: 0, fat: 0 })

function openManualAdd() {
    Object.assign(foodForm, { name: '', calories: 0, carbs: 0, protein: 0, fat: 0 })
    addDrawerVisible.value = false
    manualDialogVisible.value = true
}

async function handleManualAdd() {
    if (!foodForm.name) return ElMessage.warning('请输入名称')
    if (isSubmitting.value) return
    isSubmitting.value = true
    try {
        dietStore.addFood(null, { ...foodForm }) // Auto categorize
        manualDialogVisible.value = false
        ElMessage.success('添加成功')
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

function openFavorites() {
    addDrawerVisible.value = false
    favoritesDialogVisible.value = true
}

function selectFavorite(item) {
    dietStore.addFood(null, { ...item })
    favoritesDialogVisible.value = false
    ElMessage.success('已从收藏库添加')
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

<style scoped>
.diet-container {
    padding-bottom: 80px; /* Space for FAB */
    position: relative;
    min-height: 100%;
}
.date-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    background: #fff;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.meal-card { margin-bottom: 15px; }
.meal-header { display: flex; justify-content: space-between; font-weight: bold; }
.meal-cals { color: #909399; font-size: 14px; }
.food-info { display: flex; flex-direction: column; }
.food-name { font-weight: 500; }
.food-macros { font-size: 12px; color: #909399; }

.fab-container {
    position: fixed;
    bottom: 80px; /* Above mobile nav */
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    z-index: 999;
}
.fab-btn {
    width: 56px;
    height: 56px;
    font-size: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
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

.history-summary-view {
    display: flex;
    justify-content: center;
    margin-top: 40px;
}
.summary-card {
    width: 100%;
    max-width: 400px;
    text-align: center;
}
.summary-badge {
    display: inline-block;
    padding: 10px 20px;
    border-radius: 20px;
    color: white;
    font-weight: bold;
    font-size: 18px;
    margin: 20px 0;
}
.summary-badge.green { background: #67c23a; }
.summary-badge.red { background: #f56c6c; }
.history-note { color: #909399; font-size: 13px; }
.sub-label { text-align: center; font-size: 12px; color: #909399; margin-top: 5px; }

/* Responsive Dialogs */
@media (max-width: 768px) {
    .responsive-dialog { width: 95% !important; }
}
</style>
