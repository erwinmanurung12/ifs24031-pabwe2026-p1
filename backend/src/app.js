import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "node:fs";
import path from "node:path";
import { computeStandings } from "./standings.js";

const isInt = (v) => Number.isInteger(v) && v >= 0;
const str = (v) => typeof v === "string" && v.trim().length > 0;

export function createApp(db, { jwtSecret = "dev-secret", staticDir = null } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const fail = (res, code, message) => res.status(code).json({ message });

  const auth = (role) => (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return fail(res, 401, "Token tidak ditemukan");
    try {
      req.user = jwt.verify(token, jwtSecret);
    } catch {
      return fail(res, 401, "Token tidak valid");
    }
    if (role && req.user.role !== role) return fail(res, 403, "Akses ditolak");
    next();
  };
  const admin = auth("admin");

  const tournamentOr404 = (req, res) => {
    const t = db.prepare("SELECT * FROM tournaments WHERE id = ?").get(req.params.id);
    if (!t) fail(res, 404, "Turnamen tidak ditemukan");
    return t;
  };

  // ---------- Auth ----------
  // Akun hanya dibuat oleh panitia (admin). Mahasiswa melihat data tanpa akun.
  app.get("/api/users", admin, (_req, res) =>
    res.json(db.prepare("SELECT id, name, email, role FROM users ORDER BY id").all()));

  app.post("/api/users", admin, (req, res) => {
    const { name, email, password } = req.body;
    if (!str(name) || !str(email) || !str(password) || password.length < 8)
      return fail(res, 400, "Nama, email, dan password (min 8 karakter) wajib diisi");
    const mail = email.trim().toLowerCase();
    if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(mail))
      return fail(res, 409, "Email sudah terdaftar");
    const info = db
      .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')")
      .run(name.trim(), mail, bcrypt.hashSync(password, 10));
    res.status(201).json({ id: info.lastInsertRowid, name: name.trim(), email: mail, role: "admin" });
  });

  app.delete("/api/users/:id", admin, (req, res) => {
    if (Number(req.params.id) === req.user.id) return fail(res, 400, "Tidak dapat menghapus akun sendiri");
    const info = db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    info.changes ? res.status(204).end() : fail(res, 404, "Akun tidak ditemukan");
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = str(email) && str(password)
      ? db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase())
      : null;
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return fail(res, 401, "Email atau password salah");
    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: "8h" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  app.get("/api/users/me", auth(), (req, res) => {
    const u = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(req.user.id);
    u ? res.json(u) : fail(res, 404, "User tidak ditemukan");
  });

  // ---------- Tournaments ----------
  app.get("/api/tournaments", (_req, res) =>
    res.json(db.prepare("SELECT * FROM tournaments ORDER BY id DESC").all()));

  app.get("/api/tournaments/:id", (req, res) => {
    const t = tournamentOr404(req, res);
    if (t) res.json(t);
  });

  app.post("/api/tournaments", admin, (req, res) => {
    const { name, sport, start_date = null, status = "upcoming" } = req.body;
    if (!str(name) || !str(sport)) return fail(res, 400, "Nama dan cabang olahraga wajib diisi");
    if (!["upcoming", "ongoing", "finished"].includes(status)) return fail(res, 400, "Status tidak valid");
    const info = db
      .prepare("INSERT INTO tournaments (name, sport, status, start_date) VALUES (?, ?, ?, ?)")
      .run(name.trim(), sport.trim(), status, start_date);
    res.status(201).json(db.prepare("SELECT * FROM tournaments WHERE id = ?").get(info.lastInsertRowid));
  });

  app.put("/api/tournaments/:id", admin, (req, res) => {
    const t = tournamentOr404(req, res);
    if (!t) return;
    const { name = t.name, sport = t.sport, status = t.status, start_date = t.start_date } = req.body;
    if (!str(name) || !str(sport) || !["upcoming", "ongoing", "finished"].includes(status))
      return fail(res, 400, "Data turnamen tidak valid");
    db.prepare("UPDATE tournaments SET name=?, sport=?, status=?, start_date=? WHERE id=?")
      .run(name, sport, status, start_date, t.id);
    res.json(db.prepare("SELECT * FROM tournaments WHERE id = ?").get(t.id));
  });

  app.delete("/api/tournaments/:id", admin, (req, res) => {
    const t = tournamentOr404(req, res);
    if (!t) return;
    db.prepare("DELETE FROM tournaments WHERE id = ?").run(t.id);
    res.status(204).end();
  });

  // ---------- Teams & Players ----------
  app.get("/api/tournaments/:id/teams", (req, res) => {
    if (!tournamentOr404(req, res)) return;
    const teams = db.prepare("SELECT * FROM teams WHERE tournament_id = ? ORDER BY name").all(req.params.id);
    const players = db.prepare(
      "SELECT p.* FROM players p JOIN teams t ON t.id = p.team_id WHERE t.tournament_id = ? ORDER BY p.number"
    ).all(req.params.id);
    res.json(teams.map((t) => ({ ...t, players: players.filter((p) => p.team_id === t.id) })));
  });

  app.post("/api/tournaments/:id/teams", admin, (req, res) => {
    const t = tournamentOr404(req, res);
    if (!t) return;
    const { name, manager = null } = req.body;
    if (!str(name)) return fail(res, 400, "Nama tim wajib diisi");
    if (db.prepare("SELECT 1 FROM teams WHERE tournament_id = ? AND name = ?").get(t.id, name.trim()))
      return fail(res, 409, "Nama tim sudah dipakai di turnamen ini");
    const info = db.prepare("INSERT INTO teams (tournament_id, name, manager) VALUES (?, ?, ?)")
      .run(t.id, name.trim(), manager);
    res.status(201).json(db.prepare("SELECT * FROM teams WHERE id = ?").get(info.lastInsertRowid));
  });

  app.delete("/api/teams/:id", admin, (req, res) => {
    const info = db.prepare("DELETE FROM teams WHERE id = ?").run(req.params.id);
    info.changes ? res.status(204).end() : fail(res, 404, "Tim tidak ditemukan");
  });

  app.get("/api/teams/:id/players", (req, res) =>
    res.json(db.prepare("SELECT * FROM players WHERE team_id = ? ORDER BY number").all(req.params.id)));

  app.post("/api/teams/:id/players", admin, (req, res) => {
    const team = db.prepare("SELECT * FROM teams WHERE id = ?").get(req.params.id);
    if (!team) return fail(res, 404, "Tim tidak ditemukan");
    const { name, number = null } = req.body;
    if (!str(name) || (number !== null && !isInt(number))) return fail(res, 400, "Data pemain tidak valid");
    const info = db.prepare("INSERT INTO players (team_id, name, number) VALUES (?, ?, ?)")
      .run(team.id, name.trim(), number);
    res.status(201).json(db.prepare("SELECT * FROM players WHERE id = ?").get(info.lastInsertRowid));
  });

  // ---------- Matches ----------
  const matchSelect = `
    SELECT m.*, h.name AS home_team, a.name AS away_team
    FROM matches m
    JOIN teams h ON h.id = m.home_team_id
    JOIN teams a ON a.id = m.away_team_id`;

  app.get("/api/tournaments/:id/matches", (req, res) => {
    if (!tournamentOr404(req, res)) return;
    res.json(db.prepare(`${matchSelect} WHERE m.tournament_id = ? ORDER BY m.scheduled_at, m.id`).all(req.params.id));
  });

  app.post("/api/tournaments/:id/matches", admin, (req, res) => {
    const t = tournamentOr404(req, res);
    if (!t) return;
    const { home_team_id, away_team_id, scheduled_at = null } = req.body;
    if (!Number.isInteger(home_team_id) || !Number.isInteger(away_team_id))
      return fail(res, 400, "Tim home dan away wajib dipilih");
    if (home_team_id === away_team_id) return fail(res, 400, "Tim home dan away tidak boleh sama");
    const ok = db.prepare("SELECT COUNT(*) AS c FROM teams WHERE tournament_id = ? AND id IN (?, ?)")
      .get(t.id, home_team_id, away_team_id).c;
    if (ok !== 2) return fail(res, 400, "Tim harus terdaftar di turnamen ini");
    const info = db.prepare(
      "INSERT INTO matches (tournament_id, home_team_id, away_team_id, scheduled_at) VALUES (?, ?, ?, ?)"
    ).run(t.id, home_team_id, away_team_id, scheduled_at);
    res.status(201).json(db.prepare(`${matchSelect} WHERE m.id = ?`).get(info.lastInsertRowid));
  });

  app.put("/api/matches/:id", admin, (req, res) => {
    const m = db.prepare("SELECT * FROM matches WHERE id = ?").get(req.params.id);
    if (!m) return fail(res, 404, "Pertandingan tidak ditemukan");
    const { home_score, away_score, scheduled_at = m.scheduled_at } = req.body;
    if (!isInt(home_score) || !isInt(away_score)) return fail(res, 400, "Skor harus bilangan bulat >= 0");
    db.prepare("UPDATE matches SET home_score=?, away_score=?, scheduled_at=?, status='finished' WHERE id=?")
      .run(home_score, away_score, scheduled_at, m.id);
    res.json(db.prepare(`${matchSelect} WHERE m.id = ?`).get(m.id));
  });

  app.delete("/api/matches/:id", admin, (req, res) => {
    const info = db.prepare("DELETE FROM matches WHERE id = ?").run(req.params.id);
    info.changes ? res.status(204).end() : fail(res, 404, "Pertandingan tidak ditemukan");
  });

  // ---------- Ringkasan untuk beranda ----------
  app.get("/api/overview", (_req, res) => {
    const tournaments = db.prepare(
      "SELECT * FROM tournaments ORDER BY CASE status WHEN 'ongoing' THEN 0 WHEN 'upcoming' THEN 1 ELSE 2 END, id DESC"
    ).all().map((t) => {
      const teams = db.prepare("SELECT * FROM teams WHERE tournament_id = ?").all(t.id);
      const matches = db.prepare("SELECT * FROM matches WHERE tournament_id = ?").all(t.id);
      const done = matches.filter((m) => m.status === "finished").length;
      const top = computeStandings(teams, matches)[0];
      return {
        ...t,
        team_count: teams.length,
        matches_total: matches.length,
        matches_done: done,
        leader: done && top ? { team: top.team, points: top.points } : null,
      };
    });
    const base = `SELECT m.*, h.name AS home_team, a.name AS away_team, t.name AS tournament
      FROM matches m JOIN teams h ON h.id = m.home_team_id JOIN teams a ON a.id = m.away_team_id
      JOIN tournaments t ON t.id = m.tournament_id`;
    const recent = db.prepare(`${base} WHERE m.status = 'finished' ORDER BY m.scheduled_at DESC, m.id DESC LIMIT 5`).all();
    const now = new Date().toISOString().slice(0, 16);
    const upcoming = db.prepare(
      `${base} WHERE m.status = 'scheduled' AND m.scheduled_at >= ? ORDER BY m.scheduled_at ASC LIMIT 3`
    ).all(now);
    res.json({ tournaments, recent, upcoming });
  });

  // ---------- Standings ----------
  app.get("/api/tournaments/:id/standings", (req, res) => {
    const t = tournamentOr404(req, res);
    if (!t) return;
    const teams = db.prepare("SELECT * FROM teams WHERE tournament_id = ?").all(t.id);
    const matches = db.prepare("SELECT * FROM matches WHERE tournament_id = ?").all(t.id);
    res.json(computeStandings(teams, matches));
  });

  if (staticDir && fs.existsSync(path.join(staticDir, "index.html"))) {
    app.use(express.static(staticDir));
    app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(staticDir, "index.html")));
  }

  return app;
}
