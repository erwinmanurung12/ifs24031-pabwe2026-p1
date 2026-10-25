export default function StandingsTable({ rows }) {
  if (!rows.length) return <p className="py-6">Klasemen muncul setelah tim terdaftar dan pertandingan selesai.</p>;
  return (
    <div className="overflow-x-auto bg-pitch text-white on-dark">
      <table className="w-full text-left">
        <caption className="sr-only">Klasemen turnamen</caption>
        <thead className="text-sm text-white/70">
          <tr>
            <th className="p-3">#</th><th className="p-3">Tim</th>
            <th className="p-3 text-right" title="Main">M</th><th className="p-3 text-right" title="Menang">Mn</th>
            <th className="p-3 text-right" title="Seri">S</th><th className="p-3 text-right" title="Kalah">K</th>
            <th className="p-3 text-right" title="Selisih gol">SG</th><th className="p-3 text-right">Poin</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.team_id} className="border-t border-white/15">
              <td className={`p-3 font-display text-2xl ${r.rank === 1 ? "text-bib" : ""}`}>{r.rank}</td>
              <td className="p-3 font-semibold">{r.team}</td>
              <td className="p-3 text-right">{r.played}</td><td className="p-3 text-right">{r.won}</td>
              <td className="p-3 text-right">{r.drawn}</td><td className="p-3 text-right">{r.lost}</td>
              <td className="p-3 text-right">{r.gd}</td>
              <td className="p-3 text-right font-display text-2xl font-bold">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
