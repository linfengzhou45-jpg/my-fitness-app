<template>
  <div class="dashboard-container">
    <div class="top-bar">
        <h1>今日概览</h1>
        <div class="actions">
            <span class="workout-label">🏋️ 今日训练</span>
            <el-switch
                v-model="isWorkoutDayModel"
                active-color="#13ce66"
                inactive-color="#ff4949"
                @change="handleWorkoutToggle"
            />
            <el-button type="primary" plain size="small" style="margin-left: 20px;" @click="dialogWeightVisible = true">
                记录体重
            </el-button>
        </div>
    </div>
    
    <el-row :gutter="20">
      <!-- 左侧：热量与核心指标 -->
      <el-col :span="8">
        <el-card class="calorie-card">
          <template #header>
            <div class="card-header">
              <span>热量摄入 ({{ isWorkoutDay ? '训练日' : '休息日' }})</span>
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
          >
            <span>{{ ((todayIntake.calories / targetCalories) * 100).toFixed(1) }}%</span>
          </el-progress>
          <div class="tips" v-if="todayIntake.calories > targetCalories">
            ⚠️ 摄入超标 {{ todayIntake.calories - targetCalories }} kcal
          </div>
          <div class="tips success" v-else>
             还可摄入 {{ targetCalories - todayIntake.calories }} kcal
          </div>
          
          <el-divider>三大营养素</el-divider>
           <!-- 营养素饼图 -->
           <BaseChart :options="macroPieOptions" height="250px" />
        </el-card>
      </el-col>

      <!-- 右侧：详情与趋势 -->
      <el-col :span="16">
        <!-- 营养素仪表盘 -->
        <el-card style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span>营养素进度</span>
            </div>
          </template>
          <el-row :gutter="20" class="macros-container">
            <el-col :span="8">
              <div class="macro-item">
                <div class="label">碳水化合物</div>
                <el-progress type="dashboard" :percentage="getPercentage(todayIntake.carbs, macros.carbs)" color="#409eff">
                  <template #default="{ percentage }">
                    <div class="percentage-value">{{ todayIntake.carbs }} / {{ macros.carbs }}g</div>
                  </template>
                </el-progress>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="macro-item">
                <div class="label">蛋白质</div>
                <el-progress type="dashboard" :percentage="getPercentage(todayIntake.protein, macros.protein)" color="#67c23a">
                  <template #default="{ percentage }">
                    <div class="percentage-value">{{ todayIntake.protein }} / {{ macros.protein }}g</div>
                  </template>
                </el-progress>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="macro-item">
                <div class="label">脂肪</div>
                <el-progress type="dashboard" :percentage="getPercentage(todayIntake.fat, macros.fat)" color="#e6a23c">
                  <template #default="{ percentage }">
                    <div class="percentage-value">{{ todayIntake.fat }} / {{ macros.fat }}g</div>
                  </template>
                </el-progress>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 体重趋势图 -->
        <el-card>
            <template #header>
                <div class="card-header">
                    <span>体重趋势 (kg)</span>
                </div>
            </template>
            <BaseChart :options="weightChartOptions" height="300px" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 记录体重弹窗 -->
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
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useDietStore } from '../stores/diet'
import { storeToRefs } from 'pinia'
import BaseChart from '../components/BaseChart.vue'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const dietStore = useDietStore()

const { targetCalories, macros, isWorkoutDay, weightHistory } = storeToRefs(userStore)
const { todayIntake } = storeToRefs(dietStore)

const isWorkoutDayModel = ref(isWorkoutDay.value) // Sync with store ref object
const dialogWeightVisible = ref(false)
const newWeight = ref(userStore.profile.weight)

const caloriesStatus = computed(() => {
  const p = (todayIntake.value.calories / targetCalories.value) * 100
  if (p > 100) return 'exception'
  if (p > 85) return 'warning'
  return 'success'
})

function handleWorkoutToggle(val) {
    userStore.toggleWorkoutMode(val)
    ElMessage.info(val ? '已切换至训练日模式：热量目标提升' : '已切换至休息日模式')
}

function handleLogWeight() {
    userStore.logWeight(newWeight.value)
    dialogWeightVisible.value = false
    ElMessage.success('体重记录成功')
}

function getPercentage(current, target) {
  if (target === 0) return 0
  return Math.min(Math.round((current / target) * 100), 100)
}

// Chart Options
const macroPieOptions = computed(() => ({
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center' },
    series: [
        {
            name: '摄入来源',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
            labelLine: { show: false },
            data: [
                { value: todayIntake.value.carbs * 4, name: '碳水 (kcal)', itemStyle: { color: '#409eff' } },
                { value: todayIntake.value.protein * 4, name: '蛋白质 (kcal)', itemStyle: { color: '#67c23a' } },
                { value: todayIntake.value.fat * 9, name: '脂肪 (kcal)', itemStyle: { color: '#e6a23c' } }
            ]
        }
    ]
}))

const weightChartOptions = computed(() => {
    // Fill data
    const dates = weightHistory.value.map(item => item.date)
    const weights = weightHistory.value.map(item => item.weight)
    
    return {
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: dates },
        yAxis: { type: 'value', min: 'dataMin', scale: true }, // Auto scale
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
    margin-bottom: 20px;
}
.top-bar h1 {
    margin: 0;
}
.actions {
    display: flex;
    align-items: center;
}
.workout-label {
    margin-right: 10px;
    font-weight: bold;
    color: #606266;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  margin: 15px 0;
  color: #303133;
}
.tips {
    margin-top: 15px;
    text-align: center;
    font-size: 14px;
    color: #f56c6c;
}
.tips.success {
    color: #67c23a;
}
.macros-container {
  text-align: center;
}
.macro-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.percentage-value {
  display: block;
  margin-top: 10px;
  font-size: 16px;
  font-weight: 500;
}
</style>