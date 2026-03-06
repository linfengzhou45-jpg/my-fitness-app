<template>
  <div class="recipe-container animate-fade-in">
    <div class="search-section">
        <el-input v-model="searchQuery" placeholder="搜索食谱..." :prefix-icon="Search" clearable round size="large" />
    </div>

    <div class="tabs">
        <div class="tab" :class="{ active: tab === 'system' }" @click="tab = 'system'">推荐</div>
        <div class="tab" :class="{ active: tab === 'fav' }" @click="tab = 'fav'">收藏 ({{ dietStore.favorites.length }})</div>
    </div>

    <div class="recipe-grid">
        <div v-for="(r, index) in filtered" :key="r.id || index" class="recipe-card" @click="showDetail(r, index)">
            <img :src="r.image || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=200&q=80'" class="r-img" />
            <div class="r-info">
                <span class="r-name">{{ r.title || r.name }}</span>
                <div class="r-tags">
                    <span class="cal">{{ r.calories }}k</span>
                    <span class="macro">碳{{ r.carbs }} 蛋{{ r.protein }} 脂{{ r.fat }}</span>
                </div>
            </div>
        </div>
    </div>

    <el-dialog v-model="visible" width="90%" class="glass-dialog" center append-to-body>
        <div v-if="selected" class="detail">
            <!-- 沉浸式图片区域：点击更换 -->
            <div class="d-img-container" @click="tab === 'fav' && triggerImgUpload()">
                <img :src="selected.image || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80'" class="d-img" />
                <div v-if="tab === 'fav'" class="img-edit-hint">
                    <el-icon><Camera /></el-icon> <span>更换图片</span>
                </div>
                <input type="file" ref="fileInput" hidden accept="image/*" @change="handleImgChange" />
            </div>

            <div class="d-title-row">
                <input v-if="tab === 'fav'" v-model="selected.title" class="title-input" placeholder="输入名称..." @blur="autoSave" />
                <h3 v-else>{{ selected.title || selected.name }}</h3>
                
                <div v-if="tab === 'fav'" class="d-actions-top">
                    <el-button type="danger" link :icon="Delete" @click="confirmDelete(editingIndex)" />
                </div>
            </div>

            <!-- 数值即点即改区域 -->
            <div class="d-macros">
                <div class="di">
                    <template v-if="tab === 'fav'">
                        <input type="number" v-model.number="selected.calories" @blur="autoSave" />
                    </template>
                    <b v-else>{{ selected.calories }}</b>
                    <span>kcal</span>
                </div>
                <div class="di">
                    <template v-if="tab === 'fav'">
                        <input type="number" v-model.number="selected.carbs" @blur="autoSave" />
                    </template>
                    <b v-else>{{ selected.carbs }}</b>
                    <span>碳水</span>
                </div>
                <div class="di">
                    <template v-if="tab === 'fav'">
                        <input type="number" v-model.number="selected.protein" @blur="autoSave" />
                    </template>
                    <b v-else>{{ selected.protein }}</b>
                    <span>蛋白</span>
                </div>
                <div class="di">
                    <template v-if="tab === 'fav'">
                        <input type="number" v-model.number="selected.fat" @blur="autoSave" />
                    </template>
                    <b v-else>{{ selected.fat }}</b>
                    <span>脂肪</span>
                </div>
            </div>

            <div class="desc-edit-wrap">
                <textarea v-if="tab === 'fav'" v-model="selected.description" class="desc-textarea" placeholder="点击添加描述..." @blur="autoSave"></textarea>
                <p v-else class="d-desc">{{ selected.description || '暂无描述' }}</p>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDietStore } from '../stores/diet'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete, Camera } from '@element-plus/icons-vue'
import { processImage } from '../utils/compress'

const dietStore = useDietStore(); const router = useRouter()
const searchQuery = ref(''); const tab = ref('system')
const visible = ref(false); const selected = ref(null)
const editingIndex = ref(-1); const fileInput = ref(null)

onMounted(() => { dietStore.fetchRecipes() })

const isPlanning = computed(() => !!localStorage.getItem('planning_meal_type'))
const planningLabel = computed(() => {
    const t = localStorage.getItem('planning_meal_type')
    return { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' }[t] || ''
})

const filtered = computed(() => {
    const list = tab.value === 'system' ? dietStore.systemRecipes : dietStore.favorites
    return searchQuery.value ? list.filter(r => (r.title || r.name).includes(searchQuery.value)) : list
})

function showDetail(r, index) { 
    selected.value = JSON.parse(JSON.stringify(r));
    editingIndex.value = index; 
    visible.value = true; 
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
    if (tab.value !== 'fav' || editingIndex.value === -1) return
    dietStore.updateFavorite(editingIndex.value, selected.value)
    Object.assign(dietStore.favorites[editingIndex.value], selected.value)
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
    dietStore.addFood(null, { ...selected.value, name: selected.value.title || selected.value.name })
    ElMessage.success('已添加记录'); visible.value = false
}
</script>

<style scoped>
.recipe-container { padding: 15px; width: 100%; box-sizing: border-box; }
.search-section { margin-bottom: 25px; padding-top: 5px; }
.tabs { display: flex; gap: 10px; margin-bottom: 20px; }
.tab { padding: 8px 18px; border-radius: 12px; background: rgba(255,255,255,0.05); color: #94a3b8; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; }
.tab.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(142, 125, 255, 0.3); }

.recipe-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.recipe-card { background: rgba(30, 41, 59, 0.6); border-radius: 18px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); position: relative; }
.r-img { width: 100%; height: 110px; object-fit: cover; }
.r-info { padding: 10px; }
.r-name { font-weight: 800; font-size: 13px; display: block; margin-bottom: 5px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.r-tags { font-size: 10px; color: #94a3b8; }

.d-img-container { position: relative; width: 100%; height: 200px; border-radius: 20px; overflow: hidden; margin-bottom: 15px; cursor: pointer; }
.d-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
.d-img-container:hover .d-img { transform: scale(1.05); }
.img-edit-hint { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: white; opacity: 0; transition: opacity 0.3s; }
.d-img-container:hover .img-edit-hint { opacity: 1; }

.d-title-row { margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.title-input { background: transparent; border: none; border-bottom: 2px solid rgba(255,255,255,0.1); color: white; font-size: 20px; font-weight: 800; width: 100%; padding: 5px 0; outline: none; }
.title-input:focus { border-bottom-color: var(--primary); }

.d-macros { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
.di { background: rgba(255,255,255,0.05); padding: 12px 5px; border-radius: 15px; text-align: center; border: 1px solid rgba(255,255,255,0.03); }
.di input { background: transparent; border: none; color: #00cec9; font-size: 16px; font-weight: 900; width: 100%; text-align: center; outline: none; }
.di b { display: block; font-size: 16px; color: #00cec9; }
.di span { font-size: 10px; color: #94a3b8; margin-top: 4px; display: block; }

.desc-edit-wrap { margin-bottom: 10px; }
.desc-textarea { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 15px; width: 100%; min-height: 80px; padding: 12px; color: #cbd5e1; font-size: 13px; line-height: 1.6; resize: none; outline: none; }
.desc-textarea:focus { border-color: var(--primary); }
.d-desc { font-size: 13px; color: #cbd5e1; line-height: 1.6; padding: 0 10px; }

.d-foot { display: flex; flex-direction: column; gap: 12px; width: 100%; }
</style>