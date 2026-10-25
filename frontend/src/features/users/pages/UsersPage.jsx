import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import useInput from "../../../hooks/useInput";
import { showConfirm, showError, showSuccess } from "../../../helpers/toolsHelper";
import { createUser, deleteUser, fetchUsers } from "../states/slice";

export default function UsersPage() {
  const dispatch = useDispatch();
  const me = useSelector((s) => s.auth.user);
  const list = useSelector((s) => s.users.list);
  const [name, onName, resetName] = useInput();
  const [email, onEmail, resetEmail] = useInput();
  const [password, onPassword, resetPassword] = useInput();

  useEffect(() => { if (me?.role === "admin") dispatch(fetchUsers()); }, [dispatch, me]);

  if (me?.role !== "admin")
    return <p>Halaman ini khusus panitia. <Link to="/auth/login" className="underline">Masuk panitia</Link></p>;

  const run = async (action, message, after) => {
    try {
      await dispatch(action).unwrap();
      await dispatch(fetchUsers()).unwrap();
      showSuccess(message);
      after?.();
    } catch (err) {
      showError(err);
    }
  };

  return (
    <>
      <h1 className="font-display text-4xl font-bold text-pitch mb-2">Akun panitia</h1>
      <p className="text-ink/70 mb-6">Hanya akun di sini yang dapat mengubah jadwal dan skor. Mahasiswa melihat data tanpa akun.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(createUser({ name, email, password }), "Akun panitia dibuat", () => { resetName(); resetEmail(); resetPassword(); });
        }}
        className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] items-end bg-white border border-line p-4 mb-8">
        <label className="grid gap-1 text-sm font-medium">Nama
          <input required value={name} onChange={onName} className="border border-line px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-1 text-sm font-medium">Email
          <input type="email" required value={email} onChange={onEmail} className="border border-line px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-1 text-sm font-medium">Password (min 8 karakter)
          <input type="password" required minLength={8} value={password} onChange={onPassword} className="border border-line px-3 py-2 font-normal" />
        </label>
        <button className="bg-pitch text-white px-4 py-2 font-semibold">Buat akun</button>
      </form>

      <ul className="divide-y divide-line border-y border-line">
        {list.map((u) => (
          <li key={u.id} className="flex items-center justify-between py-3">
            <span><span className="font-display text-xl font-semibold">{u.name}</span> <span className="text-sm text-ink/70">{u.email}</span></span>
            {u.id !== me.id && (
              <button onClick={async () => { if (await showConfirm(`Hapus akun ${u.name}?`)) run(deleteUser(u.id), "Akun dihapus"); }}
                className="text-sm text-redcard underline">Hapus</button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
