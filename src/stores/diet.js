import { defineStore } from 'pinia'
import { reactive, computed, ref } from 'vue'
import { useUserStore } from './user'
import axios from 'axios'

const API_URL = '/api'

export const useDietStore = defineStore('diet', () => {
  const logs = reactive({})
  const favorites = reactive([])
  const systemRecipes = reactive([])
  
  // 核心修复：dietPlans 不再在模块顶层初始化，避免串台
  const dietPlans = reactive({})
  const currentUserId = ref(null)

  const today = computed(() => {
    const date = new Date()
    return date.toISOString().split('T')[0]
  })

  // 核心修复：加载特定用户的计划
  function loadPlans(userId) {
      if (!userId) return
      currentUserId.value = userId
      const saved = localStorage.getItem(`diet_plans_${userId}`)
      if (saved) {
          Object.assign(dietPlans, JSON.parse(saved))
      } else {
          // 清空旧数据，防止切换账号后残留
          for (const key in dietPlans) delete dietPlans[key]
      }
  }

  function getTodayPlans() {
      const d = today.value
      if (!dietPlans[d]) {
          dietPlans[d] = { breakfast: null, lunch: null, dinner: null }
      }
      return dietPlans[d]
  }

  function setMealPlan(mealType, plan) {
      const d = today.value
      if (!dietPlans[d]) dietPlans[d] = { breakfast: null, lunch: null, dinner: null }
      dietPlans[d][mealType] = plan
      
      // 持久化到用户隔离的键中
      if (currentUserId.value) {
          localStorage.setItem(`diet_plans_${currentUserId.value}`, JSON.stringify(dietPlans))
      }
  }

  function reset() {
      for (const key in logs) delete logs[key]
      favorites.splice(0, favorites.length)
      for (const key in dietPlans) delete dietPlans[key]
      currentUserId.value = null
  }

  async function fetchRecipes() {
      try {
          const res = await axios.get(`${API_URL}/recipes`)
          systemRecipes.splice(0, systemRecipes.length, ...res.data)
      } catch (e) {
          console.error("Fetch recipes failed", e)
      }
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
      return { calories: c, protein: Math.round(p), carbs: Math.round(cr), fat: Math.round(f) }
  })

  function addFood(mealType, food, targetDate) {
    const dateKey = targetDate || today.value
    if (!logs[dateKey]) logs[dateKey] = { breakfast: [], lunch: [], dinner: [], snack: [] }
    const targetMeal = mealType || 'snack'
    logs[dateKey][targetMeal].push(food)
    sync()
  }

  function updateFood(mealType, index, updatedFood) {
      if (logs[today.value] && logs[today.value][mealType]) {
          logs[today.value][mealType][index] = updatedFood
          sync()
      }
  }

  function removeFood(mealType, index) {
      if (logs[today.value] && logs[today.value][mealType]) {
          logs[today.value][mealType].splice(index, 1)
          sync()
      }
  }

  async function sync() {
      try {
          const userStore = useUserStore()
          // 同步饮食日志和收藏到后端
          await axios.put(`${API_URL}/user/sync`, { 
              dietLogs: logs, 
              favoriteFoods: favorites 
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

  function setLogs(newLogs) { 
      for (const key in logs) delete logs[key]
      Object.assign(logs, newLogs || {}) 
  }
  function setFavorites(newFavs) { favorites.splice(0, favorites.length, ...(newFavs || [])) }
  function isFavorite(item) { return favorites.some(f => f.title === item.name || f.name === item.name) }
  function toggleFavorite(item) {
      const idx = favorites.findIndex(f => f.title === (item.name || item.title))
      if (idx > -1) favorites.splice(idx, 1)
      else favorites.push({ ...item, title: item.name || item.title })
      sync()
  }

  function updateFavorite(index, updated) {
      favorites[index] = { ...favorites[index], ...updated }
      sync()
  }

  function removeFavorite(index) {
      favorites.splice(index, 1)
      sync()
  }

  return { 
      logs, favorites, systemRecipes, today, todayIntake, dietPlans,
      addFood, updateFood, removeFood, analyzeFoodWithAI, setLogs, setFavorites, 
      toggleFavorite, isFavorite, updateFavorite, removeFavorite, fetchRecipes, setMealPlan, getTodayPlans, loadPlans, reset
  }
})
