<template>
  <div class="admin-container animate-fade-in">
    <h2>管理员后台</h2>
    
    <el-row :gutter="20" class="stats-row">
        <el-col :span="12">
            <el-card shadow="hover">
                <div class="stat-item">
                    <div class="label">总用户数</div>
                    <div class="value">{{ stats.totalUsers }}</div>
                </div>
            </el-card>
        </el-col>
        <el-col :span="12">
            <el-card shadow="hover">
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
.stats-row { margin-bottom: 20px; }
.stat-item { text-align: center; }
.label { color: #909399; margin-bottom: 5px; }
.value { font-size: 24px; font-weight: bold; color: #303133; }
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>