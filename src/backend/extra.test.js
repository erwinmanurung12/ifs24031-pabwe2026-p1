import { describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { openDb } from "./db.js";
import { createApp } from "./app.js";
import { seedDemo } from "./seed.js";

const SECRET = "test";
const token = (id, role) => ({ Authorization: `Bearer ${jwt.sign({ id, role }, SECRET)}` });

function setup() {
  const db = openDb();
  const hash = bcrypt.hashSync("password1", 4);
  db.prepare("INSERT INTO users (name,email,password_hash,role) VALUES ('Admin','a@x.id',?,'admin')").run(hash);
  db.prepare("INSERT INTO users (name,email,password_hash,role) VALUES ('Budi','b@x.id',?,'viewer')").run(hash);
  return { db, api: request(createApp(db, { jwtSecret: SECRET })) };
}

describe("cabang tambahan API", () => {
  it("/users/me mengembalikan 404 bila akun sudah tidak ada", async () => {
    const { api } = setup();
    expect((await api.get("/api/users/me").set(token(999, "viewer"))).status).toBe(404);
    expect((await api.get("/api/users/me").set(token(2, "viewer"))).status).toBe(200);
  });

  it("menolak komentar bukan teks atau terlalu panjang", async () => {
    const { api } = setup();
    const t = await api.post("/api/tournaments").set(token(1, "admin")).send({ name: "T", sport: "Futsal" });
    const url = `/api/tournaments/${t.body.id}/comments`;
    expect((await api.post(url).set(token(2, "viewer")).send({ body: 123 })).status).toBe(400);
    expect((await api.post(url).set(token(2, "viewer")).send({ body: "x".repeat(501) })).status).toBe(400);
    expect((await api.post(url).set(token(2, "viewer")).send({ body: "ok" })).status).toBe(201);
  });
});

describe("seedDemo", () => {
  it("membatalkan transaksi bila terjadi error", () => {
    const { db } = setup();
    const failing = new Proxy(db, {
      get(target, prop) {
        const value = target[prop];
        if (prop === "prepare") {
          return (sql) => {
            if (sql.includes("INSERT INTO comments")) throw new Error("boom");
            return target.prepare(sql);
          };
        }
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    expect(() => seedDemo(failing)).toThrow("boom");
    expect(db.prepare("SELECT COUNT(*) AS c FROM tournaments").get().c).toBe(0);
  });
});
