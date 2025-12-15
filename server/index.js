import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// --- Auth Logic ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db', 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

// Helper to read users
const getUsers = () => {
    try {
        if (!fs.existsSync(DB_FILE)) return [];
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        console.error("Error reading db:", err);
        return [];
    }
};

// Helper to save users
const saveUsers = (users) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
};

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码必填' });
        }
        
        const users = getUsers();
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: '用户名已存在' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: hashedPassword,
            profile: { // Default profile
                 name: username,
                 gender: 'male',
                 age: 25,
                 height: 175,
                 weight: 70,
                 activityLevel: 1.375,
                 goal: 'maintain',
                 allergies: []
            },
            weightHistory: [],
            dietLogs: {}
        };
        
        users.push(newUser);
        saveUsers(users);

        res.json({ message: '注册成功' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '注册失败' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const users = getUsers();
        const user = users.find(u => u.username === username);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        
        // Return user info excluding password
        const { password: _, ...userInfo } = user;
        res.json({ token, user: userInfo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '登录失败' });
    }
});

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.get('/api/auth/me', authenticateToken, (req, res) => {
    const users = getUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.sendStatus(404);
    
    const { password: _, ...userInfo } = user;
    res.json(userInfo);
});

app.put('/api/user/sync', authenticateToken, (req, res) => {
    try {
        const { profile, weightHistory, dietLogs } = req.body;
        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === req.user.id);
        
        if (userIndex === -1) return res.sendStatus(404);
        
        // Update fields
        if (profile) users[userIndex].profile = profile;
        if (weightHistory) users[userIndex].weightHistory = weightHistory;
        if (dietLogs) users[userIndex].dietLogs = dietLogs;
        
        saveUsers(users);
        res.json({ message: '同步成功' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '同步失败' });
    }
});

// 配置 AI 客户端 (兼容 OpenAI 格式，如 DeepSeek, Gemini via Proxy 等)
const client = new OpenAI({
    baseURL: process.env.AI_BASE_URL || 'https://api.deepseek.com',
    apiKey: process.env.AI_API_KEY 
});

app.post('/api/analyze-food', async (req, res) => {
  try {
    const { description, userProfile } = req.body;

    if (!description) {
      return res.status(400).json({ error: '请提供食物描述' });
    }

    // 获取模型名称 (优先读取环境变量，默认 deepseek-chat)
    const modelName = process.env.AI_MODEL_NAME || "deepseek-chat";

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

// --- Static Files (Production) ---
// Serve frontend static files from the "dist" folder (one level up)
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Handle SPA routing: return index.html for any unknown route
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});