// Hitung klasemen liga: menang 3, seri 1, kalah 0.
// Urutan: poin, selisih gol, gol masuk, nama tim.
export function computeStandings(teams, matches) {
  const table = new Map(
    teams.map((t) => [t.id, { team_id: t.id, team: t.name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }])
  );
  for (const m of matches) {
    if (m.status !== "finished") continue;
    const h = table.get(m.home_team_id);
    const a = table.get(m.away_team_id);
    if (!h || !a) continue;
    h.played++; a.played++;
    h.gf += m.home_score; h.ga += m.away_score;
    a.gf += m.away_score; a.ga += m.home_score;
    if (m.home_score > m.away_score) { h.won++; a.lost++; h.points += 3; }
    else if (m.home_score < m.away_score) { a.won++; h.lost++; a.points += 3; }
    else { h.drawn++; a.drawn++; h.points++; a.points++; }
  }
  const rows = [...table.values()].map((r) => ({ ...r, gd: r.gf - r.ga }));
  rows.sort((x, y) => y.points - x.points || y.gd - x.gd || y.gf - x.gf || x.team.localeCompare(y.team));
  return rows.map((r, i) => ({ rank: i + 1, ...r }));
}
