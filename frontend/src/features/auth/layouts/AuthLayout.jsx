import { Link, Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <main className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-display text-3xl font-bold text-pitch">DelLiga</Link>
        <div className="mt-4 bg-white border border-line p-6"><Outlet /></div>
      </div>
    </main>
  );
}
