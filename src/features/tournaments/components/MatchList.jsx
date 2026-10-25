import { formatDate } from "../../../helpers/toolsHelper";
import PropTypes from "prop-types";
import useInput from "../../../hooks/useInput";

const matchShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  home_team: PropTypes.string,
  away_team: PropTypes.string,
  home_score: PropTypes.number,
  away_score: PropTypes.number,
  status: PropTypes.string,
});

function ScoreForm({ match, onSave, onDelete }) {
  const [home, onHome] = useInput(match.home_score ?? "");
  const [away, onAway] = useInput(match.away_score ?? "");
  const submit = (e) => {
    e.preventDefault();
    onSave(match.id, Number(home), Number(away));
  };
  return (
    <form onSubmit={submit} className="flex items-center gap-2 mt-2">
      <input aria-label={`Skor ${match.home_team}`} type="number" min="0" required value={home} onChange={onHome} className="w-16 border border-line px-2 py-1" />
      <span>-</span>
      <input aria-label={`Skor ${match.away_team}`} type="number" min="0" required value={away} onChange={onAway} className="w-16 border border-line px-2 py-1" />
      <button className="bg-pitch text-white px-3 py-1 text-sm font-semibold">
        {match.status === "finished" ? "Ubah skor" : "Simpan skor"}
      </button>
      <button type="button" onClick={() => onDelete?.(match.id)} className="text-sm text-redcard underline ml-2">Hapus laga</button>
    </form>
  );
}

ScoreForm.propTypes = {
  match: matchShape.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default function MatchList({ matches, isAdmin, onSave, onDelete }) {
  if (!matches.length) return <p className="py-6">Belum ada pertandingan dijadwalkan.</p>;
  return (
    <ul className="divide-y divide-line border-y border-line">
      {matches.map((m) => (
        <li key={m.id} className="py-4">
          <p className="text-sm text-ink/70">{formatDate(m.scheduled_at)}</p>
          <p className="font-display text-xl font-semibold">
            {m.home_team}{" "}
            <span className="px-2 text-pitch">{m.status === "finished" ? `${m.home_score} - ${m.away_score}` : "vs"}</span>{" "}
            {m.away_team}
          </p>
          {isAdmin && <ScoreForm match={m} onSave={onSave} onDelete={onDelete} />}
        </li>
      ))}
    </ul>
  );
}

MatchList.propTypes = {
  matches: PropTypes.arrayOf(matchShape).isRequired,
  isAdmin: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
