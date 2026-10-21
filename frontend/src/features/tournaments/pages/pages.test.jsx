import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test-utils";
import HomePage from "./HomePage";
import DetailPage from "./DetailPage";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) } }));

const json = (data) => ({ ok: true, status: 200, json: async () => data });
const routes = (map) => vi.fn(async (url, opts = {}) => {
  const key = `${opts.method || "GET"} ${url.replace(/^.*\/api/, "")}`;
  return map[key] ? json(map[key]) : json({});
});
afterEach(() => vi.unstubAllGlobals());

describe("HomePage", () => {
  it("menampilkan daftar turnamen", async () => {
    vi.stubGlobal("fetch", routes({ "GET /overview": {
      tournaments: [{ id: 1, name: "Pekan Olahraga", sport: "Futsal", status: "ongoing", team_count: 6, matches_total: 9, matches_done: 4, leader: { team: "IF", points: 9 } }],
      recent: [{ id: 1, tournament_id: 1, tournament: "Pekan Olahraga", home_team: "IF", away_team: "SI", home_score: 3, away_score: 1 }],
      upcoming: [{ id: 2, tournament_id: 1, tournament: "Pekan Olahraga", home_team: "TE", away_team: "BP", scheduled_at: "2026-11-01T10:00" }],
    } }));
    renderWithProviders(<HomePage />);
    expect((await screen.findAllByText("Pekan Olahraga")).length).toBeGreaterThan(0);
    expect(screen.getByText("3 - 1")).toBeInTheDocument();
    expect(screen.getByText("Pertandingan berikutnya")).toBeInTheDocument();
    expect(screen.queryByText("Buat turnamen")).not.toBeInTheDocument();
  });
  it("menampilkan keadaan kosong", async () => {
    vi.stubGlobal("fetch", routes({ "GET /overview": { tournaments: [], recent: [], upcoming: [] } }));
    renderWithProviders(<HomePage />);
    expect(await screen.findByText(/Belum ada turnamen/)).toBeInTheDocument();
  });
});

describe("DetailPage", () => {
  const base = {
    "GET /tournaments/1": { id: 1, name: "Pekan Olahraga", sport: "Futsal", status: "ongoing" },
    "GET /tournaments/1/teams": [{ id: 1, name: "IF", manager: "Andi", players: [{ id: 1, team_id: 1, name: "Budi", number: 7 }] }, { id: 2, name: "SI" }],
    "GET /tournaments/1/matches": [{ id: 9, home_team: "IF", away_team: "SI", status: "finished", home_score: 3, away_score: 1, scheduled_at: null }],
    "GET /tournaments/1/standings": [{ rank: 1, team_id: 1, team: "IF", played: 1, won: 1, drawn: 0, lost: 0, gd: 2, points: 3 }],
  };
  it("menampilkan klasemen dan tab hasil", async () => {
    vi.stubGlobal("fetch", routes(base));
    renderWithProviders(<DetailPage />, { route: "/tournaments/1", path: "/tournaments/:id" });
    expect(await screen.findByRole("table")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Jadwal dan hasil" }));
    expect(screen.getByText(/3 - 1/)).toBeInTheDocument();
    expect(screen.queryByText("Jadwalkan")).not.toBeInTheDocument();
  });
  it("admin dapat menyimpan skor", async () => {
    const f = routes({ ...base, "PUT /matches/9": {} });
    vi.stubGlobal("fetch", f);
    const state = { auth: { user: { name: "A", role: "admin" }, loading: false } };
    renderWithProviders(<DetailPage />, { route: "/tournaments/1", path: "/tournaments/:id", state });
    await userEvent.click(await screen.findByRole("tab", { name: "Jadwal dan hasil" }));
    await userEvent.click(screen.getByRole("button", { name: "Ubah skor" }));
    await waitFor(() => expect(f.mock.calls.some(([u, o]) => u.endsWith("/matches/9") && o.method === "PUT")).toBe(true));
  });
  it("admin dapat mengubah status turnamen dan menghapus laga", async () => {
    const f = routes({ ...base, "PUT /tournaments/1": {}, "DELETE /matches/9": {} });
    vi.stubGlobal("fetch", f);
    const state = { auth: { user: { name: "A", role: "admin" }, loading: false } };
    renderWithProviders(<DetailPage />, { route: "/tournaments/1", path: "/tournaments/:id", state });
    await userEvent.selectOptions(await screen.findByLabelText("Status turnamen"), "finished");
    await waitFor(() => expect(f.mock.calls.some(([u, o]) => u.endsWith("/tournaments/1") && o.method === "PUT")).toBe(true));
    await userEvent.click(screen.getByRole("button", { name: "Hapus laga" }));
    await waitFor(() => expect(f.mock.calls.some(([u, o]) => u.endsWith("/matches/9") && o.method === "DELETE")).toBe(true));
  });
  it("admin melihat daftar pemain dan dapat menambah pemain", async () => {
    const f = routes({ ...base, "POST /teams/1/players": {} });
    vi.stubGlobal("fetch", f);
    const state = { auth: { user: { name: "A", role: "admin" }, loading: false } };
    renderWithProviders(<DetailPage />, { route: "/tournaments/1", path: "/tournaments/:id", state });
    await userEvent.click(await screen.findByRole("tab", { name: "Tim" }));
    expect(screen.getByText("Budi")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Nama pemain IF"), "Citra");
    await userEvent.click(screen.getAllByRole("button", { name: "Tambah" })[0]);
    await waitFor(() => expect(f.mock.calls.some(([u, o]) => u.endsWith("/teams/1/players") && o.method === "POST")).toBe(true));
  });
  it("menampilkan pesan bila turnamen tidak ada", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404, json: async () => ({ message: "x" }) })));
    renderWithProviders(<DetailPage />, { route: "/tournaments/5", path: "/tournaments/:id" });
    expect(await screen.findByText("Turnamen tidak ditemukan.")).toBeInTheDocument();
  });
});
