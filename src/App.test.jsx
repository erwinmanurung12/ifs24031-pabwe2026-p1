import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { makeStore } from "./store";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) } }));
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

const setup = (route, user) => {
  const store = makeStore(user ? { auth: { user, loading: false } } : undefined);
  render(<Provider store={store}><MemoryRouter initialEntries={[route]}><App /></MemoryRouter></Provider>);
  return store;
};

describe("App", () => {
  it("pengunjung tanpa akun hanya melihat halaman sambutan", () => {
    const f = vi.fn(); vi.stubGlobal("fetch", f);
    setup("/");
    expect(screen.getByRole("heading", { name: /Skor, jadwal/ })).toBeInTheDocument();
    expect(screen.getAllByText("Daftar").length).toBeGreaterThan(0);
    expect(f).not.toHaveBeenCalled();
  });
  it("detail turnamen tanpa login diarahkan ke halaman masuk", () => {
    setup("/tournaments/1");
    expect(screen.getByRole("heading", { name: "Masuk" })).toBeInTheDocument();
  });
  it("mahasiswa yang sudah masuk melihat data, tanpa menu panitia", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ tournaments: [], recent: [], upcoming: [] }) }));
    setup("/", { id: 2, name: "Dina", role: "viewer" });
    expect(await screen.findByText("Turnamen")).toBeInTheDocument();
    expect(screen.getByText(/mahasiswa/)).toBeInTheDocument();
    expect(screen.queryByText("Akun panitia")).not.toBeInTheDocument();
  });
  it("sesi berakhir mengeluarkan pengguna ke halaman masuk", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ tournaments: [], recent: [], upcoming: [] }) }));
    const store = setup("/", { id: 2, name: "Dina", role: "viewer" });
    window.dispatchEvent(new Event("auth:expired"));
    await waitFor(() => expect(store.getState().auth.user).toBeNull());
    expect(await screen.findByRole("heading", { name: "Masuk" })).toBeInTheDocument();
  });
  it("keluar mengarahkan ke halaman masuk", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ tournaments: [], recent: [], upcoming: [] }) }));
    setup("/", { id: 1, name: "Admin", role: "admin" });
    await userEvent.click(await screen.findByRole("button", { name: "Keluar" }));
    expect(await screen.findByRole("heading", { name: "Masuk" })).toBeInTheDocument();
  });
});
