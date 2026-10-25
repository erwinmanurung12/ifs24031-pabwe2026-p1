import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { buildApp } from "./bootstrap.js";

const login = (app) =>
  request(app).post("/api/auth/login").send({ email: "admin@delliga.test", password: "admin12345" });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("buildApp", () => {
  it("memakai ADMIN_PASSWORD dan konfigurasi dari env", async () => {
    const app = buildApp({
      DB_PATH: ":memory:", ADMIN_PASSWORD: "admin12345", SEED_DEMO: "false",
      JWT_SECRET: "rahasia", PANITIA_CODE: "kode",
    });
    expect((await login(app)).status).toBe(200);
  });

  it("membuat password acak dan menampilkannya di log", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    buildApp({ DB_PATH: ":memory:" });
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Password admin awal"));
  });

  it("memakai process.env dan opsi staticDir bila tidak diberi argumen", async () => {
    vi.stubEnv("DB_PATH", ":memory:");
    vi.stubEnv("ADMIN_PASSWORD", "admin12345");
    vi.stubEnv("SEED_DEMO", "false");
    expect((await login(buildApp())).status).toBe(200);
    const app = buildApp(
      { DB_PATH: ":memory:", ADMIN_PASSWORD: "admin12345", SEED_DEMO: "false" },
      { staticDir: os.tmpdir() },
    );
    expect((await login(app)).status).toBe(200);
  });

  it("tidak membuat admin baru bila sudah ada di database file", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "delliga-"));
    const env = { DB_PATH: path.join(dir, "sub", "d.db"), ADMIN_PASSWORD: "admin12345", SEED_DEMO: "false" };
    buildApp(env);
    const again = buildApp(env);
    expect((await login(again)).status).toBe(200);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("memakai /tmp di Vercel", () => {
    fs.rmSync("/tmp/delliga.db", { force: true });
    buildApp({ VERCEL: "1", ADMIN_PASSWORD: "admin12345", SEED_DEMO: "false" });
    expect(fs.existsSync("/tmp/delliga.db")).toBe(true);
    fs.rmSync("/tmp/delliga.db", { force: true });
  });

  it("memakai ./data/delliga.db secara default", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "delliga-cwd-"));
    const cwd = process.cwd();
    process.chdir(dir);
    try {
      buildApp({ ADMIN_PASSWORD: "admin12345", SEED_DEMO: "false" });
      expect(fs.existsSync(path.join(dir, "data", "delliga.db"))).toBe(true);
    } finally {
      process.chdir(cwd);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
