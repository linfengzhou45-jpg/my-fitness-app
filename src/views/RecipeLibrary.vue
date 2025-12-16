<template>
  <div class="recipe-container">
    <div class="search-box">
        <el-input v-model="searchQuery" placeholder="搜索食谱或食材..." prefix-icon="Search" clearable />
    </div>
    <el-tabs v-model="activeTab" class="recipe-tabs">
      <el-tab-pane label="系统食谱" name="system">
        <div class="recipe-list">
          <el-card v-for="(recipe, index) in filteredSystemRecipes" :key="index" class="recipe-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>{{ recipe.title }}</span>
                <el-tag type="success" size="small">系统推荐</el-tag>
              </div>
            </template>
            <div class="recipe-content">
              <p class="recipe-desc">{{ recipe.description }}</p>
              <div class="recipe-meta">
                  <span>🔥 {{ recipe.calories }} kcal</span>
                  <el-button type="primary" link @click="openRecipeDetail(recipe)">查看详情</el-button>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="我的常吃" name="favorites">
        <div v-if="dietStore.favorites.length > 0" class="favorites-list">
             <el-card v-for="(item, idx) in dietStore.favorites" :key="idx" class="recipe-card" shadow="hover">
                 <div class="fav-item">
                     <div class="fav-info" @click="addFromFav(item)">
                         <div class="fav-name">{{ item.name }}</div>
                         <div class="fav-meta">{{ item.calories }} kcal · C{{ item.carbs }} P{{ item.protein }} F{{ item.fat }}</div>
                     </div>
                     <el-button type="primary" size="small" :icon="Plus" circle @click="addFromFav(item)" />
                 </div>
             </el-card>
        </div>
        <el-empty v-else description="还没有收藏常吃食物" />
      </el-tab-pane>
    </el-tabs>

    <!-- Recipe Detail Dialog -->
    <el-dialog v-model="detailVisible" :title="selectedRecipe?.title" width="90%" class="responsive-dialog">
        <div v-if="selectedRecipe">
            <div class="detail-section">
                <h4>营养成分</h4>
                <div class="macros-grid">
                    <div class="macro-box">
                        <span class="val">{{ selectedRecipe.calories }}</span>
                        <span class="lbl">热量</span>
                    </div>
                    <div class="macro-box">
                        <span class="val">{{ selectedRecipe.carbs }}g</span>
                        <span class="lbl">碳水</span>
                    </div>
                    <div class="macro-box">
                        <span class="val">{{ selectedRecipe.protein }}g</span>
                        <span class="lbl">蛋白</span>
                    </div>
                    <div class="macro-box">
                        <span class="val">{{ selectedRecipe.fat }}g</span>
                        <span class="lbl">脂肪</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>食材清单</h4>
                <ul class="ingredient-list">
                    <li v-for="(ing, i) in selectedRecipe.ingredients" :key="i">{{ ing }}</li>
                </ul>
            </div>

            <div class="detail-section">
                <h4>制作建议</h4>
                <p>{{ selectedRecipe.instructions }}</p>
            </div>
        </div>
        <template #footer>
            <el-button @click="detailVisible = false">关闭</el-button>
            <el-button type="primary" @click="addRecipeToDiet">一键添加今日饮食</el-button>
        </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useDietStore } from '../stores/diet'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

const activeTab = ref('system')
const dietStore = useDietStore()
const detailVisible = ref(false)
const selectedRecipe = ref(null)
const searchQuery = ref('')

// Mock Data for System Recipes
const systemRecipes = [
    {
        title: '经典减脂鸡胸餐',
        calories: 450, carbs: 40, protein: 45, fat: 10,
        description: '高蛋白低脂，适合减脂期午餐',
        ingredients: ['鸡胸肉 150g', '西兰花 100g', '糙米饭 100g', '橄榄油 5g'],
        instructions: '鸡胸肉煎熟，蔬菜水煮，搭配糙米饭。'
    },
    {
        title: '元气牛肉波奇碗',
        calories: 550, carbs: 60, protein: 35, fat: 15,
        description: '营养均衡，口感丰富',
        ingredients: ['瘦牛肉 120g', '玉米粒 50g', '黄瓜 50g', '白米饭 150g', '海苔碎'],
        instructions: '牛肉煮熟切片，所有食材铺在米饭上，淋上低卡酱汁。'
    },
    {
        title: '燕麦牛奶早餐杯',
        calories: 350, carbs: 50, protein: 15, fat: 8,
        description: '快速便捷，饱腹感强',
        ingredients: ['燕麦片 50g', '脱脂牛奶 200ml', '蓝莓 20g', '奇亚籽 5g'],
        instructions: '混合所有材料，冷藏过夜口感更佳。'
    }
]

const filteredSystemRecipes = computed(() => {
    if (!searchQuery.value) return systemRecipes
    const q = searchQuery.value.toLowerCase()
    return systemRecipes.filter(r => 
        r.title.toLowerCase().includes(q) || 
        r.ingredients.some(i => i.toLowerCase().includes(q))
    )
})

function openRecipeDetail(recipe) {
    selectedRecipe.value = recipe
    detailVisible.value = true
}

function addFromFav(item) {
    dietStore.addFood(null, { ...item })
    ElMessage.success('已添加到今日饮食')
}

function addRecipeToDiet() {
    if (!selectedRecipe.value) return
    
    // Add as a single item for simplicity, or we could add ingredients separately.
    // Here we add as a "Combo" item.
    dietStore.addFood(null, {
        name: selectedRecipe.value.title,
        calories: selectedRecipe.value.calories,
        carbs: selectedRecipe.value.carbs,
        protein: selectedRecipe.value.protein,
        fat: selectedRecipe.value.fat
    })
    
    detailVisible.value = false
    ElMessage.success('套餐已添加')
}
</script>

<style scoped>
.recipe-container {
    padding: 15px;
    padding-bottom: 80px;
}
.search-box {
    margin-bottom: 15px;
}
.recipe-card {
    margin-bottom: 15px;
}
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
}
.recipe-content {
    color: #606266;
}
.recipe-desc {
    font-size: 13px;
    margin-bottom: 10px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.recipe-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
    color: #303133;
}

.fav-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.fav-info {
    flex: 1;
    cursor: pointer;
}
.fav-name { font-weight: bold; font-size: 16px; }
.fav-meta { color: #909399; font-size: 12px; margin-top: 4px; }

/* Detail Dialog Styles */
.detail-section { margin-bottom: 20px; }
.detail-section h4 { margin: 0 0 10px 0; color: #303133; border-left: 4px solid #409eff; padding-left: 10px; }

.macros-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    text-align: center;
    background: #f5f7fa;
    padding: 15px;
    border-radius: 8px;
}
.macro-box { display: flex; flex-direction: column; }
.macro-box .val { font-weight: bold; font-size: 16px; color: #409eff; }
.macro-box .lbl { font-size: 12px; color: #909399; margin-top: 4px; }

.ingredient-list { padding-left: 20px; color: #606266; }
.ingredient-list li { margin-bottom: 5px; }

@media (max-width: 768px) {
    .responsive-dialog { width: 95% !important; }
}
</style>