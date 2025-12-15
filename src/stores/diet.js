import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'
import { useUserStore } from './user'
import axios from 'axios'

const API_URL = '/api'

export const useDietStore = defineStore('diet', () => {
  // 结构: { '2023-10-27': { breakfast: [], lunch: [], dinner: [], snack: [] } }
  const logs = reactive({})

  const today = computed(() => {
    const date = new Date()
    return date.toISOString().split('T')[0]
  })

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

  // Set logs from backend
  function setLogs(newLogs) {
      // Clear existing
      for (const key in logs) delete logs[key];
      // Assign new
      if (newLogs) Object.assign(logs, newLogs);
  }

  // Reset logs (on logout)
  function reset() {
      for (const key in logs) delete logs[key];
  }

  // Sync logs to backend
  async function sync() {
      const userStore = useUserStore()
      if (!userStore.token) return;
      
      try {
          await axios.put(`${API_URL}/user/sync`, {
              dietLogs: logs
          }, {
              headers: { Authorization: `Bearer ${userStore.token}` }
          })
      } catch (error) {
          console.error("Failed to sync diet logs:", error)
      }
  }

  function addFood(mealType, food) {
    if (!logs[today.value]) {
      logs[today.value] = { breakfast: [], lunch: [], dinner: [], snack: [] }
    }
    logs[today.value][mealType].push(food)
    sync()
  }

  function removeFood(mealType, index) {
    if (logs[today.value] && logs[today.value][mealType]) {
      logs[today.value][mealType].splice(index, 1)
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

  return { logs, today, todayIntake, addFood, removeFood, getTodayLog, analyzeFoodWithAI, setLogs, reset }
})