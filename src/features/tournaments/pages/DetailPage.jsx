import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import useInput from "../../../hooks/useInput";
import { STATUS_LABEL, showConfirm, showError, showSuccess } from "../../../helpers/toolsHelper";
import CommentsTab from "../components/CommentsTab";
import MatchList from "../components/MatchList";
import StandingsTable from "../components/StandingsTable";
import { addMatch, addPlayer, addTeam, deleteMatch, fetchDetail, saveScore, updateTournament } from "../states/slice";

function TeamBlock({ team, isAdmin, onAdd }) {
  const [name, onName, resetName] = useInput();
  const [number, onNumber, resetNumber] = useInput();
  const players = team.players ?? [];
  return (
    <section className="border border-line bg-white p-4">
      <h3 className="font-display text-2xl font-bold text-pitch">{team.name}</h3>
      {team.manager && <p className="text-sm text-ink/70 mb-2">Manajer: {team.manager}</p>}
      {players.length ? (
        <ol className="divide-y divide-line text-sm">
          {players.map((p) => (
            <li key={p.id} className="flex gap-3 py-1.5">
              <span className="w-6 font-display text-lg font-bold text-pitch">{p.number ?? "-"}</span>{p.name}
            </li>
          ))}
        </ol>
      ) : <p className="text-sm">Belum ada pemain.</p>}
      {isAdmin && (
        <form className="mt-3 flex gap-2" onSubmit={(e) => {
          e.preventDefault();
          onAdd(name, number === "" ? null : Number(number));
          resetName(); resetNumber();
        }}>
          <input aria-label={`Nama pemain ${team.name}`} required placeholder="Nama pemain" value={name} onChange={onName} className="flex-1 min-w-0 border border-line px-2 py-1 text-sm" />
          <input aria-label={`Nomor ${team.name}`} type="number" min="0" placeholder="No" value={number} onChange={onNumber} className="w-16 border border-line px-2 py-1 text-sm" />
          <button className="bg-pitch text-white px-3 py-1 text-sm font-semibold">Tambah</button>
        </form>
      )}
    </section>
  );
}

const TABS = [["standings", "Klasemen"], ["matches", "Jadwal dan hasil"], ["teams", "Tim"], ["comments", "Komentar"]];

export default function DetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current, teams, matches, standings, loading } = useSelector((s) => s.tournaments);
  const isAdmin = useSelector((s) => s.auth.user?.role) === "admin";
  const [tab, setTab] = useState(isAdmin ? "matches" : "standings");
  const [teamName, onTeamName, resetTeam] = useInput();
  const [home, onHome, resetHome] = useInput("");
  const [away, onAway, resetAway] = useInput("");
  const [when, onWhen, resetWhen] = useInput("");

  useEffect(() => { dispatch(fetchDetail(id)); }, [dispatch, id]);

  const run = async (action, message, after) => {
    try {
      await dispatch(action).unwrap();
      await dispatch(fetchDetail(id)).unwrap();
      showSuccess(message);
      after?.();
    } catch (err) {
      showError(err);
    }
  };

  const done = matches.filter((m) => m.status === "finished");
  const goals = done.reduce((n, m) => n + m.home_score + m.away_score, 0);

  if (loading && !current) return <p>Memuat turnamen...</p>;
  if (!current) return <p>Turnamen tidak ditemukan.</p>;

  return (
    <>
      <h1 className="font-display text-4xl font-bold text-pitch">{current.name}</h1>
      <p className="mb-4 text-ink/70">{current.sport} | {STATUS_LABEL[current.status]}</p>

      {isAdmin && (
        <div className="bg-bib/25 border-l-4 border-bib p-4 mb-4 text-sm grid gap-2 sm:flex sm:items-center sm:justify-between">
          <p>Mode panitia: jadwalkan pertandingan dan isi skor di tab Jadwal dan hasil, tambah tim dan pemain di tab Tim.</p>
          <label className="flex items-center gap-2 font-medium">Status turnamen{" "}
            <select value={current.status} onChange={(e) => run(updateTournament({ id, status: e.target.value }), "Status diperbarui")}
              className="border border-line bg-white px-2 py-1 font-normal">
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>
      )}

      <dl className="grid grid-cols-3 border border-line bg-white mb-6 text-center">
        {[["Tim", teams.length], ["Laga selesai", `${done.length} dari ${matches.length}`], ["Total gol", goals]].map(([k, v]) => (
          <div key={k} className="py-3 border-r border-line last:border-r-0">
            <dd className="font-display text-3xl font-bold text-pitch">{v}</dd>
            <dt className="text-sm text-ink/70">{k}</dt>
          </div>
        ))}
      </dl>

      <div role="tablist" className="flex gap-6 border-b border-line mb-6">
        {TABS.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
            className={`pb-2 font-semibold border-b-4 ${tab === key ? "border-bib" : "border-transparent text-ink/70"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "standings" && <StandingsTable rows={standings} />}

      {tab === "matches" && (
        <>
          {isAdmin && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(addMatch({ id, home_team_id: Number(home), away_team_id: Number(away), scheduled_at: when || null }),
                  "Pertandingan dijadwalkan", () => { resetHome(); resetAway(); resetWhen(); });
              }}
              className="grid gap-3 sm:grid-cols-[1fr_1fr_12rem_auto] items-end bg-white border border-line p-4 mb-6">
              <label className="grid gap-1 text-sm font-medium">Tim tuan rumah{" "}
                <select required value={home} onChange={onHome} className="border border-line px-3 py-2 font-normal">
                  <option value="">Pilih tim</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium">Tim tamu{" "}
                <select required value={away} onChange={onAway} className="border border-line px-3 py-2 font-normal">
                  <option value="">Pilih tim</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium">Waktu{" "}
                <input type="datetime-local" value={when} onChange={onWhen} className="border border-line px-3 py-2 font-normal" />
              </label>
              <button className="bg-pitch text-white px-4 py-2 font-semibold">Jadwalkan</button>
            </form>
          )}
          <MatchList matches={matches} isAdmin={isAdmin}
            onSave={(matchId, home_score, away_score) =>
              run(saveScore({ matchId, home_score, away_score }), "Skor disimpan")}
            onDelete={async (matchId) => {
              if (await showConfirm("Hapus pertandingan ini?")) run(deleteMatch(matchId), "Pertandingan dihapus");
            }} />
        </>
      )}

      {tab === "comments" && <CommentsTab tournamentId={id} />}

      {tab === "teams" && (
        <>
          {isAdmin && (
            <form
              onSubmit={(e) => { e.preventDefault(); run(addTeam({ id, name: teamName }), "Tim ditambahkan", resetTeam); }}
              className="flex gap-3 items-end bg-white border border-line p-4 mb-6">
              <label className="grid gap-1 text-sm font-medium flex-1">Nama tim{" "}
                <input required value={teamName} onChange={onTeamName} className="border border-line px-3 py-2 font-normal" />
              </label>
              <button className="bg-pitch text-white px-4 py-2 font-semibold">Tambah tim</button>
            </form>
          )}
          {teams.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {teams.map((t) => <TeamBlock key={t.id} team={t} isAdmin={isAdmin}
                onAdd={(name, number) => run(addPlayer({ teamId: t.id, name, number }), "Pemain ditambahkan")} />)}
            </div>
          ) : <p className="py-6">Belum ada tim terdaftar.</p>}
        </>
      )}
    </>
  );
}
