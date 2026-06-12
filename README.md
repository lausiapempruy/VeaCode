# VeaCode 2.0

> **The code playground that stays out of your way.**

VeaCode 2.0 adalah code playground lokal-first berbasis browser. Tulis HTML, CSS, JavaScript, JSON, dan Python — lihat hasilnya langsung. Tidak ada server, tidak ada backend, tidak ada login wajib untuk mulai.

---

## Struktur File

```
veacode/
├── images/
│   └── VeaCode.png          # Logo utama
├── config.json              # Konfigurasi app, fitur, dan konstanta
├── index.html               # Landing page
├── login.html               # Halaman login & registrasi
├── dashboard.html           # Dashboard pengguna
├── home.html                # Editor utama
├── settings.html            # Account & Security settings
├── docs.html                # Dokumentasi lengkap + FAQ + Changelog
├── tos.html                 # Terms of Service
├── style.css                # Design system bersama (semua halaman)
├── app.js                   # Logika aplikasi lengkap (semua halaman)
└── README.md                # File ini
```

---

## Cara Pakai

### Tanpa Akun
Buka `home.html` langsung di browser. Editor langsung siap dengan template HTML, CSS, dan JS. Tidak perlu login.

### Dengan Akun
1. Buka `index.html` → klik **Mulai gratis**
2. Isi username (wajib), display name & avatar (opsional)
3. Buat PIN 10 digit — **hafalkan, tidak bisa dipulihkan**
4. Setujui Terms of Service
5. Sistem menyiapkan akun dalam 10–20 detik
6. Masuk ke Dashboard → buka Editor

### Jalankan Lokal
Karena menggunakan `fetch('config.json')`, perlu web server lokal kecil. Cara termudah:

```bash
# Python
python -m http.server 8080

# Node.js (npx)
npx serve .
```

Lalu buka `http://localhost:8080` di browser.

### Deploy ke GitHub Pages
1. Push semua file ke repository GitHub
2. Pergi ke **Settings → Pages**
3. Pilih branch `main`, folder `/root`
4. Klik **Save** — site akan live di `https://username.github.io/nama-repo`

---

## Fitur

| Fitur | Keterangan |
|---|---|
| **Multi-file workspace** | HTML, CSS, JS, JSON, Python dalam satu sesi |
| **Live preview** | Render iframe saat Run diklik |
| **Inline console** | Tangkap `log`, `warn`, `error` dari JS |
| **Resizable panels** | Drag divider untuk atur lebar/tinggi panel |
| **Fullscreen preview** | Tekan ikon atau `Esc` untuk keluar |
| **Akun lokal** | Tersimpan di localStorage, tanpa server |
| **PIN 10 digit** | Hash SHA-256, tidak tersimpan plaintext |
| **Ekspor/Impor data** | Backup ke JSON, pulihkan dari JSON |
| **Glassmorphism UI** | Space Grotesk + JetBrains Mono |

---

## Keyboard Shortcuts (Editor)

| Shortcut | Aksi |
|---|---|
| `Ctrl` + `Enter` | Run preview |
| `Tab` | Indentasi 2 spasi |
| `Shift` + `Tab` | Hapus indentasi |
| `(` `[` `{` `"` `'` | Auto-close bracket |
| `Esc` | Keluar fullscreen preview |

---

## Arsitektur

VeaCode 2.0 berjalan **100% di browser**, tanpa backend:

```
Browser
├── localStorage
│   ├── vea2_user      → data akun (username, PIN hash, avatar)
│   ├── vea2_session   → sesi login aktif
│   └── vea2_activity  → log aktivitas (maks 20 entri)
├── app.js             → semua logika (auth, editor, settings, dll)
├── style.css          → design system bersama
└── config.json        → konfigurasi statis
```

Tidak ada `fetch` ke server eksternal selain:
- Google Fonts (font loading)
- CDN library yang kamu tambahkan sendiri di kode HTML

---

## Ketentuan Penting

- **Single device** — akun terikat pada satu browser di satu perangkat
- **PIN tidak bisa dipulihkan** — simpan di tempat aman
- **Membersihkan cache browser** akan menghapus semua data VeaCode
- **Python tidak dieksekusi** — ditampilkan sebagai teks preview

Lihat [Terms of Service](tos.html) dan [Dokumentasi lengkap](docs.html) untuk detail.

---

## Changelog

### v2.0.0 — 11 Juni 2026
- Full rebrand dari CodeTester → VeaCode 2.0
- Sistem akun lokal dengan PIN SHA-256
- Multi-file workspace (HTML, CSS, JS, JSON, Python)
- Dashboard, Settings, Docs, ToS
- Drag-resize panels
- Ekspor/Impor data JSON
- Space Grotesk + glassmorphism UI

### v1.0.0 — CodeTester (Archived)
- Editor HTML/CSS/JS dasar
- Preview iframe + console panel

---

**VeaCode 2.0** · Local-first · No backend · Open source
