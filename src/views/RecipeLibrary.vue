<template>
  <div class="recipe-container animate-fade-in">
    <div class="header-section">
        <h2>健康食谱库</h2>
        <div class="search-box-wrapper">
            <el-input 
                v-model="searchQuery" 
                placeholder="搜索食谱 (如: 鸡胸肉, 减脂...)" 
                :prefix-icon="Search" 
                clearable 
                class="custom-search"
            />
        </div>
    </div>
    
    <el-tabs v-model="activeTab" class="custom-tabs">
      <el-tab-pane label="系统推荐" name="system">
        <div class="admin-actions" v-if="isAdmin">
            <el-button type="primary" :icon="Plus" @click="openAddSystemRecipe">新增系统食谱</el-button>
        </div>
        <div class="recipe-grid">
          <div 
            v-for="(recipe, index) in filteredSystemRecipes" 
            :key="index" 
            class="recipe-card-wrapper animate-slide-up"
            :style="{ animationDelay: `${index * 0.05}s` }"
            @click="openRecipeDetail(recipe)"
          >
              <div class="recipe-card">
                  <div class="card-content">
                      <h3 class="recipe-title">{{ recipe.title }}</h3>
                      <div class="tags">
                          <span class="cal-tag">{{ recipe.calories }} kcal/份</span>
                      </div>
                      <p class="recipe-desc">{{ recipe.description }}</p>
                  </div>
                  <div class="card-image">
                      <el-image :src="recipe.image" fit="cover" loading="lazy">
                          <template #error>
                              <div class="image-placeholder">
                                  <el-icon><Food /></el-icon>
                              </div>
                          </template>
                      </el-image>
                  </div>
                  <div v-if="isAdmin" class="card-admin-overlay" @click.stop>
                      <el-button type="primary" :icon="Edit" circle size="small" class="mr-1" @click.stop="openEditSystemRecipe(recipe)" />
                      <el-button type="danger" :icon="Delete" circle size="small" @click.stop="deleteSystemRecipe(recipe.id)" />
                  </div>
              </div>
          </div>
          
           <el-empty v-if="filteredSystemRecipes.length === 0" description="未找到相关食谱" style="width: 100%" />
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="我的常吃" name="favorites">
        <div v-if="dietStore.favorites.length > 0" class="favorites-grid">
             <div v-for="(item, idx) in dietStore.favorites" :key="idx" class="fav-card animate-slide-up">
                 <div class="fav-content" @click="openAddDialog(item)">
                     <el-image v-if="item.image" :src="item.image" class="fav-img" fit="cover" />
                     <div v-else class="fav-icon">
                         <el-icon><StarFilled /></el-icon>
                     </div>
                     <div class="fav-details">
                        <div class="fav-name">{{ item.name }}</div>
                        <div class="fav-meta">基准: {{ item.calories }} kcal / {{ item.baseWeight || 100 }}g</div>
                     </div>
                 </div>
                 <div class="fav-actions">
                     <el-button type="info" :icon="Edit" circle class="action-btn" @click.stop="openEditFav(idx, item)" />
                     <el-button type="primary" :icon="Plus" circle class="add-btn action-btn" @click.stop="openAddDialog(item)" />
                 </div>
             </div>
        </div>
        <el-empty v-else description="还没有收藏常吃食物，快去记录中收藏吧！" />
      </el-tab-pane>
    </el-tabs>

    <!-- Edit Favorite Dialog -->
    <el-dialog v-model="editFavDialogVisible" title="编辑收藏食物" width="90%" class="responsive-dialog" destroy-on-close>
        <el-form :model="favForm" label-width="80px">
            <el-form-item label="名称">
                <el-input v-model="favForm.name" />
            </el-form-item>
            <el-form-item label="图片">
                <el-upload
                    class="food-uploader"
                    action="/api/upload"
                    :show-file-list="false"
                    :on-success="handleFavImageSuccess"
                    :before-upload="beforeImageUpload"
                    :headers="{ Authorization: `Bearer ${userStore.token}` }"
                >
                    <img v-if="favForm.image" :src="favForm.image" class="uploaded-food-img" />
                    <el-icon v-else class="uploader-icon"><Plus /></el-icon>
                </el-upload>
            </el-form-item>
            <el-form-item label="基准重量">
                <el-input-number v-model="favForm.baseWeight" :min="1" :step="10" /> <span class="ml-2">g</span>
            </el-form-item>
            <el-divider>营养成分 (每{{ favForm.baseWeight }}g)</el-divider>
            <el-form-item label="热量">
                <el-input-number v-model="favForm.calories" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="三大项">
                <el-row :gutter="10">
                    <el-col :span="8"><el-input-number v-model="favForm.carbs" :min="0" placeholder="C" :controls="false" style="width: 100%" /><div class="sub-label">碳水</div></el-col>
                    <el-col :span="8"><el-input-number v-model="favForm.protein" :min="0" placeholder="P" :controls="false" style="width: 100%" /><div class="sub-label">蛋白</div></el-col>
                    <el-col :span="8"><el-input-number v-model="favForm.fat" :min="0" placeholder="F" :controls="false" style="width: 100%" /><div class="sub-label">脂肪</div></el-col>
                </el-row>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="editFavDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSaveFav">保存修改</el-button>
        </template>
    </el-dialog>

    <!-- Admin: Add System Recipe Dialog -->
    <el-dialog v-model="systemDialogVisible" :title="isEditingSystem ? '编辑系统食谱' : '新增系统食谱'" width="90%" class="responsive-dialog" destroy-on-close>
        <el-form :model="systemForm" label-width="80px">
            <el-form-item label="标题">
                <el-input v-model="systemForm.title" />
            </el-form-item>
            <el-form-item label="图片">
                <el-upload
                    class="food-uploader"
                    action="/api/upload"
                    :show-file-list="false"
                    :on-success="handleSystemImageSuccess"
                    :before-upload="beforeImageUpload"
                    :headers="{ Authorization: `Bearer ${userStore.token}` }"
                >
                    <img v-if="systemForm.image" :src="systemForm.image" class="uploaded-food-img" />
                    <el-icon v-else class="uploader-icon"><Plus /></el-icon>
                </el-upload>
            </el-form-item>
            <el-form-item label="基准重量">
                <el-input-number v-model="systemForm.baseWeight" :min="1" :step="10" /> <span class="ml-2">g</span>
            </el-form-item>
            <el-form-item label="热量">
                <el-input-number v-model="systemForm.calories" :min="0" style="width: 100%" />
            </el-form-item>
            <el-form-item label="三大项">
                <el-row :gutter="10">
                    <el-col :span="8"><el-input-number v-model="systemForm.carbs" :min="0" placeholder="C" :controls="false" style="width: 100%" /><div class="sub-label">碳水</div></el-col>
                    <el-col :span="8"><el-input-number v-model="systemForm.protein" :min="0" placeholder="P" :controls="false" style="width: 100%" /><div class="sub-label">蛋白</div></el-col>
                    <el-col :span="8"><el-input-number v-model="systemForm.fat" :min="0" placeholder="F" :controls="false" style="width: 100%" /><div class="sub-label">脂肪</div></el-col>
                </el-row>
            </el-form-item>
            <el-form-item label="描述">
                <el-input v-model="systemForm.description" type="textarea" />
            </el-form-item>
            <el-form-item label="食材">
                <el-input v-model="systemForm.ingredients" type="textarea" placeholder="每行一个食材" />
            </el-form-item>
            <el-form-item label="步骤">
                <el-input v-model="systemForm.instructions" type="textarea" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="systemDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSaveSystemRecipe">{{ isEditingSystem ? '保存更新' : '确认添加' }}</el-button>
        </template>
    </el-dialog>

    <!-- Recipe Detail & Add Dialog -->
    <el-dialog v-model="detailVisible" :title="null" width="90%" class="recipe-dialog" destroy-on-close>
        <div v-if="selectedRecipe" class="detail-container">
            <!-- Header Image -->
            <div class="dialog-header-img" :style="{ backgroundImage: `url(${selectedRecipe.image})` }">
                <div class="img-overlay">
                    <h2>{{ selectedRecipe.title }}</h2>
                </div>
            </div>

            <div class="detail-body">
                <!-- Weight Calculator -->
                <div class="calculator-section">
                    <div class="calc-row">
                        <span class="calc-label">摄入分量 (g)</span>
                        <el-input-number v-model="inputWeight" :min="10" :max="2000" :step="10" size="large" />
                    </div>
                    <div class="calculated-macros">
                        <div class="c-macro">
                            <span class="c-val">{{ calculatedMacros.calories }}</span>
                            <span class="c-unit">kcal</span>
                        </div>
                        <div class="c-divider"></div>
                         <div class="c-macro">
                            <span class="c-val">{{ calculatedMacros.protein }}</span>
                            <span class="c-unit">P</span>
                        </div>
                        <div class="c-macro">
                            <span class="c-val">{{ calculatedMacros.carbs }}</span>
                            <span class="c-unit">C</span>
                        </div>
                        <div class="c-macro">
                            <span class="c-val">{{ calculatedMacros.fat }}</span>
                            <span class="c-unit">F</span>
                        </div>
                    </div>
                </div>

                <div class="section" v-if="selectedRecipe.ingredients">
                    <h4><el-icon><ShoppingBag /></el-icon> 食材清单</h4>
                    <div class="ingredients-list">
                        <div v-for="(ing, i) in selectedRecipe.ingredients" :key="i" class="ing-item">
                            <span class="dot">•</span> {{ ing }}
                        </div>
                    </div>
                </div>

                <div class="section" v-if="selectedRecipe.instructions">
                    <h4><el-icon><Timer /></el-icon> 制作步骤</h4>
                    <div class="instruction-box">
                        {{ selectedRecipe.instructions }}
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="detailVisible = false" round>取消</el-button>
                <el-button type="primary" @click="confirmAddFood" round size="large">
                    <el-icon class="mr-1"><Plus /></el-icon> 确认添加 ({{ calculatedMacros.calories }} kcal)
                </el-button>
            </div>
        </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useDietStore } from '../stores/diet'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { Plus, Search, ArrowRight, StarFilled, ShoppingBag, Timer, Food, Edit, Delete } from '@element-plus/icons-vue'
import axios from 'axios'
import { compressImage } from '../utils/compress'

const activeTab = ref('system')
const dietStore = useDietStore()
const userStore = useUserStore()
const detailVisible = ref(false)
const selectedRecipe = ref(null)
const searchQuery = ref('')
const inputWeight = ref(100) // Default 100g

// Admin & System Recipe State
const isAdmin = computed(() => userStore.role === 'admin')
const systemDialogVisible = ref(false)
const isEditingSystem = ref(false)
const systemForm = reactive({ id: null, title: '', calories: 0, carbs: 0, protein: 0, fat: 0, baseWeight: 100, image: '', description: '', ingredients: '', instructions: '' })

// Edit Favorite State
const editFavDialogVisible = ref(false)
const editingFavIndex = ref(-1)
const favForm = reactive({ name: '', image: '', calories: 0, carbs: 0, protein: 0, fat: 0, baseWeight: 100 })

onMounted(() => {
    dietStore.fetchRecipes()
})

const filteredSystemRecipes = computed(() => {
    if (!searchQuery.value) return dietStore.systemRecipes
    const q = searchQuery.value.toLowerCase()
    return dietStore.systemRecipes.filter(r => 
        r.title.toLowerCase().includes(q) || 
        (r.ingredients && r.ingredients.some(i => i.toLowerCase().includes(q)))
    )
})

// Logic for Adding Food
function openRecipeDetail(recipe) {
    selectedRecipe.value = { ...recipe, baseWeight: recipe.baseWeight || 100 } // fallback
    inputWeight.value = selectedRecipe.value.baseWeight // default to standard serving
    detailVisible.value = true
}

function openAddDialog(item) {
    // For favorites
    selectedRecipe.value = { 
        ...item, 
        title: item.name, 
        baseWeight: item.baseWeight || 100 
    }
    inputWeight.value = selectedRecipe.value.baseWeight
    detailVisible.value = true
}

// Logic for Editing Favorites
function openEditFav(index, item) {
    editingFavIndex.value = index
    // Copy item to form
    Object.assign(favForm, {
        name: item.name,
        image: item.image || '',
        calories: Number(item.calories) || 0,
        carbs: Number(item.carbs) || 0,
        protein: Number(item.protein) || 0,
        fat: Number(item.fat) || 0,
        baseWeight: Number(item.baseWeight) || 100
    })
    editFavDialogVisible.value = true
}

function handleSaveFav() {
    if (!favForm.name) return ElMessage.warning('请输入名称')
    
    dietStore.updateFavorite(editingFavIndex.value, { ...favForm })
    ElMessage.success('修改成功')
    editFavDialogVisible.value = false
}

// Upload Helpers
function handleFavImageSuccess(res) {
    favForm.image = res.url
    ElMessage.success('图片上传成功')
}
function handleSystemImageSuccess(res) {
    systemForm.image = res.url
    ElMessage.success('图片上传成功')
}
function beforeImageUpload(file) {
    const isImg = file.type === 'image/jpeg' || file.type === 'image/png';
    
    if (!isImg) {
        ElMessage.error('只能上传 JPG/PNG 文件');
        return false;
    }
    
    return compressImage(file, 600, 0.7).then(compressedFile => {
        if (compressedFile.size / 1024 / 1024 > 5) {
             ElMessage.error('图片即使压缩后仍过大，请更换图片')
             return false
        }
        return compressedFile
    }).catch(err => {
        console.error(err)
        ElMessage.error('图片处理失败')
        return false
    })
}

// Admin Logic
function openAddSystemRecipe() {
    isEditingSystem.value = false
    Object.assign(systemForm, { id: null, title: '', calories: 0, carbs: 0, protein: 0, fat: 0, baseWeight: 100, image: '', description: '', ingredients: '', instructions: '' })
    systemDialogVisible.value = true
}

function openEditSystemRecipe(recipe) {
    isEditingSystem.value = true
    // Populate form
    Object.assign(systemForm, {
        id: recipe.id,
        title: recipe.title,
        calories: recipe.calories,
        carbs: recipe.carbs,
        protein: recipe.protein,
        fat: recipe.fat,
        baseWeight: recipe.baseWeight || 100,
        image: recipe.image,
        description: recipe.description,
        // Ensure ingredients is string for textarea
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.join('\n') : recipe.ingredients,
        instructions: recipe.instructions
    })
    systemDialogVisible.value = true
}

async function handleSaveSystemRecipe() {
    if (!systemForm.title) return ElMessage.warning('标题必填')
    
    // Convert string inputs to arrays if needed
    const payload = { ...systemForm }
    if (typeof payload.ingredients === 'string') {
        payload.ingredients = payload.ingredients.split('\n').filter(i => i.trim())
    }
    
    try {
        if (isEditingSystem.value && systemForm.id) {
            // Update existing
            await axios.put(`/api/recipes/${systemForm.id}`, payload, {
                headers: { Authorization: `Bearer ${userStore.token}` }
            })
            ElMessage.success('更新成功')
        } else {
            // Create new
            await axios.post('/api/recipes', payload, {
                headers: { Authorization: `Bearer ${userStore.token}` }
            })
            ElMessage.success('添加成功')
        }
        
        systemDialogVisible.value = false
        dietStore.fetchRecipes()
    } catch (e) {
        ElMessage.error(isEditingSystem.value ? '更新失败' : '添加失败')
    }
}

async function deleteSystemRecipe(id) {
    try {
        await axios.delete(`/api/recipes/${id}`, {
            headers: { Authorization: `Bearer ${userStore.token}` }
        })
        ElMessage.success('删除成功')
        dietStore.fetchRecipes()
    } catch (e) {
        ElMessage.error('删除失败')
    }
}

const calculatedMacros = computed(() => {
    if (!selectedRecipe.value) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    
    const ratio = inputWeight.value / selectedRecipe.value.baseWeight
    return {
        calories: Math.round(selectedRecipe.value.calories * ratio),
        protein: Math.round(selectedRecipe.value.protein * ratio),
        carbs: Math.round(selectedRecipe.value.carbs * ratio),
        fat: Math.round(selectedRecipe.value.fat * ratio)
    }
})

function confirmAddFood() {
    if (!selectedRecipe.value) return
    
    dietStore.addFood(null, {
        name: selectedRecipe.value.title,
        ...calculatedMacros.value,
        image: selectedRecipe.value.image // pass image along
    })
    
    detailVisible.value = false
    ElMessage.success(`已添加 ${inputWeight.value}g ${selectedRecipe.value.title}`)
}
</script>

<style scoped>
.recipe-container {
    padding-bottom: 100px;
    margin: 0 auto;
}

.header-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
    text-align: center;
}
.header-section h2 { color: white; margin-bottom: 15px; font-weight: 800; font-size: 22px; text-shadow: 0 0 10px rgba(0,0,0,0.5); }

/* Custom Tabs Styling - High Contrast */
.custom-tabs :deep(.el-tabs__header) { margin-bottom: 20px; }
.custom-tabs :deep(.el-tabs__nav-wrap::after) { background-color: rgba(255,255,255,0.1); height: 1px; }
.custom-tabs :deep(.el-tabs__item) {
    color: rgba(255,255,255,0.5); /* Inactive brightness */
    font-size: 16px;
    font-weight: 600;
    transition: all 0.3s;
}
.custom-tabs :deep(.el-tabs__item.is-active) {
    color: #8e7dff; 
    text-shadow: 0 0 15px rgba(142, 125, 255, 0.8); /* Glow effect */
    font-size: 17px;
}
.custom-tabs :deep(.el-tabs__item:hover) { color: rgba(255,255,255,0.9); }
.custom-tabs :deep(.el-tabs__active-bar) {
    background-color: #8e7dff;
    box-shadow: 0 0 10px rgba(142, 125, 255, 0.8);
    height: 3px;
    border-radius: 3px;
}

.search-box-wrapper { width: 100%; max-width: 500px; }
.custom-search :deep(.el-input__wrapper) {
    border-radius: 20px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    background: rgba(30, 41, 59, 0.6) !important;
    border: 1px solid rgba(255,255,255,0.1);
}
.custom-search :deep(.el-input__inner) { color: white; }

/* Grid Layout */
.recipe-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* 2 Columns for mobile */
    gap: 15px;
    padding: 10px 0;
}

.recipe-card-wrapper { cursor: pointer; }
.recipe-card {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(15px);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
    transition: transform 0.2s, box-shadow 0.2s;
    height: 200px; /* Taller for vertical */
    display: flex;
    flex-direction: column;
    position: relative;
    border: 1px solid rgba(255,255,255,0.1);
}
.recipe-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0,0,0,0.4);
    border-color: rgba(255,255,255,0.2);
}

.card-image {
    width: 100%;
    height: 120px;
}
.card-image .el-image { width: 100%; height: 100%; }
.image-placeholder { width: 100%; height: 100%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 24px; }

.card-content { 
    padding: 12px; 
    flex: 1; 
    display: flex; 
    flex-direction: column; 
}
.recipe-title { margin: 0 0 5px; font-size: 15px; color: white; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-weight: 700; }
.tags { margin-bottom: 5px; }
.cal-tag { font-size: 11px; padding: 2px 8px; border-radius: 6px; font-weight: 700; background: rgba(142, 125, 255, 0.2); color: #a29bfe; }
.recipe-desc { font-size: 11px; color: #cbd5e1; line-height: 1.4; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* Favorites Grid */
.favorites-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 15px;
}
.fav-card {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(15px);
    padding: 15px;
    border-radius: 20px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid rgba(255,255,255,0.1);
}
.fav-content { display: flex; align-items: center; gap: 15px; cursor: pointer; flex: 1; }
.fav-img { width: 60px; height: 60px; border-radius: 12px; object-fit: cover; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
.fav-icon { width: 60px; height: 60px; border-radius: 12px; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; color: #ffeaa7; font-size: 28px; }
.fav-name { font-weight: 700; color: white; font-size: 16px; }
.fav-meta { font-size: 12px; color: #94a3b8; margin-top: 4px; font-weight: 600; }

.fav-actions { display: flex; gap: 8px; }
.action-btn { margin-left: 0 !important; width: 36px !important; height: 36px !important; border-radius: 10px !important; background: rgba(255,255,255,0.1); border: none; color: white; }
.add-btn { background: #8e7dff; color: white; }

/* Detail Dialog New Styles */
.recipe-dialog :deep(.el-dialog__body) { padding: 0; }
.dialog-header-img {
    height: 220px;
    background-size: cover;
    background-position: center;
    position: relative;
    border-radius: 8px 8px 0 0;
}
.img-overlay {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    background: linear-gradient(to top, rgba(15, 23, 42, 0.9), transparent);
    padding: 20px;
    color: white;
}
.img-overlay h2 { margin: 0; font-size: 24px; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }

.detail-body { padding: 20px; color: #cbd5e1; }

.calculator-section {
    background: rgba(255,255,255,0.05);
    padding: 15px;
    border-radius: 12px;
    margin-bottom: 20px;
    border: 1px solid rgba(255,255,255,0.1);
}
.calc-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.calc-label { font-weight: bold; color: white; }

.calculated-macros {
    display: flex;
    justify-content: space-around;
    align-items: center;
}
.c-macro { display: flex; flex-direction: column; align-items: center; }
.c-val { font-size: 20px; font-weight: 800; color: #8e7dff; }
.c-unit { font-size: 12px; color: #94a3b8; }
.c-divider { width: 1px; height: 20px; background: rgba(255,255,255,0.1); }

.section { margin-bottom: 20px; }
.section h4 { 
    display: flex; align-items: center; gap: 8px; margin: 0 0 12px; 
    color: white; font-size: 16px; 
}
.ingredients-list { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.ing-item { font-size: 14px; color: #cbd5e1; }
.dot { color: #8e7dff; font-weight: bold; margin-right: 5px; }
.instruction-box { 
    font-size: 14px; color: #cbd5e1; line-height: 1.6;
}

.mr-1 { margin-right: 5px; }
.ml-2 { margin-left: 8px; }
.sub-label { text-align: center; font-size: 12px; color: #909399; margin-top: 5px; }

/* Admin Styles */
.admin-actions { margin-bottom: 15px; display: flex; justify-content: flex-end; }
.card-admin-overlay { 
    position: absolute; top: 5px; right: 5px; opacity: 0; transition: opacity 0.2s; 
    background: rgba(255,255,255,0.8); border-radius: 50%; padding: 2px;
}
.recipe-card:hover .card-admin-overlay { opacity: 1; }

.food-uploader { 
    border: 1px dashed #d9d9d9; border-radius: 6px; cursor: pointer; position: relative; overflow: hidden; 
    width: 80px; height: 80px; display: flex; align-items: center; justify-content: center;
}
.food-uploader:hover { border-color: #409eff; }
.uploader-icon { font-size: 28px; color: #8c939d; }
.uploaded-food-img { width: 100%; height: 100%; object-fit: cover; }

/* Animations */
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
.animate-slide-up { animation: slideUp 0.5s ease-out both; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>