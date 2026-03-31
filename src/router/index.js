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
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Diet',
        component: () => import('../views/DietTracker.vue'),
        meta: { title: '饮食记录' }
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'recipes',
        name: 'Recipes',
        component: () => import('../views/RecipeLibrary.vue'),
        meta: { title: '食谱库' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/UserProfile.vue'),
        meta: { title: '个人中心' }
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('../views/AdminDashboard.vue'),
        meta: { requiresAdmin: true, title: '管理后台' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
    const userStore = useUserStore()
    const isAuthenticated = !!userStore.token

    // Use to.matched to check parent route meta (nested routes inherit parent meta this way)
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
    const isGuest = to.matched.some(record => record.meta.guest)

    if (requiresAuth && !isAuthenticated) {
        next('/login')
    } else if (requiresAdmin && userStore.role !== 'admin') {
        next('/')
    } else if (isGuest && isAuthenticated) {
        next('/')
    } else {
        next()
    }
})

export default router
