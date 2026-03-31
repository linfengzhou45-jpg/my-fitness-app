import { defineStore } from 'pinia'
import { reactive, computed, ref } from 'vue'
import { useUserStore } from './user'
import axios from 'axios'

const API_URL = '/api'

/**
 * 【Debug 工程师重构】FoodMapper
 * 1. 引入 _id：解决搜索后索引偏移导致的“指鹿为马”
 * 2. 字段规范化：解决描述丢失
 */
const mapFood = (raw) => {
  if (!raw) return null;
  const name = raw.name || raw.title || '未知食物';
  const description = raw.description || raw.analysis || '';
  
  return {
    _id: raw._id || Math.random().toString(36).substring(2, 11), // 前端唯一标识
    id: raw.id || null, // 后端数据库 ID
    name: name,
    title: name,
    calories: Number(raw.calories || 0),
    carbs: Number(raw.carbs || 0),
    protein: Number(raw.protein || 0),
    fat: Number(raw.fat || 0),
    description: description,
    analysis: description,
    image: raw.image || null,
    baseWeight: raw.baseWeight || 0
  };
};

export const useDietStore = defineStore('diet', () => {
  const logs = reactive({})
  const favorites = reactive([])
  const systemRecipes = reactive([])
  const dietPlans = reactive({})
  const currentUserId = ref(null)
  const pendingMealContext = reactive({ mealType: null, date: null })
  const planningMealType = ref(null)

  const today = computed(() => new Date().toISOString().split('T')[0])

  // --- Loaders ---
  function setLogs(newLogs) { 
      for (const key in logs) delete logs[key]
      if (!newLogs) return;
      Object.keys(newLogs).forEach(date => {
          logs[date] = {
              breakfast: (newLogs[date].breakfast || []).map(mapFood),
              lunch: (newLogs[date].lunch || []).map(mapFood),
              dinner: (newLogs[date].dinner || []).map(mapFood),
              snack: (newLogs[date].snack || []).map(mapFood)
          }
      })
  }

  function setFavorites(newFavs) { 
      const normalized = (newFavs || []).map(mapFood)
      favorites.splice(0, favorites.length, ...normalized) 
  }

  function setPlans(newPlans) {
      for (const key in dietPlans) delete dietPlans[key]
      if (newPlans) Object.assign(dietPlans, newPlans)
  }

  // --- Mutators (Fixed for Date & ID) ---
  function addFood(mealType, food, targetDate) {
    const dateKey = targetDate || today.value
    if (!logs[dateKey]) logs[dateKey] = { breakfast: [], lunch: [], dinner: [], snack: [] }
    const targetMeal = mealType || 'snack'
    logs[dateKey][targetMeal].push(mapFood(food))
    sync()
  }

  function updateFood(mealType, index, updatedFood, targetDate) {
      const dateKey = targetDate || today.value
      if (logs[dateKey] && logs[dateKey][mealType]) {
          logs[dateKey][mealType][index] = mapFood(updatedFood)
          sync()
      }
  }

  function removeFood(mealType, index, targetDate) {
      const dateKey = targetDate || today.value
      if (logs[dateKey] && logs[dateKey][mealType]) {
          logs[dateKey][mealType].splice(index, 1)
          sync()
      }
  }

  function toggleFavorite(item) {
      const normalized = mapFood(item)
      // 使用名称匹配收藏，因为 AI 产生的同名食物应视为同一个“食谱”
      const idx = favorites.findIndex(f => f.name === normalized.name)
      if (idx > -1) favorites.splice(idx, 1)
      else favorites.push(normalized)
      sync()
  }

  function updateFavoriteById(id, updated) {
      const idx = favorites.findIndex(f => f._id === id)
      if (idx > -1) {
          favorites[idx] = mapFood({ ...favorites[idx], ...updated })
          sync()
      }
  }

  function removeFavoriteById(id) {
      const idx = favorites.findIndex(f => f._id === id)
      if (idx > -1) {
          favorites.splice(idx, 1)
          sync()
      }
  }

  function setMealPlan(mealType, plan, targetDate) {
      const d = targetDate || today.value
      if (!dietPlans[d]) dietPlans[d] = { breakfast: null, lunch: null, dinner: null }
      dietPlans[d][mealType] = plan
      sync()
  }

  // --- Sync & Other ---
  async function sync() {
      try {
          const userStore = useUserStore()
          if (!userStore.token) return;
          await axios.put(`${API_URL}/user/sync`, { 
              dietLogs: logs, 
              favoriteFoods: favorites,
              dietPlans: dietPlans
          }, {
              headers: { Authorization: `Bearer ${userStore.token}` }
          })
      } catch (e) { console.error("Sync failed", e) }
  }

  async function analyzeFoodWithAI(description) {
      const userStore = useUserStore()
      const res = await axios.post(`${API_URL}/analyze-food`, { description, userProfile: userStore.profile })
      return res.data
  }

  const todayIntake = computed(() => {
      const dayLog = logs[today.value] || { breakfast: [], lunch: [], dinner: [], snack: [] }
      let c = 0, p = 0, cr = 0, f = 0
      Object.values(dayLog).forEach(m => {
          m.forEach(i => {
              c += Number(i.calories || 0)
              p += Number(i.protein || 0)
              cr += Number(i.carbs || 0)
              f += Number(i.fat || 0)
          })
      })
      return { calories: Math.round(c), protein: Math.round(p), carbs: Math.round(cr), fat: Math.round(f) }
  })

  function isFavorite(item) { 
      const name = item.name || item.title
      return favorites.some(f => f.name === name) 
  }

  function loadPlans(userId) {
      if (!userId) return
      currentUserId.value = userId
      const saved = localStorage.getItem(`diet_plans_${userId}`)
      if (saved && Object.keys(dietPlans).length === 0) {
          Object.assign(dietPlans, JSON.parse(saved))
      }
  }

  function getTodayPlans() {
      const d = today.value
      if (!dietPlans[d]) dietPlans[d] = { breakfast: null, lunch: null, dinner: null }
      return dietPlans[d]
  }

  function reset() {
      for (const key in logs) delete logs[key]
      favorites.splice(0, favorites.length)
      for (const key in dietPlans) delete dietPlans[key]
      currentUserId.value = null
      planningMealType.value = null
  }

  function setPendingContext(mealType, date) {
      pendingMealContext.mealType = mealType
      pendingMealContext.date = date
  }

  function clearPendingContext() {
      pendingMealContext.mealType = null
      pendingMealContext.date = null
  }

  async function fetchRecipes() {
      try {
          const res = await axios.get(`${API_URL}/recipes`)
          const normalized = (res.data || []).map(mapFood)
          systemRecipes.splice(0, systemRecipes.length, ...normalized)
      } catch (e) {
          console.error("Fetch recipes failed", e)
      }
  }

  async function saveSystemRecipe(recipe) {
      const userStore = useUserStore()
      if (userStore.role !== 'admin') return
      try {
          await axios.post(`${API_URL}/admin/recipes`, mapFood(recipe), {
              headers: { Authorization: `Bearer ${userStore.token}` }
          })
          await fetchRecipes() // 刷新系统库
      } catch (e) { console.error("Admin save recipe failed", e) }
  }

  // --- 数据可视化函数 ---
  
  // 获取最近 N 天的数据（用于趋势图）
  function getRecentDaysData(days = 7) {
    const result = []
    const todayDate = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(todayDate)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayLog = logs[dateStr]
      
      let calories = 0, carbs = 0, protein = 0, fat = 0
      if (dayLog) {
        Object.values(dayLog).forEach(meal => {
          if (Array.isArray(meal)) {
            meal.forEach(item => {
              calories += Number(item.calories || 0)
              carbs += Number(item.carbs || 0)
              protein += Number(item.protein || 0)
              fat += Number(item.fat || 0)
            })
          }
        })
      }
      
      result.push({
        date: dateStr,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        calories: Math.round(calories),
        carbs: Math.round(carbs),
        protein: Math.round(protein),
        fat: Math.round(fat)
      })
    }
    return result
  }

  // 获取今日营养素分布（用于饼图）
  function getTodayNutritionDistribution() {
    const intake = todayIntake.value
    const carbsCal = Math.round(intake.carbs * 4)
    const proteinCal = Math.round(intake.protein * 4)
    const fatCal = Math.round(intake.fat * 9)
    const total = carbsCal + proteinCal + fatCal
    
    return {
      carbs: {
        value: carbsCal,
        grams: intake.carbs,
        percent: total ? Math.round((carbsCal / total) * 100) : 0
      },
      protein: {
        value: proteinCal,
        grams: intake.protein,
        percent: total ? Math.round((proteinCal / total) * 100) : 0
      },
      fat: {
        value: fatCal,
        grams: intake.fat,
        percent: total ? Math.round((fatCal / total) * 100) : 0
      },
      totalCalories: intake.calories
    }
  }

  return {
      logs, favorites, systemRecipes, today, todayIntake, dietPlans, pendingMealContext, planningMealType,
      addFood, updateFood, removeFood, analyzeFoodWithAI, setLogs, setFavorites, setPlans,
      toggleFavorite, isFavorite, updateFavoriteById, removeFavoriteById, fetchRecipes, setMealPlan, getTodayPlans, loadPlans, reset,
      setPendingContext, clearPendingContext, sync, saveSystemRecipe,
      getRecentDaysData, getTodayNutritionDistribution
  }
})
