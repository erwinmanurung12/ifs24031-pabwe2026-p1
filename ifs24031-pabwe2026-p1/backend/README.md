# DelLiga Backend

API Express.js + SQLite untuk sistem manajemen turnamen olahraga kampus (Proyek 1 PABWE).

## Menjalankan
```
npm install
npm run dev      # http://localhost:8000
npm test         # tes + coverage
```
Tanpa `.env` pun jalan (lihat `.env.example` untuk opsi). Akun panitia pertama: `admin@delliga.test` / `admin12345`.
Data contoh dibuat otomatis saat database kosong (matikan dengan `SEED_DEMO=false`).

## Endpoint utama
- `POST /api/auth/login`, `GET /api/users/me`
- `GET|POST /api/users`, `DELETE /api/users/:id` (kelola akun panitia, khusus admin)
- `GET /api/overview`
- `GET|POST /api/tournaments`, `GET|PUT|DELETE /api/tournaments/:id`
- `GET|POST /api/tournaments/:id/teams`, `GET|POST /api/tournaments/:id/matches`, `GET /api/tournaments/:id/standings`
- `DELETE /api/teams/:id`, `GET|POST /api/teams/:id/players`
- `PUT|DELETE /api/matches/:id`

Tidak ada pendaftaran publik: akun panitia dibuat oleh admin. Mahasiswa melihat data tanpa akun. Operasi tulis hanya untuk admin (header `Authorization: Bearer <token>`).
