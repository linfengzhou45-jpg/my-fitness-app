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
app.use(express.json());

// --- Setup Paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db', 'users.json');
const RECIPES_FILE = path.join(__dirname, 'db', 'recipes.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

// --- Multer Config ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage });

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
        res.status(403).json({ error: '需要管理员权限' });
    }
};

// --- Auth Routes ---
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
        const { profile, weightHistory, dietLogs, favoriteFoods, avatar, motto } = req.body;
        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === req.user.id);
        
        if (userIndex === -1) return res.sendStatus(404);
        
        // Update fields
        if (profile) users[userIndex].profile = profile;
        if (weightHistory) users[userIndex].weightHistory = weightHistory;
        if (dietLogs) users[userIndex].dietLogs = dietLogs;
        if (favoriteFoods) users[userIndex].favoriteFoods = favoriteFoods;
        if (avatar !== undefined) users[userIndex].avatar = avatar;
        if (motto !== undefined) users[userIndex].motto = motto;
        
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
    // Return the URL to access the file
    // Assuming server is running on localhost:3000, we map /uploads to static middleware
    const fileUrl = `/uploads/${req.file.filename}`;
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
    apiKey: process.env.AI_API_KEY 
});

app.post('/api/analyze-food', async (req, res) => {
  // ... (Keep existing AI logic same) ...
  try {
    const { description, userProfile } = req.body;
    if (!description) return res.status(400).json({ error: '请提供食物描述' });
    const modelName = process.env.AI_MODEL_NAME || "deepseek-chat";
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
    const systemPrompt = `你是一个高级运动营养师。请务必只返回纯 JSON 格式的数据。
    格式: {"name": "食物名", "calories": 0, "carbs": 0, "protein": 0, "fat": 0, "analysis": "...", "advice": "..."}`;
    const userPrompt = `${promptContext} 用户吃了: "${description}". 估算成分并建议。`;

    const completion = await client.chat.completions.create({
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        model: modelName,
        temperature: 0.1,
    });
    const text = completion.choices[0].message.content;
    const jsonStr = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(jsonStr);
    res.json(data);
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'AI 服务暂时不可用' });
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