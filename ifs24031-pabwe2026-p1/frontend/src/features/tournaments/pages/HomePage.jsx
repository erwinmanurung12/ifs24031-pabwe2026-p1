import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import useInput from "../../../hooks/useInput";
import { SPORTS, STATUS_LABEL, formatDate, showError, showSuccess } from "../../../helpers/toolsHelper";
import { createTournament, fetchOverview } from "../states/slice";

function CreateForm() {
  const dispatch = useDispatch();
  const [name, onName, resetName] = useInput();
  const [sport, onSport] = useInput(SPORTS[0]);
  const [startDate, onStart, resetStart] = useInput();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createTournament({ name, sport, start_date: startDate || null })).unwrap();
      await dispatch(fetchOverview());
      showSuccess("Turnamen dibuat");
      resetName(); resetStart();
    } catch (err) {
      showError(err);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_10rem_10rem_auto] items-end border border-line bg-white p-4 mb-10">
      <label className="grid gap-1 text-sm font-medium">Nama turnamen
        <input required value={name} onChange={onName} className="border border-line px-3 py-2 font-normal" />
      </label>
      <label className="grid gap-1 text-sm font-medium">Cabang
        <select value={sport} onChange={onSport} className="border border-line px-3 py-2 font-normal">
          {SPORTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">Tanggal mulai
        <input type="date" value={startDate} onChange={onStart} className="border border-line px-3 py-2 font-normal" />
      </label>
      <button className="bg-pitch text-white px-4 py-2 font-semibold">Buat turnamen</button>
    </form>
  );
}

function Hero({ next, count }) {
  return (
    <section className="pitch-bg on-dark text-white mb-10">
      <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[1.2fr_1fr] items-center">
        <div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold leading-none">Skor, jadwal, dan klasemen turnamen kampus</h1>
          <p className="mt-4 max-w-md text-white/80">
            {count ? `${count} turnamen tercatat.` : "Belum ada turnamen."} Pantau hasil terbaru tanpa menunggu rekap di grup chat.
          </p>
        </div>
        <div className="bg-pitch-deep/90 p-5 border-l-4 border-bib">
          <p className="text-sm text-white/70">Pertandingan berikutnya</p>
          {next ? (
            <Link to={`/tournaments/${next.tournament_id}`} className="block mt-2">
              <p className="font-display text-3xl font-bold leading-tight">{next.home_team} <span className="text-bib">vs</span> {next.away_team}</p>
              <p className="mt-2 text-sm text-white/80">{formatDate(next.scheduled_at)}</p>
              <p className="text-sm text-white/60">{next.tournament}</p>
            </Link>
          ) : <p className="mt-2">Belum ada jadwal mendatang.</p>}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const dispatch = useDispatch();
  const { overview, loading } = useSelector((s) => s.tournaments);
  const user = useSelector((s) => s.auth.user);
  const { tournaments, recent, upcoming } = overview;

  useEffect(() => { dispatch(fetchOverview()); }, [dispatch]);

  return (
    <>
      <Hero next={upcoming[0]} count={tournaments.length} />
      {user?.role === "admin" && <CreateForm />}
      {loading && !tournaments.length ? <p>Memuat data...</p> : null}

      {recent.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display text-3xl font-bold text-pitch mb-3">Hasil terbaru</h2>
          <ul className="divide-y divide-line border-y border-line">
            {recent.map((m) => (
              <li key={m.id}>
                <Link to={`/tournaments/${m.tournament_id}`} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-3 px-2 hover:bg-white">
                  <span className="font-display text-xl font-semibold text-right">{m.home_team}</span>
                  <span className="bg-pitch text-white font-display text-2xl font-bold px-3 py-1">{m.home_score} - {m.away_score}</span>
                  <span className="font-display text-xl font-semibold">{m.away_team}</span>
                  <span className="col-span-3 text-center text-xs text-ink/60">{m.tournament}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-display text-3xl font-bold text-pitch mb-3">Turnamen</h2>
        {!loading && !tournaments.length ? <p>Belum ada turnamen. Panitia dapat membuatnya setelah masuk.</p> : null}
        <ul className="divide-y divide-line border-y border-line">
          {tournaments.map((t) => (
            <li key={t.id}>
              <Link to={`/tournaments/${t.id}`} className="grid gap-1 sm:grid-cols-[1fr_auto] sm:items-center py-4 px-2 hover:bg-white">
                <span>
                  <span className="font-display text-2xl font-semibold">{t.name}</span>
                  <span className="block text-sm text-ink/70">
                    {t.sport} | {STATUS_LABEL[t.status]} | {t.team_count} tim | {t.matches_done} dari {t.matches_total} laga selesai
                  </span>
                </span>
                {t.leader && (
                  <span className="text-sm"><span className="text-ink/60">Pemuncak </span>
                    <span className="font-display text-xl font-bold text-pitch">{t.leader.team}</span> ({t.leader.points} poin)
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
