<template>
  <div class="admin-container animate-fade-in">
    <h2>管理员后台</h2>
    
    <el-row :gutter="20" class="stats-row">
        <el-col :span="12">
            <el-card shadow="hover" class="stat-card">
                <div class="stat-item">
                    <div class="label">总用户数</div>
                    <div class="value">{{ stats.totalUsers }}</div>
                </div>
            </el-card>
        </el-col>
        <el-col :span="12">
            <el-card shadow="hover" class="stat-card">
                <div class="stat-item">
                    <div class="label">系统食谱数</div>
                    <div class="value">{{ stats.totalRecipes }}</div>
                </div>
            </el-card>
        </el-col>
    </el-row>

    <el-card class="user-list-card" header="用户列表">
        <el-table :data="stats.users" style="width: 100%">
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="email" label="邮箱" />
            <el-table-column prop="role" label="角色">
                <template #default="{ row }">
                    <el-tag :type="row.role === 'admin' ? 'danger' : 'info'">{{ row.role }}</el-tag>
                </template>
            </el-table-column>
        </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const stats = ref({ totalUsers: 0, totalRecipes: 0, users: [] })

onMounted(async () => {
    try {
        const res = await axios.get('/api/admin/stats', {
            headers: { Authorization: `Bearer ${userStore.token}` }
        })
        stats.value = res.data
    } catch (e) {
        console.error(e)
    }
})
</script>

<style scoped>
.admin-container { padding: 20px; padding-bottom: 100px; margin: 0 auto; }
h2 { color: white; margin-bottom: 20px; text-shadow: 0 0 10px rgba(255,255,255,0.2); }

.stats-row { margin-bottom: 20px; }
.stat-card {
    border: none;
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.1);
    color: white;
    transition: transform 0.3s;
}
.stat-card:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.2); }

.stat-item { text-align: center; padding: 10px 0; }
.label { color: #94a3b8; margin-bottom: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
.value { font-size: 32px; font-weight: 800; color: #8e7dff; text-shadow: 0 0 20px rgba(142, 125, 255, 0.4); }

.user-list-card {
    border: none;
    background: rgba(30, 41, 59, 0.6) !important;
    backdrop-filter: blur(20px);
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.1) !important;
    overflow: hidden;
}
.user-list-card :deep(.el-card__header) {
    border-bottom: 1px solid rgba(255,255,255,0.1);
    color: white;
    font-weight: 700;
}

/* 表格深色适配 */
.user-list-card :deep(.el-table) {
    background-color: transparent;
    --el-table-tr-bg-color: transparent;
    --el-table-header-bg-color: rgba(255,255,255,0.05);
    --el-table-border-color: rgba(255,255,255,0.05);
    --el-table-text-color: #cbd5e1;
    --el-table-header-text-color: #94a3b8;
    --el-table-row-hover-bg-color: rgba(255,255,255,0.05);
}
.user-list-card :deep(.el-table__inner-wrapper::before) { background-color: transparent; }

.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>