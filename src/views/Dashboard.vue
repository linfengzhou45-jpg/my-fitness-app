<template>
  <div class="bento-dashboard">
    <!-- Header -->
    <header class="dashboard-head">
      <div>
        <h1 class="greeting">早安, {{ userStore.profile.name || 'Champion' }}! ☀️</h1>
        <p class="subtitle">让今天的每一卡路里都算数。</p>
      </div>
      <button class="action-btn" @click="dialogWeightVisible = true">
         <el-icon><ScaleToOriginal /></el-icon> 记体重
      </button>
    </header>

    <!-- Bento Grid (Mobile Only Layout) -->
    <div class="bento-grid">
      <!-- 1. Hero: Calories -->
      <div class="bento-card calorie-hero animate-pop delay-1">
         <div class="hero-content">
            <div class="hero-text">
                <span class="label">今日热量</span>
                <span class="big-val">{{ todayIntake.calories }}</span>
                <span class="target">/ {{ targetCalories }} kcal</span>
            </div>
            <div class="ring-wrapper">
                 <el-progress 
                    type="dashboard" 
                    :percentage="Number(Math.min((todayIntake.calories / targetCalories) * 100, 100).toFixed(1))" 
                    :width="110"
                    :stroke-width="10"
                    :color="caloriesStatusColor"
                >
                    <template #default="{ percentage }">
                        <div class="ring-inner">
                            <span class="ring-pct">{{ percentage }}%</span>
                        </div>
                    </template>
                </el-progress>
            </div>
         </div>
         <div class="mobile-hero-status">{{ getCalorieDiffText }}</div>
      </div>

      <!-- 2. Workout Toggle -->
      <div class="bento-card workout-tile animate-pop delay-2" :class="{ active: workoutActive }" @click="toggleWorkout">
          <div class="w-header">
              <div class="w-status-icon">
                  <el-icon><Stopwatch /></el-icon>
              </div>
              <div class="w-text-content">
                  <span class="w-label">运动模式</span>
                  <span class="w-state">{{ workoutActive ? '进行中' : '休息中' }}</span>
              </div>
              <el-switch v-model="workoutActive" active-color="#00b894" inactive-color="#636e72" @click.stop size="small" />
          </div>
          
           <div v-if="workoutActive" class="w-controls" @click.stop>
                <div class="w-cal-display">
                    <span class="cal-val">{{ workoutCalories }}</span>
                    <span class="cal-unit">kcal</span>
                </div>
                <div class="w-slider-wrap">
                    <el-slider 
                        v-model="workoutCalories" 
                        :min="50" 
                        :max="1500" 
                        :step="10" 
                        :show-tooltip="false"
                        size="small"
                        @change="updateWorkout"
                    />
                </div>
           </div>
           <div v-else class="w-placeholder">
               点击开启以记录额外消耗
           </div>
      </div>

      <!-- 3. Macros (Row of 3) -->
      <div class="bento-card macro-card carb animate-pop delay-3">
         <div class="icon-bubble blue"><el-icon><IceCream /></el-icon></div>
         <div class="macro-info">
            <span class="m-label">碳水</span>
            <span class="m-val">{{ todayIntake.carbs }}<small>g</small></span>
         </div>
      </div>
      
      <div class="bento-card macro-card protein animate-pop delay-3">
         <div class="icon-bubble green"><el-icon><Chicken /></el-icon></div>
         <div class="macro-info">
            <span class="m-label">蛋白</span>
            <span class="m-val">{{ todayIntake.protein }}<small>g</small></span>
         </div>
      </div>

      <div class="bento-card macro-card fat animate-pop delay-3">
         <div class="icon-bubble orange"><el-icon><Burger /></el-icon></div>
         <div class="macro-info">
            <span class="m-label">脂肪</span>
            <span class="m-val">{{ todayIntake.fat }}<small>g</small></span>
         </div>
      </div>

      <!-- 4. Weight Chart -->
      <div class="bento-card weight-tile animate-pop delay-4">
         <div class="tile-header">
             <h3>体重趋势</h3>
             <span class="trend-badge">30天</span>
         </div>
         <div class="chart-wrapper">
             <BaseChart :options="weightChartOptions" height="100%" width="100%" />
         </div>
      </div>

      <!-- 5. History -->
      <div class="bento-card history-tile animate-pop delay-5">
         <h3>近期结余</h3>
         <div class="history-scroll">
             <div v-for="h in historyData" :key="h.date" class="h-row">
                 <div class="h-date">
                     <span class="d-day">{{ h.date.split('-')[2] }}</span>
                     <span class="d-month">{{ h.date.split('-')[1] }}月</span>
                 </div>
                 <div class="h-val" :class="h.balance >= 0 ? 'good' : 'bad'">
                     {{ h.balance >= 0 ? '+' : '' }}{{ h.balance }}
                 </div>
             </div>
             <el-empty v-if="historyData.length === 0" description="No Data" :image-size="60" />
         </div>
      </div>
    </div>

    <!-- Weight Dialog -->
    <el-dialog v-model="dialogWeightVisible" title="记录体重" width="300px" center class="glass-dialog" destroy-on-close>
        <div class="w-input-area">
             <el-input-number v-model="newWeight" :precision="1" :step="0.1" :min="30" :max="300" size="large" />
             <span class="unit">kg</span>
        </div>
        <template #footer>
            <el-button type="primary" @click="handleLogWeight" size="large" round style="width: 100%">保存</el-button>
        </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useDietStore } from '../stores/diet'
import { storeToRefs } from 'pinia'
import BaseChart from '../components/BaseChart.vue'
import { ElMessage } from 'element-plus'
import { ScaleToOriginal, Stopwatch, IceCream, Chicken, Burger } from '@element-plus/icons-vue'

const userStore = useUserStore()
const dietStore = useDietStore()
const { targetCalories, workoutSettings, weightHistory } = storeToRefs(userStore)
const { todayIntake, logs, today } = storeToRefs(dietStore)

const dialogWeightVisible = ref(false)
const newWeight = ref(userStore.profile.weight)

// Workout Logic
const workoutActive = ref(workoutSettings.value.active)
const workoutCalories = ref(workoutSettings.value.calories)

const updateWorkout = () => {
    userStore.setWorkoutMode(workoutActive.value, null, workoutCalories.value)
}
const toggleWorkout = () => {
    // Prevent toggle if clicking controls (handled by stop modifiers, but safe to check)
}

watch(workoutSettings, (newVal) => {
    workoutActive.value = newVal.active
    workoutCalories.value = newVal.calories
}, { deep: true })

watch(workoutActive, (val) => {
    updateWorkout()
})

// Visuals
const caloriesStatusColor = computed(() => {
  const p = (todayIntake.value.calories / targetCalories.value) * 100
  if (p > 100) return '#ff7675'
  if (p > 85) return '#fdcb6e'
  return '#00b894'
})
const getCalorieDiffText = computed(() => {
    const diff = targetCalories.value - todayIntake.value.calories
    return diff >= 0 ? `剩余 ${diff}` : `超 ${Math.abs(diff)}`
})

const historyData = computed(() => {
    const days = []
    const sorted = Object.keys(logs.value).sort().reverse().slice(0, 10)
    sorted.forEach(date => {
        if (date === today.value) return
        let cal = 0
        Object.values(logs.value[date]).forEach(m => m.forEach(i => cal += Number(i.calories)))
        days.push({ date, balance: targetCalories.value - cal })
    })
    return days
})

const weightChartOptions = computed(() => {
    const dates = weightHistory.value.map(i => i.date.slice(5))
    const weights = weightHistory.value.map(i => i.weight)
    return {
        grid: { top: 10, bottom: 20, left: 0, right: 0 },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: dates, show: false },
        yAxis: { type: 'value', min: 'dataMin', show: false },
        series: [{
            data: weights, type: 'line', smooth: true, showSymbol: false,
            lineStyle: { width: 4, color: '#6c5ce7' },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{offset: 0, color: 'rgba(108,92,231,0.2)'}, {offset: 1, color: 'rgba(108,92,231,0)'}] } }
        }]
    }
})

function handleLogWeight() {
    userStore.logWeight(newWeight.value)
    dialogWeightVisible.value = false
    ElMessage.success('Saved')
}
</script>

<style scoped>
.bento-dashboard {
    padding-bottom: 100px;
    width: 100%;
    margin: 0 auto;
}

.dashboard-head {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 20px; padding: 0 5px;
}
.greeting { 
    font-size: 24px; font-weight: 800; margin: 0; 
    background: linear-gradient(135deg, #2d3436 0%, #636e72 100%); 
    -webkit-background-clip: text; color: transparent; 
    letter-spacing: -0.5px;
}
.subtitle { margin: 2px 0 0; color: #b2bec3; font-weight: 500; font-size: 13px; }
.action-btn {
    padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.6); 
    background: rgba(255,255,255,0.5); backdrop-filter: blur(10px);
    font-weight: 700; color: #2d3436; cursor: pointer;
    display: flex; align-items: center; gap: 5px; transition: all 0.3s;
    font-size: 13px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}
.action-btn:hover { background: white; }

/* BENTO GRID SYSTEM (MOBILE ONLY) */
.bento-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: minmax(100px, auto);
    gap: 15px;
    grid-template-areas: 
        "hero hero hero"
        "work work work"
        "carb prot fat"
        "weight weight weight"
        "hist hist hist";
}

.bento-card {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    border-radius: 24px; padding: 15px;
    position: relative; overflow: hidden;
    box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05);
    border: 1px solid rgba(255, 255, 255, 0.6);
}

/* Grid Areas */
.calorie-hero { grid-area: hero; display: flex; flex-direction: row; justify-content: space-between; align-items: center; padding: 20px; }
.workout-tile { grid-area: work; display: flex; flex-direction: column; justify-content: space-between; padding: 15px 20px; }
.macro-card { grid-column: span 1; grid-row: span 1; display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: center; gap: 5px; padding: 12px; }
.carb { grid-area: carb; }
.prot { grid-area: prot; }
.fat { grid-area: fat; }
.weight-tile { grid-area: weight; min-height: 180px; display: flex; flex-direction: column; }
.history-tile { grid-area: hist; min-height: 200px; }

/* 1. Hero Styles */
.hero-content { display: flex; justify-content: space-between; width: 100%; align-items: center; z-index: 1; }
.hero-text { display: flex; flex-direction: column; }
.hero-text .label { font-size: 12px; color: #b2bec3; font-weight: 700; letter-spacing: 1px; margin-bottom: 2px; }
.hero-text .big-val { font-size: 42px; font-weight: 800; line-height: 1; color: #2d3436; letter-spacing: -1px; }
.hero-text .target { font-size: 14px; color: #636e72; font-family: monospace; font-weight: 600; }
.ring-inner { display: flex; flex-direction: column; align-items: center; }
.ring-pct { font-size: 20px; font-weight: 800; color: #2d3436; }
.mobile-hero-status {
    position: absolute; bottom: 10px; right: 20px;
    font-size: 12px; font-weight: 700; color: #2d3436;
    padding: 4px 10px; border-radius: 20px;
    background: rgba(255,255,255,0.5);
    backdrop-filter: blur(5px);
}

/* 2. Workout Styles */
.workout-tile { 
    background: #2d3436 !important; /* Force dark */
    color: white; 
    border: none;
    overflow: visible;
}
.workout-tile.active { border: 2px solid #00b894; }

.w-header { display: flex; align-items: center; gap: 10px; width: 100%; }
.w-status-icon { 
    width: 32px; height: 32px; border-radius: 10px; background: rgba(255,255,255,0.1); 
    display: flex; align-items: center; justify-content: center; font-size: 16px;
}
.workout-tile.active .w-status-icon { background: #00b894; color: white; }

.w-text-content { flex: 1; display: flex; flex-direction: column; }
.w-label { font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 600; }
.w-state { font-size: 14px; font-weight: 700; color: white; }

.w-controls { margin-top: 15px; animation: fadeIn 0.3s; }
.w-cal-display { display: flex; align-items: baseline; gap: 4px; margin-bottom: 5px; }
.cal-val { font-size: 24px; font-weight: 800; color: #00b894; line-height: 1; }
.cal-unit { font-size: 12px; color: rgba(255,255,255,0.6); }

.w-slider-wrap { padding: 0 5px; }
.workout-tile :deep(.el-slider__runway) { background-color: rgba(255,255,255,0.2); height: 4px; margin: 10px 0; }
.workout-tile :deep(.el-slider__bar) { background-color: #00b894; height: 4px; }
.workout-tile :deep(.el-slider__button) { width: 16px; height: 16px; border: 2px solid #00b894; background: white; }

.w-placeholder { 
    margin-top: 10px; font-size: 12px; color: rgba(255,255,255,0.3); 
    text-align: center; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 10px;
}

/* 3. Macro Styles */
.icon-bubble { 
    width: 36px; height: 36px; border-radius: 12px; 
    display: flex; align-items: center; justify-content: center; font-size: 18px; margin-bottom: 5px;
    backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.5);
}
.blue { background: rgba(64, 158, 255, 0.1); color: #409eff; }
.green { background: rgba(0, 184, 148, 0.1); color: #00b894; }
.orange { background: rgba(253, 203, 110, 0.1); color: #fdcb6e; }

.macro-info { display: flex; flex-direction: column; gap: 2px; }
.m-label { font-size: 11px; color: #b2bec3; font-weight: 700; }
.m-val { font-size: 18px; font-weight: 800; color: #2d3436; }
.m-val small { font-size: 10px; }

/* 4. Weight Styles */
.tile-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.tile-header h3 { margin: 0; font-size: 16px; color: #2d3436; font-weight: 800; }
.trend-badge { 
    background: rgba(0, 184, 148, 0.1); color: #00b894; 
    padding: 4px 8px; border-radius: 8px; font-weight: 800; font-size: 11px; 
}
.chart-wrapper { height: 120px; width: 100%; opacity: 0.9; }

/* 5. History Styles */
.history-tile h3 { margin: 0 0 15px 0; font-size: 16px; color: #2d3436; font-weight: 800; }
.history-scroll { overflow-y: auto; height: 100%; display: flex; flex-direction: column; gap: 10px; }
.h-row { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 12px; border: 1px solid rgba(255,255,255,0.5); }
.h-date { display: flex; flex-direction: column; align-items: center; background: white; padding: 4px 8px; border-radius: 8px; }
.d-day { font-weight: 800; font-size: 14px; color: #2d3436; }
.d-month { font-size: 9px; color: #b2bec3; font-weight: 700; }
.h-val { font-weight: 800; font-size: 15px; }
.h-val.good { color: #00b894; }
.h-val.bad { color: #ff7675; }

/* Animation */
.animate-pop { animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
.delay-1 { animation-delay: 0.05s; }
.delay-2 { animation-delay: 0.1s; }
.delay-3 { animation-delay: 0.15s; }
.delay-4 { animation-delay: 0.2s; }
.delay-5 { animation-delay: 0.25s; }
@keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.w-input-area { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 20px 0; }
.w-input-area .unit { font-size: 18px; font-weight: 800; color: #2d3436; }
</style>