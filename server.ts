import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || "";
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

if (NODE_ENV === "production" && !JWT_SECRET) {
  throw new Error("JWT_SECRET is required in production environment");
}

const effectiveJwtSecret = JWT_SECRET || "dev-only-jwt-secret-change-me";

type DbPayload = {
  lockspecs?: unknown[];
  gallery?: unknown[];
  tasks?: unknown[];
  skills?: unknown[];
  docs?: unknown[];
  visionSessions?: unknown[];
  theme?: string;
  sidebarOpen?: boolean;
};

const registerSchema = z.object({
  email: z.string().email().max(254),
  username: z.string().min(3).max(32),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

const dbSchema = z.object({
  lockspecs: z.array(z.unknown()).optional(),
  gallery: z.array(z.unknown()).optional(),
  tasks: z.array(z.unknown()).optional(),
  skills: z.array(z.unknown()).optional(),
  docs: z.array(z.unknown()).optional(),
  visionSessions: z.array(z.unknown()).optional(),
  theme: z.string().max(64).optional(),
  sidebarOpen: z.boolean().optional(),
});

const authAttempts = new Map<string, { count: number; firstAt: number; blockedUntil?: number }>();
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 10;
const AUTH_BLOCK_MS = 15 * 60 * 1000;

const getClientIp = (req: express.Request) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || req.ip;
  }
  return req.ip;
};

const safeReadJson = <T>(filePath: string, fallback: T): T => {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

async function startServer() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "2mb" }));

  const DB_DIR = path.join(process.cwd(), "data");
  const DB_PATH = path.join(DB_DIR, "db.json");
  const USERS_PATH = path.join(DB_DIR, "users.json");

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const getDB = () => safeReadJson<Record<string, DbPayload>>(DB_PATH, {});
  const saveDB = (data: Record<string, DbPayload>) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  const getUsers = () => safeReadJson<any[]>(USERS_PATH, []);
  const saveUsers = (users: any[]) => fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));

  const isAuthBlocked = (key: string) => {
    const entry = authAttempts.get(key);
    if (!entry) return false;
    if (entry.blockedUntil && entry.blockedUntil > Date.now()) return true;
    return false;
  };

  const recordAuthFail = (key: string) => {
    const now = Date.now();
    const current = authAttempts.get(key);
    if (!current || now - current.firstAt > AUTH_WINDOW_MS) {
      authAttempts.set(key, { count: 1, firstAt: now });
      return;
    }
    const nextCount = current.count + 1;
    const blockedUntil = nextCount >= AUTH_MAX_ATTEMPTS ? now + AUTH_BLOCK_MS : undefined;
    authAttempts.set(key, { count: nextCount, firstAt: current.firstAt, blockedUntil });
  };

  const clearAuthFail = (key: string) => authAttempts.delete(key);

  const authRateLimit = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = getClientIp(req);
    if (isAuthBlocked(ip)) {
      return res.status(429).json({ error: "Too many login attempts. Try again later." });
    }
    next();
  };

  app.post("/api/auth/register", authRateLimit, async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid registration payload" });
    }

    const { email, password, username } = parsed.data;
    const users = getUsers();

    if (users.find((u: any) => u.email === email)) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = {
      id: Math.random().toString(36).slice(2),
      email,
      username,
      password: hashedPassword,
      createdAt: Date.now(),
    };

    users.push(newUser);
    saveUsers(users);

    const { password: _, ...userWithoutPassword } = newUser;
    const token = jwt.sign({ userId: newUser.id }, effectiveJwtSecret, { expiresIn: "12h" });

    res.json({ user: userWithoutPassword, token, expiresIn: 60 * 60 * 12 });
  });

  app.post("/api/auth/login", authRateLimit, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid login payload" });
    }

    const { email, password } = parsed.data;
    const ip = getClientIp(req);

    const users = getUsers();
    const user = users.find((u: any) => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      recordAuthFail(ip);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    clearAuthFail(ip);
    const { password: _, ...userWithoutPassword } = user;
    const token = jwt.sign({ userId: user.id }, effectiveJwtSecret, { expiresIn: "12h" });
    res.json({ user: userWithoutPassword, token, expiresIn: 60 * 60 * 12 });
  });

  app.get("/api/auth/github/url", (_req, res) => {
    if (!GITHUB_CLIENT_ID) {
      return res.status(500).json({ error: "GitHub Client ID not configured" });
    }
    const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=read:user,repo`;
    res.json({ url });
  });

  app.get("/api/auth/github/callback", async (req, res) => {
    const { code } = req.query;
    try {
      if (!code || typeof code !== "string") {
        return res.status(400).send("Missing code");
      }

      const tokenRes = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
        },
        { headers: { Accept: "application/json" } }
      );

      const accessToken = tokenRes.data.access_token;
      const userRes = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `token ${accessToken}` },
      });

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
        headers: { Authorization: token },
      });
      res.json(Array.isArray(repoRes.data) ? repoRes.data : []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const verifyToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, effectiveJwtSecret) as any;
      req.userId = decoded.userId;
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  app.get("/api/db", verifyToken, (req: any, res: any) => {
    const db = getDB();
    res.json(db[req.userId] || {});
  });

  app.post("/api/db", verifyToken, (req: any, res: any) => {
    const parsed = dbSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid DB payload" });
    }

    const db = getDB();
    db[req.userId] = parsed.data;
    saveDB(db);
    res.json({ status: "ok", updatedAt: Date.now() });
  });

  if (NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
