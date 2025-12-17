import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'
import { useUserStore } from './user'
import axios from 'axios'

const API_URL = '/api'

export const useDietStore = defineStore('diet', () => {
  // 结构: { '2023-10-27': { breakfast: [], lunch: [], dinner: [], snack: [] } }
  const logs = reactive({})
  const favorites = reactive([])
  const systemRecipes = reactive([])

  const today = computed(() => {
    const date = new Date()
    return date.toISOString().split('T')[0]
  })
  
  async function fetchRecipes() {
      try {
          const res = await axios.get(`${API_URL}/recipes`)
          systemRecipes.splice(0, systemRecipes.length, ...res.data)
      } catch (e) {
          console.error("Failed to fetch recipes", e)
      }
  }

  function getTodayLog() {
    if (!logs[today.value]) {
      logs[today.value] = { breakfast: [], lunch: [], dinner: [], snack: [] }
    }
    return logs[today.value]
  }

  const todayIntake = computed(() => {
    const current = getTodayLog()
    let total = { calories: 0, carbs: 0, protein: 0, fat: 0 }
    
    Object.values(current).forEach(meal => {
      meal.forEach(item => {
        total.calories += Number(item.calories)
        total.carbs += Number(item.carbs)
        total.protein += Number(item.protein)
        total.fat += Number(item.fat)
      })
    })
    return total
  })

  // Set data from backend
  function setLogs(newLogs) {
      // Clear existing
      for (const key in logs) delete logs[key];
      // Assign new
      if (newLogs) Object.assign(logs, newLogs);
  }

  function setFavorites(newFavorites) {
      favorites.splice(0, favorites.length, ...newFavorites)
  }

  // Reset logs (on logout)
  function reset() {
      for (const key in logs) delete logs[key];
      favorites.splice(0, favorites.length);
  }

  // Sync logs to backend
  async function sync() {
      const userStore = useUserStore()
      if (!userStore.token) return;
      
      try {
          await axios.put(`${API_URL}/user/sync`, {
              dietLogs: logs,
              favoriteFoods: favorites
          }, {
              headers: { Authorization: `Bearer ${userStore.token}` }
          })
      } catch (error) {
          console.error("Failed to sync diet logs:", error)
      }
  }

  function getAutoMealType() {
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 10.5) return 'breakfast'
      if (hour >= 10.5 && hour < 15) return 'lunch'
      if (hour >= 17 && hour < 21) return 'dinner'
      return 'snack'
  }

  function addFood(mealType, food) {
    if (!logs[today.value]) {
      logs[today.value] = { breakfast: [], lunch: [], dinner: [], snack: [] }
    }
    
    const targetMeal = mealType || getAutoMealType()
    logs[today.value][targetMeal].push(food)
    sync()
  }

  function updateFood(mealType, index, updatedFood) {
      if (logs[today.value] && logs[today.value][mealType]) {
          // Keep existing properties if not overwritten, but usually we overwrite the stats
          logs[today.value][mealType][index] = { ...updatedFood }
          sync()
      }
  }

  function removeFood(mealType, index) {
    if (logs[today.value] && logs[today.value][mealType]) {
      logs[today.value][mealType].splice(index, 1)
      sync()
    }
  }

  function toggleFavorite(food) {
      const index = favorites.findIndex(f => f.name === food.name && f.calories === food.calories)
      if (index > -1) {
          favorites.splice(index, 1)
      } else {
          // Store a clean copy without extra props
          favorites.push({
              name: food.name,
              calories: food.calories,
              carbs: food.carbs,
              protein: food.protein,
              fat: food.fat,
              weight: food.weight || 100 // Default reference weight
          })
      }
      sync()
  }

  function isFavorite(food) {
      return favorites.some(f => f.name === food.name && f.calories === food.calories)
  }

  function updateFavorite(index, updatedFood) {
      if (index >= 0 && index < favorites.length) {
          favorites[index] = { ...updatedFood }
          sync()
      }
  }
  
  // AI Feature (Backend)
  async function analyzeFoodWithAI(description) {
      const userStore = useUserStore()
      
      const payload = {
          description,
          userProfile: {
              gender: userStore.profile.gender,
              weight: userStore.profile.weight,
              goal: userStore.profile.goal,
              bmr: userStore.bmr
          }
      }

      try {
          const response = await fetch(`${API_URL}/analyze-food`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
          })

          if (!response.ok) {
              throw new Error('服务器响应错误')
          }

          const data = await response.json()
          return data
      } catch (error) {
          console.error("AI Analysis failed:", error)
          throw error
      }
  }

  return { logs, favorites, systemRecipes, today, todayIntake, addFood, updateFood, removeFood, getTodayLog, analyzeFoodWithAI, setLogs, setFavorites, reset, toggleFavorite, isFavorite, updateFavorite, fetchRecipes }
})