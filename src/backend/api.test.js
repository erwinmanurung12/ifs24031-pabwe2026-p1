import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { openDb } from "./db.js";
import { createApp } from "./app.js";
import { computeStandings } from "./standings.js";

let api, db, adminToken, viewerToken, tid, teams;

beforeAll(async () => {
  db = openDb();
  db.prepare("INSERT INTO users (name,email,password_hash,role) VALUES ('Admin','a@x.id',?, 'admin')")
    .run(bcrypt.hashSync("admin12345", 4));
  api = request(createApp(db, { jwtSecret: "test", panitiaCode: "rahasia-panitia" }));
  adminToken = (await api.post("/api/auth/login").send({ email: "a@x.id", password: "admin12345" })).body.token;
  db.prepare("INSERT INTO users (name,email,password_hash,role) VALUES ('Budi','b@x.id',?, 'viewer')").run(bcrypt.hashSync("password1", 4));
  viewerToken = (await api.post("/api/auth/login").send({ email: "b@x.id", password: "password1" })).body.token;
});
const as = (t) => ({ Authorization: `Bearer ${t}` });

describe("auth & akun panitia", () => {
  it("kelola akun oleh admin", async () => {
    expect((await api.get("/api/tournaments")).status).toBe(401);
    const body = { name: "Citra", email: "C@x.id", password: "password1" };
    expect((await api.post("/api/users").send(body)).status).toBe(401);
    expect((await api.post("/api/users").set(as(viewerToken)).send(body)).status).toBe(403);
    expect((await api.post("/api/users").set(as(adminToken)).send({ name: "x" })).status).toBe(400);
    const c = await api.post("/api/users").set(as(adminToken)).send(body);
    expect(c.status).toBe(201);
    expect(c.body.email).toBe("c@x.id");
    expect((await api.post("/api/users").set(as(adminToken)).send({ ...body, email: "c@x.id" })).status).toBe(409);
    expect((await api.get("/api/users").set(as(adminToken))).body.length).toBe(3);
    expect((await api.post("/api/auth/login").send({ email: "C@x.id", password: "password1" })).status).toBe(200);
    expect((await api.delete(`/api/users/${c.body.id}`).set(as(adminToken))).status).toBe(204);
    expect((await api.delete("/api/users/999").set(as(adminToken))).status).toBe(404);
    expect((await api.delete("/api/users/1").set(as(adminToken))).status).toBe(400);
  });
  it("login gagal & /me", async () => {
    expect((await api.post("/api/auth/login").send({ email: "b@x.id", password: "salah" })).status).toBe(401);
    expect((await api.post("/api/auth/login").send({})).status).toBe(401);
    expect((await api.get("/api/users/me").set(as(viewerToken))).body.email).toBe("b@x.id");
    expect((await api.get("/api/users/me")).status).toBe(401);
    expect((await api.get("/api/users/me").set(as("rusak"))).status).toBe(401);
  });
});

describe("turnamen, tim, pertandingan", () => {
  it("viewer tidak boleh membuat turnamen", async () => {
    expect((await api.post("/api/tournaments").set(as(viewerToken)).send({ name: "A", sport: "Futsal" })).status).toBe(403);
  });
  it("admin CRUD turnamen", async () => {
    expect((await api.post("/api/tournaments").set(as(adminToken)).send({ name: "" })).status).toBe(400);
    expect((await api.post("/api/tournaments").set(as(adminToken)).send({ name: "A", sport: "F", status: "x" })).status).toBe(400);
    const c = await api.post("/api/tournaments").set(as(adminToken)).send({ name: "Pekan Olahraga", sport: "Futsal" });
    expect(c.status).toBe(201);
    tid = c.body.id;
    expect((await api.get("/api/tournaments").set(as(viewerToken))).body.length).toBe(1);
    expect((await api.get(`/api/tournaments/${tid}`).set(as(viewerToken))).body.name).toBe("Pekan Olahraga");
    expect((await api.get("/api/tournaments/999").set(as(viewerToken))).status).toBe(404);
    expect((await api.put(`/api/tournaments/${tid}`).set(as(adminToken)).send({ status: "ongoing" })).body.status).toBe("ongoing");
    expect((await api.put(`/api/tournaments/${tid}`).set(as(adminToken)).send({ name: "" })).status).toBe(400);
    expect((await api.put("/api/tournaments/999").set(as(adminToken)).send({})).status).toBe(404);
  });
  it("tim & pemain", async () => {
    teams = [];
    for (const n of ["IF", "SI", "TE"]) {
      const r = await api.post(`/api/tournaments/${tid}/teams`).set(as(adminToken)).send({ name: n });
      expect(r.status).toBe(201);
      teams.push(r.body.id);
    }
    expect((await api.post(`/api/tournaments/${tid}/teams`).set(as(adminToken)).send({ name: "IF" })).status).toBe(409);
    expect((await api.post(`/api/tournaments/${tid}/teams`).set(as(adminToken)).send({})).status).toBe(400);
    expect((await api.post("/api/tournaments/999/teams").set(as(adminToken)).send({ name: "Z" })).status).toBe(404);
    expect((await api.get(`/api/tournaments/${tid}/teams`).set(as(viewerToken))).body.length).toBe(3);
    expect((await api.get("/api/tournaments/999/teams").set(as(viewerToken))).status).toBe(404);
    const p = await api.post(`/api/teams/${teams[0]}/players`).set(as(adminToken)).send({ name: "Andi", number: 9 });
    expect(p.status).toBe(201);
    expect((await api.post(`/api/teams/${teams[0]}/players`).set(as(adminToken)).send({ name: "A", number: -1 })).status).toBe(400);
    expect((await api.post("/api/teams/999/players").set(as(adminToken)).send({ name: "A" })).status).toBe(404);
    expect((await api.get(`/api/teams/${teams[0]}/players`).set(as(viewerToken))).body.length).toBe(1);
  });
  it("validasi pertandingan", async () => {
    const post = (b) => api.post(`/api/tournaments/${tid}/matches`).set(as(adminToken)).send(b);
    expect((await post({})).status).toBe(400);
    expect((await post({ home_team_id: teams[0], away_team_id: teams[0] })).status).toBe(400);
    expect((await post({ home_team_id: teams[0], away_team_id: 999 })).status).toBe(400);
    expect((await api.post("/api/tournaments/999/matches").set(as(adminToken)).send({})).status).toBe(404);
  });
  it("klasemen otomatis dari skor", async () => {
    const post = (h, a) => api.post(`/api/tournaments/${tid}/matches`).set(as(adminToken)).send({ home_team_id: h, away_team_id: a, scheduled_at: "2026-11-01T10:00" });
    const m1 = (await post(teams[0], teams[1])).body;
    const m2 = (await post(teams[1], teams[2])).body;
    const m3 = (await post(teams[2], teams[0])).body;
    expect((await api.get(`/api/tournaments/${tid}/matches`).set(as(viewerToken))).body.length).toBe(3);
    expect((await api.get("/api/tournaments/999/matches").set(as(viewerToken))).status).toBe(404);
    expect((await api.put(`/api/matches/${m1.id}`).set(as(adminToken)).send({ home_score: -1, away_score: 0 })).status).toBe(400);
    expect((await api.put("/api/matches/999").set(as(adminToken)).send({ home_score: 1, away_score: 0 })).status).toBe(404);
    await api.put(`/api/matches/${m1.id}`).set(as(adminToken)).send({ home_score: 3, away_score: 1 });
    await api.put(`/api/matches/${m2.id}`).set(as(adminToken)).send({ home_score: 2, away_score: 2 });
    const s = (await api.get(`/api/tournaments/${tid}/standings`).set(as(viewerToken))).body;
    expect(s[0]).toMatchObject({ team: "IF", points: 3, gd: 2, rank: 1 });
    expect(s.find((r) => r.team === "SI")).toMatchObject({ points: 1, drawn: 1, lost: 1 });
    expect((await api.get("/api/tournaments/999/standings").set(as(viewerToken))).status).toBe(404);
    expect((await api.delete(`/api/matches/${m3.id}`).set(as(adminToken))).status).toBe(204);
    expect((await api.delete("/api/matches/999").set(as(adminToken))).status).toBe(404);
  });
  it("hapus tim & turnamen", async () => {
    expect((await api.delete(`/api/teams/${teams[2]}`).set(as(adminToken))).status).toBe(204);
    expect((await api.delete("/api/teams/999").set(as(adminToken))).status).toBe(404);
    expect((await api.delete(`/api/tournaments/${tid}`).set(as(adminToken))).status).toBe(204);
    expect((await api.delete("/api/tournaments/999").set(as(adminToken))).status).toBe(404);
  });
});

describe("pendaftaran dua peran & komentar", () => {
  it("mahasiswa bebas mendaftar, panitia wajib kode", async () => {
    const reg = (b) => api.post("/api/auth/register").send(b);
    const base = { name: "Dina", email: "Dina@x.id", password: "password1" };
    expect((await reg({ name: "x" })).status).toBe(400);
    expect((await reg({ ...base, role: "superuser" })).status).toBe(400);
    const m = await reg(base);
    expect(m.status).toBe(201);
    expect(m.body).toMatchObject({ role: "viewer", email: "dina@x.id" });
    expect((await reg(base)).status).toBe(409);
    expect((await reg({ ...base, email: "p@x.id", role: "admin" })).status).toBe(403);
    expect((await reg({ ...base, email: "p@x.id", role: "admin", panitia_code: "salah" })).status).toBe(403);
    const p = await reg({ ...base, email: "p@x.id", role: "admin", panitia_code: "rahasia-panitia" });
    expect(p.status).toBe(201);
    expect(p.body.role).toBe("admin");
  });
  it("pendaftaran panitia ditutup bila kode tidak diatur", async () => {
    const a2 = request(createApp(openDb()));
    const r = await a2.post("/api/auth/register").send({ name: "x", email: "x@x.id", password: "password1", role: "admin", panitia_code: "" });
    expect(r.status).toBe(403);
  });
  it("komentar: tulis, lihat, hapus milik sendiri; admin bisa hapus siapa saja", async () => {
    const t = (await api.post("/api/tournaments").set(as(adminToken)).send({ name: "Liga", sport: "Voli" })).body.id;
    const url = `/api/tournaments/${t}/comments`;
    expect((await api.get(url)).status).toBe(401);
    expect((await api.post(url).set(as(viewerToken)).send({ body: "  " })).status).toBe(400);
    expect((await api.post(url).set(as(viewerToken)).send({ body: "x".repeat(501) })).status).toBe(400);
    expect((await api.post("/api/tournaments/999/comments").set(as(viewerToken)).send({ body: "hai" })).status).toBe(404);
    const c1 = await api.post(url).set(as(viewerToken)).send({ body: " Semangat! " });
    expect(c1.status).toBe(201);
    expect(c1.body).toMatchObject({ body: "Semangat!", author: "Budi", author_role: "viewer" });
    const c2 = await api.post(url).set(as(adminToken)).send({ body: "Jadwal diumumkan besok" });
    expect((await api.get(url).set(as(viewerToken))).body.map((c) => c.body)).toEqual(["Jadwal diumumkan besok", "Semangat!"]);
    expect((await api.get("/api/tournaments/999/comments").set(as(viewerToken))).status).toBe(404);
    expect((await api.delete(`/api/comments/${c2.body.id}`).set(as(viewerToken))).status).toBe(403);
    expect((await api.delete(`/api/comments/${c1.body.id}`).set(as(viewerToken))).status).toBe(204);
    expect((await api.delete(`/api/comments/${c2.body.id}`).set(as(adminToken))).status).toBe(204);
    expect((await api.delete("/api/comments/999").set(as(adminToken))).status).toBe(404);
  });
});

describe("computeStandings", () => {
  it("urutan: poin, selisih gol, gol masuk, nama; abaikan laga belum selesai", () => {
    const t = [{ id: 1, name: "B" }, { id: 2, name: "A" }, { id: 3, name: "C" }];
    const m = [
      { home_team_id: 1, away_team_id: 2, home_score: 1, away_score: 1, status: "finished" },
      { home_team_id: 3, away_team_id: 1, home_score: 0, away_score: 0, status: "scheduled" },
      { home_team_id: 9, away_team_id: 1, home_score: 5, away_score: 0, status: "finished" },
    ];
    const s = computeStandings(t, m);
    expect(s.map((r) => r.team)).toEqual(["A", "B", "C"]);
    expect(s[2].played).toBe(0);
  });
});

import { seedDemo } from "./seed.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("data contoh & ringkasan beranda", () => {
  it("seed hanya berjalan sekali dan /api/overview terisi", async () => {
    const db = openDb();
    db.prepare("INSERT INTO users (name,email,password_hash,role) VALUES ('Admin','a@x.id',?,'admin')").run(bcrypt.hashSync("admin12345", 4));
    expect(seedDemo(db)).toBe(true);
    expect(seedDemo(db)).toBe(false);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-"));
    fs.writeFileSync(path.join(dir, "index.html"), "<h1>app</h1>");
    const a = request(createApp(db, { staticDir: dir, jwtSecret: "t" }));
    const H = as((await a.post("/api/auth/login").send({ email: "a@x.id", password: "admin12345" })).body.token);
    const o = (await a.get("/api/overview").set(H)).body;
    expect(o.tournaments.length).toBe(3);
    expect(o.tournaments[0].leader).not.toBeNull();
    expect(o.recent.length).toBe(5);
    expect(o.upcoming.length).toBeGreaterThan(0);
    const teams = (await a.get(`/api/tournaments/${o.tournaments[0].id}/teams`).set(H)).body;
    expect(teams[0].players.length).toBe(5);
    const seeded = db.prepare("SELECT COUNT(*) AS c FROM comments").get().c;
    expect(seeded).toBe(2);
    expect((await a.get("/tournaments/1")).text).toContain("app");
  });
});
