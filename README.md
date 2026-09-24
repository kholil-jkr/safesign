# SafeSign — Check your employment contract before you sign

Asisten kontrak kerja untuk pekerja migran (dan organisasi pendampingnya).

## Tiga Modul

| Modul | Untuk siapa | Butuh login? |
|---|---|---|
| **Analyzer** — cek kontrak dengan AI (10 bahasa, kamera/foto/berkas/tautan) | Pekerja | ❌ Anonim — hasil tidak disimpan |
| **Advokasi** — pencocokan lembaga, draf email AI (gerbang izin), pelacakan kasus, Kotak Masuk | Pekerja | ✅ Kasus bersifat pribadi per akun |
| **Manajemen** — registry kontrak organisasi, approval, e-signature, pengingat, laporan | Organisasi | ✅ Khusus role admin/legal/manager/staff (tersembunyi dari navigasi publik) |

### Login opsional + Mode Penyamaran
- **Tamu**: hanya Analyzer; hasil analisis langsung dibuang setelah selesai.
- **Login (email+password / Google)**: mendapat **Riwayat Kontrak** (seperti log chat AI — banyak kontrak, buka ulang, hapus), kasus advokasi pribadi, dan Kotak Masuk email.
- **Mode Penyamaran** (menu akun): analisis tetap bisa dilihat selama sesi, tetapi **dihapus permanen dari server saat Anda keluar**.
- User **pertama** yang mendaftar otomatis menjadi `admin` (bootstrap organisasi).

## Menjalankan sendiri (self-host)

```bash
# 1. Install dependensi
bun install

# 2. Salin env & isi
cp .env.example .env
#    - AUTH_SECRET  → WAJIB: openssl rand -hex 32
#    - DATABASE_URL → PostgreSQL (Neon/Supabase/lokal)
#    - CLOUDFLARE_* → token Workers AI (untuk fitur AI)

# 3. Siapkan skema database + konten dasar (direktori 34 lembaga + 6 template)
bun run db:push
bun run db:seed:base

# 4. Dev / build
bun run dev          # http://localhost:3000
bun run build && bun start
```

Database **mulai kosong** — tidak ada kontrak/kasus demo. Untuk data demo (presentasi):
`bun run db:seed:demo`. Untuk membersihkan: `bun run db:cleanup`.

### Login Google (opsional)
1. [Google Cloud Console](https://console.cloud.google.com) → Credentials → buat **OAuth Client ID** (Web).
2. Authorized redirect URI: `https://DOMAIN-ANDA/api/auth/google/callback`
3. Set `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` di env. Tombol Google muncul otomatis.

### Email otomatis (opsional)
- Set `SMTP_HOST/PORT/USER/PASS/FROM` → email advokasi terkirim nyata; **balasan lembaga masuk ke email user** (Reply-To), tercatat di Kotak Masuk.
- Tanpa SMTP → mode manual (mailto + salin draf), kasus tetap terlacak.
- Webhook balasan masuk (agar balasan tampil di aplikasi): set `EMAIL_WEBHOOK_SECRET`, arungkan penyedia email (mis. Resend Inbound) ke `POST /api/email/inbound` dengan header `x-webhook-secret`.

## Keamanan
- Password di-hash bcrypt (12 rounds); sesi JWT httpOnly (SameSite=Lax, Secure di produksi).
- Rate limit: login/daftar/ganti password/kirim email.
- Semua API Manajemen diproteksi role; kasus & riwayat terisolasi per user.
- Kunci API hanya di env server (`.env` di-gitignore; Vercel Encrypted Env).

## Deploy ke Vercel
Import repo → set env vars (lihat `.env.example`) → deploy. `postinstall` menjalankan `prisma generate` otomatis.

## Stack
Next.js 16 (App Router) · React 19 · Prisma + PostgreSQL (Neon) · Tailwind 4 · zustand · Cloudflare Workers AI · nodemailer
