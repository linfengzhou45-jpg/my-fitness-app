import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
// Increase limit for Base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Setup Paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db', 'users.json');
const RECIPES_FILE = path.join(__dirname, 'db', 'recipes.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

// Ensure uploads dir exists (optional now, but good to keep)
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

// --- Multer Config (Memory Storage for Base64) ---
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit 5MB
});

// --- Helpers ---
const getUsers = () => {
    try {
        if (!fs.existsSync(DB_FILE)) return [];
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        console.error("Error reading users db:", err);
        return [];
    }
};

const saveUsers = (users) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
};

const getRecipes = () => {
    try {
        if (!fs.existsSync(RECIPES_FILE)) return [];
        const data = fs.readFileSync(RECIPES_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        console.error("Error reading recipes db:", err);
        return [];
    }
};

const saveRecipes = (recipes) => {
    fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2));
};

// --- Middleware ---
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

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.sendStatus(403);
    }
};

// --- Admin Recipes Management ---
app.post('/api/admin/recipes', authenticateToken, isAdmin, (req, res) => {
    const recipes = getRecipes();
    const recipeData = req.body;

    if (recipeData.id) {
        // 更新现有食谱
        const index = recipes.findIndex(r => r.id === recipeData.id);
        if (index !== -1) {
            recipes[index] = { ...recipes[index], ...recipeData };
        }
    } else {
        // 创建新食谱
        recipeData.id = Date.now();
        recipes.push(recipeData);
    }

    saveRecipes(recipes);
    res.json({ message: '操作成功' });
});

app.delete('/api/admin/recipes/:id', authenticateToken, isAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    let recipes = getRecipes();
    const originalLength = recipes.length;
    recipes = recipes.filter(r => r.id !== id);
    
    if (recipes.length === originalLength) return res.status(404).json({ error: '食谱不存在' });
    
    saveRecipes(recipes);
    res.json({ message: '删除成功' });
});
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        if (!username || !password) return res.status(400).json({ error: '用户名和密码必填' });
        
        const users = getUsers();
        if (users.find(u => u.username === username)) return res.status(400).json({ error: '用户名已存在' });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Auto-assign admin role to specific username (e.g., 'admin') or first user
        // For simplicity: if username is 'admin', give admin role
        const role = username === 'admin' ? 'admin' : 'user';

        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: hashedPassword,
            role,
            avatar: '', // Custom avatar
            motto: '致力于更健康的自己', // Custom motto
            profile: { 
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
            dietLogs: {},
            favoriteFoods: []
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

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' });
        const { password: _, ...userInfo } = user;
        res.json({ token, user: userInfo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '登录失败' });
    }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    const users = getUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.sendStatus(404);
    const { password: _, ...userInfo } = user;
    res.json(userInfo);
});

// --- User Data Routes ---
app.put('/api/user/sync', authenticateToken, (req, res) => {
    try {
        const { profile, weightHistory, dietLogs, favoriteFoods, dietPlans, avatar, motto } = req.body;
        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === req.user.id);

        if (userIndex === -1) return res.sendStatus(404);

        // Update fields
        if (profile) users[userIndex].profile = profile;
        if (weightHistory) users[userIndex].weightHistory = weightHistory;
        if (dietLogs) users[userIndex].dietLogs = dietLogs;
        if (favoriteFoods) users[userIndex].favoriteFoods = favoriteFoods;
        if (dietPlans) users[userIndex].dietPlans = dietPlans;
        if (avatar !== undefined) users[userIndex].avatar = avatar;        if (motto !== undefined) users[userIndex].motto = motto;
        
        saveUsers(users);
        res.json({ message: '同步成功' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '同步失败' });
    }
});

// --- Upload Route ---
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: '没有上传文件' });
    
    // Convert buffer to Base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const mimeType = req.file.mimetype; // e.g., image/jpeg
    const fileUrl = `data:${mimeType};base64,${b64}`;
    
    res.json({ url: fileUrl });
});

// --- Recipe Routes (Public Read, Admin Write) ---
app.get('/api/recipes', (req, res) => {
    res.json(getRecipes());
});

app.post('/api/recipes', authenticateToken, isAdmin, (req, res) => {
    try {
        const newRecipe = { id: Date.now(), ...req.body };
        const recipes = getRecipes();
        recipes.push(newRecipe);
        saveRecipes(recipes);
        res.json(newRecipe);
    } catch (error) {
        res.status(500).json({ error: '添加食谱失败' });
    }
});

app.put('/api/recipes/:id', authenticateToken, isAdmin, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const recipes = getRecipes();
        const index = recipes.findIndex(r => r.id === id);
        
        if (index === -1) return res.status(404).json({ error: '食谱不存在' });
        
        // Merge updates
        recipes[index] = { ...recipes[index], ...req.body, id }; // Ensure ID doesn't change
        saveRecipes(recipes);
        res.json(recipes[index]);
    } catch (error) {
        res.status(500).json({ error: '更新食谱失败' });
    }
});

app.delete('/api/recipes/:id', authenticateToken, isAdmin, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        let recipes = getRecipes();
        recipes = recipes.filter(r => r.id !== id);
        saveRecipes(recipes);
        res.json({ message: '删除成功' });
    } catch (error) {
        res.status(500).json({ error: '删除失败' });
    }
});

// --- Admin Stats Route ---
app.get('/api/admin/stats', authenticateToken, isAdmin, (req, res) => {
    const users = getUsers();
    const recipes = getRecipes();
    
    // Calculate basic stats
    const totalUsers = users.length;
    const totalRecipes = recipes.length;
    
    // Simple User list (safe view)
    const userList = users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        lastActive: 'Recently' // Mock
    }));

    res.json({
        totalUsers,
        totalRecipes,
        users: userList
    });
});

// --- AI Route ---
const client = new OpenAI({
    baseURL: process.env.AI_BASE_URL || 'https://api.deepseek.com',
    apiKey: process.env.AI_API_KEY,
    timeout: 90000 // 增加到 90 秒超时
});

app.post('/api/analyze-food', async (req, res) => {
  try {
    const { description, userProfile } = req.body;
    if (!description) return res.status(400).json({ error: '请提供内容' });
    
    const modelName = process.env.AI_MODEL_NAME || "deepseek-chat";
    
    // 构建上下文
    let promptContext = '';
    if (userProfile) {
        promptContext = `
        当前用户档案:
        - 性别: ${userProfile.gender}
        - 目标: ${userProfile.goal}
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
      "calories": 0,
      "carbs": 0,
      "protein": 0,
      "fat": 0,
      "analysis": "成分分析",
      "advice": "针对该用户的建议",
      "meals": [] // 仅当用户明确要求制定多餐计划时返回此数组
    }
    `;

    const userPrompt = `
    ${promptContext}
    用户请求内容: "${description}"
    任务:
    1. 如果用户请求单次饮食建议（如“建议晚餐”），请直接在 JSON 根节点返回 name, calories, carbs, protein, fat 等字段，不要包含 meals 数组。
    2. 如果用户请求完整饮食方案（如“制定今日三餐”），请将每餐详情放入 meals 数组中，每项包含 { "type": "breakfast/lunch/dinner", "name": "...", "calories": 0, ... }。
    3. 始终根据用户的资料、目标和忌口，给出简短建议。
    `;

    console.log(`[AI Request] Model: ${modelName}`);

    const completion = await client.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        model: modelName,
        temperature: 0.1,
    });

    const text = completion.choices[0].message.content;
    console.log('[AI Raw Response Snippet]:', text.substring(0, 100));

    // 清理并解析 JSON (结合备份逻辑与健壮性清洗)
    const jsonStr = text.replace(/```json|```/g, '').trim();
    const startIndex = jsonStr.indexOf('{');
    const endIndex = jsonStr.lastIndexOf('}');
    
    if (startIndex !== -1 && endIndex !== -1) {
        const finalJson = jsonStr.substring(startIndex, endIndex + 1);
        const data = JSON.parse(finalJson);
        res.json(data);
    } else {
        throw new Error('AI 未返回有效的 JSON 结构');
    }

  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'AI 服务暂时不可用，请检查网络或稍后再试' });
  }
});

// --- Static Files ---
// 1. Uploaded images
app.use('/uploads', express.static(UPLOADS_DIR));
// 2. Frontend App
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});