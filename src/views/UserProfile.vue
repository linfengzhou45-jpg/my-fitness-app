<template>
  <el-card class="profile-card">
    <template #header>
      <div class="card-header">
        <span>个人资料设置</span>
        <el-button type="primary" size="small" @click="saveProfile">保存</el-button>
      </div>
    </template>

    <el-form :model="form" label-position="top" class="profile-form">
      <el-form-item label="昵称">
        <el-input v-model="form.name" />
      </el-form-item>

      <el-form-item label="性别">
        <el-radio-group v-model="form.gender">
          <el-radio label="male">男</el-radio>
          <el-radio label="female">女</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12" :xs="24">
          <el-form-item label="年龄">
            <el-input-number v-model="form.age" :min="10" :max="100" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12" :xs="24">
          <el-form-item label="身高 (cm)">
            <el-input-number v-model="form.height" :min="100" :max="250" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12" :xs="24">
           <el-form-item label="体重 (kg)">
            <el-input-number v-model="form.weight" :min="30" :max="200" :precision="1" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">健身目标</el-divider>

      <el-form-item label="当前目标">
        <el-select v-model="form.goal" placeholder="Select" style="width: 100%">
          <el-option label="减脂 (Cut)" value="cut" />
          <el-option label="维持 (Maintain)" value="maintain" />
          <el-option label="增肌 (Bulk)" value="bulk" />
        </el-select>
      </el-form-item>

      <el-form-item label="活动水平">
        <el-select v-model="form.activityLevel" placeholder="Select" style="width: 100%">
          <el-option label="久坐 (办公室工作)" :value="1.2" />
          <el-option label="轻度活跃 (每周运动1-3次)" :value="1.375" />
          <el-option label="中度活跃 (每周运动3-5次)" :value="1.55" />
          <el-option label="非常活跃 (每周运动6-7次)" :value="1.725" />
          <el-option label="极度活跃 (体力工作+训练)" :value="1.9" />
        </el-select>
      </el-form-item>

       <el-form-item label="过敏/忌口">
        <el-select
          v-model="form.allergies"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="输入过敏源或忌口"
          style="width: 100%"
        >
          <el-option label="花生" value="peanuts" />
          <el-option label="海鲜" value="seafood" />
          <el-option label="乳制品" value="dairy" />
          <el-option label="麸质" value="gluten" />
        </el-select>
      </el-form-item>

    </el-form>
  </el-card>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const form = reactive({ ...userStore.profile })

onMounted(() => {
    Object.assign(form, userStore.profile)
})

function saveProfile() {
  userStore.updateProfile(form)
  ElMessage.success('个人资料已更新')
}
</script>

<style scoped>
.profile-card {
    margin-bottom: 80px; /* Spacing for bottom nav */
}
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
/* Ensure form items don't overflow on mobile */
.profile-form {
    max-width: 100%;
}
</style>