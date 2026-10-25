import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import useInput from "../../../hooks/useInput";
import { showError } from "../../../helpers/toolsHelper";
import { login } from "../states/slice";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector((s) => s.auth.loading);
  const [email, onEmail] = useInput();
  const [password, onPassword] = useInput();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login({ email, password })).unwrap();
      navigate("/");
    } catch (err) {
      showError(err);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <h1 className="font-display text-2xl font-bold">Masuk</h1>
      <p className="text-sm text-ink/70">Untuk panitia BEM Olahraga dan mahasiswa. Setelah masuk, jadwal, skor, dan klasemen dapat dilihat.</p>
      <label className="grid gap-1 text-sm font-medium">Email
        <input id="username" name="username" type="email" required value={email} onChange={onEmail} className="border border-line px-3 py-2 font-normal" />
      </label>
      <label className="grid gap-1 text-sm font-medium">Password
        <input id="password" name="password" type="password" required value={password} onChange={onPassword} className="border border-line px-3 py-2 font-normal" />
      </label>
      <button id="btn-submit" type="submit" disabled={loading} className="bg-pitch text-white py-2 font-semibold disabled:opacity-60">Masuk</button>
      <p className="text-sm">Belum punya akun? <Link to="/auth/register" className="underline">Daftar</Link></p>
    </form>
  );
}
