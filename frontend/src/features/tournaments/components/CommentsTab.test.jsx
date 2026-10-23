import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test-utils";
import CommentsTab from "./CommentsTab";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) } }));
afterEach(() => vi.unstubAllGlobals());

const comments = [
  { id: 1, user_id: 2, author: "Dina", author_role: "viewer", body: "Semangat tim IF!", created_at: "2026-10-22T10:00:00Z" },
  { id: 2, user_id: 1, author: "Admin", author_role: "admin", body: "Jadwal besok", created_at: "2026-10-22T11:00:00Z" },
];
const stub = (list) => {
  const f = vi.fn(async (url, o = {}) => ({ ok: true, status: o.method === "DELETE" ? 204 : 200, json: async () => (o.method && o.method !== "GET" ? {} : list) }));
  vi.stubGlobal("fetch", f); return f;
};
const as = (user) => ({ auth: { user, loading: false } });

describe("CommentsTab", () => {
  it("mahasiswa dapat menulis komentar dan hanya menghapus miliknya", async () => {
    const f = stub(comments);
    renderWithProviders(<CommentsTab tournamentId="1" />, { state: as({ id: 2, name: "Dina", role: "viewer" }) });
    expect(await screen.findByText("Semangat tim IF!")).toBeInTheDocument();
    expect(screen.getByText("Panitia")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Hapus" })).toHaveLength(1);
    await userEvent.type(screen.getByLabelText("Tulis komentar"), "Mantap");
    await userEvent.click(screen.getByRole("button", { name: "Kirim komentar" }));
    await waitFor(() => expect(f.mock.calls.some(([u, o]) => u.endsWith("/tournaments/1/comments") && o.method === "POST")).toBe(true));
    await userEvent.click(screen.getByRole("button", { name: "Hapus" }));
    await waitFor(() => expect(f.mock.calls.some(([u, o]) => u.endsWith("/comments/1") && o.method === "DELETE")).toBe(true));
  });
  it("panitia dapat menghapus semua komentar; keadaan kosong ditangani", async () => {
    stub(comments);
    const { unmount } = renderWithProviders(<CommentsTab tournamentId="1" />, { state: as({ id: 1, name: "Admin", role: "admin" }) });
    expect(await screen.findAllByRole("button", { name: "Hapus" })).toHaveLength(2);
    unmount();
    stub([]);
    renderWithProviders(<CommentsTab tournamentId="1" />, { state: as({ id: 3, name: "X", role: "viewer" }) });
    expect(await screen.findByText(/Belum ada komentar/)).toBeInTheDocument();
  });
});
