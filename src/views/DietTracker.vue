<template>
  <div class="diet-container animate-fade-in">
    <!-- Date Picker & Header -->
    <div class="control-bar">
       <div class="date-selector">
           <el-icon class="calendar-icon"><Calendar /></el-icon>
           <el-date-picker
            v-model="currentDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="(time) => time.getTime() > Date.now()"
            @change="handleDateChange"
            class="custom-date-picker"
            :clearable="false"
          />
       </div>
      <div class="daily-summary" v-if="currentDate === today">
          <span class="summary-label">今日摄入</span>
          <span class="summary-value">{{ dayIntake.calories }} <small>kcal</small></span>
      </div>
    </div>

    <!-- Main Content Area -->
    <div v-if="canShowDetails" class="meals-container">
        <div v-for="(meal, index) in meals" :key="meal.key" class="meal-wrapper" :style="{ animationDelay: `${index * 0.1}s` }">
            <el-card class="meal-card" shadow="hover" :body-style="{ padding: '0' }">
                <template #header>
                    <div class="meal-header">
                        <div class="header-left">
                            <el-icon class="meal-icon" :class="meal.key">
                                <component :is="mealIconMap[meal.key]" />
                            </el-icon>
                            <span class="meal-title">{{ meal.label }}</span>
                        </div>
                        <span class="meal-cals">{{ getMealCalories(meal.key) }} kcal</span>
                    </div>
                </template>
                
                <div v-if="currentLog[meal.key] && currentLog[meal.key].length > 0" class="food-list">
                    <div v-for="(item, idx) in currentLog[meal.key]" :key="idx" class="food-item">
                        <div class="food-info">
                            <div class="food-name">{{ item.name }}</div>
                            <div class="food-macros">
                                <span class="cal-badge">{{ item.calories }} kcal</span>
                                <span class="macro-text">C:{{ item.carbs }} P:{{ item.protein }} F:{{ item.fat }}</span>
                            </div>
                        </div>
                        <div class="food-actions">
                             <el-tooltip content="编辑" placement="top">
                                <el-button type="primary" link :icon="Edit" @click="openEditFood(meal.key, idx, item)" />
                             </el-tooltip>
                             <el-tooltip :content="dietStore.isFavorite(item) ? '取消收藏' : '收藏'" placement="top">
                                <el-button 
                                    :type="dietStore.isFavorite(item) ? 'warning' : 'info'" 
                                    link 
                                    :icon="dietStore.isFavorite(item) ? StarFilled : Star" 
                                    @click="dietStore.toggleFavorite(item)" 
                                />
                             </el-tooltip>
                             <el-tooltip content="删除" placement="top">
                                <el-button type="danger" link :icon="Delete" @click="dietStore.removeFood(meal.key, idx)" />
                             </el-tooltip>
                        </div>
                    </div>
                </div>
                <div v-else class="empty-meal">
                    <span class="empty-text">点击右下角添加食物</span>
                </div>
            </el-card>
        </div>
        
        <div class="empty-state" v-if="isDayEmpty">
            <el-empty description="今天还没有记录饮食哦" :image-size="100" />
        </div>
    </div>

    <!-- Historical Summary View (For older dates) -->
    <div v-else class="history-summary-view">
        <el-card class="summary-card modern-card">
            <h3>{{ currentDate }} 饮食概览</h3>
            <div class="summary-badge" :class="historyBalance >= 0 ? 'green' : 'red'">
                {{ historyBalance >= 0 ? `剩余额度 ${historyBalance} kcal` : `超标摄入 ${Math.abs(historyBalance)} kcal` }}
            </div>
            <p class="history-note">详细记录已归档，仅展示核心指标。</p>
        </el-card>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useDietStore } from '../stores/diet'
import { useUserStore } from '../stores/user'
import { Delete, Edit, Star, StarFilled, Calendar, Sunrise, Sunny, Sunset, CoffeeCup } from '@element-plus/icons-vue'

const dietStore = useDietStore()
const userStore = useUserStore()

// Inject global openEdit function from App.vue
const openEditFood = inject('openEditFood')

// State
const currentDate = ref(dietStore.today)

// Data
const meals = [
    { key: 'breakfast', label: '早餐' },
    { key: 'lunch', label: '午餐' },
    { key: 'dinner', label: '晚餐' },
    { key: 'snack', label: '加餐/零食' }
]

const mealIconMap = {
    breakfast: Sunrise,
    lunch: Sunny,
    dinner: Sunset,
    snack: CoffeeCup
}

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
</script>

<style scoped>
.diet-container {
    padding-bottom: 90px; /* Space for FAB */
    position: relative;
    min-height: 100%;
    max-width: 800px;
    margin: 0 auto;
}

/* Control Bar */
.control-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    background: #fff;
    padding: 15px 20px;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
}
.date-selector {
    display: flex;
    align-items: center;
    gap: 10px;
}
.calendar-icon { font-size: 20px; color: #409eff; }
.custom-date-picker { width: 150px; }

.daily-summary {
    text-align: right;
}
.summary-label { display: block; font-size: 12px; color: #909399; }
.summary-value { font-size: 20px; font-weight: bold; color: #2c3e50; }
.summary-value small { font-size: 14px; font-weight: normal; color: #909399; }

/* Meal Cards */
.meals-container { display: flex; flex-direction: column; gap: 20px; }
.meal-wrapper { animation: slideUp 0.5s ease-out both; }

.meal-card {
    border: none;
    border-radius: 16px;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
}
.meal-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.06);
}

.meal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background: linear-gradient(to right, #f9fafb, #fff);
}
.header-left { display: flex; align-items: center; gap: 10px; }
.meal-title { font-weight: 600; color: #2c3e50; font-size: 16px; }
.meal-cals { font-weight: 500; color: #909399; font-size: 14px; }

.meal-icon {
    font-size: 20px;
    padding: 6px;
    border-radius: 8px;
}
.meal-icon.breakfast { color: #e67e22; background: rgba(230, 126, 34, 0.1); }
.meal-icon.lunch { color: #f1c40f; background: rgba(241, 196, 15, 0.1); }
.meal-icon.dinner { color: #9b59b6; background: rgba(155, 89, 182, 0.1); }
.meal-icon.snack { color: #1abc9c; background: rgba(26, 188, 156, 0.1); }

/* Food List */
.food-list { padding: 5px 0; }
.food-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    border-bottom: 1px solid #f5f7fa;
    transition: background 0.2s;
}
.food-item:last-child { border-bottom: none; }
.food-item:hover { background: #fcfcfc; }

.food-info { display: flex; flex-direction: column; gap: 4px; }
.food-name { font-weight: 500; font-size: 15px; color: #2c3e50; }
.food-macros { display: flex; align-items: center; gap: 10px; font-size: 12px; }
.cal-badge { 
    background: #f0f2f5; color: #606266; 
    padding: 2px 6px; border-radius: 4px; font-weight: 600; 
}
.macro-text { color: #909399; }

.food-actions { display: flex; gap: 5px; opacity: 0.6; transition: opacity 0.2s; }
.food-item:hover .food-actions { opacity: 1; }

.empty-meal {
    padding: 20px;
    text-align: center;
    color: #c0c4cc;
    font-size: 13px;
    font-style: italic;
}

/* History View */
.history-summary-view {
    display: flex;
    justify-content: center;
    margin-top: 40px;
}
.summary-card {
    width: 100%;
    max-width: 400px;
    text-align: center;
    padding: 20px;
}
.summary-badge {
    display: inline-block;
    padding: 10px 25px;
    border-radius: 30px;
    color: white;
    font-weight: bold;
    font-size: 16px;
    margin: 25px 0;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}
.summary-badge.green { background: linear-gradient(135deg, #2ecc71, #27ae60); }
.summary-badge.red { background: linear-gradient(135deg, #e74c3c, #c0392b); }
.history-note { color: #909399; font-size: 13px; }

/* Animations */
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
</style>