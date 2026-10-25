const BASE = import.meta.env.VITE_API_URL || "/api";

const NETWORK_MSG = "Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.";

export const getToken = () => localStorage.getItem("token");
export const getUser = () => {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
};
export const setSession = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};
export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error(NETWORK_MSG);
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) {
    clearSession();
    window.dispatchEvent(new Event("auth:expired"));
    throw new Error("Sesi berakhir. Silakan masuk kembali.");
  }
  if (!res.ok) {
    // Proxy dev mengembalikan 5xx tanpa pesan bila backend mati
    if (!data.message && res.status >= 500) throw new Error(NETWORK_MSG);
    throw new Error(data.message || "Terjadi kesalahan pada server");
  }
  return data;
}
