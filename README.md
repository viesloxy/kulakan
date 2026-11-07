# Kulakan: Smart Profit & Inventory for Small F&B

**Kulakan** adalah aplikasi web untuk UMKM F&B (warung kopi, kafe, kedai makan) yang menghubungkan
**resep, stok, biaya, profit, dan kas** dalam satu alur. Ia membantu pemilik tahu **bahan apa yang harus
dibeli, menu mana yang paling untung, dan berapa modal yang aman dipakai**, tanpa spreadsheet dan tanpa menebak.

> Dibangun untuk **GTNIC 2026** (_Garda Tech National Innovation Competition_), Kategori **Web Development**,
> sub-tema _Accelerating Digital Transformation for Business and SMEs_.

---

## Masalah & Solusi

| Masalah UMKM F&B                                              | Solusi Kulakan                                               |
| ------------------------------------------------------------- | ------------------------------------------------------------ |
| Kehabisan stok kritis karena belanja telat atau pakai feeling | Rekomendasi restock berbasis urgensi dan dampak pendapatan   |
| Uang kas habis karena belanja berlebihan                      | Rekomendasi dibatasi kas tersedia (tidak pernah over-budget) |
| Menu terlaris ternyata merugi (harga bahan naik tanpa sadar)  | HPP dihitung ulang otomatis dan alert margin                 |
| Stok tidak sinkron dengan penjualan                           | Pemotongan stok atomik per pesanan (BOM dan waste factor)    |

## Empat Kapabilitas Inti

- **CAP-A · Cashflow-Aware Reorder Planner**: _"Dengan kas Rp X, bahan apa yang harus saya beli?"_
- **CAP-B · Recipe-to-Stock Engine**: pemotongan stok otomatis sesuai BOM saat penjualan.
- **CAP-C · Menu Profitability Dashboard**: margin, status (profitable/watchlist/loss), dan ranking menu.
- **CAP-D · Smart Recipe Costing**: HPP (WAC) dan proyeksi harga, dihitung ulang otomatis.

## Tech Stack

| Layer    | Teknologi                          |
| -------- | ---------------------------------- |
| Backend  | Laravel 13 (PHP 8.3+)              |
| Frontend | Inertia.js + React 19 + TypeScript |
| Styling  | Tailwind CSS 4 + shadcn/ui         |
| Database | PostgreSQL 16 (Docker)             |
| Testing  | Pest                               |

## Model Penggunaan

Kulakan dikembangkan sebagai proyek open source yang dijalankan **self-hosted: satu deployment
melayani satu UMKM**, sehingga seluruh data operasional (stok, harga, penjualan) tetap milik
UMKM itu sendiri di lingkungan lokalnya. Di dalam satu deployment, satu UMKM dapat memiliki
lebih dari satu owner dan banyak staff yang berbagi satu lingkungan data melalui halaman
**Pengguna** (multi-user per UMKM). Dukungan banyak UMKM dalam satu deployment (multi-tenant,
hosting bersama) menjadi peta jalan rilis berikutnya.

## Cara Menjalankan (Development)

Prasyarat: PHP >= 8.3 + Composer, Node >= 20, dan Docker.

```bash
cp .env.example .env            # lalu sesuaikan kredensial
composer install
npm install
docker compose up -d db         # start PostgreSQL 16
php artisan key:generate
php artisan storage:link        # publikasikan storage (foto menu)
php artisan migrate --seed
npm run dev                     # Vite dev server
php artisan serve               # buka http://localhost:8000
```

## Environment Variables

| Var                           | Keterangan             | Default               |
| ----------------------------- | ---------------------- | --------------------- |
| `APP_NAME`                    | Nama aplikasi          | `Kulakan`             |
| `APP_ENV`                     | `local` / `production` | `local`               |
| `DB_CONNECTION`               | Driver database        | `pgsql`               |
| `DB_HOST` / `DB_PORT`         | Host & port PostgreSQL | `127.0.0.1` / `5433`  |
| `DB_DATABASE`                 | Nama database          | `kulakan`             |
| `DB_USERNAME` / `DB_PASSWORD` | Kredensial PostgreSQL  | `postgres` / `secret` |

## Struktur Repo (ringkas)

```
app/Services/       # logika bisnis (Inventory, Costing, Restock)  [menyusul]
app/Http/           # controllers tipis + Form Requests
resources/js/       # React (Inertia pages & komponen shadcn/ui)
database/           # migrations & seeders
routes/             # web routes
tests/              # Pest (Unit & Feature)
```

## Akun Demo (hasil seeder)

| Role            | Email               | Password   |
| --------------- | ------------------- | ---------- |
| Pemilik (owner) | `owner@kulakan.com` | `password` |
| Kasir (staff)   | `staff@kulakan.com` | `password` |

## Status & Live Site

- Repository: **publik**.
- Live: `https://<domain>` _(menyusul, VM dan domain sedang disiapkan)_.
