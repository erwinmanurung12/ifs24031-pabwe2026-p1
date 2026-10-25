import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
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
  if (!db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) {
    // Tanpa ADMIN_PASSWORD, buat password acak dan tampilkan sekali di log.
    const password = env.ADMIN_PASSWORD || crypto.randomBytes(9).toString("base64url");
    if (!env.ADMIN_PASSWORD) console.log(`Password admin awal (acak): ${password}`);
    db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')")
      .run("Admin BEM", email, bcrypt.hashSync(password, 10));
  }
  if (env.SEED_DEMO !== "false") seedDemo(db);

  return createApp(db, {
    jwtSecret: env.JWT_SECRET || undefined,
    panitiaCode: env.PANITIA_CODE || null,
    staticDir,
  });
}
