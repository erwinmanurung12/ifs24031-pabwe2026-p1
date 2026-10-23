import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { openDb } from "./db.js";
import { createApp } from "./app.js";
import { seedDemo } from "./seed.js";

const dbPath = process.env.DB_PATH || "./data/delliga.db";
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = openDb(dbPath);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@delliga.test";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin12345";
if (!db.prepare("SELECT 1 FROM users WHERE email = ?").get(ADMIN_EMAIL)) {
  db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')")
    .run("Admin BEM", ADMIN_EMAIL, bcrypt.hashSync(ADMIN_PASSWORD, 10));
}

if (process.env.SEED_DEMO !== "false") seedDemo(db);

const staticDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../frontend/dist");
const app = createApp(db, { jwtSecret: process.env.JWT_SECRET || "dev-secret", panitiaCode: process.env.PANITIA_CODE || null, staticDir });
const port = Number(process.env.PORT) || 8000;
app.listen(port, () => console.log(`DelLiga API berjalan di http://localhost:${port}`));
