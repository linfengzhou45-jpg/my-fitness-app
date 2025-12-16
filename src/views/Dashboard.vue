<template>
  <div class="dashboard-container">
    <div class="top-bar">
        <h2>健康数据</h2>
        <div class="actions">
            <el-button type="primary" plain size="small" @click="dialogWeightVisible = true">
                记录体重
            </el-button>
        </div>
    </div>
    
    <!-- Workout Settings -->
    <el-card class="workout-card">
        <div class="workout-header">
            <span class="workout-label">🏋️ 运动模式</span>
            <el-switch v-model="workoutActive" active-color="#13ce66" @change="handleWorkoutActiveChange" />
        </div>
        
        <div v-if="workoutActive" class="workout-controls animate-fade-in">
            <div class="intensity-presets">
                <el-radio-group v-model="workoutLevel" size="small" @change="handleLevelChange">
                    <el-radio-button label="casual">休闲</el-radio-button>
                    <el-radio-button label="moderate">适量</el-radio-button>
                    <el-radio-button label="intense">较强</el-radio-button>
                    <el-radio-button label="extreme">极限</el-radio-button>
                </el-radio-group>
            </div>
            <div class="slider-container">
                <span class="slider-label">额外消耗: {{ workoutCalories }} kcal</span>
                <el-slider 
                    v-model="workoutCalories" 
                    :min="100" 
                    :max="1000" 
                    :step="50" 
                    @change="handleSliderChange" 
                    style="flex: 1; margin-left: 15px;" 
                />
            </div>
        </div>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- Calories & Macros -->
      <el-col :xs="24" :sm="8">
        <el-card class="calorie-card">
          <template #header>
            <div class="card-header">
              <span>热量摄入</span>
            </div>
          </template>
          <div class="stat-value">
            {{ todayIntake.calories }} / {{ targetCalories }} kcal
          </div>
          <el-progress 
            :percentage="Number(Math.min((todayIntake.calories / targetCalories) * 100, 100).toFixed(1))" 
            :status="caloriesStatus"
            :stroke-width="18"
            text-inside
          />
          <div class="tips" v-if="todayIntake.calories > targetCalories">
            ⚠️ 摄入超标 {{ todayIntake.calories - targetCalories }} kcal
          </div>
          <div class="tips success" v-else>
             还可摄入 {{ targetCalories - todayIntake.calories }} kcal
          </div>
          
          <el-divider>三大营养素</el-divider>
           <BaseChart :options="macroPieOptions" height="250px" />
        </el-card>
      </el-col>

      <!-- Details & Trends -->
      <el-col :xs="24" :sm="16">
        <!-- Macros Progress -->
        <el-card style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span>营养素进度</span>
            </div>
          </template>
          <el-row :gutter="10" class="macros-container">
            <el-col :span="8">
              <div class="macro-item">
                <div class="label">碳水</div>
                <el-progress type="dashboard" :width="80" :percentage="getPercentage(todayIntake.carbs, macros.carbs)" color="#409eff">
                  <template #default="{ percentage }">
                    <div class="percentage-value">{{ todayIntake.carbs }}/{{ macros.carbs }}</div>
                  </template>
                </el-progress>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="macro-item">
                <div class="label">蛋白质</div>
                <el-progress type="dashboard" :width="80" :percentage="getPercentage(todayIntake.protein, macros.protein)" color="#67c23a">
                  <template #default="{ percentage }">
                    <div class="percentage-value">{{ todayIntake.protein }}/{{ macros.protein }}</div>
                  </template>
                </el-progress>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="macro-item">
                <div class="label">脂肪</div>
                <el-progress type="dashboard" :width="80" :percentage="getPercentage(todayIntake.fat, macros.fat)" color="#e6a23c">
                  <template #default="{ percentage }">
                    <div class="percentage-value">{{ todayIntake.fat }}/{{ macros.fat }}</div>
                  </template>
                </el-progress>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- Weight Chart -->
        <el-card>
            <template #header>
                <div class="card-header">
                    <span>体重趋势 (kg)</span>
                </div>
            </template>
            <BaseChart :options="weightChartOptions" height="250px" />
        </el-card>
      </el-col>
    </el-row>

    <!-- History Summary -->
    <el-card style="margin-top: 20px;">
        <template #header>
            <div class="card-header">
                <span>近期记录 (仅展示余量/超标)</span>
            </div>
        </template>
        <div class="history-list">
             <div v-for="h in historyData" :key="h.date" class="history-item">
                <span class="date">{{ h.date }}</span>
                <span v-if="h.balance >= 0" class="badge green">余量 {{ h.balance }} kcal</span>
                <span v-else class="badge red">超标 {{ Math.abs(h.balance) }} kcal</span>
             </div>
             <div v-if="historyData.length === 0" class="no-data">暂无历史数据</div>
        </div>
    </el-card>

    <!-- Log Weight Dialog -->
    <el-dialog v-model="dialogWeightVisible" title="记录今日体重" width="300px">
        <el-input-number v-model="newWeight" :precision="1" :step="0.1" :min="30" :max="300" style="width: 100%" />
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogWeightVisible = false">取消</el-button>
                <el-button type="primary" @click="handleLogWeight">保存</el-button>
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
    
    // Simple logic: we don't have historical "target calories" stored, 
    // so we estimate using CURRENT target (approximation). 
    // Ideally backend should store daily summary.
    // For now, using current target is the best best without major backend refactor.
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
    legend: { top: '0%', left: 'center' },
    series: [
        {
            name: '摄入来源',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
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
        tooltip: { trigger: 'axis' },
        grid: { left: '10%', right: '5%', bottom: '10%', top: '10%' },
        xAxis: { type: 'category', data: dates },
        yAxis: { type: 'value', min: 'dataMin', scale: true }, 
        series: [{
            data: weights,
            type: 'line',
            smooth: true,
            areaStyle: { opacity: 0.2 },
            lineStyle: { color: '#8e44ad' },
            itemStyle: { color: '#8e44ad' }
        }]
    }
})
</script>

<style scoped>
.dashboard-container {
    padding-bottom: 20px;
}
.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}
.top-bar h2 { margin: 0; font-size: 20px; }

.workout-card { margin-bottom: 20px; }
.workout-header { display: flex; align-items: center; justify-content: space-between; }
.workout-label { font-weight: bold; font-size: 16px; margin-right: 10px; }
.workout-controls { margin-top: 15px; }
.intensity-presets { margin-bottom: 15px; display: flex; justify-content: center; }
.slider-container { display: flex; align-items: center; }
.slider-label { min-width: 140px; font-size: 14px; color: #606266; }

.stat-value {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin: 15px 0;
  color: #303133;
}
.tips {
    margin-top: 15px;
    text-align: center;
    font-size: 13px;
    color: #f56c6c;
}
.tips.success { color: #67c23a; }
.macros-container { text-align: center; }
.macro-item { display: flex; flex-direction: column; align-items: center; }
.percentage-value { font-size: 12px; margin-top: 5px; color: #606266; }

.history-list { display: flex; flex-direction: column; gap: 10px; }
.history-item { 
    display: flex; justify-content: space-between; align-items: center; 
    padding: 10px; background: #f8f9fa; border-radius: 4px; 
}
.badge { padding: 4px 8px; border-radius: 12px; color: #fff; font-size: 12px; }
.badge.green { background-color: #67c23a; }
.badge.red { background-color: #f56c6c; }
.no-data { text-align: center; color: #909399; padding: 20px; }

.animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>