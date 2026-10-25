import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Swal from "sweetalert2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "./test-utils";
import LoginPage from "./features/auth/pages/LoginPage";
import CommentsTab from "./features/tournaments/components/CommentsTab";
import MatchList from "./features/tournaments/components/MatchList";
import StandingsTable from "./features/tournaments/components/StandingsTable";
import DetailPage from "./features/tournaments/pages/DetailPage";
import HomePage from "./features/tournaments/pages/HomePage";
import UsersPage from "./features/users/pages/UsersPage";
import { formatDate, showConfirm, showError, showSuccess } from "./helpers/toolsHelper";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) } }));

const admin = { auth: { user: { id: 1, name: "Admin", role: "admin" }, loading: false } };
const viewer = { auth: { user: { id: 2, name: "Dina", role: "viewer" }, loading: false } };

// Semua permintaan berhasil kecuali kunci "METHOD /path" yang ada di `failing`.
const stub = (data = {}, failing = []) => {
  const f = vi.fn(async (url, o = {}) => {
    const key = `${o.method || "GET"} ${url.replace(/^.*\/api/, "")}`;
    if (failing.includes(key)) return { ok: false, status: 400, json: async () => ({ message: "Ditolak server" }) };
    return { ok: true, status: o.method === "DELETE" ? 204 : 200, json: async () => data[key] ?? {} };
  });
  vi.stubGlobal("fetch", f);
  return f;
};
const called = (f, method, suffix) => f.mock.calls.some(([u, o = {}]) => u.endsWith(suffix) && (o.method || "GET") === method);
const ERROR_DIALOG = expect.objectContaining({ icon: "error", text: "Ditolak server" });

beforeEach(() => Swal.fire.mockClear());
afterEach(() => vi.unstubAllGlobals());

describe("LoginPage", () => {
  it("menampilkan pesan bila login gagal", async () => {
    stub({}, ["POST /auth/login"]);
    renderWithProviders(<LoginPage />);
    await userEvent.type(screen.getByLabelText("Email"), "a@x.id");
    await userEvent.type(screen.getByLabelText("Password"), "salah-salah");
    await userEvent.click(screen.getByRole("button", { name: "Masuk" }));
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(ERROR_DIALOG));
  });
});

describe("CommentsTab", () => {
  it("menampilkan pesan bila komentar gagal dikirim", async () => {
    stub({ "GET /tournaments/1/comments": [] }, ["POST /tournaments/1/comments"]);
    renderWithProviders(<CommentsTab tournamentId="1" />, { state: viewer });
    await userEvent.type(await screen.findByLabelText("Tulis komentar"), "Halo");
    await userEvent.click(screen.getByRole("button", { name: "Kirim komentar" }));
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(ERROR_DIALOG));
  });
});

describe("UsersPage", () => {
  it("menampilkan pesan bila membuat atau menghapus akun gagal", async () => {
    stub(
      { "GET /users": [{ id: 1, name: "Admin", email: "a@x.id" }, { id: 2, name: "Budi", email: "b@x.id" }] },
      ["POST /users", "DELETE /users/2"],
    );
    renderWithProviders(<UsersPage />, { state: admin });
    await screen.findByText("Budi");
    await userEvent.type(screen.getByLabelText("Nama"), "Citra");
    await userEvent.type(screen.getByLabelText("Email"), "c@x.id");
    await userEvent.type(screen.getByLabelText(/Password/), "password1");
    await userEvent.click(screen.getByRole("button", { name: "Buat akun" }));
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(ERROR_DIALOG));
    Swal.fire.mockClear();
    await userEvent.click(screen.getByRole("button", { name: "Hapus" }));
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(ERROR_DIALOG));
  });
});

describe("HomePage (panitia)", () => {
  const overview = { "GET /overview": { tournaments: [], recent: [], upcoming: [] } };
  it("panitia dapat membuat turnamen", async () => {
    const f = stub(overview);
    renderWithProviders(<HomePage />, { state: admin });
    await userEvent.type(await screen.findByLabelText("Nama turnamen"), "Liga Baru");
    await userEvent.selectOptions(screen.getByLabelText("Cabang"), "Voli");
    await userEvent.type(screen.getByLabelText("Tanggal mulai"), "2026-11-01");
    await userEvent.click(screen.getByRole("button", { name: "Buat turnamen" }));
    await waitFor(() => expect(called(f, "POST", "/tournaments")).toBe(true));
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "success" })));
  });
  it("menampilkan pesan bila pembuatan turnamen gagal", async () => {
    stub(overview, ["POST /tournaments"]);
    renderWithProviders(<HomePage />, { state: admin });
    await userEvent.type(await screen.findByLabelText("Nama turnamen"), "Liga Baru");
    await userEvent.click(screen.getByRole("button", { name: "Buat turnamen" }));
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(ERROR_DIALOG));
  });
});

describe("DetailPage (panitia)", () => {
  const data = {
    "GET /tournaments/1": { id: 1, name: "Pekan Olahraga", sport: "Futsal", status: "ongoing" },
    "GET /tournaments/1/teams": [{ id: 1, name: "IF", players: [] }, { id: 2, name: "SI", players: [] }],
    "GET /tournaments/1/matches": [],
    "GET /tournaments/1/standings": [],
  };
  const open = (f = stub(data)) => {
    renderWithProviders(<DetailPage />, { route: "/tournaments/1", path: "/tournaments/:id", state: admin });
    return f;
  };

  it("panitia dapat menjadwalkan pertandingan", async () => {
    const f = open();
    await userEvent.click(await screen.findByRole("tab", { name: "Jadwal dan hasil" }));
    await userEvent.selectOptions(screen.getByLabelText("Tim tuan rumah"), "1");
    await userEvent.selectOptions(screen.getByLabelText("Tim tamu"), "2");
    await userEvent.click(screen.getByRole("button", { name: "Jadwalkan" }));
    await waitFor(() => expect(called(f, "POST", "/tournaments/1/matches")).toBe(true));
  });

  it("menampilkan pesan bila perubahan status gagal", async () => {
    open(stub(data, ["PUT /tournaments/1"]));
    await userEvent.selectOptions(await screen.findByLabelText("Status turnamen"), "finished");
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(ERROR_DIALOG));
  });

  it("menampilkan pemain tanpa nomor dan menambah pemain bernomor", async () => {
    const f = open(stub({
      ...data,
      "GET /tournaments/1/teams": [{ id: 1, name: "IF", players: [{ id: 7, team_id: 1, name: "Budi", number: null }] }],
    }));
    await userEvent.click(await screen.findByRole("tab", { name: "Tim" }));
    expect(screen.getByText("-")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Nama pemain IF"), "Citra");
    await userEvent.type(screen.getByLabelText("Nomor IF"), "9");
    await userEvent.click(screen.getByRole("button", { name: "Tambah" }));
    await waitFor(() => expect(called(f, "POST", "/teams/1/players")).toBe(true));
  });

  it("membuka tab komentar", async () => {
    const f = open(stub({ ...data, "GET /tournaments/1/comments": [] }));
    await userEvent.click(await screen.findByRole("tab", { name: "Komentar" }));
    await waitFor(() => expect(called(f, "GET", "/tournaments/1/comments")).toBe(true));
  });

  it("menampilkan keadaan kosong pada tab Tim dan dapat menambah tim", async () => {
    const f = open(stub({ ...data, "GET /tournaments/1/teams": [] }));
    await userEvent.click(await screen.findByRole("tab", { name: "Tim" }));
    expect(screen.getByText("Belum ada tim terdaftar.")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Nama tim"), "TRPL");
    await userEvent.click(screen.getByRole("button", { name: "Tambah tim" }));
    await waitFor(() => expect(called(f, "POST", "/tournaments/1/teams")).toBe(true));
  });
});

describe("MatchList", () => {
  const scheduled = { id: 5, home_team: "IF", away_team: "SI", status: "scheduled", home_score: null, away_score: null, scheduled_at: null };
  it("menampilkan keadaan kosong", () => {
    renderWithProviders(<MatchList matches={[]} onSave={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Belum ada pertandingan dijadwalkan.")).toBeInTheDocument();
  });
  it("panitia mengisi skor laga yang belum dimainkan", async () => {
    const onSave = vi.fn();
    renderWithProviders(<MatchList matches={[scheduled]} isAdmin onSave={onSave} onDelete={vi.fn()} />);
    expect(screen.getByText("vs")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Skor IF"), "2");
    await userEvent.type(screen.getByLabelText("Skor SI"), "1");
    await userEvent.click(screen.getByRole("button", { name: "Simpan skor" }));
    expect(onSave).toHaveBeenCalledWith(5, 2, 1);
  });
  it("tombol hapus tidak error bila onDelete tidak diberikan", async () => {
    renderWithProviders(<MatchList matches={[scheduled]} isAdmin onSave={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Hapus laga" }));
    expect(screen.getByRole("button", { name: "Hapus laga" })).toBeInTheDocument();
  });
});

describe("StandingsTable", () => {
  it("menampilkan keadaan kosong dan peringkat selain pertama", () => {
    const { unmount } = renderWithProviders(<StandingsTable rows={[]} />);
    expect(screen.getByText(/Klasemen muncul/)).toBeInTheDocument();
    unmount();
    const row = (rank, team) => ({ rank, team_id: rank, team, played: 1, won: 0, drawn: 1, lost: 0, gd: 0, points: 1 });
    renderWithProviders(<StandingsTable rows={[row(1, "IF"), row(2, "SI")]} />);
    expect(screen.getByText("SI")).toBeInTheDocument();
  });
});

describe("toolsHelper", () => {
  it("menyusun pesan error dari berbagai bentuk", () => {
    showError("teks");
    showError({ message: "dari objek" });
    showError({});
    showError();
    const texts = Swal.fire.mock.calls.map(([o]) => o.text);
    expect(texts).toEqual(["teks", "dari objek", "Terjadi kesalahan", "Terjadi kesalahan"]);
  });
  it("menampilkan notifikasi, konfirmasi, dan format tanggal", async () => {
    showSuccess("ok");
    expect(await showConfirm("Yakin?")).toBe(true);
    expect(formatDate(null)).toBe("Jadwal belum ditentukan");
    expect(formatDate("2026-10-25T10:00:00Z")).toMatch(/2026/);
  });
});
