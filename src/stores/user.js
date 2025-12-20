import { defineStore } from 'pinia'
import { reactive, computed, ref } from 'vue'
import axios from 'axios'
import { useDietStore } from './diet'

const API_URL = '/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('auth_token') || '')
  
  const defaultProfile = {
    name: 'User',
    gender: 'male',
    age: 25,
    height: 175, 
    weight: 70, 
    activityLevel: 1.375, 
    goal: 'maintain', 
    allergies: [],
    customCalories: null
  }

  const profile = reactive({ ...defaultProfile })
  const weightHistory = reactive([])
  const workoutSettings = reactive({ active: false, level: 'casual', calories: 300 })
  
  // New Fields
  const role = ref('user')
  const avatar = ref('')
  const motto = ref('致力于更健康的自己')

  const isLoggedIn = computed(() => !!token.value)

  // 基础代谢率 BMR
  const bmr = computed(() => {
    let base = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age
    return profile.gender === 'male' ? base + 5 : base - 161
  })

  // 每日总能量消耗 TDEE
  const tdee = computed(() => {
    return Math.round(bmr.value * profile.activityLevel)
  })

  // 目标热量
  const targetCalories = computed(() => {
    let baseTarget = 0
    
    // Check if user has a custom setting
    if (profile.customCalories && profile.customCalories > 0) {
        baseTarget = Number(profile.customCalories)
    } else {
        // Fallback to auto-calculation
        switch (profile.goal) {
          case 'cut': baseTarget = Math.round(tdee.value * 0.8); break // 20% Deficit
          case 'bulk': baseTarget = Math.round(tdee.value * 1.1); break // 10% Surplus
          default: baseTarget = tdee.value
        }
    }

    if (workoutSettings.active) {
        baseTarget += workoutSettings.calories
    }
    return baseTarget
  })

  // 宏量营养素目标
  const macros = computed(() => {
    const cals = targetCalories.value
    const ratios = workoutSettings.active 
        ? { c: 0.5, p: 0.3, f: 0.2 } 
        : { c: 0.4, p: 0.3, f: 0.3 }

    return {
      carbs: Math.round((cals * ratios.c) / 4),
      protein: Math.round((cals * ratios.p) / 4),
      fat: Math.round((cals * ratios.f) / 9)
    }
  })

  // Auth Actions
  async function login(credentials) {
      const res = await axios.post(`${API_URL}/auth/login`, credentials)
      token.value = res.data.token
      localStorage.setItem('auth_token', token.value)
      
      handleUserData(res.data.user)
  }

  async function register(data) {
      await axios.post(`${API_URL}/auth/register`, data)
  }

  function logout() {
      token.value = ''
      localStorage.removeItem('auth_token')
      resetState()
  }

  function resetState() {
      // Reset User Store
      Object.assign(profile, defaultProfile)
      weightHistory.splice(0, weightHistory.length)
      workoutSettings.active = false
      workoutSettings.level = 'casual'
      workoutSettings.calories = 300
      role.value = 'user'
      avatar.value = ''
      motto.value = '致力于更健康的自己'
      
      // Reset Diet Store
      const dietStore = useDietStore()
      dietStore.reset()
  }

  async function fetchUser() {
      if (!token.value) return
      try {
          const res = await axios.get(`${API_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${token.value}` }
          })
          handleUserData(res.data)
      } catch (e) {
          console.error("Fetch user failed", e)
          logout()
      }
  }

  function handleUserData(userData) {
      if (userData.profile) Object.assign(profile, userData.profile)
      if (userData.weightHistory) {
          weightHistory.splice(0, weightHistory.length, ...userData.weightHistory)
      }
      if (userData.role) role.value = userData.role
      if (userData.avatar) avatar.value = userData.avatar
      if (userData.motto) motto.value = userData.motto
      
      // Update Diet Store
      const dietStore = useDietStore()
      if (userData.dietLogs) {
          dietStore.setLogs(userData.dietLogs)
      } 
      if (userData.favoriteFoods) {
          dietStore.setFavorites(userData.favoriteFoods)
      }
      if (!userData.dietLogs && !userData.favoriteFoods) {
          dietStore.reset() 
      }
  }

  const syncData = async () => {
      if (!isLoggedIn.value) return;
      try {
          await axios.put(`${API_URL}/user/sync`, {
              profile: profile,
              weightHistory: weightHistory,
              avatar: avatar.value,
              motto: motto.value
          }, {
              headers: { Authorization: `Bearer ${token.value}` }
          })
      } catch (e) {
          console.error("Sync failed", e)
      }
  }

  function updateProfile(newProfile) {
    Object.assign(profile, newProfile)
    syncData()
  }
  
  function updateAvatar(url) {
      avatar.value = url
      syncData()
  }
  
  function updateMotto(text) {
      motto.value = text
      syncData()
  }

  function logWeight(weight) {
      const today = new Date().toISOString().split('T')[0]
      const existingIndex = weightHistory.findIndex(h => h.date === today)
      if (existingIndex > -1) {
          weightHistory[existingIndex].weight = weight
      } else {
          weightHistory.push({ date: today, weight })
      }
      weightHistory.sort((a, b) => new Date(a.date) - new Date(b.date))
      
      profile.weight = weight
      syncData()
  }
  
  function setWorkoutMode(active, level, calories) {
      workoutSettings.active = active
      if (level) workoutSettings.level = level
      if (calories) workoutSettings.calories = calories
  }

  // Initialize
  if (token.value) {
      fetchUser()
  }

  return { 
      token, isLoggedIn, login, register, logout, fetchUser, 
      profile, weightHistory, workoutSettings, role, avatar, motto,
      bmr, tdee, targetCalories, macros, 
      updateProfile, updateAvatar, updateMotto, logWeight, setWorkoutMode 
  }
})
