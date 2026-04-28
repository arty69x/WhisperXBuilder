import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "whisperx-mega-secret-2024";
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  const DB_DIR = path.join(process.cwd(), "data");
  const DB_PATH = path.join(DB_DIR, "db.json");
  const USERS_PATH = path.join(DB_DIR, "users.json");

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const getDB = () => fs.existsSync(DB_PATH) ? JSON.parse(fs.readFileSync(DB_PATH, "utf8")) : {};
  const saveDB = (data: any) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  const getUsers = () => fs.existsSync(USERS_PATH) ? JSON.parse(fs.readFileSync(USERS_PATH, "utf8")) : [];
  const saveUsers = (users: any[]) => fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));

  // ─── Auth Routes ─────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, username } = req.body;
    const users = getUsers();
    if (users.find((u: any) => u.email === email)) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Math.random().toString(36).slice(2), email, username, password: hashedPassword, createdAt: Date.now() };
    users.push(newUser);
    saveUsers(users);
    const { password: _, ...userWithoutPassword } = newUser;
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET);
    res.json({ user: userWithoutPassword, token });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find((u: any) => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const { password: _, ...userWithoutPassword } = user;
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ user: userWithoutPassword, token });
  });

  // ─── GitHub OAuth ────────────────────────────────────────
  app.get("/api/auth/github/url", (req, res) => {
    if (!GITHUB_CLIENT_ID) {
      return res.status(500).json({ error: "GitHub Client ID not configured" });
    }
    const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user,repo`;
    res.json({ url });
  });

  app.get("/api/auth/github/callback", async (req, res) => {
    const { code } = req.query;
    try {
      const tokenRes = await axios.post("https://github.com/login/oauth/access_token", {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code
      }, { headers: { Accept: "application/json" } });

      const accessToken = tokenRes.data.access_token;
      const userRes = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `token ${accessToken}` }
      });

      // In a real app, you'd save this to your database
      // Here we'll just send it back to the client to update their store
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ 
                type: 'GITHUB_AUTH_SUCCESS', 
                token: '${accessToken}',
                user: ${JSON.stringify(userRes.data)}
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      res.status(500).send("GitHub Error: " + err.message);
    }
  });

  app.get("/api/github/repos", async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const repoRes = await axios.get("https://api.github.com/user/repos?sort=updated&per_page=50", {
        headers: { Authorization: token }
      });
      res.json(repoRes.data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Middleware ──────────────────────────────────────────
  const verifyToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.userId = decoded.userId;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // ─── DB Routes (Protected) ────────────────────────────────
  app.get("/api/db", verifyToken, (req: any, res: any) => {
    const db = getDB();
    res.json(db[req.userId] || {});
  });

  app.post("/api/db", verifyToken, (req: any, res: any) => {
    const db = getDB();
    db[req.userId] = req.body;
    saveDB(db);
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
