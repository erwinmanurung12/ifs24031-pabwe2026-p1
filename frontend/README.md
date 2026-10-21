# DelLiga Frontend

Antarmuka React (Vite) untuk DelLiga. Membutuhkan backend DelLiga yang sedang berjalan.

## Menjalankan (pengembangan)
```
npm install
npm run dev      # http://localhost:3000
```
Secara bawaan permintaan `/api` diteruskan ke backend di `http://localhost:8000`.

## Build untuk deploy
Isi alamat backend yang sudah online lewat `.env`, lalu build:
```
VITE_API_URL=https://alamat-backend-kamu/api
npm run build    # hasil di folder dist/
```
## Pengujian
`npm test` atau `npm run test:coverage`
