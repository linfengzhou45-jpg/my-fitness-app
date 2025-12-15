<template>
  <div>
    <el-card>
       <template #header>
        <div class="card-header">
          <span>饮食记录 - {{ dietStore.today }}</span>
        </div>
      </template>
      
      <div v-for="meal in meals" :key="meal.key" class="meal-section">
        <div class="meal-header">
            <h3>{{ meal.label }}</h3>
            <div class="meal-actions">
                <el-button size="small" type="success" plain @click="openAiDialog(meal.key)">✨ AI 估算</el-button>
                <el-button size="small" type="primary" :icon="Plus" circle @click="openAddDialog(meal.key)"></el-button>
            </div>
        </div>
        
        <el-table :data="dietStore.getTodayLog()[meal.key]" style="width: 100%" empty-text="暂无记录">
            <el-table-column prop="name" label="食物名称" />
            <el-table-column prop="calories" label="热量 (kcal)" width="120" />
            <el-table-column label="营养素 (C/P/F)" width="180">
                <template #default="scope">
                    {{ scope.row.carbs }}g / {{ scope.row.protein }}g / {{ scope.row.fat }}g
                </template>
            </el-table-column>
             <el-table-column label="操作" width="80">
                <template #default="scope">
                    <el-button type="danger" :icon="Delete" circle size="small" @click="dietStore.removeFood(meal.key, scope.$index)" />
                </template>
            </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 普通添加弹窗 -->
    <el-dialog v-model="dialogVisible" title="添加食物" width="500px">
        <el-form :model="foodForm" label-width="100px">
            <el-form-item label="选择食物">
                <el-select 
                    v-model="foodForm.foodId" 
                    placeholder="搜索食物库 (可输入名称)" 
                    filterable 
                    clearable
                    @change="handleFoodSelect"
                    style="width: 100%">
                    <el-option
                        v-for="item in foodDatabase"
                        :key="item.id"
                        :label="item.name"
                        :value="item.id"
                    />
                </el-select>
            </el-form-item>
            
            <el-form-item label="重量 (g)">
                <el-input-number v-model="foodForm.weight" :min="1" :step="10" @change="calculateNutrition" style="width: 100%" />
            </el-form-item>

            <el-divider content-position="center">营养数据 (自动计算)</el-divider>

            <el-form-item label="食物名称">
                <el-input v-model="foodForm.name" placeholder="自定义或自动填充" />
            </el-form-item>
            <el-form-item label="热量 (kcal)">
                <el-input-number v-model="foodForm.calories" :min="0" />
            </el-form-item>
             <el-form-item label="碳水 (g)">
                <el-input-number v-model="foodForm.carbs" :min="0" />
            </el-form-item>
             <el-form-item label="蛋白质 (g)">
                <el-input-number v-model="foodForm.protein" :min="0" />
            </el-form-item>
             <el-form-item label="脂肪 (g)">
                <el-input-number v-model="foodForm.fat" :min="0" />
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="isSubmitting" @click="handleAddFood">确认添加</el-button>
            </span>
        </template>
    </el-dialog>

    <!-- AI 分析弹窗 -->
    <el-dialog v-model="aiDialogVisible" title="AI 智能饮食分析 (VIP)" width="500px">
        <div class="vip-banner">
            <span class="vip-icon">👑</span> 
            <span>VIP 专属通道已激活：AI 将结合您的身体数据进行个性化分析</span>
        </div>

        <div>
            <el-input
                v-model="aiDescription"
                :rows="4"
                type="textarea"
                placeholder="请描述你的食物，越详细越准确。&#10;例如：一碗红烧牛腩盖饭，饭比较多，牛肉大概5块，汤汁很浓比较油。"
            />

            <!-- AI Presets Controls -->
            <div class="ai-presets">
                <div class="preset-item">
                    <el-button 
                        v-if="!showGreasinessInput" 
                        type="primary" 
                        link 
                        :icon="Plus"
                        @click="() => { showGreasinessInput = true; greasiness = 'medium' }"
                    >
                        添加油腻程度 (可选)
                    </el-button>

                    <div v-else class="greasiness-control-group animate-fade-in">
                        <span class="label">食物油腻度：</span>
                        <el-radio-group v-model="greasiness" size="small">
                            <el-radio-button label="light">清淡</el-radio-button>
                            <el-radio-button label="medium">适中</el-radio-button>
                            <el-radio-button label="heavy">油腻</el-radio-button>
                        </el-radio-group>
                        <el-button 
                            type="danger" 
                            link 
                            :icon="Delete" 
                            title="清除选项"
                            style="margin-left: 10px"
                            @click="resetGreasiness"
                        ></el-button>
                    </div>
                </div>

                <div v-if="showStapleOption" class="preset-item animate-fade-in">
                    <span class="label">{{ stapleLabel }}</span>
                    <el-radio-group v-model="stapleType" size="small">
                        <el-radio-button label="fist">一拳 (150g)</el-radio-button>
                        <el-radio-button label="bowl">一碗 (250g)</el-radio-button>
                        <el-radio-button label="custom">自定义</el-radio-button>
                    </el-radio-group>
                    <el-input-number 
                        v-if="stapleType === 'custom'" 
                        v-model="customStapleWeight" 
                        size="small" 
                        :min="10" 
                        :max="1000" 
                        style="margin-left: 10px; width: 100px;"
                        placeholder="克数"
                    />
                    <span v-if="stapleType === 'custom'" style="margin-left: 5px; font-size: 12px; color: #666">g</span>
                </div>
            </div>
            
            <div v-if="aiResult" class="ai-result-preview">
                <el-divider>分析结果</el-divider>
                
                <div class="ai-tags">
                    <el-tag type="danger" effect="dark">{{ aiResult.calories }} kcal</el-tag>
                    <el-tag effect="plain">碳水 {{ aiResult.carbs }}g</el-tag>
                    <el-tag effect="plain" type="success">蛋白 {{ aiResult.protein }}g</el-tag>
                    <el-tag effect="plain" type="warning">脂肪 {{ aiResult.fat }}g</el-tag>
                </div>

                <p class="ai-analysis-text">
                    <strong>成分分析：</strong> {{ aiResult.analysis }}
                </p>
                
                <el-alert
                    v-if="aiResult.advice"
                    :title="aiResult.advice"
                    type="success"
                    :closable="false"
                    show-icon
                    style="margin-top: 15px"
                />
            </div>
        </div>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="aiDialogVisible = false">关闭</el-button>
                
                <el-button 
                    v-if="!aiResult" 
                    type="primary" 
                    :loading="aiLoading" 
                    @click="handleAiAnalyze">
                    开始分析
                </el-button>

                <template v-else>
                    <el-button 
                        type="warning" 
                        plain
                        :loading="aiLoading" 
                        @click="handleAiAnalyze">
                        重新分析
                    </el-button>
                    <el-button 
                        type="success" 
                        :loading="isSubmitting"
                        @click="applyAiResult">
                        采纳并添加
                    </el-button>
                </template>
            </span>
        </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { useDietStore } from '../stores/diet'
import { Plus, Delete } from '@element-plus/icons-vue'
import { foodDatabase } from '../data/foodDatabase'
import { ElMessage } from 'element-plus'

const dietStore = useDietStore()
const dialogVisible = ref(false)
const aiDialogVisible = ref(false)
const currentMealKey = ref('')

// AI Related
const aiDescription = ref('')
const aiLoading = ref(false)
const aiResult = ref(null)
const isSubmitting = ref(false)

// AI Presets
const greasiness = ref(null)
const showGreasinessInput = ref(false)
const stapleType = ref('fist')
const customStapleWeight = ref(150)

const stapleKeywords = ['饭', '面', '粥', '粉']

const showStapleOption = computed(() => {
    const text = aiDescription.value
    if (!text) return false

    // 1. 米饭/粥类 (Rice/Porridge)
    // 使用 "饭/粥" 而非 "米"，完美避开 "提拉米苏", "玉米", "虾米" 等
    if (/饭|粥/.test(text)) return true

    // 2. 面/粉类 (Noodles/Vermicelli)
    if (/面|粉/.test(text)) {
        // 黑名单：排除含有 "面" 或 "粉" 但不是主食的词汇
        const exclusions = [
            '蛋白粉', '奶粉', '面粉', '面包', '淀粉', '藕粉', 
            '魔芋粉', '发酵粉', '泡打粉', '洗衣粉', '胡椒粉', '孜然粉'
        ]
        // 如果包含任意排除词，则不显示
        if (exclusions.some(ex => text.includes(ex))) return false
        
        return true
    }

    return false
})

const stapleLabel = computed(() => {
    const text = aiDescription.value
    if (/面|粉/.test(text) && !/饭|粥/.test(text)) {
        return '面食分量(估算)：'
    }
    return '米饭/主食分量(估算)：'
})

const meals = [
    { key: 'breakfast', label: '早餐' },
    { key: 'lunch', label: '午餐' },
    { key: 'dinner', label: '晚餐' },
    { key: 'snack', label: '加餐' }
]

const foodForm = reactive({
    foodId: '',
    weight: 100,
    name: '',
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0
})

function openAddDialog(mealKey) {
    currentMealKey.value = mealKey
    resetForm()
    dialogVisible.value = true
}

function openAiDialog(mealKey) {
    currentMealKey.value = mealKey
    aiDescription.value = ''
    aiResult.value = null
    // Reset presets
    greasiness.value = null
    showGreasinessInput.value = false
    stapleType.value = 'fist'
    customStapleWeight.value = 150
    aiDialogVisible.value = true
}

function resetGreasiness() {
    greasiness.value = null
    showGreasinessInput.value = false
}

async function handleAiAnalyze() {
    if (!aiDescription.value) return ElMessage.warning('请输入食物描述')
    
    let finalPrompt = aiDescription.value
    
    // Add presets to prompt ONLY if selected
    if (greasiness.value) {
        const greasinessMap = { light: '清淡(少油)', medium: '适中', heavy: '油腻(多油)' }
        finalPrompt += `，油腻程度：${greasinessMap[greasiness.value]}`
    }

    if (showStapleOption.value) {
        let stapleText = ''
        if (stapleType.value === 'fist') stapleText = '一拳大小(约150g)'
        else if (stapleType.value === 'bowl') stapleText = '一碗(约250g)'
        else stapleText = `${customStapleWeight.value}g`
        
        finalPrompt += `，主食分量：${stapleText}`
    }

    aiLoading.value = true
    try {
        const result = await dietStore.analyzeFoodWithAI(finalPrompt)
        aiResult.value = result
    } catch (error) {
        console.error(error)
        ElMessage.error('服务器连接失败，请确认后端服务已启动')
    } finally {
        aiLoading.value = false
    }
}

async function applyAiResult() {
    if (!aiResult.value || isSubmitting.value) return
    
    isSubmitting.value = true
    try {
        // Convert AI result to standard food item structure
        const foodItem = {
            name: aiResult.value.name,
            calories: Number(aiResult.value.calories),
            carbs: Number(aiResult.value.carbs),
            protein: Number(aiResult.value.protein),
            fat: Number(aiResult.value.fat),
            weight: null // AI estimates total portion, weight is undefined/irrelevant here
        }
        
        dietStore.addFood(currentMealKey.value, foodItem)
        aiDialogVisible.value = false
        ElMessage.success('已添加至记录')
        await nextTick()
    } finally {
        isSubmitting.value = false
    }
}

function resetForm() {
    foodForm.foodId = ''
    foodForm.weight = 100
    foodForm.name = ''
    foodForm.calories = 0
    foodForm.carbs = 0
    foodForm.protein = 0
    foodForm.fat = 0
}

function handleFoodSelect(id) {
    if (!id) return
    const food = foodDatabase.find(f => f.id === id)
    if (food) {
        foodForm.name = food.name
        calculateNutrition()
    }
}

function calculateNutrition() {
    if (!foodForm.foodId) return
    
    const food = foodDatabase.find(f => f.id === foodForm.foodId)
    if (food) {
        const ratio = foodForm.weight / 100
        foodForm.calories = Math.round(food.calories * ratio)
        foodForm.carbs = Number((food.carbs * ratio).toFixed(1))
        foodForm.protein = Number((food.protein * ratio).toFixed(1))
        foodForm.fat = Number((food.fat * ratio).toFixed(1))
    }
}

async function handleAddFood() {
    if (isSubmitting.value) return
    isSubmitting.value = true
    try {
        const foodItem = {
            name: foodForm.name || '未知食物',
            calories: foodForm.calories,
            carbs: foodForm.carbs,
            protein: foodForm.protein,
            fat: foodForm.fat,
            weight: foodForm.weight
        }
        dietStore.addFood(currentMealKey.value, foodItem)
        dialogVisible.value = false
        await nextTick()
    } finally {
        isSubmitting.value = false
    }
}
</script>

<style scoped>
.meal-section {
    margin-bottom: 30px;
}
.meal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #f5f7fa;
    padding: 10px;
    border-radius: 4px;
}
.meal-header h3 {
    margin: 0;
    font-size: 16px;
}
.meal-actions {
    display: flex;
    gap: 10px;
}
.vip-banner {
    background: linear-gradient(90deg, #8e44ad, #c0392b);
    color: white;
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    font-size: 13px;
    font-weight: bold;
}
.vip-icon {
    font-size: 18px;
    margin-right: 8px;
}
.ai-result-preview {
    margin-top: 20px;
    background: #fff;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #ebeef5;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}
.ai-analysis-text {
    font-size: 14px;
    color: #5e6d82;
    margin: 15px 0;
    line-height: 1.6;
}
.ai-tags {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}
.ai-presets {
    margin-top: 15px;
    background: #f8f9fa;
    padding: 10px;
    border-radius: 6px;
}
.preset-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}
.preset-item:last-child {
    margin-bottom: 0;
}
.preset-item .label {
    font-size: 14px;
    color: #606266;
    margin-right: 10px;
    min-width: 100px;
}
.greasiness-control-group {
    display: flex;
    align-items: center;
}
.animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
