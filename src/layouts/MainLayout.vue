<template>
  <!-- Aurora Background -->
  <div class="app-aurora-bg">
    <div class="orb-global orb-1"></div>
    <div class="orb-global orb-2"></div>
    <div class="orb-global orb-3"></div>
  </div>

  <div class="mobile-wrapper">
    <div class="app-layout">
      <main class="main-content">
        <div class="content-scroll">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <div :key="$route.path" class="view-container">
                <component :is="Component" />
              </div>
            </transition>
          </router-view>
        </div>
      </main>

      <!-- Bottom Navigation -->
      <BottomNav @add="openGlobalAdd()" />

      <!-- Add Food Sheet (Drawer + Dialogs) -->
      <AddFoodSheet ref="addFoodSheetRef" />
    </div>
  </div>
</template>

<script setup>
import { ref, provide, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import BottomNav from '../components/BottomNav.vue'
import AddFoodSheet from '../components/AddFoodSheet.vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const addFoodSheetRef = ref(null)

// --- provide methods for child views (DietTracker etc.) ---
function openGlobalAdd(context = {}) {
  addFoodSheetRef.value?.open(context)
}
provide('openGlobalAdd', openGlobalAdd)

function openEditFood(mealType, index, food) {
  addFoodSheetRef.value?.openEdit(mealType, index, food)
}
provide('openEditFood', openEditFood)

// --- Error Boundary: prevent child component crash from killing the layout ---
onErrorCaptured((err, instance, info) => {
  console.error('[MainLayout] Child component error caught:', err, info)
  ElMessage.error('页面渲染出错，请重试')
  // Return false to stop the error from propagating further (protects the layout)
  return false
})
</script>

<style scoped>
.app-aurora-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.orb-global {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: #6c5ce7;
  top: -50px;
  left: -50px;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: #00cec9;
  bottom: -50px;
  right: -50px;
}

.mobile-wrapper {
  width: 100%;
  max-width: 480px;
  height: 100vh;
  position: relative;
  z-index: 10;
  margin: 0 auto;
  border-left: 1px solid rgba(255,255,255,0.05);
  border-right: 1px solid rgba(255,255,255,0.05);
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.app-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 15px 15px 20px;
}

.view-container {
  width: 100%;
  height: 100%;
}

/* Page transition animation */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
