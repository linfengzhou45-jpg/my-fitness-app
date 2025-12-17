<template>
  <div class="dashboard-container">
    <div class="dashboard-header animate-fade-in">
        <div class="header-text">
            <h2>健康概览</h2>
            <p>Today's Health Summary</p>
        </div>
        <div class="actions">
            <el-button type="primary" round :icon="Edit" @click="dialogWeightVisible = true">
                记录体重
            </el-button>
        </div>
    </div>
    
    <!-- Workout Settings -->
    <el-card class="modern-card workout-card animate-slide-up" shadow="hover">
        <div class="workout-header">
            <div class="header-left">
                 <div class="icon-wrapper bg-orange">
                    <el-icon><Stopwatch /></el-icon>
                 </div>
                 <span class="card-title">运动模式</span>
            </div>
            <el-switch v-model="workoutActive" active-color="#ff9f43" @change="handleWorkoutActiveChange" />
        </div>
        
        <div v-if="workoutActive" class="workout-controls">
            <div class="intensity-presets">
                <el-radio-group v-model="workoutLevel" size="default" @change="handleLevelChange" fill="#ff9f43">
                    <el-radio-button label="casual">休闲</el-radio-button>
                    <el-radio-button label="moderate">适量</el-radio-button>
                    <el-radio-button label="intense">较强</el-radio-button>
                    <el-radio-button label="extreme">极限</el-radio-button>
                </el-radio-group>
            </div>
            <div class="slider-container">
                <span class="slider-label">额外消耗: <strong>{{ workoutCalories }}</strong> kcal</span>
                <el-slider 
                    v-model="workoutCalories" 
                    :min="100" 
                    :max="1000" 
                    :step="50" 
                    @change="handleSliderChange" 
                    style="flex: 1; margin-left: 20px;" 
                />
            </div>
        </div>
    </el-card>

    <el-row :gutter="32" class="main-stats-row">
      <!-- Calories & Macros -->
      <el-col :xs="24" :lg="8" class="animate-slide-up delay-1">
        <el-card class="modern-card calorie-card" shadow="hover">
          <template #header>
            <div class="card-header">
                <div class="header-left">
                    <div class="icon-wrapper bg-blue">
                        <el-icon><Odometer /></el-icon>
                    </div>
                    <span>热量摄入</span>
                </div>
            </div>
          </template>
          
          <div class="calorie-display">
            <div class="number-display">
                <span class="current">{{ todayIntake.calories }}</span>
                <span class="divider">/</span>
                <span class="target">{{ targetCalories }}</span>
                <span class="unit">kcal</span>
            </div>
            <el-progress 
                :percentage="Number(Math.min((todayIntake.calories / targetCalories) * 100, 100).toFixed(1))" 
                :status="caloriesStatus"
                :stroke-width="20"
                :show-text="false"
                class="main-progress"
            />
             <div class="tips-container">
                <div class="tips warning" v-if="todayIntake.calories > targetCalories">
                    <el-icon><Warning /></el-icon> 
                    <span>已超标 {{ todayIntake.calories - targetCalories }} kcal</span>
                </div>
                <div class="tips success" v-else>
                    <el-icon><CircleCheck /></el-icon>
                    <span>剩余 {{ targetCalories - todayIntake.calories }} kcal</span>
                </div>
            </div>
          </div>
          
          <el-divider class="custom-divider">营养素分布</el-divider>
           <BaseChart :options="macroPieOptions" height="220px" />
        </el-card>
      </el-col>

      <!-- Details & Trends -->
      <el-col :xs="24" :lg="16" class="animate-slide-up delay-2">
        <!-- Macros Progress -->
        <el-card class="modern-card mb-20" shadow="hover">
          <template #header>
            <div class="card-header">
                <div class="header-left">
                    <div class="icon-wrapper bg-green">
                        <el-icon><PieChart /></el-icon>
                    </div>
                    <span>营养素进度</span>
                </div>
            </div>
          </template>
          <el-row :gutter="20" class="macros-container">
            <el-col :span="8">
              <div class="macro-item">
                <el-progress type="dashboard" :width="100" :percentage="getPercentage(todayIntake.carbs, macros.carbs)" color="#409eff">
                  <template #default="{ percentage }">
                    <div class="macro-val">{{ todayIntake.carbs }}g</div>
                    <div class="macro-target">/ {{ macros.carbs }}g</div>
                  </template>
                </el-progress>
                <div class="macro-label">碳水化合物</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="macro-item">
                <el-progress type="dashboard" :width="100" :percentage="getPercentage(todayIntake.protein, macros.protein)" color="#67c23a">
                  <template #default="{ percentage }">
                    <div class="macro-val">{{ todayIntake.protein }}g</div>
                    <div class="macro-target">/ {{ macros.protein }}g</div>
                  </template>
                </el-progress>
                <div class="macro-label">蛋白质</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="macro-item">
                <el-progress type="dashboard" :width="100" :percentage="getPercentage(todayIntake.fat, macros.fat)" color="#e6a23c">
                  <template #default="{ percentage }">
                    <div class="macro-val">{{ todayIntake.fat }}g</div>
                    <div class="macro-target">/ {{ macros.fat }}g</div>
                  </template>
                </el-progress>
                <div class="macro-label">脂肪</div>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- Weight Chart -->
        <el-card class="modern-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <div class="header-left">
                        <div class="icon-wrapper bg-purple">
                            <el-icon><TrendCharts /></el-icon>
                        </div>
                        <span>体重趋势</span>
                    </div>
                </div>
            </template>
            <BaseChart :options="weightChartOptions" height="250px" />
        </el-card>
      </el-col>
    </el-row>

    <!-- History Summary -->
    <el-card class="modern-card mt-20 animate-slide-up delay-3" shadow="hover">
        <template #header>
            <div class="card-header">
                <div class="header-left">
                     <div class="icon-wrapper bg-gray">
                        <el-icon><Calendar /></el-icon>
                    </div>
                    <span>近期概况</span>
                </div>
                <span class="subtitle">仅展示热量结余</span>
            </div>
        </template>
        <div class="history-list">
             <div v-for="h in historyData" :key="h.date" class="history-item">
                <span class="date">{{ h.date }}</span>
                <div class="balance-tag" :class="h.balance >= 0 ? 'is-success' : 'is-warning'">
                    {{ h.balance >= 0 ? '余量' : '超标' }}
                    <strong>{{ Math.abs(h.balance) }}</strong> kcal
                </div>
             </div>
             <div v-if="historyData.length === 0" class="no-data">
                 <el-empty description="暂无历史数据" image-size="60" />
             </div>
        </div>
    </el-card>

    <!-- Log Weight Dialog -->
    <el-dialog v-model="dialogWeightVisible" title="记录今日体重" width="320px" center destroy-on-close class="custom-dialog">
        <div class="weight-input-container">
             <el-input-number v-model="newWeight" :precision="1" :step="0.1" :min="30" :max="300" size="large" />
             <span class="unit">kg</span>
        </div>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogWeightVisible = false" round>取消</el-button>
                <el-button type="primary" @click="handleLogWeight" round>保存记录</el-button>
            </span>
        </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '../stores/user'
import { useDietStore } from '../stores/diet'
import { storeToRefs } from 'pinia'
import BaseChart from '../components/BaseChart.vue'
import { ElMessage } from 'element-plus'
import { Edit, Stopwatch, Odometer, Warning, CircleCheck, PieChart, TrendCharts, Calendar } from '@element-plus/icons-vue'

const userStore = useUserStore()
const dietStore = useDietStore()

const { targetCalories, macros, workoutSettings, weightHistory } = storeToRefs(userStore)
const { todayIntake, logs, today } = storeToRefs(dietStore)

const dialogWeightVisible = ref(false)
const newWeight = ref(userStore.profile.weight)

// Workout Local State
const workoutActive = ref(workoutSettings.value.active)
const workoutLevel = ref(workoutSettings.value.level)
const workoutCalories = ref(workoutSettings.value.calories)

// Sync local state to store
const updateWorkoutSettings = () => {
    userStore.setWorkoutMode(workoutActive.value, workoutLevel.value, workoutCalories.value)
}

function handleWorkoutActiveChange() {
    updateWorkoutSettings()
    ElMessage.info(workoutActive.value ? '已开启运动模式' : '已关闭运动模式')
}

function handleLevelChange(val) {
    const presets = { casual: 200, moderate: 400, intense: 600, extreme: 800 }
    if (presets[val]) {
        workoutCalories.value = presets[val]
        updateWorkoutSettings()
    }
}

function handleSliderChange() {
    updateWorkoutSettings()
}

// Watch store changes to update local (in case changed elsewhere)
watch(workoutSettings, (newVal) => {
    workoutActive.value = newVal.active
    workoutLevel.value = newVal.level
    workoutCalories.value = newVal.calories
}, { deep: true })


const caloriesStatus = computed(() => {
  const p = (todayIntake.value.calories / targetCalories.value) * 100
  if (p > 100) return 'exception'
  if (p > 85) return 'warning'
  return 'success'
})

function handleLogWeight() {
    userStore.logWeight(newWeight.value)
    dialogWeightVisible.value = false
    ElMessage.success('体重记录成功')
}

function getPercentage(current, target) {
  if (target === 0) return 0
  return Math.min(Math.round((current / target) * 100), 100)
}

// History Logic
const historyData = computed(() => {
    // Get past 7 days excluding today
    const days = []
    const sortedDates = Object.keys(logs.value).sort().reverse()
    const baseTarget = targetCalories.value 
    
    sortedDates.forEach(date => {
        if (date === today.value) return // Skip today
        
        const dayLog = logs.value[date]
        let dayCals = 0
        Object.values(dayLog).forEach(meal => {
            meal.forEach(item => dayCals += Number(item.calories))
        })
        
        days.push({
            date,
            balance: baseTarget - dayCals
        })
    })
    return days.slice(0, 7) // Show last 7 entries
})

// Chart Options
const macroPieOptions = computed(() => ({
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', left: 'center', icon: 'circle' },
    series: [
        {
            name: '摄入来源',
            type: 'pie',
            radius: ['45%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
            labelLine: { show: false },
            data: [
                { value: todayIntake.value.carbs * 4, name: '碳水', itemStyle: { color: '#409eff' } },
                { value: todayIntake.value.protein * 4, name: '蛋白质', itemStyle: { color: '#67c23a' } },
                { value: todayIntake.value.fat * 9, name: '脂肪', itemStyle: { color: '#e6a23c' } }
            ]
        }
    ]
}))

const weightChartOptions = computed(() => {
    const dates = weightHistory.value.map(item => item.date)
    const weights = weightHistory.value.map(item => item.weight)
    
    return {
        tooltip: { 
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#eee',
            textStyle: { color: '#333' }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
        xAxis: { 
            type: 'category', 
            data: dates,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#999' }
        },
        yAxis: { 
            type: 'value', 
            min: 'dataMin', 
            scale: true,
            splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
        }, 
        series: [{
            data: weights,
            type: 'line',
            smooth: true,
            symbolSize: 8,
            lineStyle: { color: '#8e44ad', width: 3 },
            itemStyle: { color: '#8e44ad', borderWidth: 2, borderColor: '#fff' },
            areaStyle: { 
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [{ offset: 0, color: 'rgba(142, 68, 173, 0.2)' }, { offset: 1, color: 'rgba(142, 68, 173, 0)' }]
                }
            }
        }]
    }
})
</script>

<style scoped>
.dashboard-container {
    padding-bottom: 30px;
    max-width: 1200px;
    margin: 0 auto;
}

/* Header Styles */
.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    padding: 10px 5px;
}
.header-text h2 { margin: 0; font-size: 24px; color: #2c3e50; }
.header-text p { margin: 5px 0 0; color: #7f8c8d; font-size: 14px; }

/* Common Card Styles */
.modern-card {
    border: none;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    transition: transform 0.3s, box-shadow 0.3s;
    overflow: hidden;
}
.modern-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.06);
}
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.header-left { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 16px; color: #2c3e50; }
.subtitle { font-size: 12px; color: #999; font-weight: normal; }

/* Icon Wrappers */
.icon-wrapper {
    width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white;
}
.bg-orange { background: linear-gradient(135deg, #ff9f43, #ff6b6b); }
.bg-blue { background: linear-gradient(135deg, #54a0ff, #2e86de); }
.bg-green { background: linear-gradient(135deg, #2ed573, #7bed9f); }
.bg-purple { background: linear-gradient(135deg, #a55eea, #8854d0); }
.bg-gray { background: linear-gradient(135deg, #a4b0be, #747d8c); }

/* Workout Card */
.workout-card { margin-bottom: 25px; border-left: 5px solid #ff9f43; }
.workout-header { display: flex; justify-content: space-between; align-items: center; }
.workout-controls { margin-top: 20px; padding-top: 10px; border-top: 1px dashed #eee; }
.intensity-presets { margin-bottom: 15px; display: flex; justify-content: center; }
.slider-container { display: flex; align-items: center; padding: 0 10px; }

/* Calorie Card */
.calorie-display { text-align: center; padding: 10px 0; }
.number-display { font-size: 28px; font-weight: 700; color: #2c3e50; margin-bottom: 15px; }
.number-display .divider { color: #ccc; font-weight: 300; margin: 0 5px; }
.number-display .target { color: #95a5a6; font-size: 20px; }
.number-display .unit { font-size: 14px; color: #95a5a6; font-weight: normal; margin-left: 5px; }
.tips-container { margin-top: 15px; min-height: 24px; display: flex; justify-content: center; }
.tips { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 500; }
.tips.warning { color: #e74c3c; }
.tips.success { color: #27ae60; }
.custom-divider { margin: 25px 0 15px; }

/* Macros */
.macros-container { text-align: center; padding: 10px 0; }
.macro-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.macro-val { font-size: 16px; font-weight: bold; color: #2c3e50; }
.macro-target { font-size: 12px; color: #95a5a6; }
.macro-label { font-size: 13px; color: #7f8c8d; }

/* History List */
.history-list { display: flex; flex-direction: column; gap: 12px; }
.history-item { 
    display: flex; justify-content: space-between; align-items: center; 
    padding: 12px 15px; background: #f8f9fa; border-radius: 10px;
    transition: background 0.2s;
}
.history-item:hover { background: #f1f2f6; }
.date { color: #2c3e50; font-weight: 500; }
.balance-tag { padding: 4px 12px; border-radius: 20px; font-size: 13px; }
.balance-tag.is-success { background: rgba(46, 213, 115, 0.15); color: #27ae60; }
.balance-tag.is-warning { background: rgba(255, 71, 87, 0.15); color: #e74c3c; }
.mt-20 { margin-top: 20px; }
.mb-20 { margin-bottom: 20px; }

/* Weight Dialog */
.weight-input-container { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 20px 0; }
.weight-input-container .unit { font-size: 18px; font-weight: bold; color: #2c3e50; }

/* Animations */
.animate-fade-in { animation: fadeIn 0.6s ease-out; }
.animate-slide-up { animation: slideUp 0.6s ease-out both; }
.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 768px) {
    .header-text h2 { font-size: 20px; }
}

@media (max-width: 1199px) {
    .calorie-card {
        margin-bottom: 20px;
    }
}
</style>