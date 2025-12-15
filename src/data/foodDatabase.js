// 常见食物营养数据库 (每100g)
export const foodDatabase = [
  // 主食类
  { id: '1', name: '米饭 (蒸)', calories: 116, carbs: 25.9, protein: 2.6, fat: 0.3 },
  { id: '2', name: '馒头', calories: 223, carbs: 47, protein: 7, fat: 1.1 },
  { id: '3', name: '燕麦片 (生)', calories: 377, carbs: 66.9, protein: 15, fat: 6.7 },
  { id: '4', name: '全麦面包', calories: 246, carbs: 46, protein: 10, fat: 3 },
  { id: '5', name: '红薯 (蒸)', calories: 86, carbs: 20, protein: 1.6, fat: 0.2 },
  { id: '6', name: '煮玉米', calories: 112, carbs: 22.8, protein: 4, fat: 1.2 },
  { id: '7', name: '面条 (煮)', calories: 110, carbs: 23, protein: 4, fat: 0.5 },

  // 肉蛋奶类
  { id: '10', name: '鸡蛋 (煮)', calories: 144, carbs: 0.8, protein: 12.6, fat: 10.5 },
  { id: '11', name: '鸡胸肉 (生)', calories: 118, carbs: 0.6, protein: 24.6, fat: 1.9 },
  { id: '12', name: '瘦牛肉', calories: 106, carbs: 0, protein: 20.2, fat: 2.3 },
  { id: '13', name: '猪瘦肉', calories: 143, carbs: 1, protein: 20, fat: 6 },
  { id: '14', name: '牛奶 (全脂)', calories: 65, carbs: 4.9, protein: 3.3, fat: 3.5 },
  { id: '15', name: '酸奶 (无糖)', calories: 62, carbs: 5, protein: 3, fat: 3 },
  { id: '16', name: '三文鱼', calories: 139, carbs: 0, protein: 19.8, fat: 6.3 },
  { id: '17', name: '虾仁', calories: 85, carbs: 0, protein: 18, fat: 1 },

  // 蔬菜类
  { id: '30', name: '西兰花', calories: 34, carbs: 7, protein: 2.8, fat: 0.4 },
  { id: '31', name: '生菜', calories: 15, carbs: 2.9, protein: 1.4, fat: 0.2 },
  { id: '32', name: '西红柿', calories: 18, carbs: 3.9, protein: 0.9, fat: 0.2 },
  { id: '33', name: '黄瓜', calories: 16, carbs: 3.6, protein: 0.7, fat: 0.1 },
  { id: '34', name: '菠菜', calories: 23, carbs: 3.6, protein: 2.9, fat: 0.4 },
  { id: '35', name: '胡萝卜', calories: 41, carbs: 9.6, protein: 0.9, fat: 0.2 },

  // 水果类
  { id: '50', name: '苹果', calories: 52, carbs: 14, protein: 0.3, fat: 0.2 },
  { id: '51', name: '香蕉', calories: 89, carbs: 22.8, protein: 1.1, fat: 0.3 },
  { id: '52', name: '蓝莓', calories: 57, carbs: 14, protein: 0.7, fat: 0.3 },
  { id: '53', name: '橙子', calories: 47, carbs: 11.8, protein: 0.9, fat: 0.1 },
  { id: '54', name: '西瓜', calories: 30, carbs: 7.6, protein: 0.6, fat: 0.2 },

  // 坚果/油脂
  { id: '70', name: '巴旦木', calories: 579, carbs: 21.6, protein: 21.2, fat: 49.9 },
  { id: '71', name: '花生酱', calories: 588, carbs: 20, protein: 25, fat: 50 },
  { id: '72', name: '橄榄油', calories: 884, carbs: 0, protein: 0, fat: 100 },

  // 零食/饮料
  { id: '90', name: '可乐 (330ml)', calories: 43, carbs: 10.6, protein: 0, fat: 0 }, // 注意：这里通常按100ml算，展示时需特殊处理或统一标准。这里为了简单按100ml数据
  { id: '91', name: '巧克力', calories: 546, carbs: 61, protein: 4.9, fat: 31 },
  { id: '92', name: '薯片', calories: 536, carbs: 53, protein: 7, fat: 35 }
]
