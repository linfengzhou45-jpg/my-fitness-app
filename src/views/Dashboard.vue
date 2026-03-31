<template>
  <div class="bento-dashboard animate-fade-in">
    <!-- Header -->
    <header class="dashboard-head">
      <div>
        <h1 class="greeting">早安, {{ userStore.profile.name || 'Champion' }}!</h1>
        <p class="subtitle">今天也要保持活力哦 ✨</p>
      </div>
      <div class="head-actions">
        <div class="avatar-mini" @click="$router.push('/profile')">
            <img v-if="userStore.avatar" :src="userStore.avatar" />
            <el-icon v-else><User /></el-icon>
        </div>
        <button class="action-btn" @click="dialogWeightVisible = true">记体重</button>
      </div>
    </header>

    <div class="bento-grid">
      <!-- 1. Calorie Hero with Plans -->
      <div class="bento-card calorie-hero">
         <div class="hero-top">
            <div class="hero-stats">
                <span class="label">今日摄入</span>
                <span class="big-val">{{ todayIntake.calories || 0 }}</span>
                <span class="target">目标 {{ targetCalories }} kcal</span>
            </div>
            <div class="hero-progress">
                 <el-progress 
                    type="circle" 
                    :percentage="Number(Math.min((todayIntake.calories / targetCalories) * 100, 100).toFixed(1))" 
                    :width="75"
                    :stroke-width="8"
                    :color="progressColor" 
                />
            </div>
         </div>

         <!-- Meal Plan Grid -->
         <div class="meal-plans-grid">
             <div v-for="meal in mealsConfig" :key="meal.key" class="plan-slot" @click="handleSlotClick(meal.key)">
                 <span class="ps-label">{{ meal.label }}推荐</span>
                 <template v-if="getMealPlan(meal.key)">
                    <span class="ps-content">{{ typeof getMealPlan(meal.key) === 'object' ? getMealPlan(meal.key).food : getMealPlan(meal.key) }}</span>
                    <span class="ps-cal" v-if="getMealPlan(meal.key).calories">{{ getMealPlan(meal.key).calories }}kcal</span>
                 </template>
                 <span v-else class="ps-content empty">待制订</span>
             </div>
         </div>

         <div class="one-key-plan-btn" @click="triggerOneKeyPlan">
             <el-icon><MagicStick /></el-icon> 一键制订三餐计划
         </div>
      </div>

      <!-- 2. Workout Card -->
      <div class="bento-card workout-card" :class="{ 'workout-active': workoutActive }">
          <div class="w-header">
              <div class="w-title-group">
                <div class="w-status-dot"></div>
                <span class="w-title">运动模式</span>
              </div>
              <div class="custom-switch-wrap">
                <el-switch v-model="workoutActive" size="small" active-color="#00b894" />
              </div>
          </div>
          <div v-if="workoutActive" class="w-body animate-pop-in">
              <div class="slider-container">
                <el-slider v-model="workoutCalories" :min="50" :max="1000" :show-tooltip="false" @change="syncWorkout" />
              </div>
              <div class="w-val">期望消耗 <span>{{ workoutCalories }}</span> kcal</div>

              <div class="workout-suggestions">
                  <div class="ws-grid">
                      <div class="ws-item">
                          <div class="ws-icon-wrap">
                            <span class="ws-symbol">🏋️</span>
                          </div>
                          <span class="ws-label">力量训练</span>
                          <span class="ws-time">{{ calculateTime(3.5) }} <small>min</small></span>
                      </div>
                      <div class="ws-item featured">
                          <div class="ws-icon-wrap">
                            <span class="ws-symbol">🏃</span>
                          </div>
                          <span class="ws-label">慢跑</span>
                          <span class="ws-time">{{ calculateTime(8.0) }} <small>min</small></span>
                      </div>
                      <div class="ws-item">
                          <div class="ws-icon-wrap">
                            <span class="ws-symbol">🚶</span>
                          </div>
                          <span class="ws-label">快走</span>
                          <span class="ws-time">{{ calculateTime(3.0) }} <small>min</small></span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <!-- 3. Macros Row -->
      <div class="macros-row">
          <div class="bento-card macro-box"><span class="ml">碳水</span><span class="mv">{{ todayIntake.carbs }}g</span></div>
          <div class="bento-card macro-box"><span class="ml">蛋白</span><span class="mv">{{ todayIntake.protein }}g</span></div>
          <div class="bento-card macro-box"><span class="ml">脂肪</span><span class="mv">{{ todayIntake.fat }}g</span></div>
      </div>

      <!-- 4. 营养趋势图 -->
      <div class="bento-card trend-card">
        <div class="card-header">
          <span class="card-title">📈 营养趋势</span>
          <div class="time-range-tabs">
            <span :class="{ active: trendRange === 7 }" @click="trendRange = 7">周</span>
            <span :class="{ active: trendRange === 30 }" @click="trendRange = 30">月</span>
          </div>
        </div>
        <div class="metric-tabs">
          <span
            v-for="m in metrics"
            :key="m.key"
            :class="{ active: trendMetric === m.key }"
            @click="trendMetric = m.key"
          >{{ m.label }}</span>
        </div>
        <div class="chart-container">
          <BaseChart :options="trendChartOptions" height="180px" />
        </div>
      </div>

      <!-- 5. 营养素分布 + 达标天数 -->
      <div class="charts-row">
        <div class="bento-card pie-card">
          <div class="card-header">
            <span class="card-title">🥧 今日营养素</span>
          </div>
          <BaseChart :options="pieChartOptions" height="160px" />
          <div class="pie-legend">
            <div class="legend-item">
              <span class="dot carbs"></span>
              <span>碳水 {{ nutritionDist.carbs.percent }}%</span>
            </div>
            <div class="legend-item">
              <span class="dot protein"></span>
              <span>蛋白 {{ nutritionDist.protein.percent }}%</span>
            </div>
            <div class="legend-item">
              <span class="dot fat"></span>
              <span>脂肪 {{ nutritionDist.fat.percent }}%</span>
            </div>
          </div>
        </div>
        
        <div class="bento-card bar-card">
          <div class="card-header">
            <span class="card-title">📊 达标天数</span>
          </div>
          <BaseChart :options="barChartOptions" height="160px" />
          <div class="bar-summary">
            <span class="good">✅ 达标 {{goodDays}}天</span>
            <span class="bad">⚠️ 超标 {{badDays}}天</span>
          </div>
        </div>
      </div>

      <!-- 6. 体重趋势 -->
      <div class="bento-card chart-card">
         <div class="c-header">体重趋势</div>
         <div class="c-content">
             <BaseChart :options="chartOptions" height="100%" />
         </div>
      </div>
    </div>

    <!-- Recommendation Options & Detail -->
    <el-dialog v-model="recDialogVisible" :title="currentMealDetail ? '计划详情' : '制订饮食计划'" width="85%" class="glass-dialog" center append-to-body>
        <div v-if="currentMealDetail" class="meal-detail-view">
            <div class="md-food-name">{{ typeof currentMealDetail === 'object' ? currentMealDetail.food : currentMealDetail }}</div>
            <div class="md-macros" v-if="typeof currentMealDetail === 'object' && currentMealDetail.calories">
                <div class="md-macro"><span>{{ currentMealDetail.calories }}</span><label>热量</label></div>
                <div class="md-macro"><span>{{ currentMealDetail.carbs }}g</span><label>碳水</label></div>
                <div class="md-macro"><span>{{ currentMealDetail.protein }}g</span><label>蛋白质</label></div>
                <div class="md-macro"><span>{{ currentMealDetail.fat }}g</span><label>脂肪</label></div>
            </div>
            <el-divider>重新规划</el-divider>
        </div>
        <div class="rec-list">
            <div class="rec-item" @click="openRecipeLibrary">
                <el-icon :size="24" color="#00cec9"><Reading /></el-icon>
                <div class="rec-info"><span class="rt">从食谱库选取</span><span class="rs">手动挑选菜品加入计划</span></div>
            </div>
        </div>
    </el-dialog>

    <!-- AI Plan Result / Loading -->
    <el-dialog v-model="aiVisible" title="AI 计划建议" width="90%" class="glass-dialog" center append-to-body>
        <div v-if="userStore.profile.allergies.length > 0" class="allergy-notice">
            已避开忌口: {{ userStore.profile.allergies.join('、') }}
        </div>
        <div v-if="aiLoading" class="ai-wait">
            <div class="pulse-loader"></div>
            <p>正在努力计算中...</p>
        </div>
        <div v-else-if="aiResult" class="ai-res">
            <template v-if="aiResult.meals && aiResult.meals.length > 0">
                <div v-for="m in aiResult.meals" :key="m.type" class="ai-res-item">
                    <strong>{{ m.type === 'breakfast' ? '早餐' : m.type === 'lunch' ? '午餐' : '晚餐' }}:</strong> {{ m.food }} ({{ m.calories }}kcal)
                </div>
            </template>
            <div v-else-if="aiResult.food" class="ai-res-item">
                <strong>{{ currentSlot === 'breakfast' ? '早餐' : currentSlot === 'lunch' ? '午餐' : '晚餐' }}:</strong> {{ aiResult.food }} ({{ aiResult.calories }}kcal)
                <div class="ai-macros" v-if="aiResult.carbs !== undefined">
                    <span>碳水: {{aiResult.carbs}}g</span>
                    <span>蛋白: {{aiResult.protein}}g</span>
                    <span>脂肪: {{aiResult.fat}}g</span>
                </div>
            </div>
            <p v-else>{{ aiResult.summary || aiResult.analysis || aiResult.advice || aiResult.food }}</p>
            <el-button type="primary" round @click="aiVisible = false" style="width: 100%; margin-top: 15px">采纳建议</el-button>
        </div>
    </el-dialog>

    <el-dialog v-model="dialogWeightVisible" title="记录体重" width="300px" center class="glass-dialog">
        <el-input-number v-model="newWeight" :precision="1" :step="0.1" style="width: 100%" />
        <template #footer><el-button type="primary" @click="saveWeight" round style="width: 100%">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useDietStore } from '../stores/diet'
import { storeToRefs } from 'pinia'
import BaseChart from '../components/BaseChart.vue'
import { ElMessage } from 'element-plus'
import { ScaleToOriginal, Stopwatch, MagicStick, Opportunity, Reading, Warning } from '@element-plus/icons-vue'
import axios from 'axios'

const userStore = useUserStore(); const dietStore = useDietStore(); const router = useRouter()
const { targetCalories, workoutSettings, weightHistory } = storeToRefs(userStore)
const { todayIntake } = storeToRefs(dietStore)

const mealsConfig = [{ key: 'breakfast', label: '早餐' }, { key: 'lunch', label: '午餐' }, { key: 'dinner', label: '晚餐' }]
const getMealPlan = (key) => {
    const plans = dietStore.getTodayPlans()
    return (plans && plans[key]) ? plans[key] : null
}

const dialogWeightVisible = ref(false); const newWeight = ref(userStore.profile.weight)
const recDialogVisible = ref(false); const currentSlot = ref(null)
const aiVisible = ref(false); const aiLoading = ref(false); const aiResult = ref(null)

const currentMealDetail = computed(() => {
    if (!currentSlot.value) return null
    return getMealPlan(currentSlot.value)
})

function handleSlotClick(key) { currentSlot.value = key; recDialogVisible.value = true; }
function openRecipeLibrary() {
    recDialogVisible.value = false
    dietStore.planningMealType = currentSlot.value
    router.push('/recipes')
}

async function triggerOneKeyPlan() {
    aiVisible.value = true; aiLoading.value = true;
    const prompt = `制定今日三餐。忌口: ${userStore.profile.allergies.join('、') || '无'}。返回JSON格式: {"meals": [{"type":"breakfast","food":"...","calories":0,"carbs":0,"protein":0,"fat":0},{"type":"lunch","food":"...","calories":0,"carbs":0,"protein":0,"fat":0},{"type":"dinner","food":"...","calories":0,"carbs":0,"protein":0,"fat":0}]}`;
    try {
        const res = await axios.post('/api/analyze-food', { description: prompt, userProfile: userStore.profile });
        if (res.data.meals) res.data.meals.forEach(m => {
            const key = m.type.toLowerCase().includes('break') ? 'breakfast' : m.type.toLowerCase().includes('lunch') ? 'lunch' : 'dinner'
            dietStore.setMealPlan(key, m)
        });
        aiResult.value = res.data;
    } catch (e) { ElMessage.error('规划失败') } finally { aiLoading.value = false }
}

const workoutActive = ref(workoutSettings.value.active); const workoutCalories = ref(workoutSettings.value.calories)
const syncWorkout = () => userStore.setWorkoutMode(workoutActive.value, null, workoutCalories.value)
watch(workoutActive, syncWorkout)

const calculateTime = (met) => {
    // Formula: Time(min) = (Calories * 60) / (MET * Weight)
    const weight = userStore.profile.weight || 70
    const time = (workoutCalories.value * 60) / (met * weight)
    return Math.round(time)
}

const progressColor = computed(() => {
    const p = (todayIntake.value.calories / targetCalories.value) * 100
    return p > 100 ? '#ff7675' : p > 85 ? '#fdcb6e' : '#00b894'
})

// --- 数据可视化相关 ---
const trendRange = ref(7)
const trendMetric = ref('calories')
const metrics = [
  { key: 'calories', label: '热量' },
  { key: 'carbs', label: '碳水' },
  { key: 'protein', label: '蛋白质' },
  { key: 'fat', label: '脂肪' }
]

// 营养趋势数据
const trendData = computed(() => dietStore.getRecentDaysData(trendRange.value))

// 今日营养素分布
const nutritionDist = computed(() => dietStore.getTodayNutritionDistribution())

// 达标天数统计
const goodDays = computed(() => {
  const data = trendData.value
  const target = targetCalories.value
  return data.filter(d => d.calories <= target && d.calories > 0).length
})

const badDays = computed(() => {
  const data = trendData.value
  const target = targetCalories.value
  return data.filter(d => d.calories > target).length
})

// 趋势图配置
const trendChartOptions = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderColor: 'rgba(255,255,255,0.1)',
    textStyle: { color: '#fff' }
  },
  grid: { top: 20, bottom: 25, left: 35, right: 10 },
  xAxis: {
    type: 'category',
    data: trendData.value.map(d => d.label),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#94a3b8', fontSize: 10 }
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
    axisLabel: { color: '#94a3b8', fontSize: 10 }
  },
  series: [{
    type: 'line',
    smooth: true,
    showSymbol: false,
    data: trendData.value.map(d => d[trendMetric.value]),
    lineStyle: { width: 3, color: '#8e7dff' },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(142, 125, 255, 0.3)' },
          { offset: 1, color: 'rgba(142, 125, 255, 0)' }
        ]
      }
    }
  }]
}))

// 饼图配置
const pieChartOptions = computed(() => {
  const dist = nutritionDist.value
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '60%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      label: {
        show: true,
        position: 'center',
        formatter: `${dist.totalCalories}\nkcal`,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
        lineHeight: 18
      },
      data: [
        { value: dist.carbs.value || 0, name: '碳水', itemStyle: { color: '#fdcb6e' } },
        { value: dist.protein.value || 0, name: '蛋白质', itemStyle: { color: '#74b9ff' } },
        { value: dist.fat.value || 0, name: '脂肪', itemStyle: { color: '#55efc4' } }
      ]
    }]
  }
})

// 柱状图配置（达标天数）
const barChartOptions = computed(() => {
  const data = trendData.value
  const target = targetCalories.value
  
  return {
    tooltip: { trigger: 'axis' },
    grid: { top: 20, bottom: 25, left: 35, right: 10 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.label),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 9 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#94a3b8', fontSize: 9 }
    },
    series: [
      {
        type: 'bar',
        data: data.map(d => ({
          value: d.calories,
          itemStyle: {
            color: d.calories > target ? '#ff7675' : '#00b894',
            borderRadius: [4, 4, 0, 0]
          }
        })),
        barWidth: '60%'
      },
      {
        type: 'line',
        data: data.map(() => target),
        lineStyle: { color: '#fdcb6e', type: 'dashed', width: 2 },
        showSymbol: false
      }
    ]
  }
})

const chartOptions = computed(() => ({
    grid: { top: 5, bottom: 5, left: 0, right: 0 },
    xAxis: { type: 'category', data: weightHistory.value.map(i => i.date.slice(5)), show: false },
    yAxis: { type: 'value', min: 'dataMin', show: false },
    series: [{ data: weightHistory.value.map(i => i.weight), type: 'line', smooth: true, showSymbol: false, lineStyle: { width: 3, color: '#8e7dff' }, areaStyle: { opacity: 0.1 } }]
}))

function saveWeight() { userStore.logWeight(newWeight.value); dialogWeightVisible.value = false; ElMessage.success('已同步'); }
</script>

<style scoped>
.bento-dashboard { padding: 15px; width: 100%; box-sizing: border-box; }
.dashboard-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-top: 10px; }
.greeting { 
    font-size: 24px; 
    font-weight: 900; 
    margin: 0; 
    color: white; 
    letter-spacing: -0.5px; 
    width: 225px; /* 固定宽度，*/
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 0; /* 防止被挤压 */
}
.subtitle { font-size: 13px; color: #94a3b8; margin: 5px 0 0; }
.head-actions { display: flex; align-items: center; gap: 12px; }
.avatar-mini { width: 34px; height: 34px; border-radius: 12px; background: rgba(255,255,255,0.05); overflow: hidden; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; }
.avatar-mini img { width: 100%; height: 100%; object-fit: cover; }
.avatar-mini .el-icon { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
.action-btn { background: rgba(255,255,255,0.1); border: none; color: white; padding: 8px 16px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; }
.action-btn:active { transform: scale(0.95); background: rgba(255,255,255,0.15); }

.bento-grid { display: flex; flex-direction: column; gap: 15px; }
.bento-card { background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(20px); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); padding: 20px; color: white; }

.calorie-hero { display: flex; flex-direction: column; gap: 15px; }
.hero-top { display: flex; justify-content: space-between; align-items: center; }
.hero-stats { display: flex; flex-direction: column; }
.big-val { font-size: 36px; font-weight: 900; line-height: 1; }
.label { font-size: 12px; color: #94a3b8; margin-bottom: 5px; }
.target { font-size: 12px; color: #64748b; }

.meal-plans-grid { 
  display: grid; 
  grid-template-columns: repeat(3, 1fr); 
  gap: 8px; 
  width: 100%;
}
.plan-slot { 
  background: rgba(255,255,255,0.05); 
  border-radius: 12px; 
  padding: 10px 4px; 
  text-align: center; 
  border: 1px solid rgba(255,255,255,0.05); 
  cursor: pointer;
  min-width: 0;
  transition: all 0.3s ease;
}
.plan-slot:active {
  transform: scale(0.95);
  background: rgba(255,255,255,0.1);
}
.ps-label { font-size: 10px; color: #94a3b8; display: block; margin-bottom: 2px; }
.ps-cal { font-size: 10px; color: #00cec9; display: block; margin-top: 2px; font-weight: 500; }
.ps-content { 
  font-size: 12px; 
  font-weight: 700; 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  display: block;
  color: #f8fafc;
}
.ps-content.empty { color: rgba(255,255,255,0.2); }

.one-key-plan-btn { background: linear-gradient(90deg, rgba(142, 125, 255, 0.1), rgba(0, 206, 201, 0.1)); border: 1px dashed var(--primary); border-radius: 12px; padding: 12px; text-align: center; font-size: 13px; font-weight: 700; color: #a29bfe; cursor: pointer; }

.meal-detail-view { text-align: center; padding-bottom: 10px; }
.md-food-name { font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 15px; }
.md-macros { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
.md-macro { background: rgba(255,255,255,0.05); padding: 10px 5px; border-radius: 12px; display: flex; flex-direction: column; }
.md-macro span { font-size: 14px; font-weight: 700; color: #00cec9; }
.md-macro label { font-size: 10px; color: #94a3b8; margin-top: 4px; }

.w-header { display: flex; justify-content: space-between; align-items: center; }
.w-title-group { display: flex; align-items: center; gap: 8px; }
.w-status-dot { 
    width: 6px; height: 6px; border-radius: 50%; background: #475569;
    transition: all 0.4s ease;
}
.workout-active .w-status-dot { 
    background: #00b894; 
    box-shadow: 0 0 8px #00b894;
    animation: dot-pulse 2s infinite;
}
@keyframes dot-pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } 100% { opacity: 1; transform: scale(1); } }
.w-title { font-size: 15px; font-weight: 800; color: #f8fafc; }

/* 高级感开关定制 */
.custom-switch-wrap {
    padding: 2px;
    border-radius: 20px;
    transition: all 0.4s ease;
}
.workout-active .custom-switch-wrap {
    background: rgba(0, 184, 148, 0.1);
    box-shadow: 0 0 15px rgba(0, 184, 148, 0.2);
}
:deep(.el-switch__core) {
    background-color: rgba(255,255,255,0.1) !important;
    border: none !important;
}
:deep(.el-switch.is-checked .el-switch__core) {
    background-color: #00b894 !important;
    box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
}
:deep(.el-switch__action) {
    background-color: #f8fafc !important;
}

.workout-card { 
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    border: 1px solid rgba(255,255,255,0.05);
}
.workout-active { 
    border-color: rgba(0, 184, 148, 0.3); 
    background: linear-gradient(165deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 1));
    box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(0, 184, 148, 0.1);
}

.slider-container { padding: 15px 5px 5px; }
:deep(.el-slider__runway) { background-color: rgba(255,255,255,0.05); height: 3px; }
:deep(.el-slider__bar) { background-color: #00b894; height: 3px; }
:deep(.el-slider__button) { 
    width: 12px; height: 12px; border: 2px solid #00b894; background-color: #0f172a; 
    transition: transform 0.2s;
}
:deep(.el-slider__button:hover) { transform: scale(1.2); }

.w-val { font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 25px; font-weight: 500; }
.w-val span { font-size: 20px; font-weight: 900; color: #00b894; font-family: monospace; }

.workout-suggestions { 
    background: rgba(0, 0, 0, 0.3); 
    border-radius: 20px; 
    padding: 20px 10px; 
    border: 1px solid rgba(255,255,255,0.03);
}
.ws-grid { display: flex; justify-content: space-around; align-items: flex-end; }
.ws-item { display: flex; flex-direction: column; align-items: center; opacity: 0.2; transition: all 0.5s ease; }
.workout-active .ws-item { opacity: 0.85; } /* 统一亮度，不再区分 featured 的透明度 */
.workout-active .ws-item.featured { transform: translateY(-3px); }

.ws-icon-wrap { 
    width: 40px; height: 40px; margin-bottom: 12px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.4s ease;
}

/* 核心：将符号转换为高质感白色剪影 */
.ws-symbol {
    font-size: 28px;
    filter: grayscale(1) brightness(10) contrast(10); /* 强制转为纯白剪影，去除 Emoji 原始色彩 */
    opacity: 0.9;
}

.workout-active .ws-icon-wrap { 
    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.2)); 
}
.ws-label { font-size: 10px; color: #64748b; margin-bottom: 6px; font-weight: 700; letter-spacing: 0.5px; }
.ws-time { font-size: 15px; font-weight: 900; color: #f1f5f9; }
.ws-time small { font-size: 10px; color: #64748b; margin-left: 2px; }

.macros-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.macro-box { padding: 15px 5px; text-align: center; }
.ml { font-size: 11px; color: #94a3b8; display: block; margin-bottom: 5px; }
.mv { font-size: 16px; font-weight: 800; }

.chart-card { height: 160px; display: flex; flex-direction: column; }
.c-header { font-weight: 800; font-size: 14px; margin-bottom: 10px; }
.c-content { flex: 1; height: 100px; }

.rec-list { display: flex; flex-direction: column; gap: 10px; }
.rec-item { display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 15px; cursor: pointer; }
.rt { font-weight: 800; display: block; }
.rs { font-size: 11px; color: #94a3b8; }

.ai-res-item { margin-bottom: 8px; color: #fff; font-size: 14px; }
.ai-macros { display: flex; gap: 10px; font-size: 11px; color: #94a3b8; margin-top: 4px; }
.ai-macros span { background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; }
.allergy-notice { background: rgba(255,71,87,0.1); border: 1px solid rgba(255,71,87,0.2); padding: 8px; border-radius: 10px; color: #ff7675; font-size: 12px; margin-bottom: 10px; text-align: center; }
.ai-wait { text-align: center; padding: 20px 0; }
.pulse-loader { width: 30px; height: 30px; background: var(--primary); border-radius: 50%; margin: 0 auto 10px; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 1; } }

/* 数据可视化图表样式 */
.trend-card, .pie-card, .bar-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .card-title {
    font-size: 14px;
    font-weight: 700;
    color: #f8fafc;
  }
}

.time-range-tabs, .metric-tabs {
  display: flex;
  gap: 6px;
  span {
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 11px;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.3s;
    &.active {
      background: rgba(142, 125, 255, 0.2);
      color: #8e7dff;
    }
  }
}

.metric-tabs {
  margin-bottom: 8px;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.pie-legend {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 8px;
  .legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: #94a3b8;
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      &.carbs { background: #fdcb6e; }
      &.protein { background: #74b9ff; }
      &.fat { background: #55efc4; }
    }
  }
}

.bar-summary {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 8px;
  font-size: 10px;
  .good { color: #00b894; }
  .bad { color: #ff7675; }
}
</style>