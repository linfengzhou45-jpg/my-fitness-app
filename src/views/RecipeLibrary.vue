<template>
  <div class="recipe-container animate-fade-in">
    <div class="search-section">
        <el-input v-model="searchQuery" placeholder="搜索食谱..." :prefix-icon="Search" clearable round size="large" />
    </div>

    <div class="tabs-header">
        <div class="tabs">
            <div class="tab" :class="{ active: tab === 'system' }" @click="tab = 'system'">推荐</div>
            <div class="tab" :class="{ active: tab === 'fav' }" @click="tab = 'fav'">收藏 ({{ dietStore.favorites.length }})</div>
        </div>
        <div v-if="tab === 'fav'" class="add-custom-btn" @click="createNewRecipe">
            <el-icon><Plus /></el-icon>
        </div>
    </div>

    <div class="recipe-grid">
        <div v-for="(r, index) in filtered" :key="tab + (r.id || r.name || '') + index" class="recipe-card" @click="showDetail(r, index)">
            <div class="card-img-wrapper">
                <img :src="r.image || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=200&q=80'" class="r-img" />
                <div class="fav-badge" v-if="dietStore.isFavorite({ name: r.title || r.name })">
                    <el-icon><StarFilled /></el-icon>
                </div>
            </div>
            <div class="r-info">
                <span class="r-name">{{ r.title || r.name }}</span>
                <div class="r-tags">
                    <span class="cal">{{ r.calories }} kcal</span>
                    <span class="macro">碳{{ r.carbs }} 蛋{{ r.protein }} 脂{{ r.fat }}</span>
                </div>
            </div>
        </div>
    </div>

    <el-dialog v-model="visible" width="340px" class="glass-dialog custom-detail-dialog" center append-to-body>
        <div v-if="selected" class="detail">
            <!-- 沉浸式图片区域 -->
            <div class="d-img-container" @click="canEdit && triggerImgUpload()">
                <img :src="selected.image || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80'" class="d-img" />
                <div v-if="canEdit" class="img-edit-hint">
                    <el-icon><Camera /></el-icon> <span>更换图片</span>
                </div>
                <div class="fav-toggle-btn" :class="{ active: isCurrentFavorite }" @click.stop="toggleFavorite">
                    <el-icon><StarFilled v-if="isCurrentFavorite" /><Star v-else /></el-icon>
                </div>
                <input type="file" ref="fileInput" hidden accept="image/*" @change="handleImgChange" />
            </div>

            <div class="d-title-row">
                <input v-if="canEdit" v-model="selected.title" class="title-input" placeholder="输入名称..." @blur="autoSave" />
                <h3 v-else class="static-title">{{ selected.title || selected.name }}</h3>
                
                <div v-if="tab === 'fav'" class="d-actions-top">
                    <el-button type="danger" link :icon="Delete" @click="confirmDelete(editingIndex)" />
                </div>
            </div>

            <!-- 数值即点即改区域 -->
            <div class="d-macros">
                <div class="di">
                    <template v-if="canEdit">
                        <input type="number" v-model.number="selected.calories" @blur="autoSave" />
                    </template>
                    <b v-else>{{ selected.calories }}</b>
                    <span>kcal</span>
                </div>
                <div class="di">
                    <template v-if="canEdit">
                        <input type="number" v-model.number="selected.carbs" @blur="autoSave" />
                    </template>
                    <b v-else>{{ selected.carbs }}</b>
                    <span>碳水</span>
                </div>
                <div class="di">
                    <template v-if="canEdit">
                        <input type="number" v-model.number="selected.protein" @blur="autoSave" />
                    </template>
                    <b v-else>{{ selected.protein }}</b>
                    <span>蛋白</span>
                </div>
                <div class="di">
                    <template v-if="canEdit">
                        <input type="number" v-model.number="selected.fat" @blur="autoSave" />
                    </template>
                    <b v-else>{{ selected.fat }}</b>
                    <span>脂肪</span>
                </div>
            </div>

            <div class="desc-edit-wrap">
                <textarea v-if="canEdit" v-model="selected.description" class="desc-textarea" placeholder="点击添加描述..." @blur="autoSave"></textarea>
                <p v-else class="d-desc">{{ selected.description || '暂无描述' }}</p>
            </div>

            <!-- Meal Type Selector when no context -->
            <div v-if="!dietStore.pendingMealContext.mealType && !isPlanning" class="meal-selector">
                <p class="selector-label">添加到哪个餐次？</p>
                <div class="selector-btns">
                    <div v-for="m in meals" :key="m.key" 
                         class="sel-btn" :class="{ active: selectedMeal === m.key }" 
                         @click="selectedMeal = m.key">
                        {{ m.label }}
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <div class="d-foot">
                <el-button v-if="isPlanning" type="warning" round @click="savePlan">
                    设为{{ planningLabel }}计划
                </el-button>
                <el-button type="primary" round @click="addLog">确认摄入</el-button>
            </div>
        </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDietStore } from '../stores/diet'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete, Camera, Plus, Star, StarFilled } from '@element-plus/icons-vue'
import { processImage } from '../utils/compress'

const dietStore = useDietStore(); const router = useRouter(); const route = useRoute()
const searchQuery = ref(''); const tab = ref(route.query.tab || 'system')
const visible = ref(false); const selected = ref(null)
const editingIndex = ref(-1); const fileInput = ref(null)
const selectedMeal = ref('snack')

// 监听 tab 切换，同步到路由参数
watch(tab, (newVal) => {
    router.replace({ query: { tab: newVal } })
    // 强制关闭弹窗并重置索引，防止副作用
    visible.value = false
    selected.value = null
    editingIndex.value = -1
})

const meals = [
    { key: 'breakfast', label: '早' },
    { key: 'lunch', label: '午' },
    { key: 'dinner', label: '晚' },
    { key: 'snack', label: '加' }
]

onMounted(() => { 
    dietStore.fetchRecipes()
    visible.value = false
    selected.value = null
    editingIndex.value = -1
})

const isPlanning = computed(() => !!localStorage.getItem('planning_meal_type'))
const planningLabel = computed(() => {
    const t = localStorage.getItem('planning_meal_type')
    return { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' }[t] || ''
})

const canEdit = computed(() => tab.value === 'fav')

const filtered = computed(() => {
    // 使用解构赋值确保返回新数组副本
    const list = tab.value === 'system' ? [...dietStore.systemRecipes] : [...dietStore.favorites]
    const query = searchQuery.value.trim()
    return query ? list.filter(r => (r.title || r.name || '').includes(query)) : list
})

const isCurrentFavorite = computed(() => {
    if (!selected.value) return false
    return dietStore.isFavorite({ name: selected.value.title || selected.value.name })
})

function showDetail(r, index) { 
    selected.value = JSON.parse(JSON.stringify(r));
    editingIndex.value = index; 
    visible.value = true; 
    selectedMeal.value = dietStore.pendingMealContext.mealType || 'snack'
}

function triggerImgUpload() { fileInput.value.click() }

async function handleImgChange(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
        const base64 = await processImage(file)
        selected.value.image = base64
        autoSave()
    } catch (err) {
        ElMessage.error('图片处理失败')
    }
}

function autoSave() {
    if (!canEdit.value || editingIndex.value === -1) return
    dietStore.updateFavorite(editingIndex.value, selected.value)
    Object.assign(dietStore.favorites[editingIndex.value], selected.value)
}

function toggleFavorite() {
    if (!selected.value) return
    const item = { 
        name: selected.value.title || selected.value.name,
        calories: selected.value.calories,
        carbs: selected.value.carbs,
        protein: selected.value.protein,
        fat: selected.value.fat,
        image: selected.value.image,
        description: selected.value.description
    }
    dietStore.toggleFavorite(item)
    if (tab.value === 'fav' && !dietStore.isFavorite(item)) {
        visible.value = false
    }
}

function createNewRecipe() {
    const newR = {
        title: '新食谱',
        calories: 0,
        carbs: 0,
        protein: 0,
        fat: 0,
        image: '',
        description: ''
    }
    dietStore.favorites.push(newR)
    dietStore.sync()
    showDetail(newR, dietStore.favorites.length - 1)
}

function confirmDelete(index) {
    ElMessageBox.confirm('确定要从收藏中删除吗？', '提示', { 
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' 
    }).then(() => {
        dietStore.removeFavorite(index);
        ElMessage.success('已删除');
        visible.value = false;
    });
}

function savePlan() {
    const t = localStorage.getItem('planning_meal_type')
    const foodData = {
        food: selected.value.title || selected.value.name,
        calories: selected.value.calories,
        carbs: selected.value.carbs,
        protein: selected.value.protein,
        fat: selected.value.fat
    }
    dietStore.setMealPlan(t, foodData)
    localStorage.removeItem('planning_meal_type')
    ElMessage.success('计划已更新'); visible.value = false; router.push('/dashboard')
}

function addLog() {
    const mealType = dietStore.pendingMealContext.mealType || selectedMeal.value
    dietStore.addFood(
        mealType, 
        { ...selected.value, name: selected.value.title || selected.value.name },
        dietStore.pendingMealContext.date
    )
    dietStore.clearPendingContext()
    ElMessage.success('已添加记录'); visible.value = false
}
</script>

<style scoped>
.recipe-container { 
    padding: 10px 15px !important; /* 加上父容器 15px，视觉 30px */
    width: 100% !important; 
    box-sizing: border-box; 
    overflow-x: hidden;
}

.search-section { 
    margin-bottom: 25px; 
    padding-top: 5px; 
    width: 100%; /* 恢复正常宽度，利用容器 padding 自动实现 30px 边距 */
    box-sizing: border-box;
}

.tabs-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 20px; 
    width: 100%; /* 恢复正常宽度 */
    box-sizing: border-box;
}

.tabs { display: flex; gap: 8px; }
.tab { padding: 8px 15px; border-radius: 12px; background: rgba(255,255,255,0.05); color: #94a3b8; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; }
.tab.active { background: var(--primary); color: white; }

.add-custom-btn { width: 36px; height: 36px; border-radius: 10px; background: rgba(142, 125, 255, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; cursor: pointer; }

.recipe-grid { 
    display: grid;
    /* 核心修复：最大 155px，最小自动收缩，防止撑开页面 */
    grid-template-columns: repeat(2, minmax(0, 155px)); 
    gap: 12px; 
    width: 100%;
    box-sizing: border-box;
    justify-content: center; /* 保持居中 */
    padding-bottom: 30px;
}

.recipe-card { 
    background: rgba(30, 41, 59, 0.6); 
    border-radius: 18px; 
    overflow: hidden; 
    border: 1px solid rgba(255,255,255,0.1); 
    width: 100%; 
    height: 155px; /* 恢复固定高度，保持比例 */
    display: flex; 
    flex-direction: column; 
    transition: transform 0.2s;
}

.card-img-wrapper { width: 100%; height: 60%; position: relative; overflow: hidden; }
.r-img { width: 100%; height: 100%; object-fit: cover; }
.fav-badge { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.5); color: #ffeaa7; padding: 3px; border-radius: 5px; font-size: 10px; }

.r-info { padding: 6px 8px; flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
.r-name { font-weight: 800; font-size: 12px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
.r-tags { font-size: 9px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 弹窗及其他样式 ... */
.d-img-container { position: relative; width: 100%; height: 160px; border-radius: 18px; overflow: hidden; margin-bottom: 12px; }
.d-img { width: 100%; height: 100%; object-fit: cover; }
.fav-toggle-btn { position: absolute; top: 12px; right: 12px; width: 36px; height: 36px; border-radius: 50%; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; color: white; }
.fav-toggle-btn.active { color: #ffeaa7; }
.d-title-row { margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between; }
.static-title { margin: 0; font-size: 18px; font-weight: 800; color: white; }
.title-input { background: transparent; border: none; border-bottom: 2px solid rgba(255,255,255,0.1); color: white; font-size: 18px; font-weight: 800; width: 100%; outline: none; }
.d-macros { 
    display: grid; 
    grid-template-columns: repeat(4, 1fr); 
    gap: 6px; 
    margin-bottom: 15px; 
}
.di { 
    background: rgba(255,255,255,0.05); 
    padding: 6px 2px; 
    border-radius: 12px; 
    text-align: center;
    min-width: 0; /* 允许收缩 */
}
.di input { 
    background: transparent; 
    border: none; 
    color: #00cec9; 
    font-size: 13px; 
    font-weight: 900; 
    width: 100%; 
    box-sizing: border-box; 
    text-align: center; 
    outline: none; 
}
.di b { display: block; font-size: 13px; color: #00cec9; }
.di span { font-size: 9px; color: #94a3b8; }
.desc-edit-wrap { margin-bottom: 15px; }
.desc-textarea { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; width: 100%; min-height: 60px; padding: 10px; color: #cbd5e1; font-size: 12px; resize: none; outline: none; }
.d-desc { font-size: 12px; color: #cbd5e1; line-height: 1.5; }
.meal-selector { margin-bottom: 15px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 15px; }
.selector-label { font-size: 12px; color: #94a3b8; margin-bottom: 8px; }
.selector-btns { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.sel-btn { padding: 6px 0; background: rgba(255,255,255,0.05); border-radius: 8px; text-align: center; font-size: 12px; color: #94a3b8; cursor: pointer; }
.sel-btn.active { background: rgba(142, 125, 255, 0.1); border-color: var(--primary); color: white; }
.d-foot { display: flex; flex-direction: column; gap: 12px; width: 100%; }
</style>