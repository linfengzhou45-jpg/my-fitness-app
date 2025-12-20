import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { guest: true }
  },
  {
    path: '/',
    name: 'Diet',
    component: () => import('../views/DietTracker.vue'),
    meta: { requiresAuth: true, title: '饮食记录' }
  },
  {
    path: '/recipes',
    name: 'Recipes',
    component: () => import('../views/RecipeLibrary.vue'),
    meta: { requiresAuth: true, title: '食谱库' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/UserProfile.vue'),
    meta: { requiresAuth: true, title: '个人中心' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true, title: '仪表盘' }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/AdminDashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, title: '管理后台' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
    const userStore = useUserStore()
    // Ensure token is checked from store (which loads from localStorage)
    const isAuthenticated = !!userStore.token

    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login')
    } else if (to.meta.requiresAdmin && userStore.role !== 'admin') {
        next('/')
    } else if (to.meta.guest && isAuthenticated) {
        next('/')
    } else {
        next()
    }
})

export default router