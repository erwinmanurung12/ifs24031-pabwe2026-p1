import { useDispatch, useSelector } from "react-redux";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../../auth/states/slice";

export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  return (
    <>
      <header className="bg-pitch-deep text-white on-dark">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl font-bold tracking-wide">DelLiga</Link>
          <nav className="flex items-center gap-4 text-sm">
            {user ? (
              <>
                {user.role === "admin" && <Link to="/panitia" className="underline">Akun panitia</Link>}
                <span>{user.name} <span className="text-white/60">({user.role === "admin" ? "panitia" : "mahasiswa"})</span></span>
                <button onClick={() => { dispatch(logout()); navigate("/auth/login"); }} className="underline">Keluar</button>
              </>
            ) : (
              <>
                <Link to="/auth/login" className="underline">Masuk</Link>
                <Link to="/auth/register" className="bg-bib text-ink px-3 py-1 font-semibold">Daftar</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8"><Outlet /></main>
    </>
  );
}
