import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test-utils";
import RegisterPage from "./RegisterPage";
import LoginPage from "./LoginPage";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) } }));
const ok = (data = {}) => ({ ok: true, status: 200, json: async () => data });
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

describe("RegisterPage", () => {
  const fill = async () => {
    await userEvent.type(screen.getByLabelText("Nama"), "Dina");
    await userEvent.type(screen.getByLabelText("Email"), "d@x.id");
    await userEvent.type(screen.getByLabelText(/Password/), "password1");
  };
  it("mahasiswa mendaftar tanpa kode panitia", async () => {
    const f = vi.fn().mockResolvedValue(ok({ id: 1 }));
    vi.stubGlobal("fetch", f);
    renderWithProviders(<RegisterPage />);
    expect(screen.queryByLabelText("Kode panitia")).not.toBeInTheDocument();
    await fill();
    await userEvent.click(screen.getByRole("button", { name: "Daftar" }));
    await waitFor(() => expect(f).toHaveBeenCalled());
    expect(JSON.parse(f.mock.calls[0][1].body)).toMatchObject({ role: "viewer", email: "d@x.id" });
  });
  it("panitia wajib mengisi kode panitia", async () => {
    const f = vi.fn().mockResolvedValue(ok({ id: 2 }));
    vi.stubGlobal("fetch", f);
    renderWithProviders(<RegisterPage />);
    await userEvent.selectOptions(screen.getByLabelText("Daftar sebagai"), "admin");
    await userEvent.type(screen.getByLabelText(/Kode panitia/), "rahasia");
    await fill();
    await userEvent.click(screen.getByRole("button", { name: "Daftar" }));
    await waitFor(() => expect(f).toHaveBeenCalled());
    expect(JSON.parse(f.mock.calls[0][1].body)).toMatchObject({ role: "admin", panitia_code: "rahasia" });
  });
  it("menampilkan error dari server", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({ message: "Kode panitia salah" }) }));
    renderWithProviders(<RegisterPage />);
    await fill();
    await userEvent.click(screen.getByRole("button", { name: "Daftar" }));
    const Swal = (await import("sweetalert2")).default;
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ text: "Kode panitia salah" })));
  });
});

describe("LoginPage", () => {
  it("login menyimpan sesi", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok({ token: "t", user: { id: 1, name: "A", role: "viewer" } })));
    const { store } = renderWithProviders(<LoginPage />);
    await userEvent.type(screen.getByLabelText("Email"), "a@x.id");
    await userEvent.type(screen.getByLabelText("Password"), "password1");
    await userEvent.click(screen.getByRole("button", { name: "Masuk" }));
    await waitFor(() => expect(store.getState().auth.user.name).toBe("A"));
  });
});
