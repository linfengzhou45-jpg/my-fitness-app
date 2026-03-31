<template>
  <nav class="mobile-dock">
    <router-link to="/dashboard" class="dock-item" active-class="active">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
    </router-link>

    <router-link to="/" class="dock-item" active-class="" exact-active-class="active">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
    </router-link>

    <div class="dock-center-action">
      <div class="dock-add-btn" @click="$emit('add')">
        <el-icon :size="24"><Plus /></el-icon>
      </div>
    </div>

    <router-link to="/recipes" class="dock-item" active-class="active">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    </router-link>

    <router-link to="/profile" class="dock-item" active-class="active">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </router-link>
  </nav>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue'

defineEmits(['add'])
</script>

<style scoped>
.mobile-dock {
  height: 70px;
  background: rgba(15, 23, 42, 0.9);
  display: flex;
  align-items: center;
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-bottom: env(safe-area-inset-bottom);
  flex-shrink: 0;
}

.dock-item {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #636e72;
  text-decoration: none;
  transition: all 0.2s ease;
}

.dock-item.active {
  color: var(--primary);
}

.dock-center-action {
  flex: 1.2;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.dock-add-btn {
  width: 48px;
  height: 48px;
  background: var(--primary);
  color: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(142, 125, 255, 0.4);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}

.dock-add-btn:active {
  transform: scale(0.9) rotate(90deg);
}
</style>
