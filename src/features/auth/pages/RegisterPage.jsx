import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import useInput from "../../../hooks/useInput";
import { showError, showSuccess } from "../../../helpers/toolsHelper";
import { register } from "../states/slice";

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector((s) => s.auth.loading);
  const [name, onName] = useInput();
  const [email, onEmail] = useInput();
  const [password, onPassword] = useInput();
  const [role, onRole] = useInput("viewer");
  const [code, onCode] = useInput();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const body = { name, email, password, role };
      if (role === "admin") body.panitia_code = code;
      await dispatch(register(body)).unwrap();
      showSuccess("Akun dibuat, silakan masuk");
      navigate("/auth/login");
    } catch (err) {
      showError(err);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <h1 className="font-display text-2xl font-bold">Buat akun</h1>
      <label className="grid gap-1 text-sm font-medium">Daftar sebagai
        <select value={role} onChange={onRole} className="border border-line px-3 py-2 font-normal">
          <option value="viewer">Mahasiswa atau peserta (melihat dan berkomentar)</option>
          <option value="admin">Panitia BEM Olahraga (mengelola data)</option>
        </select>
      </label>
      {role === "admin" && (
        <label className="grid gap-1 text-sm font-medium">Kode panitia
          <input required value={code} onChange={onCode} className="border border-line px-3 py-2 font-normal" />
          <span className="text-xs font-normal text-ink/70">Kode diberikan oleh ketua panitia.</span>
        </label>
      )}
      <label className="grid gap-1 text-sm font-medium">Nama
        <input required value={name} onChange={onName} className="border border-line px-3 py-2 font-normal" />
      </label>
      <label className="grid gap-1 text-sm font-medium">Email
        <input type="email" required value={email} onChange={onEmail} className="border border-line px-3 py-2 font-normal" />
      </label>
      <label className="grid gap-1 text-sm font-medium">Password (minimal 8 karakter)
        <input type="password" required minLength={8} value={password} onChange={onPassword} className="border border-line px-3 py-2 font-normal" />
      </label>
      <button disabled={loading} className="bg-pitch text-white py-2 font-semibold disabled:opacity-60">Daftar</button>
      <p className="text-sm">Sudah punya akun? <Link to="/auth/login" className="underline">Masuk</Link></p>
    </form>
  );
}
