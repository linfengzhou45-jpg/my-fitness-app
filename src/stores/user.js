import { defineStore } from 'pinia'
import { reactive, computed, ref } from 'vue'
import axios from 'axios'
import { useDietStore } from './diet'

const API_URL = '/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('auth_token') || '')
  const userId = ref(null)
  
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
  
  const role = ref('user')
  const avatar = ref('')
  const motto = ref('致力于更健康的自己')

  const isLoggedIn = computed(() => !!token.value)

  const bmr = computed(() => {
    let base = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age
    return profile.gender === 'male' ? base + 5 : base - 161
  })

  const tdee = computed(() => Math.round(bmr.value * profile.activityLevel))

  const targetCalories = computed(() => {
    let baseTarget = 0
    if (profile.customCalories && profile.customCalories > 0) {
        baseTarget = Number(profile.customCalories)
    } else {
        switch (profile.goal) {
          case 'cut': baseTarget = Math.round(tdee.value * 0.8); break
          case 'bulk': baseTarget = Math.round(tdee.value * 1.1); break
          default: baseTarget = tdee.value
        }
    }
    if (workoutSettings.active) baseTarget += workoutSettings.calories
    return baseTarget
  })

  const macros = computed(() => {
    const cals = targetCalories.value
    const ratios = workoutSettings.active ? { c: 0.5, p: 0.3, f: 0.2 } : { c: 0.4, p: 0.3, f: 0.3 }
    return {
      carbs: Math.round((cals * ratios.c) / 4),
      protein: Math.round((cals * ratios.p) / 4),
      fat: Math.round((cals * ratios.f) / 9)
    }
  })

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
      userId.value = null
      localStorage.removeItem('auth_token')
      resetState()
  }

  function resetState() {
      Object.assign(profile, defaultProfile)
      weightHistory.splice(0, weightHistory.length)
      workoutSettings.active = false
      role.value = 'user'
      avatar.value = ''
      motto.value = '致力于更健康的自己'
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
          logout()
      }
  }

  function handleUserData(userData) {
      if (userData.id) userId.value = userData.id
      if (userData.profile) Object.assign(profile, userData.profile)
      if (userData.weightHistory) weightHistory.splice(0, weightHistory.length, ...userData.weightHistory)
      if (userData.role) role.value = userData.role
      if (userData.avatar) avatar.value = userData.avatar
      if (userData.motto) motto.value = userData.motto
      
      const dietStore = useDietStore()
      // 加载用户隔离的三餐推荐
      dietStore.loadPlans(userData.id)
      
      if (userData.dietLogs) dietStore.setLogs(userData.dietLogs)
      if (userData.favoriteFoods) dietStore.setFavorites(userData.favoriteFoods)
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
      } catch (e) {}
  }

  function updateProfile(newProfile) {
    const oldWeight = profile.weight
    Object.assign(profile, newProfile)
    if (newProfile.weight && newProfile.weight !== oldWeight) logWeight(newProfile.weight)
    else syncData()
  }
  
  function updateAvatar(url) { avatar.value = url; syncData(); }
  function updateMotto(text) { motto.value = text; syncData(); }

  function logWeight(weight) {
      const today = new Date().toISOString().split('T')[0]
      const existingIndex = weightHistory.findIndex(h => h.date === today)
      if (existingIndex > -1) weightHistory[existingIndex].weight = weight
      else weightHistory.push({ date: today, weight })
      weightHistory.sort((a, b) => new Date(a.date) - new Date(b.date))
      profile.weight = weight
      syncData()
  }
  
  function setWorkoutMode(active, level, calories) {
      workoutSettings.active = active
      if (level) workoutSettings.level = level
      if (calories) workoutSettings.calories = calories
  }

  if (token.value) fetchUser()

  return { 
      token, userId, isLoggedIn, login, register, logout, fetchUser, 
      profile, weightHistory, workoutSettings, role, avatar, motto,
      bmr, tdee, targetCalories, macros, 
      updateProfile, updateAvatar, updateMotto, logWeight, setWorkoutMode 
  }
})
