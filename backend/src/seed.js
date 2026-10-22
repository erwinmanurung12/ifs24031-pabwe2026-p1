// Data contoh supaya aplikasi tidak kosong saat pertama dijalankan.
// Hanya diisi bila tabel turnamen masih kosong. Ganti dengan data asli BEM bila perlu.
const FIRST = ["Andi", "Budi", "Citra", "Dimas", "Eko", "Fajar", "Gilang", "Hendra", "Indra", "Joko", "Kevin", "Lukas"];
const LAST = ["Pratama", "Simanjuntak", "Siregar", "Manurung", "Sitompul", "Hutapea", "Nainggolan", "Pasaribu", "Tambunan", "Silalahi"];

const iso = (days, hour = 15) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
};

const pairs = (ids) => ids.flatMap((a, i) => ids.slice(i + 1).map((b) => [a, b]));

const DATA = [
  {
    name: "Pekan Olahraga IT Del 2026", sport: "Futsal", status: "ongoing", start: -14,
    teams: ["Informatika", "Sistem Informasi", "Teknik Elektro", "Bioproses", "Manajemen Rekayasa", "TRPL"],
    scores: [[3, 1], [2, 2], [0, 1], [4, 2], [1, 1], [2, 0], [3, 3], [1, 0], [2, 1]],
  },
  {
    name: "Liga Voli Antar-Angkatan 2026", sport: "Voli", status: "ongoing", start: -7,
    teams: ["Angkatan 2022", "Angkatan 2023", "Angkatan 2024", "Angkatan 2025"],
    scores: [[3, 1], [3, 2], [1, 3], [3, 0]],
  },
  {
    name: "Turnamen Badminton Dies Natalis", sport: "Badminton", status: "upcoming", start: 10,
    teams: ["Tim Putra A", "Tim Putra B", "Tim Putri A", "Tim Putri B"],
    scores: [],
  },
];

export function seedDemo(db) {
  if (db.prepare("SELECT COUNT(*) AS c FROM tournaments").get().c > 0) return false;
  const insT = db.prepare("INSERT INTO tournaments (name, sport, status, start_date) VALUES (?, ?, ?, ?)");
  const insTeam = db.prepare("INSERT INTO teams (tournament_id, name, manager) VALUES (?, ?, ?)");
  const insPlayer = db.prepare("INSERT INTO players (team_id, name, number) VALUES (?, ?, ?)");
  const insMatch = db.prepare(
    "INSERT INTO matches (tournament_id, home_team_id, away_team_id, scheduled_at, home_score, away_score, status) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  db.exec("BEGIN");
  try {
    DATA.forEach((t, ti) => {
      const tid = insT.run(t.name, t.sport, t.status, iso(t.start).slice(0, 10)).lastInsertRowid;
      const ids = t.teams.map((name, i) => {
        const id = insTeam.run(tid, name, `${FIRST[(ti + i) % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`).lastInsertRowid;
        for (let j = 0; j < 5; j++) {
          insPlayer.run(id, `${FIRST[(i * 2 + j + ti) % FIRST.length]} ${LAST[(i * 3 + j * 2) % LAST.length]}`, j + 1);
        }
        return id;
      });
      pairs(ids).slice(0, t.scores.length + 3).forEach(([h, a], k) => {
        const score = t.scores[k];
        insMatch.run(tid, h, a, iso(score ? k - t.scores.length : k + 1, 13 + (k % 3) * 2),
          score ? score[0] : null, score ? score[1] : null, score ? "finished" : "scheduled");
      });
    });
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return true;
}
