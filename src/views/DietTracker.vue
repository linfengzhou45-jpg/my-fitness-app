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
        style="width: 140px"
      />
      <div class="daily-summary" v-if="currentDate === today">
          <span class="summary-text">今日摄入: {{ dayIntake.calories }} kcal</span>
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
                <el-table-column width="140" align="right">
                    <template #default="scope">
                        <el-button 
                            type="primary" 
                            :icon="Edit" 
                            circle 
                            plain
                            size="small" 
                            @click="openEditFood(meal.key, scope.$index, scope.row)" 
                        />
                        <el-button 
                            :type="dietStore.isFavorite(scope.row) ? 'warning' : 'info'" 
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

  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useDietStore } from '../stores/diet'
import { useUserStore } from '../stores/user'
import { Delete, Edit, Star, StarFilled } from '@element-plus/icons-vue'

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
.summary-text { font-weight: bold; color: #409eff; }
</style>