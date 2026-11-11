# Kulakan: Smart Profit & Inventory for Small F&B

<p align="center">
  <a href="https://kulakan.web.id/">
    <img src="public/images/logo.svg" alt="Kulakan Logo" width="80" height="80">
  </a>
</p>

<p align="center">
  <strong>Platform Terintegrasi Stok, Resep, HPP Otomatis, dan Restock Cerdas untuk UMKM F&B</strong>
</p>

<p align="center">
  <a href="https://kulakan.web.id/"><strong>🌐 Live Demo: https://kulakan.web.id/</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-13.x-FF2D20?style=flat&logo=laravel&logoColor=white" alt="Laravel 13">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/Inertia.js-3.x-9553E9?style=flat&logo=inertia&logoColor=white" alt="Inertia.js 3">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind CSS 4">
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL 16">
  <img src="https://img.shields.io/badge/Pest_Testing-5.x-F55247?style=flat&logo=pest&logoColor=white" alt="Pest 5">
</p>

---

**Kulakan** adalah aplikasi web modern untuk pelaku usaha mikro, kecil, dan menengah (UMKM) sektor makanan dan minuman (warung kopi, kafe, kedai makan) yang menghubungkan **resep, stok bahan baku, biaya produksi, profitabilitas menu, dan anggaran kas** dalam satu alur terpadu.

Kulakan menjawab pertanyaan kritis pemilik usaha:

> _"Dengan sisa kas Rp X, bahan baku apa yang paling mendesak dibeli tanpa bikin bangkrut?"_  
> _"Menu mana yang paling laku tapi diam-diam merugi karena harga bahan naik?"_

> 🏆 Dibangun oleh **Tim Pemburu Doksli Sertif Juara** untuk **GTNIC 2026** (_Garda Tech National Innovation Competition_), Kategori **Web Development**, Sub-tema: _Accelerating Digital Transformation for Business and SMEs_.

---

## 📑 Daftar Isi

- [Live Demo & Akses Publik](#-live-demo--akses-publik)
- [Masalah & Solusi Nyata](#-masalah--solusi-nyata)
- [Fitur & Kapabilitas Utama](#-fitur--kapabilitas-utama)
- [Peta Halaman & Rute](#-peta-halaman--rute)
- [Galeri Antarmuka (Preview Semua Halaman)](#-galeri-antarmuka-preview-semua-halaman)
- [Tech Stack](#-tech-stack)
- [Struktur Repositori](#-struktur-repositori)
- [Panduan Instalasi Lokal](#-panduan-instalasi-lokal-development)
- [Konfigurasi Environment Penting](#-konfigurasi-environment-penting)
- [Pengujian & Verifikasi Kualitas](#-pengujian--verifikasi-kualitas)
- [Tim Pengembang](#-tim-pengembang)
- [Lisensi & Hak Cipta](#-lisensi--hak-cipta)

---

## 🚀 Live Demo & Akses Publik

Aplikasi saat ini telah aktif di lingkungan semi-publik untuk keperluan demonstrasi dan pengujian:

- 🔗 **URL Live**: [https://kulakan.web.id/](https://kulakan.web.id/)
- 👥 **Akun Demo (Siap Pakai)**:

| Peran (Role) | Email               | Password   | Hak Akses Utama                                                                                               |
| :----------- | :------------------ | :--------- | :------------------------------------------------------------------------------------------------------------ |
| **Owner**    | `owner@kulakan.com` | `password` | Akses penuh: Dashboard finansial, margin menu, restock planner, resep/BOM, audit pembatalan, dan kelola staf. |
| **Staff**    | `staff@kulakan.com` | `password` | Akses operasional: POS Kasir, riwayat pesanan (antrean dapur), cetak struk, dan pencatatan waste bahan.       |

---

## 💡 Masalah & Solusi Nyata

| Masalah Klasik UMKM F&B                                                     | Solusi Cerdas Kulakan                                                                                                                               |
| :-------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Belanja pakai feeling & over-budget** sampai kas operasional habis        | **Restock Planner berbasis anggaran**: rekomendasi diprioritaskan berdasarkan urgensi stok dan proyeksi omzet, dibatasi secara ketat oleh kas riil. |
| **Stok fisik dan pencatatan tidak pernah sinkron**                          | **Recipe-to-Stock Engine**: stok bahan baku terpotong atomik saat pesanan dibuat di kasir sesuai _Bill of Materials_ (BOM) & faktor _waste_.        |
| **Menu favorit ternyata boncos** akibat lonjakan harga bahan baku diam-diam | **Smart Recipe Costing**: HPP dihitung ulang otomatis dengan metode _Weighted Average Cost_ (WAC) dan memberi peringatan saat margin menipis.       |
| **Makanan/minuman salah racik atau dibatalkan** membuat stok kacau          | **Pembedaan Void vs Waste**: fleksibilitas memulihkan stok ke rak fisik (_restored_) atau mencatatnya sebagai limbah operasional (_wasted_).        |
| **Pesanan menumpuk dan miss-komunikasi** antara kasir dan barista/kitchen   | **Kitchen Order Lifecycle**: alur status transparan (`preparing` $\rightarrow$ `ready` $\rightarrow$ `completed`) dengan live queue indicator.      |

---

## ✨ Fitur & Kapabilitas Utama

### 1. 📦 Cashflow-Aware Reorder Planner (CAP-A)

- **Simulasi Restok Berbasis Anggaran**: Masukkan saldo kas yang dialokasikan, sistem secara otomatis memilih paket bahan baku paling kritis yang harus dibeli tanpa melebihi budget.
- **Siklus Hidup Restok 4-Tahap**: Status transparan mulai dari `draft` $\rightarrow$ `approved` $\rightarrow$ `ordered` $\rightarrow$ `purchased` (atau `cancelled`).
- **Integrasi Dokumen PO (WhatsApp & Email)**: Satu klik untuk membuat Purchase Order rapi dan mengirimkannya ke kontak supplier via WhatsApp atau Email.
- **Konfirmasi Realisasi Belanja (_Receiving & Partial Fulfillment_)**: Catat kuantitas dan harga riil per bahan jika pasokan agen tidak lengkap, sehingga stok dan HPP faktual selalu presisi.

### 2. ⚡ Recipe-to-Stock Engine & Lifecycle Pesanan (CAP-B)

- **Pemotongan Stok Atomik**: Mengeliminasi kesalahan manusia dengan menghitung konsumsi bahan per porsi secara presisi tinggi.
- **Alur Operasional Dapur/Barista**:
    - `Sedang Disiapkan (preparing)`: Dapur/barista mulai meracik pesanan.
    - `Siap Diambil (ready)`: Pesanan selesai dan menunggu pelanggan di pick-up counter.
    - `Selesai (completed)`: Pesanan diserahkan ke pelanggan.
- **Logika Pembatalan: Void vs Waste**:
    - _Bahan Belum Diolah_: Stok fisik dikembalikan ke rak penyimpanan (`sale_reversal`).
    - _Bahan Terlanjur Dibuat / Tumpah_: Stok tetap terpotong dan dicatat langsung ke buku besar kerugian limbah operasional (`waste`).
- **POS Kasir Cepat & Cetak Struk**: Antarmuka kasir responsif, kalkulasi kembalian otomatis, shortcut keyboard, serta cetak struk thermal kasir (58mm/80mm).

### 3. 📊 Menu Profitability & Health Monitoring (CAP-C)

- **Klasifikasi Kesehatan Margin**: Kategori otomatis per menu:
    - 🟢 **Profitable**: Margin sehat di atas target.
    - 🟡 **Watchlist**: Margin mendekati batas kritis biaya overhead.
    - 🔴 **Loss**: Menu merugi dan butuh penyesuaian harga atau resep.
- **Matriks Profit vs Popularitas**: Membantu pemilik mengidentifikasi menu _Star_ (laku & untung tinggi) vs _Dog_ (tidak laku & margin tipis).

### 4. 🧮 Smart Recipe Costing & Integritas WAC (CAP-D)

- **Perhitungan WAC (Weighted Average Cost)**: Penyesuaian HPP bahan otomatis setiap kali ada pembelian stok baru dengan harga berbeda.
- **Presisi Moneter Mutlak**: Seluruh perhitungan HPP dan konversi bahan menggunakan ekstensi `bcmath` untuk mencegah _floating-point rounding error_.
- **Faktor Waste/Penyusutan Resep**: Memperhitungkan susut bahan (misal: ampas kopi, kulit buah, minyak terbuang) agar HPP faktual tidak _understated_.

### 5. 🛡️ Peringatan Dini Real-Time (_Smart Alerts_)

- Alert otomatis jika stok bahan berada di bawah _safety stock_ (batas minimum).
- Alert jika margin menu tergerus akibat kenaikan harga beli bahan baku terkini.

### 6. 👥 Manajemen Pengguna & Keamanan Multi-Role

- Pembatasan hak akses berbasis peran: **Owner** (manajerial & finansial) dan **Staff** (operasional & POS).
- Penambahan akun staf dilakukan terpusat oleh Owner di halaman `/pengguna` untuk mencegah registrasi publik tak sah.
- Proteksi terhadap _Sole Owner Deletion_ (mencegah sistem terkunci tanpa pemilik).
- Proteksi _Race Condition_ (_pessimistic locking_ `lockForUpdate` pada mutasi belanja & pesanan).
- Dilengkapi header keamanan standar OWASP (`X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`) dan _Rate Limiter_ pada rute mutasi.

---

## 🗺️ Peta Halaman & Rute

Seluruh halaman dirender sebagai komponen React melalui **Inertia.js** — bukan REST API terpisah. Tabel berikut memetakan URL, hak akses per peran, dan fungsi utama tiap halaman.

| #   | Halaman                | Rute (`/`)              | Akses        | Fungsi Utama                                                                       |
| :-- | :--------------------- | :---------------------- | :----------- | :--------------------------------------------------------------------------------- |
| 1   | Landing Page           | `/`                     | Publik       | Halaman pemasaran: masalah, kapabilitas, cara kerja, dan FAQ.                      |
| 2   | Masuk                  | `/login`                | Publik       | Autentikasi via email + kata sandi (dan passkey opsional).                         |
| 3   | Dashboard              | `/dashboard`            | Owner        | Ringkasan kas, nilai persediaan, penjualan 7 hari, dan alert aktif.                |
| 4   | Bahan Baku             | `/bahan-baku`           | Owner, Staff | Daftar stok, mutasi, riwayat harga, dan penyesuaian/waste.                         |
| 5   | Menu & Resep           | `/menu`                 | Owner, Staff | Katalog menu, resep (BOM), HPP, dan analisis margin.                               |
| 6   | POS Kasir              | `/pos`                  | Owner, Staff | Antarmuka kasir: pilih menu, susun keranjang, hitung total.                        |
| 7   | Pembayaran Kasir       | `/pos/checkout`         | Owner, Staff | Metode bayar (Tunai/QRIS), kembalian, verifikasi, dan cetak struk.                 |
| 8   | Pesanan                | `/pesanan`              | Owner, Staff | Antrean dapur (`preparing` → `ready` → `completed`), riwayat, dan void.            |
| 9   | Profitabilitas         | `/profitabilitas`       | Owner        | Klasifikasi margin (Profitable/Watchlist/Loss) dan matriks profit vs popularitas.  |
| 10  | Restock Planner        | `/restock`              | Owner        | Simulasi belanja berbasis anggaran kas dan status siklus restock.                  |
| 11  | Detail Rencana Belanja | `/restock/plans/{plan}` | Owner        | Rincian rekomendasi, realisasi belanja, PO (WhatsApp/Email), dan audit trail.      |
| 12  | Alert                  | `/alert`                | Owner        | Peringatan stok menipis dan kenaikan harga bahan baku.                             |
| 13  | Pengguna               | `/pengguna`             | Owner        | Kelola akun staf & owner, reset, nonaktifkan (soft delete), proteksi _sole owner_. |
| 14  | Pengaturan             | `/settings/profile`     | Owner, Staff | Profil, keamanan (kata sandi/passkey), dan tampilan (terang/gelap).                |

> **Catatan hak akses:** halaman bertanda **Owner** diimplementasikan di grup rute `middleware('role:owner')` sehingga akun **Staff** menerima **HTTP 403**. Rute mutasi (POST/PUT/PATCH/DELETE) juga diproteksi `role:owner` + rate limiter — mis. `POST /pos`, `POST /restock/plans`, `POST /bahan-baku/{id}/stock-in`, dan `PATCH /pesanan/{order}/status`.

---

## 🖼️ Galeri Antarmuka (Preview Semua Halaman)

Pratinjau berikut diambil langsung dari aplikasi yang berjalan menggunakan data contoh UMKM kedai kopi.

### 1. Landing Page — `/`

<img src="public/images/screenshots/01-welcome.png" alt="Landing Page Kulakan" width="100%">

### 2. Halaman Masuk — `/login`

<img src="public/images/screenshots/02-login.png" alt="Halaman Masuk Kulakan" width="100%">

### 3. Dashboard — `/dashboard` _(Owner)_

<img src="public/images/screenshots/03-dashboard.png" alt="Dashboard Kulakan" width="100%">

### 4. Bahan Baku — `/bahan-baku` _(Owner, Staff)_

<img src="public/images/screenshots/04-bahan-baku.png" alt="Halaman Bahan Baku" width="100%">

### 5. Menu & Resep — `/menu` _(Owner, Staff)_

<img src="public/images/screenshots/05-menu.png" alt="Halaman Menu dan Resep" width="100%">

### 6. POS Kasir — `/pos` _(Owner, Staff)_

<img src="public/images/screenshots/06-pos.png" alt="Halaman POS Kasir" width="100%">

### 7. Pembayaran Kasir — `/pos/checkout` _(Owner, Staff)_

<img src="public/images/screenshots/12-pos-checkout.png" alt="Halaman Pembayaran Kasir" width="100%">

### 8. Pesanan (Antrean Dapur) — `/pesanan` _(Owner, Staff)_

<img src="public/images/screenshots/07-pesanan.png" alt="Halaman Pesanan" width="100%">

### 9. Profitabilitas — `/profitabilitas` _(Owner)_

<img src="public/images/screenshots/08-profitabilitas.png" alt="Halaman Profitabilitas" width="100%">

### 10. Restock Planner — `/restock` _(Owner)_

<img src="public/images/screenshots/09-restock.png" alt="Halaman Restock Planner" width="100%">

### 11. Detail Rencana Belanja — `/restock/plans/{plan}` _(Owner)_

<img src="public/images/screenshots/13-restock-detail.png" alt="Detail Rencana Belanja" width="100%">

### 12. Alert — `/alert` _(Owner)_

<img src="public/images/screenshots/10-alert.png" alt="Halaman Alert" width="100%">

### 13. Pengguna — `/pengguna` _(Owner)_

<img src="public/images/screenshots/11-pengguna.png" alt="Halaman Pengguna" width="100%">

### 14. Pengaturan — `/settings/profile` _(Owner, Staff)_

<img src="public/images/screenshots/14-settings-profile.png" alt="Halaman Pengaturan Profil" width="100%">

---

## 🛠️ Tech Stack

| Lapisan                   | Teknologi                                                                                                | Keterangan                                                     |
| :------------------------ | :------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------- |
| **Backend Framework**     | [Laravel 13](https://laravel.com/) (PHP 8.3+)                                                            | Arsitektur aplikasi modern, service layer untuk logika bisnis. |
| **Frontend Framework**    | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)                           | Single page application yang type-safe.                        |
| **Monolith Bridge**       | [Inertia.js 3.x](https://inertiajs.com/)                                                                 | Pengalaman SPA tanpa boilerplate REST terpisah.                |
| **Routing & Type-Safety** | [Laravel Wayfinder](https://github.com/laravel/wayfinder)                                                | Rute Laravel di-generate menjadi helper TypeScript yang aman.  |
| **Autentikasi**           | [Laravel Fortify](https://laravel.com/docs/fortify) + [Passkeys](https://github.com/laravel/passkeys)    | Login email/kata sandi, verifikasi, dan passkey (WebAuthn).    |
| **UI Styling & System**   | [Tailwind CSS 4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)                       | _Finexy Design System_ (`fx-*` tokens) & mode terang/gelap.    |
| **Ikon, Chart & Animasi** | [Lucide](https://lucide.dev/) + [Recharts](https://recharts.org/) + [Motion](https://motion.dev/)        | Ikon konsisten, grafik finansial, dan transisi halus.          |
| **Database**              | [PostgreSQL 16](https://www.postgresql.org/)                                                             | RDBMS ACID dengan foreign key & check constraint.              |
| **Precision Math**        | PHP `ext-bcmath` + helper `App\Support\Number`                                                           | Kalkulasi moneter & WAC desimal tanpa _floating point error_.  |
| **Testing & Quality**     | [Pest 5](https://pestphp.com/) + [PHPStan](https://phpstan.org/) + [Pint](https://laravel.com/docs/pint) | Unit/feature test otomatis, analisa statis, dan PSR-12.        |

---

## 📂 Struktur Repositori

```text
app/
├── Http/
│   ├── Controllers/         # Controller tipis (Dashboard, Order, Restock, Menu, Bahan, User)
│   ├── Middleware/          # Role guard, Security Headers, Appearance
│   └── Requests/            # Validasi form request terisolasi (Input sanitization)
├── Models/                  # Model Eloquent (User, Ingredient, Menu, Recipe, SalesOrder, RestockPlan)
└── Services/                # Jantung logika bisnis aplikasi
    ├── AlertService.php         # Sinkronisasi & evaluasi peringatan stok/margin
    ├── CostingService.php       # Kalkulasi HPP, resep BOM, dan WAC
    ├── InventoryService.php     # Pemotongan stok POS, void/waste, & audit ledger
    └── RestockService.php       # Algoritma simulasi belanja berbasis anggaran kas
resources/
├── js/
│   ├── components/          # Komponen UI (FxCard, FxButton, Modal, Stepper, Shell)
│   └── pages/               # Halaman Inertia: dashboard, ingredients, menus, pos,
│                            #   pos-checkout, orders, profitability, restock,
│                            #   restock-plan-detail, alerts, pengguna, welcome
└── views/
    ├── app.blade.php        # Root Blade template
    └── receipt.blade.php    # Template struk thermal kasir
database/
├── migrations/              # Skema tabel relasional & check constraints
└── seeders/                 # Demo seeder UMKM (DatabaseSeeder → DemoSeeder)
public/
└── images/
    ├── *.svg, *.png, *.jpg  # Logo & gambar landing page
    └── screenshots/         # Pratinjau antarmuka untuk README (per halaman)
```

---

## 💻 Panduan Instalasi Lokal (Development)

### Prasyarat Sistem

- PHP >= 8.3 (dengan ekstensi `pdo_pgsql`, `bcmath`, `mbstring`)
- Composer >= 2.x
- Node.js >= 20.x & npm
- Docker & Docker Compose (untuk PostgreSQL lokal)

### Langkah Cepat (Automated Setup)

```bash
# 1. Clone repositori
git clone https://github.com/viesloxy/kulakan.git
cd kulakan

# 2. Salin environment & jalankan setup otomatis
cp .env.example .env
composer run setup
```

### Langkah Manual (Step-by-Step)

```bash
# 1. Install dependensi
composer install
npm install

# 2. Siapkan file konfigurasi & generate app key
cp .env.example .env
php artisan key:generate

# 3. Jalankan container PostgreSQL 16
docker compose up -d db

# 4. Hubungkan penyimpanan file publik (untuk foto menu)
php artisan storage:link

# 5. Jalankan migrasi & data contoh UMKM
php artisan migrate --seed

# 6. Jalankan frontend asset builder & server Laravel
npm run dev
php artisan serve
```

Aplikasi dapat diakses di browser melalui: `http://localhost:8000`

---

## ⚙️ Konfigurasi Environment Penting

Salin `.env.example` menjadi `.env`, lalu sesuaikan nilai berikut:

| Variabel                      | Nilai contoh            | Keterangan                                                                        |
| :---------------------------- | :---------------------- | :-------------------------------------------------------------------------------- |
| `APP_URL`                     | `http://localhost:8000` | Basis URL aplikasi.                                                               |
| `DB_CONNECTION`               | `pgsql`                 | Driver database (PostgreSQL).                                                     |
| `DB_HOST` / `DB_PORT`         | `127.0.0.1` / `5433`    | Port host `5433` dipetakan ke container Postgres 16 (lihat `docker-compose.yml`). |
| `DB_DATABASE`                 | `kulakan`               | Nama database.                                                                    |
| `DB_USERNAME` / `DB_PASSWORD` | `postgres` / `secret`   | Kredensial default lingkungan pengembangan.                                       |

Data contoh (akun demo, katalog kedai kopi, riwayat penjualan, dan alert) dibuat oleh seeder standar melalui `php artisan migrate --seed` (`DatabaseSeeder` → `DemoSeeder`).

> 🔒 Untuk lingkungan produksi, wajib mengganti `DB_PASSWORD`, menetapkan `APP_ENV=production` dan `APP_DEBUG=false`, serta menghasilkan `APP_KEY` baru (`php artisan key:generate`).

---

## 🧪 Pengujian & Verifikasi Kualitas

Seluruh fungsionalitas diuji secara otomatis untuk menjamin keandalan sistem:

```bash
# Menjalankan seluruh test suite fitur & unit (Pest)
composer test

# Pemeriksaan analisa statis (PHPStan)
composer types:check

# Pemeriksaan linter & formatter (Laravel Pint)
composer lint:check

# Pemeriksaan tipe frontend & ESLint
npm run check
npm run types:check
```

---

## 👥 Tim Pengembang

Proyek **Kulakan** dikembangkan oleh tim **Pemburu Doksli Sertif Juara** untuk GTNIC 2026:

| #   | Nama Lengkap                     | Institusi             |
| :-- | :------------------------------- | :-------------------- |
| 1   | **Vito Aditya**                  | Universitas Airlangga |
| 2   | **Luthfi Alan Perdana**          | Universitas Airlangga |
| 3   | **Brillian Arhaburrizqi Kusuma** | Universitas Airlangga |

> ℹ️ **Kulakan** adalah nama produk/aplikasi, sedangkan **Pemburu Doksli Sertif Juara** adalah nama tim peserta GTNIC 2026.

---

## 📄 Lisensi & Hak Cipta

Hak cipta © 2026 **Tim Pemburu Doksli Sertif Juara** (Vito Aditya, Luthfi Alan Perdana, Brillian Arhaburrizqi Kusuma).

Proyek ini dikembangkan untuk **Garda Tech National Innovation Competition (GTNIC) 2026** dan didistribusikan di bawah [MIT License](LICENSE).
