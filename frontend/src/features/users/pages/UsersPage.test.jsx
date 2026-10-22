import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test-utils";
import UsersPage from "./UsersPage";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) } }));

const admin = { auth: { user: { id: 1, name: "Admin", role: "admin" }, loading: false } };
const stub = (map) => vi.stubGlobal("fetch", vi.fn(async (url, o = {}) => {
  const key = `${o.method || "GET"} ${url.replace(/^.*\/api/, "")}`;
  return { ok: true, status: key.startsWith("DELETE") ? 204 : 200, json: async () => map[key] ?? {} };
}));
afterEach(() => vi.unstubAllGlobals());

describe("UsersPage", () => {
  it("menolak pengunjung tanpa akun", () => {
    renderWithProviders(<UsersPage />);
    expect(screen.getByText(/khusus panitia/)).toBeInTheDocument();
  });
  it("admin melihat, membuat, dan menghapus akun", async () => {
    stub({ "GET /users": [{ id: 1, name: "Admin", email: "a@x.id" }, { id: 2, name: "Budi", email: "b@x.id" }] });
    renderWithProviders(<UsersPage />, { state: admin });
    expect(await screen.findByText("Budi")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Nama"), "Citra");
    await userEvent.type(screen.getByLabelText("Email"), "c@x.id");
    await userEvent.type(screen.getByLabelText(/Password/), "password1");
    await userEvent.click(screen.getByRole("button", { name: "Buat akun" }));
    await waitFor(() => expect(fetch.mock.calls.some(([u, o]) => u.endsWith("/users") && o.method === "POST")).toBe(true));
    await userEvent.click(screen.getByRole("button", { name: "Hapus" }));
    await waitFor(() => expect(fetch.mock.calls.some(([u, o]) => u.endsWith("/users/2") && o.method === "DELETE")).toBe(true));
  });
});
