import { afterEach, describe, expect, it, vi } from "vitest";
import { api, clearSession, getToken, getUser, setSession } from "./apiHelper";

afterEach(() => { vi.restoreAllMocks(); clearSession(); });

describe("apiHelper", () => {
  it("menyimpan dan menghapus sesi", () => {
    setSession("tok", { name: "A" });
    expect(getToken()).toBe("tok");
    expect(getUser()).toEqual({ name: "A" });
    clearSession();
    expect(getToken()).toBeNull();
    localStorage.setItem("user", "{rusak");
    expect(getUser()).toBeNull();
  });
  it("mengirim header Authorization dan mengembalikan JSON", async () => {
    setSession("tok", {});
    const f = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ a: 1 }) });
    vi.stubGlobal("fetch", f);
    expect(await api("/x", { method: "POST", body: { b: 2 } })).toEqual({ a: 1 });
    expect(f.mock.calls[0][1].headers.Authorization).toBe("Bearer tok");
  });
  it("sesi berakhir: 401 menghapus sesi dan memicu event", async () => {
    setSession("tok", { name: "A" });
    const onExpired = vi.fn(); window.addEventListener("auth:expired", onExpired);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ message: "Token tidak valid" }) }));
    await expect(api("/x")).rejects.toThrow("Sesi berakhir");
    expect(getToken()).toBeNull();
    expect(onExpired).toHaveBeenCalled();
    window.removeEventListener("auth:expired", onExpired);
  });
  it("menangani 204 dan error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: true, status: 204 }));
    expect(await api("/x")).toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ message: "Salah" }) }));
    await expect(api("/x")).rejects.toThrow("Salah");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch")));
    await expect(api("/x")).rejects.toThrow("Tidak dapat terhubung ke server");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false, status: 500, json: async () => { throw new Error(); } }));
    await expect(api("/x")).rejects.toThrow("Tidak dapat terhubung ke server");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({}) }));
    await expect(api("/x")).rejects.toThrow("Terjadi kesalahan pada server");
  });
});
