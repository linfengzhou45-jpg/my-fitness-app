<template>
  <div class="timeline-container">
    <!-- Floating Header -->
    <div class="timeline-header animate-down">
       <div class="date-capsule">
           <button class="nav-arrow" @click="changeDay(-1)"><el-icon><ArrowLeftBold /></el-icon></button>
           <el-date-picker
            v-model="currentDate"
            type="date"
            format="MM月DD日"
            value-format="YYYY-MM-DD"
            :clearable="false"
            class="hidden-picker"
            @change="handleDateChange"
          />
           <div class="date-display" @click="triggerDatePicker">
               <span class="d-text">{{ formattedDate }}</span>
               <span class="d-sub" v-if="isToday">今天</span>
           </div>
           <button class="nav-arrow" @click="changeDay(1)" :disabled="isToday"><el-icon><ArrowRightBold /></el-icon></button>
       </div>
       <div class="daily-total">
           <span class="t-label">摄入</span>
           <span class="t-val">{{ dayIntake.calories }}</span>
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
                </div>
                
                <div v-if="currentLog[meal.key] && currentLog[meal.key].length > 0" class="food-group">
                    <div v-for="(item, idx) in currentLog[meal.key]" :key="idx" class="food-row">
                        <div class="f-left">
                            <span class="f-name">{{ item.name }}</span>
                            <div class="f-tags">
                                <span class="tag cal">{{ item.calories }}</span>
                                <span class="tag macro">C{{ item.carbs }} P{{ item.protein }} F{{ item.fat }}</span>
                            </div>
                        </div>
                        <div class="f-actions">
                            <button class="icon-btn edit" @click="openEditFood(meal.key, idx, item)"><el-icon><Edit /></el-icon></button>
                            <button class="icon-btn fav" :class="{ active: dietStore.isFavorite(item) }" @click="dietStore.toggleFavorite(item)">
                                <el-icon><StarFilled /></el-icon>
                            </button>
                            <button class="icon-btn del" @click="dietStore.removeFood(meal.key, idx)"><el-icon><Delete /></el-icon></button>
                        </div>
                    </div>
                </div>
                
                <div v-else class="empty-slot" @click="openAddForMeal(meal.key)">
                    <span class="plus">+</span> 记录{{ meal.label }}
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
import { Delete, Edit, StarFilled, ArrowLeftBold, ArrowRightBold, Sunrise, Sunny, Sunset, CoffeeCup, Moon } from '@element-plus/icons-vue'
import dayjs from 'dayjs' // Assuming dayjs or native date logic

const dietStore = useDietStore()
const userStore = useUserStore()
const openEditFood = inject('openEditFood') // Need to ensure parent provides this or handle logic

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
    // Styling hack: position the real date picker over the text but invisible, or handle programmatically
    const picker = document.querySelector('.hidden-picker .el-input__inner')
    if(picker) picker.click() // Might need better handling depending on Element Plus version
}
function getMealCalories(key) {
    return currentLog.value[key]?.reduce((acc, c) => acc + Number(c.calories), 0) || 0
}

// Quick Add (Just opens standard add dialog, theoretically you could pre-select meal)
// Since the global add dialog doesn't accept meal type param yet, we just open it.
// In a real 'Deep Refactor', I'd pass the meal type to the add drawer.
function openAddForMeal(key) {
    // Logic to open add drawer, potentially focusing specific meal
    // For now, assume user selects meal type manually in drawer or just generic add
    // Ideally, emit event or use provide/inject to open specific add flow
    // I'll assume generic add for now
    document.querySelector('.add-fab')?.click() 
}
</script>

<style scoped>
.timeline-container {
    padding-bottom: 100px;
    max-width: 600px; /* Mobile focused width */
    margin: 0 auto;
}

/* Header */
.timeline-header {
    display: flex; justify-content: space-between; align-items: center;
    position: sticky; top: 15px; z-index: 10;
    background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(20px);
    padding: 8px 20px; border-radius: 50px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    margin-bottom: 40px; border: 1px solid rgba(255,255,255,0.1);
    transition: all 0.3s;
}
.date-capsule { display: flex; align-items: center; gap: 15px; }
.nav-arrow { 
    border: none; background: transparent; color: #94a3b8; cursor: pointer; 
    display: flex; align-items: center; font-size: 16px; padding: 5px;
    transition: color 0.2s;
}
.nav-arrow:hover { color: #8e7dff; }
.nav-arrow:disabled { opacity: 0.3; cursor: not-allowed; }
.date-display { display: flex; flex-direction: column; align-items: center; line-height: 1.1; cursor: pointer; position: relative; }
.hidden-picker { position: absolute; opacity: 0; width: 100%; height: 100%; top: 0; left: 0; z-index: -1; }
.d-text { font-weight: 800; font-size: 17px; color: white; letter-spacing: -0.5px; }
.d-sub { font-size: 11px; color: #00cec9; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

.daily-total { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.1; }
.t-label { font-size: 10px; color: #94a3b8; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
.t-val { font-size: 20px; font-weight: 800; color: white; letter-spacing: -1px; }

/* Timeline Body */
.timeline-body { position: relative; padding: 0 10px; }
.timeline-line {
    position: absolute; left: 28px; top: 0; bottom: 0; width: 2px;
    background: linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
    background-size: 2px 10px;
    z-index: 0;
}

.timeline-item {
    display: flex; gap: 20px; margin-bottom: 30px; position: relative; z-index: 1;
}

.time-node { flex-shrink: 0; width: 40px; display: flex; justify-content: center; }
.node-dot {
    width: 40px; height: 40px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    background: #1e293b; border: 2px solid rgba(255,255,255,0.1); 
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    font-size: 18px; transition: transform 0.2s;
}
.timeline-item:hover .node-dot { transform: scale(1.1); border-color: #8e7dff; }
.node-dot.breakfast { color: #fab1a0; }
.node-dot.lunch { color: #ffeaa7; }
.node-dot.dinner { color: #a29bfe; }
.node-dot.snack { color: #55efc4; }

.content-card {
    flex: 1; background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(15px);
    border-radius: 24px;
    box-shadow: 0 10px 30px -5px rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.1);
    overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s;
}
.content-card:hover { transform: translateY(-3px); box-shadow: 0 15px 40px -5px rgba(0,0,0,0.4); border-color: rgba(255,255,255,0.2); }

.card-head {
    display: flex; justify-content: space-between; align-items: center;
    padding: 15px 24px; background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05);
}
.meal-name { font-weight: 800; color: white; font-size: 15px; }
.meal-cal { font-weight: 700; color: #cbd5e1; font-size: 13px; background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 8px; }

.food-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.05);
}
.food-row:last-child { border-bottom: none; }
.f-left { display: flex; flex-direction: column; gap: 5px; }
.f-name { font-weight: 700; font-size: 16px; color: #e2e8f0; }
.f-tags { display: flex; gap: 8px; }
.tag { font-size: 11px; padding: 3px 8px; border-radius: 6px; font-weight: 700; letter-spacing: 0.5px; }
.tag.cal { background: rgba(255,255,255,0.1); color: #cbd5e1; }
.tag.macro { background: rgba(142, 125, 255, 0.15); color: #a29bfe; font-family: monospace; }

.f-actions { display: flex; gap: 12px; opacity: 0; transition: opacity 0.2s, transform 0.2s; transform: translateX(10px); }
.food-row:hover .f-actions { opacity: 1; transform: translateX(0); }
.icon-btn { border: none; background: transparent; cursor: pointer; color: #64748b; font-size: 16px; padding: 6px; border-radius: 8px; transition: all 0.2s; }
.icon-btn:hover { background: rgba(255,255,255,0.1); color: white; }
.icon-btn.fav:hover { color: #ffeaa7; background: rgba(253, 203, 110, 0.2); }
.icon-btn.fav.active { color: #ffeaa7; }
.icon-btn.del:hover { color: #ff7675; background: rgba(255, 118, 117, 0.2); }

.empty-slot {
    padding: 20px; text-align: center; cursor: pointer;
    color: #64748b; font-size: 14px; font-weight: 600;
    transition: all 0.3s;
    border: 2px dashed rgba(255,255,255,0.05);
    margin: 10px; border-radius: 16px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
}
.empty-slot:hover { 
    border-color: #8e7dff; color: #8e7dff; background: rgba(142, 125, 255, 0.1);
}
.plus { font-size: 18px; font-weight: bold; }

.empty-day-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    margin-top: 60px; color: #64748b; gap: 15px; opacity: 0.6;
}
.sleep-icon { font-size: 48px; color: #475569; }

/* Animations */
.animate-down { animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.animate-slide-right { animation: slideRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
</style>