import Swal from "sweetalert2";

const message = (e) => (typeof e === "string" ? e : e?.message || "Terjadi kesalahan");

export const showSuccess = (text) =>
  Swal.fire({ toast: true, position: "top-end", icon: "success", title: text, showConfirmButton: false, timer: 2000 });
export const showConfirm = async (text) =>
  (await Swal.fire({ icon: "warning", title: text, showCancelButton: true, confirmButtonText: "Ya, hapus", cancelButtonText: "Batal" })).isConfirmed;
export const showError = (e) => Swal.fire({ icon: "error", title: "Gagal", text: message(e) });

export const SPORTS = ["Futsal", "Sepak bola", "Voli", "Basket", "Badminton", "Tenis meja"];
export const STATUS_LABEL = { upcoming: "Akan datang", ongoing: "Berlangsung", finished: "Selesai" };

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "Jadwal belum ditentukan";
