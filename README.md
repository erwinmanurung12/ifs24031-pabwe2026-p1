# DelLiga

Sistem manajemen turnamen olahraga kampus (Proyek 1 PABWE).
Membutuhkan Node.js 22.13 atau lebih baru (SQLite memakai modul bawaan `node:sqlite`, tanpa kompilasi).
Satu repository dengan dua folder: `backend/` (Express.js + SQLite) dan `frontend/` (ReactJS + Vite).

## Pengembangan lokal
```
npm install
npm run install:all
npm run dev
```
Buka http://localhost:3000 (backend di port 8000, `/api` diteruskan otomatis).

## Satu server, satu URL (produksi)
```
npm run install:all
npm run build
npm start
```
Buka http://localhost:8000. Express melayani API dan hasil build React sekaligus.

## Deploy (Render, satu layanan)
- Build Command: `npm run install:all && npm run build`
- Start Command: `npm start`
- Environment: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `PANITIA_CODE`, `NODE_VERSION=22`

## Peran pengguna
- **Mahasiswa/peserta** (viewer): daftar sendiri, lalu dapat melihat jadwal, skor, klasemen, dan berkomentar.
- **Panitia BEM Olahraga** (admin): mengelola turnamen, tim, pemain, jadwal, skor, dan akun. Daftar sebagai panitia butuh `PANITIA_CODE` (diatur di environment backend).
- Tanpa akun, pengunjung hanya melihat halaman sambutan.

## Akun panitia bawaan
`admin@delliga.test` / `admin12345` (ubah lewat environment). Data contoh dibuat otomatis saat database kosong.

## Pengujian
`npm test`
