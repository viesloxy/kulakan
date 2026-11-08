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
  <img src="https://img.shields.io/badge/Inertia.js-2.x-9553E9?style=flat&logo=inertia&logoColor=white" alt="Inertia.js 2">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind CSS 4">
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL 16">
  <img src="https://img.shields.io/badge/Pest_Testing-3.x-F55247?style=flat&logo=pest&logoColor=white" alt="Pest">
</p>

---

**Kulakan** adalah aplikasi web modern untuk pelaku usaha mikro, kecil, dan menengah (UMKM) sektor makanan dan minuman (warung kopi, kafe, kedai makan) yang menghubungkan **resep, stok bahan baku, biaya produksi, profitabilitas menu, dan anggaran kas** dalam satu alur terpadu.

Kulakan menjawab pertanyaan kritis pemilik usaha:

> _"Dengan sisa kas Rp X, bahan baku apa yang paling mendesak dibeli tanpa bikin bangkrut?"_  
> _"Menu mana yang paling laku tapi diam-diam merugi karena harga bahan naik?"_

> 🏆 Dibangun untuk **GTNIC 2026** (_Garda Tech National Innovation Competition_), Kategori **Web Development**, Sub-tema: _Accelerating Digital Transformation for Business and SMEs_.

---

## 🚀 Live Demo & Akses Publik

Aplikasi saat ini telah aktif di lingkungan semi-publik untuk keperluan demonstrasi dan pengujian:

- 🔗 **URL Live**: [https://kulakan.web.id/](https://kulakan.web.id/)
- 👥 **Akun Demo (Siap Pakai)**:

| Peran (Role)                | Email               | Password   | Hak Akses Utama                                                                                               |
| :-------------------------- | :------------------ | :--------- | :------------------------------------------------------------------------------------------------------------ |
| **Pemilik (Owner)**         | `owner@kulakan.com` | `password` | Akses penuh: Dashboard finansial, margin menu, restock planner, resep/BOM, audit pembatalan, dan kelola staf. |
| **Kasir / Barista (Staff)** | `staff@kulakan.com` | `password` | Akses operasional: POS Kasir, riwayat pesanan (antrean dapur), cetak struk, dan pencatatan waste bahan.       |

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

## 🛠️ Tech Stack

| Lapisan                      | Teknologi                                                                                                | Keterangan                                                |
| :--------------------------- | :------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------- |
| **Backend Framework**        | [Laravel 13](https://laravel.com/) (PHP 8.3+)                                                            | Modern Laravel application architecture                   |
| **Frontend Framework**       | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)                           | Type-safe single page application                         |
| **Monolith Bridge**          | [Inertia.js 2.x](https://inertiajs.com/)                                                                 | Seamless SPA experience without separate REST boilerplate |
| **UI Styling & System**      | [Tailwind CSS 4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)                       | Neo-brutalist Fx Design System & dark/light mode          |
| **Animasi & Interaktivitas** | [Motion](https://motion.dev/) (Framer Motion)                                                            | Transisi halus dan feedback visual                        |
| **Database**                 | [PostgreSQL 16](https://www.postgresql.org/)                                                             | ACID-compliant relational DB with foreign key cascades    |
| **Precision Math**           | PHP `ext-bcmath`                                                                                         | Kalkulasi moneter & WAC desimal tanpa floating point      |
| **Testing & Quality**        | [Pest 3](https://pestphp.com/) + [PHPStan](https://phpstan.org/) + [Pint](https://laravel.com/docs/pint) | Automated unit/feature tests & PSR-12 code style          |

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
│   └── pages/               # Halaman Inertia (dashboard, pos, orders, restock, ingredients, menus)
└── views/
    ├── app.blade.php        # Root Blade template
    └── receipt.blade.php    # Template struk thermal kasir
database/
├── migrations/              # Skema tabel relasional & check constraints
└── seeders/                 # Demo seeder UMKM (kedai kopi siap pakai)
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

## 📄 Lisensi & Hak Cipta

Dikembangkan oleh Tim Kulakan untuk **Garda Tech National Innovation Competition (GTNIC) 2026**.  
Didistribusikan di bawah lisensi [MIT License](LICENSE).
