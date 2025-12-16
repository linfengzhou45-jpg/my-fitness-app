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
    },
    {
        title: '兰州牛肉拉面',
        calories: 600, carbs: 80, protein: 30, fat: 20,
        description: '地道风味，汤鲜面劲道',
        ingredients: ['拉面 200g', '牛肉片 100g', '白萝卜 50g', '香菜', '蒜苗', '辣椒油'],
        instructions: '煮面，牛肉切片，白萝卜煮熟，加入香菜蒜苗和特制辣椒油。'
    },
    {
        title: '回锅肉饭',
        calories: 700, carbs: 70, protein: 25, fat: 35,
        description: '香辣可口，米饭杀手',
        ingredients: ['五花肉 150g', '青椒 50g', '蒜苗 30g', '豆瓣酱', '米饭 200g'],
        instructions: '五花肉煮熟切片，煸炒出油，加入青椒蒜苗豆瓣酱，配米饭。'
    },
    {
        title: '宫保鸡丁饭',
        calories: 650, carbs: 65, protein: 30, fat: 30,
        description: '酸甜微辣，经典川菜',
        ingredients: ['鸡胸肉 150g', '花生米 30g', '黄瓜 50g', '胡萝卜 50g', '米饭 200g', '干辣椒', '花椒'],
        instructions: '鸡丁滑炒，加入配料和调料，大火翻炒，配米饭。'
    },
    {
        title: '鱼香肉丝饭',
        calories: 620, carbs: 60, protein: 28, fat: 28,
        description: '咸鲜酸甜，下饭神器',
        ingredients: ['猪里脊 150g', '木耳 30g', '胡萝卜 30g', '青椒 30g', '米饭 200g'],
        instructions: '肉丝滑炒，加入配菜和鱼香汁，快速翻炒，配米饭。'
    },
    {
        title: '番茄鸡蛋面',
        calories: 480, carbs: 60, protein: 20, fat: 18,
        description: '家常美味，简单营养',
        ingredients: ['面条 150g', '番茄 200g', '鸡蛋 2个', '葱花'],
        instructions: '番茄炒蛋，加入开水煮面，面熟后放入番茄鸡蛋汤中。'
    },
    {
        title: '香菇滑鸡饭',
        calories: 580, carbs: 60, protein: 30, fat: 25,
        description: '鸡肉滑嫩，香菇入味',
        ingredients: ['鸡腿肉 150g', '香菇 80g', '姜片', '葱段', '米饭 200g'],
        instructions: '鸡腿肉切块滑炒，加入香菇，调味焖煮，配米饭。'
    },
    {
        title: '扬州炒饭',
        calories: 680, carbs: 80, protein: 20, fat: 30,
        description: '粒粒分明，色香味俱全',
        ingredients: ['米饭 250g', '鸡蛋 2个', '虾仁 50g', '火腿 50g', '青豆 30g', '胡萝卜丁 30g'],
        instructions: '鸡蛋炒散，加入配料和米饭翻炒均匀。'
    },
    {
        title: '红烧牛肉面',
        calories: 750, carbs: 90, protein: 35, fat: 30,
        description: '浓郁汤汁，软烂牛肉',
        ingredients: ['牛肉 150g', '面条 200g', '白萝卜 50g', '八角', '桂皮', '葱姜蒜'],
        instructions: '牛肉炖煮入味，煮面，加入牛肉和汤汁。'
    },
    {
        title: '麻婆豆腐盖饭',
        calories: 580, carbs: 60, protein: 25, fat: 25,
        description: '麻辣鲜香，豆腐嫩滑',
        ingredients: ['豆腐 200g', '肉末 50g', '豆瓣酱', '花椒', '辣椒粉', '米饭 200g'],
        instructions: '肉末炒香，加入豆瓣酱和豆腐，调味烧煮，淋在米饭上。'
    },
    {
        title: '葱油拌面',
        calories: 420, carbs: 60, protein: 12, fat: 15,
        description: '香而不腻，简单美味',
        ingredients: ['面条 150g', '小葱', '食用油', '酱油'],
        instructions: '小葱炸成葱油，面条煮熟沥干，拌入葱油和酱油。'
    },
    {
        title: '酸辣土豆丝',
        calories: 300, carbs: 40, protein: 5, fat: 12,
        description: '清爽开胃，酸辣适中',
        ingredients: ['土豆 300g', '干辣椒', '醋', '蒜末'],
        instructions: '土豆切丝焯水，大火爆炒，调入醋和辣椒。'
    },
    {
        title: '手撕包菜',
        calories: 280, carbs: 20, protein: 8, fat: 18,
        description: '家常炒菜，清脆爽口',
        ingredients: ['包菜 300g', '蒜末', '干辣椒', '花椒'],
        instructions: '包菜手撕，大火快炒，加入蒜末辣椒花椒。'
    },
    {
        title: '鸡蛋炒饭',
        calories: 600, carbs: 70, protein: 18, fat: 25,
        description: '简单快手，经典主食',
        ingredients: ['米饭 200g', '鸡蛋 2个', '葱花', '酱油'],
        instructions: '鸡蛋炒散，加入米饭和葱花翻炒均匀，调味。'
    },
    {
        title: '番茄牛腩饭',
        calories: 700, carbs: 60, protein: 35, fat: 35,
        description: '营养丰富，汤汁浓郁',
        ingredients: ['牛腩 150g', '番茄 2个', '土豆 100g', '胡萝卜 50g', '米饭 200g'],
        instructions: '牛腩炖烂，加入番茄土豆胡萝卜，烧煮入味，配米饭。'
    },
    {
        title: '香辣虾',
        calories: 550, carbs: 30, protein: 30, fat: 35,
        description: '麻辣鲜香，开胃下饭',
        ingredients: ['虾 300g', '干辣椒', '花椒', '姜蒜', '葱'],
        instructions: '虾炸至金黄，大火煸炒配料，加入虾翻炒。'
    },
    {
        title: '蒜蓉西兰花',
        calories: 180, carbs: 15, protein: 8, fat: 10,
        description: '清淡健康，蒜香浓郁',
        ingredients: ['西兰花 300g', '蒜蓉', '蚝油'],
        instructions: '西兰花焯水，蒜蓉爆香，加入西兰花翻炒。'
    },
    {
        title: '麻辣香锅',
        calories: 800, carbs: 50, protein: 40, fat: 50,
        description: '自由搭配，麻辣过瘾',
        ingredients: ['各种蔬菜、肉类、丸子等', '麻辣香锅底料'],
        instructions: '食材焯水，加入香锅底料大火翻炒。'
    },
    {
        title: '重庆小面',
        calories: 500, carbs: 70, protein: 20, fat: 15,
        description: '麻辣鲜香，劲道爽滑',
        ingredients: ['面条 150g', '花生米', '肉末', '油菜', '花椒油', '辣椒油'],
        instructions: '面条煮熟，加入特制调料和配料。'
    },
    {
        title: '酸菜鱼',
        calories: 400, carbs: 20, protein: 40, fat: 20,
        description: '酸辣开胃，鱼肉鲜嫩',
        ingredients: ['草鱼片 300g', '酸菜 150g', '豆芽', '金针菇', '辣椒', '花椒'],
        instructions: '鱼片腌制，酸菜炒香，加入高汤煮鱼片。'
    },
    {
        title: '干锅花菜',
        calories: 350, carbs: 25, protein: 10, fat: 20,
        description: '干香入味，下饭好菜',
        ingredients: ['花菜 300g', '五花肉 50g', '干辣椒', '蒜片'],
        instructions: '花菜焯水，五花肉煸炒，加入花菜和调料。'
    },
    {
        title: '水煮肉片',
        calories: 600, carbs: 25, protein: 40, fat: 40,
        description: '麻辣鲜香，肉片滑嫩',
        ingredients: ['猪里脊 200g', '豆芽 100g', '青菜 100g', '豆瓣酱', '辣椒', '花椒'],
        instructions: '肉片腌制，配菜焯水，豆瓣酱炒香，加入高汤煮肉片。'
    },
    {
        title: '蚝油生菜',
        calories: 150, carbs: 10, protein: 5, fat: 8,
        description: '清爽健康，蚝油提鲜',
        ingredients: ['生菜 300g', '蒜蓉', '蚝油'],
        instructions: '生菜焯水，蒜蓉爆香，淋上蚝油。'
    },
    {
        title: '西红柿炒蛋',
        calories: 320, carbs: 20, protein: 15, fat: 20,
        description: '家常经典，酸甜可口',
        ingredients: ['西红柿 2个', '鸡蛋 3个', '葱花'],
        instructions: '鸡蛋炒散，西红柿炒出汁，混合翻炒。'
    },
    {
        title: '清炒时蔬',
        calories: 200, carbs: 25, protein: 10, fat: 8,
        description: '健康素菜，保持原味',
        ingredients: ['多种时令蔬菜', '蒜蓉'],
        instructions: '蔬菜焯水，大火快炒，加入蒜蓉调味。'
    },
    {
        title: '香菇青菜',
        calories: 180, carbs: 20, protein: 5, fat: 8,
        description: '营养丰富，清淡可口',
        ingredients: ['香菇 100g', '青菜 200g', '蒜蓉'],
        instructions: '香菇青菜炒熟，蒜蓉调味。'
    },
    {
        title: '肉末茄子',
        calories: 400, carbs: 30, protein: 20, fat: 25,
        description: '茄子软糯，肉末鲜香',
        ingredients: ['茄子 200g', '肉末 50g', '蒜蓉', '豆瓣酱'],
        instructions: '茄子炸熟，肉末炒香，加入豆瓣酱和茄子。'
    },
    {
        title: '红烧豆腐',
        calories: 350, carbs: 20, protein: 25, fat: 18,
        description: '豆腐入味，家常下饭',
        ingredients: ['豆腐 300g', '葱姜蒜', '酱油', '糖'],
        instructions: '豆腐煎至金黄，加入调料红烧。'
    },
    {
        title: '小炒肉',
        calories: 550, carbs: 20, protein: 30, fat: 40,
        description: '香辣开胃，肉片焦香',
        ingredients: ['五花肉 150g', '青红椒 100g', '豆豉', '蒜片'],
        instructions: '五花肉煸炒，加入青红椒和调料。'
    },
    {
        title: '酱爆猪肝',
        calories: 480, carbs: 20, protein: 30, fat: 30,
        description: '猪肝滑嫩，酱香浓郁',
        ingredients: ['猪肝 200g', '青椒 50g', '洋葱 50g', '甜面酱'],
        instructions: '猪肝滑炒，加入青椒洋葱甜面酱翻炒。'
    },
    {
        title: '蒜苗炒腊肉',
        calories: 500, carbs: 15, protein: 25, fat: 40,
        description: '腊肉咸香，蒜苗脆嫩',
        ingredients: ['腊肉 100g', '蒜苗 150g', '干辣椒'],
        instructions: '腊肉切片煸炒，加入蒜苗和干辣椒。'
    },
    {
        title: '地三鲜',
        calories: 450, carbs: 40, protein: 10, fat: 30,
        description: '东北名菜，软糯鲜香',
        ingredients: ['土豆 200g', '茄子 150g', '青椒 100g', '蒜蓉'],
        instructions: '土豆茄子炸熟，青椒炒香，所有食材混合翻炒。'
    },
    {
        title: '豆角焖面',
        calories: 600, carbs: 70, protein: 20, fat: 25,
        description: '面条入味，豆角软烂',
        ingredients: ['面条 200g', '豆角 150g', '五花肉 50g', '葱姜蒜'],
        instructions: '五花肉炒香，加入豆角焖煮，放入面条焖熟。'
    },
    {
        title: '锅包肉',
        calories: 800, carbs: 70, protein: 30, fat: 40,
        description: '酸甜酥脆，东北特色',
        ingredients: ['猪里脊 200g', '淀粉', '糖醋汁', '胡萝卜丝', '香菜'],
        instructions: '里脊肉切片裹淀粉炸酥，淋上糖醋汁。'
    },
    {
        title: '拔丝地瓜',
        calories: 550, carbs: 80, protein: 5, fat: 25,
        description: '香甜可口，外酥里糯',
        ingredients: ['地瓜 300g', '白糖', '食用油'],
        instructions: '地瓜炸熟，白糖熬成糖浆，裹在地瓜上。'
    },
    {
        title: '京酱肉丝',
        calories: 480, carbs: 30, protein: 30, fat: 25,
        description: '酱香浓郁，搭配豆皮',
        ingredients: ['猪里脊 200g', '甜面酱', '葱丝', '豆皮'],
        instructions: '肉丝炒熟，加入甜面酱翻炒，配葱丝豆皮。'
    },
    {
        title: '卤肉饭',
        calories: 650, carbs: 60, protein: 25, fat: 35,
        description: '肥而不腻，香浓可口',
        ingredients: ['五花肉 150g', '香菇 50g', '红葱头', '米饭 200g'],
        instructions: '五花肉卤煮入味，淋在米饭上。'
    },
    {
        title: '肉夹馍',
        calories: 500, carbs: 50, protein: 25, fat: 25,
        description: '外酥里嫩，肉香四溢',
        ingredients: ['白吉馍 1个', '卤肉 100g', '青椒', '香菜'],
        instructions: '白吉馍加热，夹入剁碎的卤肉和青椒香菜。'
    },
    {
        title: '热干面',
        calories: 450, carbs: 60, protein: 15, fat: 15,
        description: '武汉特色，酱香浓郁',
        ingredients: ['碱水面 150g', '芝麻酱', '萝卜干', '酸豆角', '葱花'],
        instructions: '面条煮熟，拌入芝麻酱和各种配料。'
    },
    {
        title: '凉皮',
        calories: 380, carbs: 70, protein: 10, fat: 5,
        description: '清爽开胃，劲道爽滑',
        ingredients: ['凉皮 200g', '黄瓜丝', '豆芽', '辣椒油', '醋'],
        instructions: '凉皮切条，加入黄瓜丝豆芽，淋上调料。'
    },
    {
        title: '炒河粉',
        calories: 550, carbs: 70, protein: 15, fat: 25,
        description: '广东特色，锅气十足',
        ingredients: ['河粉 200g', '牛肉片 50g', '豆芽 50g', '韭菜 30g'],
        instructions: '河粉炒香，加入牛肉豆芽韭菜，大火快炒。'
    },
    {
        title: '肠粉',
        calories: 300, carbs: 40, protein: 10, fat: 10,
        description: '广东早茶，软糯鲜美',
        ingredients: ['肠粉皮', '虾仁', '鸡蛋', '葱花', '酱油'],
        instructions: '肠粉蒸熟，淋上酱油，加入虾仁鸡蛋。'
    },
    {
        title: '煲仔饭',
        calories: 700, carbs: 70, protein: 30, fat: 30,
        description: '锅巴焦香，食材入味',
        ingredients: ['大米 200g', '腊肠 50g', '鸡腿肉 100g', '青菜', '酱油'],
        instructions: '大米煮饭，加入腊肠鸡腿肉焖煮，最后淋上酱油。'
    },
    {
        title: '皮蛋瘦肉粥',
        calories: 350, carbs: 40, protein: 20, fat: 10,
        description: '暖胃养生，清淡美味',
        ingredients: ['大米 100g', '瘦肉 50g', '皮蛋 1个', '葱花'],
        instructions: '大米煮粥，加入瘦肉皮蛋，最后撒上葱花。'
    },
    {
        title: '小笼包',
        calories: 400, carbs: 50, protein: 15, fat: 15,
        description: '汁多味美，江南点心',
        ingredients: ['面粉', '猪肉馅', '姜葱水'],
        instructions: '面皮包入肉馅，蒸熟。'
    },
    {
        title: '生煎包',
        calories: 450, carbs: 50, protein: 15, fat: 20,
        description: '底脆馅香，上海特色',
        ingredients: ['面粉', '猪肉馅', '芝麻', '葱花'],
        instructions: '包子底部煎至金黄，加水焖熟。'
    },
    {
        title: '炒年糕',
        calories: 500, carbs: 70, protein: 15, fat: 20,
        description: '软糯筋道，家常主食',
        ingredients: ['年糕 200g', '青菜 100g', '肉丝 50g'],
        instructions: '年糕炒软，加入青菜肉丝翻炒。'
    },
    {
        title: '麻团',
        calories: 380, carbs: 60, protein: 5, fat: 15,
        description: '香甜酥脆，外糯里空',
        ingredients: ['糯米粉', '白糖', '芝麻'],
        instructions: '糯米粉做成团，裹芝麻炸至金黄。'
    },
    {
        title: '油条',
        calories: 280, carbs: 30, protein: 8, fat: 15,
        description: '早餐搭档，酥脆可口',
        ingredients: ['面粉', '酵母', '食用油'],
        instructions: '面粉发酵，炸至金黄。'
    },
    {
        title: '豆腐脑',
        calories: 120, carbs: 10, protein: 10, fat: 5,
        description: '南北风味，咸甜皆宜',
        ingredients: ['豆浆', '内酯', '酱油', '辣椒油', '糖'],
        instructions: '豆浆点制成豆腐脑，加入咸或甜调料。'
    },
    {
        title: '煎饼果子',
        calories: 400, carbs: 50, protein: 15, fat: 15,
        description: '天津小吃，香脆可口',
        ingredients: ['面糊', '鸡蛋', '薄脆', '葱花', '甜面酱', '辣酱'],
        instructions: '面糊摊平，打入鸡蛋，加入薄脆和酱料。'
    },
    {
        title: '包子',
        calories: 300, carbs: 40, protein: 12, fat: 10,
        description: '传统早餐，馅料丰富',
        ingredients: ['面粉', '肉馅或菜馅'],
        instructions: '面皮包入馅料，蒸熟。'
    },
    {
        title: '饺子',
        calories: 350, carbs: 40, protein: 15, fat: 15,
        description: '节庆美食，美味馅料',
        ingredients: ['面粉', '肉馅或菜馅'],
        instructions: '面皮包入馅料，煮熟。'
    },
    {
        title: '馄饨',
        calories: 280, carbs: 30, protein: 10, fat: 10,
        description: '清淡鲜美，早餐夜宵',
        ingredients: ['馄饨皮', '肉馅或菜馅', '高汤'],
        instructions: '馄饨包好，煮熟，加入高汤。'
    },
    {
        title: '米粉',
        calories: 400, carbs: 60, protein: 15, fat: 10,
        description: '南方特色，汤粉美味',
        ingredients: ['米粉 150g', '肉片 50g', '青菜', '高汤'],
        instructions: '米粉煮熟，加入肉片青菜和高汤。'
    },
    {
        title: '炒面',
        calories: 500, carbs: 60, protein: 15, fat: 20,
        description: '家常主食，方便快捷',
        ingredients: ['面条 150g', '鸡蛋', '青菜', '肉丝'],
        instructions: '面条煮熟，鸡蛋青菜肉丝炒熟，混合翻炒。'
    },
    {
        title: '煲仔饭 (排骨)',
        calories: 680, carbs: 70, protein: 30, fat: 30,
        description: '排骨香浓，米饭入味',
        ingredients: ['大米 200g', '排骨 150g', '豆豉', '青菜'],
        instructions: '大米煮饭，加入排骨焖煮，最后淋上酱油。'
    },
    {
        title: '牛肉馅饼',
        calories: 480, carbs: 50, protein: 20, fat: 20,
        description: '外焦里嫩，牛肉鲜香',
        ingredients: ['面粉', '牛肉馅', '葱花'],
        instructions: '面皮包入牛肉馅，煎至金黄。'
    },
    {
        title: '韭菜盒子',
        calories: 380, carbs: 40, protein: 15, fat: 15,
        description: '皮薄馅大，韭菜飘香',
        ingredients: ['面粉', '韭菜', '鸡蛋', '虾皮'],
        instructions: '面皮包入韭菜鸡蛋馅，煎熟。'
    },
    {
        title: '驴肉火烧',
        calories: 550, carbs: 60, protein: 25, fat: 25,
        description: '河间名吃，外酥里嫩',
        ingredients: ['火烧', '驴肉', '青椒'],
        instructions: '火烧加热，夹入驴肉和青椒。'
    },
    {
        title: '烤冷面',
        calories: 420, carbs: 70, protein: 10, fat: 10,
        description: '东北街头小吃，酸甜可口',
        ingredients: ['冷面', '鸡蛋', '香肠', '洋葱', '甜面酱', '辣酱'],
        instructions: '冷面煎软，打入鸡蛋，加入香肠洋葱，刷酱。'
    },
    {
        title: '肉饼',
        calories: 500, carbs: 50, protein: 25, fat: 25,
        description: '外酥里嫩，肉馅鲜美',
        ingredients: ['面粉', '猪肉馅', '葱花'],
        instructions: '面皮包入猪肉馅，煎至金黄。'
    },
    {
        title: '馅饼',
        calories: 450, carbs: 50, protein: 20, fat: 20,
        description: '各种馅料，家常美味',
        ingredients: ['面粉', '各种馅料'],
        instructions: '面皮包入馅料，煎熟。'
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