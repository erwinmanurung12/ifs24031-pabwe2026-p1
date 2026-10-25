import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { openDb } from "./db.js";
import { createApp } from "./app.js";
import { seedDemo } from "./seed.js";

// Menyiapkan database, akun admin, data contoh, dan aplikasi Express.
// Dipakai oleh server biasa (server.js) dan fungsi serverless Vercel (api/index.js).
export function buildApp(env = process.env, { staticDir = null } = {}) {
  // Di Vercel hanya /tmp yang dapat ditulis (sementara, hilang saat instance baru).
  const dbPath = env.DB_PATH || (env.VERCEL ? "/tmp/delliga.db" : "./data/delliga.db");
  if (dbPath !== ":memory:") fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = openDb(dbPath);

  const email = env.ADMIN_EMAIL || "admin@delliga.test";
  const password = env.ADMIN_PASSWORD || "admin12345";
  if (!db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) {
    db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')")
      .run("Admin BEM", email, bcrypt.hashSync(password, 10));
  }
  if (env.SEED_DEMO !== "false") seedDemo(db);

  return createApp(db, {
    jwtSecret: env.JWT_SECRET || "dev-secret",
    panitiaCode: env.PANITIA_CODE || null,
    staticDir,
  });
}
