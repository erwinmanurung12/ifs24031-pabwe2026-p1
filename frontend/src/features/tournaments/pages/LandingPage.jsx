import { Link } from "react-router-dom";

const POINTS = [
  ["Jadwal dan skor terbaru", "Lihat pertandingan berikutnya dan hasil yang baru selesai."],
  ["Klasemen otomatis", "Poin, selisih gol, dan peringkat terhitung langsung dari skor."],
  ["Komentar", "Beri semangat atau tanya jadwal langsung di halaman turnamen."],
];

export default function LandingPage() {
  return (
    <>
      <section className="pitch-bg on-dark text-white mb-10">
        <div className="p-6 sm:p-12 max-w-2xl">
          <h1 className="font-display text-5xl sm:text-6xl font-bold leading-none">Skor, jadwal, dan klasemen turnamen kampus</h1>
          <p className="mt-4 text-white/80">
            Dikelola panitia BEM Departemen Olahraga. Daftar atau masuk untuk melihat pertandingan dan ikut berkomentar.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/auth/register" className="bg-bib text-ink px-5 py-2 font-semibold">Daftar</Link>
            <Link to="/auth/login" className="border border-white/60 px-5 py-2 font-semibold">Masuk</Link>
          </div>
        </div>
      </section>
      <ul className="grid gap-6 sm:grid-cols-3">
        {POINTS.map(([title, text]) => (
          <li key={title} className="border-t-4 border-bib pt-3">
            <h2 className="font-display text-2xl font-bold text-pitch">{title}</h2>
            <p className="text-sm text-ink/80">{text}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
