# DelLiga

Sistem manajemen turnamen olahraga kampus (Proyek 1 PABWE).
Membutuhkan Node.js 22.13 atau lebih baru (SQLite memakai modul bawaan `node:sqlite`, tanpa kompilasi).
Satu repository: seluruh kode ada di `src/` — frontend ReactJS + Vite di `src/`, backend Express.js + SQLite di `src/backend/`.

## Pengembangan lokal
```
npm install
npm run dev
```
Buka http://localhost:3000 (backend di port 8000, `/api` diteruskan otomatis).

## Satu server, satu URL (produksi)
```
npm install
npm run build
npm start
```
Buka http://localhost:8000. Express melayani API dan hasil build React sekaligus.

## Deploy (Render, satu layanan)
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Environment: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `PANITIA_CODE`, `NODE_VERSION=22`

## Peran pengguna
- **Mahasiswa/peserta** (viewer): daftar sendiri, lalu dapat melihat jadwal, skor, klasemen, dan berkomentar.
- **Panitia BEM Olahraga** (admin): mengelola turnamen, tim, pemain, jadwal, skor, dan akun. Daftar sebagai panitia butuh `PANITIA_CODE` (diatur di environment backend).
- Tanpa akun, pengunjung hanya melihat halaman sambutan.

## Akun panitia bawaan
`admin@delliga.test` dengan password dari `ADMIN_PASSWORD`. Kalau tidak diisi, password acak dibuat dan ditampilkan sekali di log saat akun admin pertama dibuat. Data contoh dibuat otomatis saat database kosong.

## Pengujian
`npm test`

## Deploy di Vercel (satu proyek)
- Root Directory: folder utama repo (bawaan). Framework Preset: Other.
- Pengaturan build sudah ada di `vercel.json`.
- Environment: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `PANITIA_CODE`.
- Catatan: di Vercel database SQLite berada di `/tmp` sehingga bersifat sementara dan dapat kembali ke data contoh saat instance baru dibuat.
