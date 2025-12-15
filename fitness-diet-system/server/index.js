import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// 配置 DeepSeek / SiliconFlow 客户端
const client = new OpenAI({
    baseURL: process.env.AI_BASE_URL || 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY 
});

app.post('/api/analyze-food', async (req, res) => {
  try {
    const { description, userProfile } = req.body;

    if (!description) {
      return res.status(400).json({ error: '请提供食物描述' });
    }

    // 获取模型名称 (优先读取环境变量，默认 deepseek-chat)
    const modelName = process.env.DEEPSEEK_MODEL_NAME || "deepseek-chat";

    console.log(`[AI Request] URL: ${client.baseURL}, Model: ${modelName}`); 

    // 构建上下文
    let promptContext = '';
    if (userProfile) {
        promptContext = `
        当前用户档案:
        - 性别: ${userProfile.gender}
        - 目标: ${userProfile.goal === 'cut' ? '减脂' : userProfile.goal === 'bulk' ? '增肌' : '保持'}
        - 体重: ${userProfile.weight}kg
        - BMR: ${userProfile.bmr} kcal
        `;
    }

    const systemPrompt = `
    你是一个高级运动营养师。
    请务必只返回纯 JSON 格式的数据，不要包含 markdown 标记 (如 \`\`\`json)。
    格式要求:
    {
      "name": "标准食物名称",
      "calories": 0, // 热量 (kcal)
      "carbs": 0,    // 碳水 (g)
      "protein": 0,  // 蛋白质 (g)
      "fat": 0,      // 脂肪 (g)
      "analysis": "成分分析 (如: 油脂较高...)",
      "advice": "针对该用户的建议"
    }
    `;

    const userPrompt = `
    ${promptContext}
    用户刚刚吃了: "${description}"
    任务:
    1. 估算食物的热量和宏量营养素 (考虑油腻程度、烹饪方式)。
    2. 根据用户的档案目标，给出简短的饮食建议。
    `;

    const completion = await client.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        model: modelName,
        temperature: 0.1, // 降低随机性，让数据更稳定
    });

    const text = completion.choices[0].message.content;
    
    // 清理 markdown 标记
    const jsonStr = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(jsonStr);

    res.json(data);

  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'AI 服务暂时不可用，请稍后再试' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});