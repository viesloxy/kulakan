# Kulakan — Smart Profit & Inventory for Small F&B

**Kulakan** adalah aplikasi web untuk UMKM F&B (warung kopi, kafe, kedai makan) yang menghubungkan
**resep → stok → biaya → profit → kas** dalam satu alur. Ia membantu pemilik tahu **bahan apa yang harus
dibeli, menu mana yang paling untung, dan berapa modal yang aman dipakai** — tanpa spreadsheet, tanpa menebak.

> Dibangun untuk **GTNIC 2026** (*Garda Tech National Innovation Competition*) · Kategori **Web Development**
> · Sub-tema *Accelerating Digital Transformation for Business and SMEs*.

---

## Masalah & Solusi

| Masalah UMKM F&B | Solusi Kulakan |
| --- | --- |
| Kehabisan stok kritis karena belanja telat / pakai feeling | Rekomendasi restock berbasis urgensi × dampak pendapatan |
| Uang kas habis karena belanja berlebihan | Rekomendasi dibatasi kas tersedia (tidak pernah over-budget) |
| Menu terlaris ternyata merugi (harga bahan naik tanpa sadar) | HPP dihitung ulang otomatis + alert margin |
| Stok tidak sinkron dengan penjualan | Pemotongan stok atomik per pesanan (BOM + waste factor) |

## Empat Kapabilitas Inti

- **CAP-A · Cashflow-Aware Reorder Planner** — *"Dengan kas Rp X, bahan apa yang harus saya beli?"*
- **CAP-B · Recipe-to-Stock Engine** — pemotongan stok otomatis sesuai BOM saat penjualan.
- **CAP-C · Menu Profitability Dashboard** — margin, status (profitable/watchlist/loss), dan ranking menu.
- **CAP-D · Smart Recipe Costing** — HPP (WAC) + proyeksi harga, dihitung ulang otomatis.

## Tech Stack

| Layer | Teknologi |
| --- | --- |
| Backend | Laravel 13 (PHP 8.3+) |
| Frontend | Inertia.js + React 19 + TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | PostgreSQL 16 (Docker) |
| Testing | Pest |

## Cara Menjalankan (Development)

Prasyarat: PHP ≥ 8.3 + Composer, Node ≥ 20, dan Docker.

```bash
cp .env.example .env            # lalu sesuaikan kredensial
composer install
npm install
docker compose up -d db         # start PostgreSQL 16
php artisan key:generate
php artisan migrate --seed
npm run dev                     # Vite dev server
php artisan serve               # buka http://localhost:8000
```

## Environment Variables

| Var | Keterangan | Default |
| --- | --- | --- |
| `APP_NAME` | Nama aplikasi | `Kulakan` |
| `APP_ENV` | `local` / `production` | `local` |
| `DB_CONNECTION` | Driver database | `pgsql` |
| `DB_HOST` / `DB_PORT` | Host & port PostgreSQL | `127.0.0.1` / `5432` |
| `DB_DATABASE` | Nama database | `kulakan` |
| `DB_USERNAME` / `DB_PASSWORD` | Kredensial PostgreSQL | `postgres` / `secret` |

## Struktur Repo (ringkas)

```
app/Services/       ← logika bisnis (Inventory, Costing, Restock)  [menyusul]
app/Http/           ← controllers tipis + Form Requests
resources/js/       ← React (Inertia pages & komponen shadcn/ui)
database/           ← migrations & seeders
routes/             ← web routes
tests/              ← Pest (Unit & Feature)
```

## Status & Live Site

- Repository: **publik**.
- Live: `https://<domain>` *(menyusul — VM + domain sedang disiapkan)*.