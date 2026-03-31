<template>
  <div class="timeline-container">
    <!-- 极简头部：仅保留日期文字 -->
    <div class="timeline-header animate-down">
       <el-date-picker
        v-model="currentDate"
        type="date"
        format="MM月DD日"
        value-format="YYYY-MM-DD"
        :clearable="false"
        class="hidden-picker"
        @change="handleDateChange"
      />
       <div class="date-only-display" @click="triggerDatePicker">
           <span class="d-text">{{ formattedDate }}</span>
           <span class="d-sub" v-if="isToday">今天</span>
       </div>
    </div>

    <!-- Timeline Content -->
    <div class="timeline-body">
        <div class="timeline-line"></div>
        
        <div v-for="(meal, index) in meals" :key="meal.key" class="timeline-item animate-slide-right" :style="{ animationDelay: `${index * 0.1}s` }">
            <div class="time-node">
                <div class="node-dot" :class="meal.key">
                    <el-icon><component :is="mealIconMap[meal.key]" /></el-icon>
                </div>
            </div>
            
            <div class="content-card">
                <div class="card-head">
                    <span class="meal-name">{{ meal.label }}</span>
                    <span class="meal-cal">{{ getMealCalories(meal.key) }} kcal</span>
                    <!-- Add Button in Header for feedback -->
                    <el-button link type="primary" :icon="Plus" class="quick-add-btn" @click="openAddForMeal(meal.key)"></el-button>
                </div>
                
                <div v-if="currentLog[meal.key] && currentLog[meal.key].length > 0" class="food-group">
                    <div v-for="(item, idx) in currentLog[meal.key]" :key="idx" class="food-row">
                        <div class="f-info">
                            <span class="f-name">{{ item.name }}</span>
                            <div class="f-tags">
                                <span class="tag cal">{{ item.calories }}</span>
                                <span class="tag macro">碳{{ item.carbs }} 蛋{{ item.protein }} 脂{{ item.fat }}</span>
                            </div>
                        </div>
                        <div class="f-actions">
                            <button class="icon-btn edit" @click="openEditFood(meal.key, idx, item)"><el-icon><Edit /></el-icon></button>
                            <button class="icon-btn fav" :class="{ active: dietStore.isFavorite(item) }" @click="dietStore.toggleFavorite(item)">
                                <el-icon><StarFilled /></el-icon>
                            </button>
                            <button class="icon-btn del" @click="dietStore.removeFood(meal.key, idx, currentDate)"><el-icon><Delete /></el-icon></button>
                        </div>
                    </div>
                </div>
                
                <div v-else class="empty-slot" @click="openAddForMeal(meal.key)">
                    <span class="plus-icon">+</span> 记录{{ meal.label }}
                </div>
            </div>
        </div>
        
        <!-- Empty State -->
        <div v-if="isDayEmpty" class="empty-day-state">
            <el-icon class="sleep-icon"><Moon /></el-icon>
            <p>还没有记录哦</p>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useDietStore } from '../stores/diet'
import { useUserStore } from '../stores/user'
import { Delete, Edit, StarFilled, ArrowLeftBold, ArrowRightBold, Sunrise, Sunny, Sunset, CoffeeCup, Moon, Plus } from '@element-plus/icons-vue'

const dietStore = useDietStore()
const userStore = useUserStore()
const openEditFood = inject('openEditFood')
const openGlobalAdd = inject('openGlobalAdd')

const currentDate = ref(dietStore.today)
const meals = [
    { key: 'breakfast', label: '早餐' },
    { key: 'lunch', label: '午餐' },
    { key: 'dinner', label: '晚餐' },
    { key: 'snack', label: '加餐' }
]
const mealIconMap = { breakfast: Sunrise, lunch: Sunny, dinner: Sunset, snack: CoffeeCup }

const isToday = computed(() => currentDate.value === dietStore.today)
const formattedDate = computed(() => {
    const d = new Date(currentDate.value)
    return `${d.getMonth() + 1}月${d.getDate()}日`
})

const currentLog = computed(() => dietStore.logs[currentDate.value] || { breakfast: [], lunch: [], dinner: [], snack: [] })
const dayIntake = computed(() => {
    let total = 0
    Object.values(currentLog.value).forEach(l => l.forEach(i => total += Number(i.calories)))
    return { calories: total }
})
const isDayEmpty = computed(() => Object.values(currentLog.value).every(l => l.length === 0))

function changeDay(offset) {
    const d = new Date(currentDate.value)
    d.setDate(d.getDate() + offset)
    currentDate.value = d.toISOString().split('T')[0]
}
function handleDateChange(val) {
    if (!val) currentDate.value = dietStore.today
}
function triggerDatePicker() {
    const picker = document.querySelector('.hidden-picker .el-input__inner')
    if(picker) picker.click()
}
function getMealCalories(key) {
    return currentLog.value[key]?.reduce((acc, c) => acc + Number(c.calories), 0) || 0
}

function openAddForMeal(key) {
    // Open Global Drawer with context: Lock the specific meal and current viewing date
    openGlobalAdd({
        mealType: key,
        date: currentDate.value
    })
}
</script>

<style scoped>
.timeline-container {
    width: auto;
    margin: -15px -15px 0; 
    box-sizing: border-box;
    padding: 15px 30px 15px 30px; /* 左右均调整为 30px */
    overflow-x: hidden;
}

/* 极简日期栏：移除背景和边框 */
.timeline-header {
    display: flex; 
    justify-content: center; 
    align-items: center;
    position: sticky; 
    top: 5px; 
    z-index: 10;
    padding: 10px 0;
    margin-bottom: 20px;
    background: transparent;
}
.date-only-display { 
    display: flex; 
    align-items: baseline; 
    gap: 8px;
    cursor: pointer;
    padding: 6px 16px;
}

.d-text { font-weight: 800; font-size: 18px; color: white; }
.d-sub { font-size: 12px; color: #00cec9; font-weight: 800; }
.hidden-picker { position: absolute; opacity: 0; width: 0px; height: 0px; top: 0; left: 0; pointer-events: none; }

/* Timeline Body */
.timeline-body { position: relative; padding: 0; }
.timeline-line {
    position: absolute; left: 19px; top: 0; bottom: 0; width: 2px;
    background: linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
    z-index: 0;
}

.timeline-item {
    display: flex; gap: 5px; margin-bottom: 25px; position: relative; z-index: 1;
}

.time-node { flex-shrink: 0; width: 40px; display: flex; justify-content: center; }
.node-dot {
    width: 38px; height: 38px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    background: #1e293b; border: 1px solid rgba(255,255,255,0.1); 
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    font-size: 16px;
}
.node-dot.breakfast { color: #fab1a0; }
.node-dot.lunch { color: #ffeaa7; }
.node-dot.dinner { color: #a29bfe; }
.node-dot.snack { color: #55efc4; }

.content-card {
    flex: 1; 
    min-width: 0; /* CRITICAL: Prevents bento card from overflowing its parent */
    background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(15px);
    border-radius: 20px;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.08);
    overflow: hidden;
}

.card-head {
    display: flex; align-items: center;
    padding: 12px 18px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05);
}
.meal-name { font-weight: 800; color: white; font-size: 15px; flex: 1; }
.meal-cal { font-weight: 700; color: #94a3b8; font-size: 12px; margin-right: 10px; }
.quick-add-btn { font-size: 18px; }

.food-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 18px; border-bottom: 1px solid rgba(255,255,255,0.03);
}
.f-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.f-name { font-weight: 700; font-size: 15px; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.f-tags { display: flex; gap: 6px; }
.tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
.tag.cal { background: rgba(255,255,255,0.08); color: #cbd5e1; }
.tag.macro { background: rgba(142, 125, 255, 0.1); color: #a29bfe; font-family: monospace; }

.f-actions { display: flex; gap: 8px; margin-left: 10px; }
.icon-btn { border: none; background: transparent; cursor: pointer; color: #64748b; font-size: 14px; padding: 4px; transition: all 0.2s; }
.icon-btn:hover { color: white; }
.icon-btn.fav.active { color: #ffeaa7; }
.icon-btn.del:hover { color: #ff7675; }

.empty-slot {
    padding: 18px; text-align: center; cursor: pointer;
    color: #64748b; font-size: 13px; font-weight: 700;
    transition: all 0.3s; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; gap: 6px;
}
.empty-slot:hover { color: #8e7dff; background: rgba(142, 125, 255, 0.05); }
.plus-icon { font-size: 16px; font-weight: 900; }

.empty-day-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 40px 0; color: #475569; gap: 10px; opacity: 0.6;
}
.sleep-icon { font-size: 40px; }

/* Animations */
.animate-down { animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.animate-slide-right { animation: slideRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideRight { from { opacity: 0; transform: translateX(-15px); } to { opacity: 1; transform: translateX(0); } }
</style>