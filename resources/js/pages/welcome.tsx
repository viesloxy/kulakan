import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Calculator,
    ChevronDown,
    CircleHelp,
    CookingPot,
    Gauge,
    Package,
    Sparkles,
    TriangleAlert,
} from 'lucide-react';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard } from '@/components/fx/fx-card';
import { dashboard, login, register } from '@/routes';

const problems = [
    {
        title: 'Harga bahan naik tak terdeteksi',
        description:
            'Harga cabai naik 20% tapi harga jual tetap. Tanpa pencatatan penawaran, margin tergerus diam-diam sampai akhir bulan.',
        icon: TriangleAlert,
    },
    {
        title: 'Stok bocor tanpa jejak',
        description:
            'Bahan hilang karena terbuang, rusak, atau salah takar. Buku manual tidak membedakan stok terpakai dan stok terbuang.',
        icon: Package,
    },
    {
        title: 'Harga jual pakai perasaan',
        description:
            'Meniru warung sebelah tanpa tahu biaya sendiri. Untung terlihat besar di kasir, tapi habis setelah bahan dan overhead dihitung.',
        icon: Gauge,
    },
];

const capabilities = [
    {
        code: 'CAP-A',
        title: 'Reorder Planner',
        description:
            'Masukkan kas yang tersedia, sistem menyusun rencana belanja bahan berdasarkan urgensi dan kelas ABC sampai kasnya habis secara efisien. Rencana bisa disimpan, disetujui, lalu ditandai dibeli dan stok langsung bertambah.',
        visual: 'planner' as const,
    },
    {
        code: 'CAP-B',
        title: 'Recipe-to-Stock',
        description:
            'Susun BOM resep per menu: kuantitas per porsi dan faktor waste 0-50%. Setiap pesanan di kasir otomatis memotong stok bahan lewat ledger append-only, lengkap dengan penyesuaian dan waste yang tercatat rapi.',
        visual: 'recipe' as const,
    },
    {
        code: 'CAP-C',
        title: 'Profitability',
        description:
            'Margin tiap menu dihitung dari HPP terkini dan diklasifikasi menjadi profitable, watchlist, atau loss. Simulasi harga bahan menjawab bagaimana jika cabai naik 20%, tanpa menyentuh data asli.',
        visual: 'profit' as const,
    },
    {
        code: 'CAP-D',
        title: 'Smart Recipe Costing',
        description:
            'HPP dihitung dari WAC bahan yang diperbarui otomatis setiap pembelian, ditambah overhead per porsi. Proyeksi HPP ikut bergerak saat harga penawaran baru masuk, dan HPP saat penjualan disimpan permanen.',
        visual: 'costing' as const,
    },
];

const steps = [
    {
        title: 'Catat bahan dan harga',
        description:
            'Masukkan bahan beserta kemasan belinya. WAC terbentuk otomatis dari setiap pembelian dan tersimpan di riwayat harga.',
    },
    {
        title: 'Susun resep menu',
        description:
            'Rangkai BOM per porsi. HPP jual tiap menu langsung terhitung, lengkap dengan margin dan status kesehatannya.',
    },
    {
        title: 'Jual dan pantau margin',
        description:
            'Catat pesanan di POS. Stok terpotong, HPP ter-snapshot, dan alert menyala saat stok menipis atau margin turun.',
    },
];

const stats = [
    {
        value: 'Rp 11.244',
        label: 'HPP Es Kopi Susu Aren dihitung akurat dari resep',
    },
    {
        value: '-210 g',
        label: 'stok biji kopi terpotong otomatis per 10 cup',
    },
    {
        value: '48,89%',
        label: 'margin terpantau dan ikut berubah saat harga naik',
    },
    {
        value: 'Rp 483.000',
        label: 'rencana belanja disusun otomatis dari kas Rp 500.000',
    },
];

const faqs = [
    {
        q: 'Dari mana HPP tiap menu dihitung?',
        a: 'Dari BOM resep dikali WAC (Weighted Average Cost) tiap bahan, ditambah overhead standar per porsi. WAC bergerak otomatis setiap pembelian dicatat, jadi HPP selalu mencerminkan biaya terkini.',
    },
    {
        q: 'Apakah stok benar-benar terpotong otomatis?',
        a: 'Ya. Setiap pesanan selesai di POS memotong stok bahan sesuai resep dan faktor waste. Pembatalan pesanan (void) mengembalikan stok lewat jurnal pembalik, sehingga riwayat tetap bisa diaudit.',
    },
    {
        q: 'Apa bedanya WAC dan harga penawaran?',
        a: 'WAC adalah biaya rata-rata tertimbang dari pembelian nyata dan dipakai untuk HPP aktif. Harga penawaran hanya dipakai untuk proyeksi HPP, tanpa mengubah stok atau pembukuan.',
    },
    {
        q: 'Bagaimana alert bekerja?',
        a: 'Sistem membuat alert otomatis setelah transaksi: stok di bawah minimum, margin menu turun, dan kenaikan harga bahan di atas 10%. Semua alert bisa ditandai selesai setelah ditindak.',
    },
    {
        q: 'Siapa saja yang bisa memakai aplikasi ini?',
        a: 'Pemilik (owner) mengakses dashboard, profitabilitas, restock, alert, dan semua pengaturan bahan atau menu. Staf kasir memakai POS dan bisa mencatat penyesuaian stok atau waste.',
    },
];

function PlannerVisual() {
    return (
        <svg viewBox="0 0 220 96" className="h-24 w-full" fill="none">
            <rect
                x="10"
                y="14"
                width="86"
                height="10"
                rx="5"
                className="fill-[#ECECE9] dark:fill-[#2C2C29]"
            />
            <rect
                x="10"
                y="14"
                width="62"
                height="10"
                rx="5"
                className="fx-hatch-coral fill-primary"
            />
            <rect
                x="10"
                y="34"
                width="86"
                height="10"
                rx="5"
                className="fill-[#ECECE9] dark:fill-[#2C2C29]"
            />
            <rect
                x="10"
                y="34"
                width="34"
                height="10"
                rx="5"
                className="fx-hatch-coral fill-primary"
            />
            <rect
                x="10"
                y="54"
                width="86"
                height="10"
                rx="5"
                className="fill-[#ECECE9] dark:fill-[#2C2C29]"
            />
            <rect
                x="10"
                y="54"
                width="74"
                height="10"
                rx="5"
                className="fx-hatch-coral fill-primary"
            />
            <text
                x="10"
                y="86"
                className="fill-[#6E6E6A] text-[9px] font-semibold"
            >
                kas terpakai
            </text>
            <circle
                cx="126"
                cy="22"
                r="6"
                className="fill-[#E6F5EC] stroke-[#1D9E53]"
                strokeWidth="1.6"
            />
            <text
                x="138"
                y="26"
                className="fill-[#1D9E53] text-[10px] font-bold"
            >
                A · segera
            </text>
            <circle
                cx="126"
                cy="42"
                r="6"
                className="fill-[#E7EEFC] stroke-[#2B6BE6]"
                strokeWidth="1.6"
            />
            <text
                x="138"
                y="46"
                className="fill-[#2B6BE6] text-[10px] font-bold"
            >
                B · disiplin
            </text>
            <circle
                cx="126"
                cy="62"
                r="6"
                className="fill-[#FDECE7] stroke-[#EC582A]"
                strokeWidth="1.6"
            />
            <text
                x="138"
                y="66"
                className="fill-[#EC582A] text-[10px] font-bold"
            >
                C · opsional
            </text>
        </svg>
    );
}

function RecipeVisual() {
    return (
        <svg viewBox="0 0 220 96" className="h-24 w-full" fill="none">
            <rect
                x="12"
                y="36"
                width="58"
                height="24"
                rx="12"
                className="fill-primary"
            />
            <text x="24" y="52" className="fill-white text-[10px] font-bold">
                Menu
            </text>
            <path
                d="M74 48h30"
                className="stroke-[#9A9A94] dark:stroke-[#4A4A45]"
                strokeDasharray="3 5"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
            <circle
                cx="122"
                cy="24"
                r="9"
                className="fill-[#FDECE7] stroke-[#EC582A]"
                strokeWidth="1.6"
            />
            <circle
                cx="122"
                cy="48"
                r="9"
                className="fill-[#FDECE7] stroke-[#EC582A]"
                strokeWidth="1.6"
            />
            <circle
                cx="122"
                cy="72"
                r="9"
                className="fill-[#FDECE7] stroke-[#EC582A]"
                strokeWidth="1.6"
            />
            <text
                x="140"
                y="28"
                className="fill-[#161615] text-[10px] font-semibold dark:fill-[#F5F5F3]"
            >
                Biji kopi 21 g
            </text>
            <text
                x="140"
                y="52"
                className="fill-[#161615] text-[10px] font-semibold dark:fill-[#F5F5F3]"
            >
                Susu 153 ml
            </text>
            <text
                x="140"
                y="76"
                className="fill-[#161615] text-[10px] font-semibold dark:fill-[#F5F5F3]"
            >
                Gula aren 26 ml
            </text>
        </svg>
    );
}

function ProfitVisual() {
    return (
        <svg viewBox="0 0 220 96" className="h-24 w-full" fill="none">
            <rect
                x="16"
                y="56"
                width="16"
                height="26"
                rx="4"
                className="fx-hatch-coral fill-primary"
            />
            <rect
                x="42"
                y="44"
                width="16"
                height="38"
                rx="4"
                className="fx-hatch-coral fill-primary"
            />
            <rect
                x="68"
                y="30"
                width="16"
                height="52"
                rx="4"
                className="fx-hatch-coral fill-primary"
            />
            <rect
                x="94"
                y="38"
                width="16"
                height="44"
                rx="4"
                className="fill-[#ECECE9] dark:fill-[#2C2C29]"
            />
            <rect
                x="120"
                y="20"
                width="16"
                height="62"
                rx="4"
                className="fx-hatch-coral fill-primary"
            />
            <path
                d="M20 44 C 60 36, 90 20, 128 14"
                className="stroke-[#1D9E53]"
                strokeWidth="2.4"
                strokeLinecap="round"
            />
            <circle cx="128" cy="14" r="4" className="fill-[#1D9E53]" />
            <text
                x="140"
                y="18"
                className="fill-[#1D9E53] text-[10px] font-bold"
            >
                48,9%
            </text>
            <text
                x="16"
                y="94"
                className="fill-[#6E6E6A] text-[9px] font-semibold"
            >
                margin per menu
            </text>
        </svg>
    );
}

function CostingVisual() {
    return (
        <svg viewBox="0 0 220 96" className="h-24 w-full" fill="none">
            <rect
                x="14"
                y="14"
                width="130"
                height="30"
                rx="10"
                className="fill-[#FDECE7]"
            />
            <text
                x="24"
                y="34"
                className="fill-[#EC582A] text-[11px] font-bold"
            >
                HPP = WAC + overhead
            </text>
            <rect
                x="14"
                y="54"
                width="58"
                height="12"
                rx="6"
                className="fill-[#ECECE9] dark:fill-[#2C2C29]"
            />
            <text
                x="20"
                y="63"
                className="fill-[#6E6E6A] text-[9px] font-semibold"
            >
                Rp 11.244
            </text>
            <path
                d="M80 60h20m0 0-6-6m6 6-6 6"
                className="stroke-[#EC582A]"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <rect
                x="108"
                y="54"
                width="72"
                height="12"
                rx="6"
                className="fill-[#FEF3D6]"
            />
            <text
                x="114"
                y="63"
                className="fill-[#9A6B00] text-[9px] font-semibold"
            >
                proyeksi 12.294
            </text>
            <text
                x="14"
                y="88"
                className="fill-[#6E6E6A] text-[9px] font-semibold"
            >
                WAC bergerak tiap pembelian, HPP lama tersimpan
            </text>
        </svg>
    );
}

const capabilityVisuals = {
    planner: PlannerVisual,
    recipe: RecipeVisual,
    profit: ProfitVisual,
    costing: CostingVisual,
};

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Kulakan · Smart Profit & Inventory for Small F&B" />
            <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
                {/* dekorasi latar global */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-40 right-[-10%] size-[34rem] rounded-full bg-[radial-gradient(circle,rgba(236,88,42,0.14),transparent_65%)]"
                />

                {/* navigasi */}
                <header className="relative z-30 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 pt-5 md:px-6">
                    <Link
                        href="/"
                        className="flex h-12 items-center gap-2.5 fx-pill px-4"
                    >
                        <img
                            src="/images/logo.svg"
                            alt="Logo Kulakan"
                            className="size-7"
                        />
                        <span className="text-base font-bold tracking-tight">
                            Kulakan
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-1 fx-pill px-2 lg:flex">
                        {[
                            ['#masalah', 'Masalah'],
                            ['#kapabilitas', 'Kapabilitas'],
                            ['#cara-kerja', 'Cara kerja'],
                            ['#faq', 'FAQ'],
                        ].map(([href, label]) => (
                            <a
                                key={href}
                                href={href}
                                className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {label}
                            </a>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        {auth.user ? (
                            <FxButton
                                variant="coral"
                                onClick={() => router.visit(dashboard())}
                            >
                                Buka Dashboard
                                <ArrowRight className="size-4" />
                            </FxButton>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-foreground transition-colors hover:text-primary"
                                >
                                    Masuk
                                </Link>
                                <FxButton
                                    variant="coral"
                                    onClick={() => router.visit(register())}
                                >
                                    Daftar
                                    <ArrowRight className="size-4" />
                                </FxButton>
                            </>
                        )}
                    </div>
                </header>

                {/* hero */}
                <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-16 text-center md:px-6 lg:pt-24">
                    <span className="inline-flex items-center gap-2 rounded-full bg-coral-soft px-3.5 py-1.5 text-xs font-semibold text-primary">
                        <Sparkles className="size-3.5" />
                        Smart Profit &amp; Inventory for Small F&amp;B
                    </span>
                    <h1 className="mx-auto mt-5 max-w-3xl text-4xl leading-[1.06] font-bold tracking-tight text-balance sm:text-6xl">
                        Stok, HPP, dan margin warungmu, terhitung otomatis.
                    </h1>
                    <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
                        Kulakan mencatat bahan baku, menyusun resep menjadi
                        stok, menghitung HPP secara akurat, dan menyarankan
                        belanja restock paling hemat. Dibuat untuk pemilik
                        warung dan kafe kecil yang ingin tahu angka sebenarnya.
                    </p>
                    <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                        <FxButton
                            variant="coral"
                            size="lg"
                            onClick={() => router.visit(login())}
                        >
                            Masuk ke aplikasi
                            <ArrowRight className="size-4" />
                        </FxButton>
                        <FxButton
                            variant="soft"
                            size="lg"
                            onClick={() => router.visit(register())}
                        >
                            Daftar gratis
                        </FxButton>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                        Akun demo: owner@kulakan.com atau staff@kulakan.com,
                        kata sandi: password
                    </p>

                    {/* gambar pratinjau aplikasi di bawah heading */}
                    <div className="relative mx-auto mt-14 max-w-5xl">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -top-16 left-1/2 h-56 w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(236,88,42,0.20),transparent_65%)]"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -bottom-10 -left-12 size-44 rounded-full fx-hatch opacity-60"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-10 -bottom-12 size-32 rounded-full fx-hatch opacity-50"
                        />
                        <div className="relative overflow-hidden rounded-[2rem] bg-[#0B0B0A] p-6 ring-1 ring-black/40 md:p-10">
                            <img
                                src="/images/app-preview.png"
                                alt="Pratinjau antarmuka aplikasi Kulakan"
                                className="mx-auto w-full"
                            />
                        </div>
                        {/* pil informasi di bawah gambar */}
                        <div className="relative z-10 -mt-6 flex flex-wrap items-center justify-center gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-xs font-semibold shadow-sm">
                                <span className="size-1.5 rounded-full bg-success" />
                                Stok terpotong otomatis per pesanan
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-xs font-semibold shadow-sm">
                                <span className="size-1.5 rounded-full bg-warning" />
                                Alert menyala saat margin turun
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-xs font-semibold shadow-sm">
                                <span className="size-1.5 rounded-full bg-primary" />
                                HPP tersnapshot saat penjualan
                            </span>
                        </div>
                    </div>
                </section>

                {/* angka kanonik */}
                <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-20 pb-4 md:px-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {stats.map((s) => (
                            <FxCard
                                key={s.value}
                                className="flex flex-col gap-1.5 p-5"
                            >
                                <p className="text-xl font-bold tracking-tight tabular-nums">
                                    {s.value}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {s.label}
                                </p>
                            </FxCard>
                        ))}
                    </div>
                </section>

                {/* masalah */}
                <section
                    id="masalah"
                    className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-20 md:px-6"
                >
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
                            <TriangleAlert className="size-3.5" />
                            Masalah yang diselesaikan
                        </span>
                        <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance">
                            Tiga hal yang menggerus laba warung
                        </h2>
                        <p className="mt-3 text-muted-foreground">
                            Warung kecil jarang kekurangan penjualan; yang
                            menipis adalah pemahaman terhadap biaya dan stok.
                        </p>
                    </div>
                    <div className="mt-10 grid gap-4 md:grid-cols-3">
                        {problems.map((p) => (
                            <FxCard
                                key={p.title}
                                className="flex h-full flex-col gap-4 p-6"
                            >
                                <span className="flex size-10 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground">
                                    <p.icon className="size-5" />
                                </span>
                                <div>
                                    <h3 className="font-semibold tracking-tight">
                                        {p.title}
                                    </h3>
                                    <p className="mt-1.5 text-sm text-muted-foreground">
                                        {p.description}
                                    </p>
                                </div>
                            </FxCard>
                        ))}
                    </div>
                </section>

                {/* kapabilitas */}
                <section
                    id="kapabilitas"
                    className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-20 md:px-6"
                >
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
                            <Calculator className="size-3.5" />
                            Empat kapabilitas inti
                        </span>
                        <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance">
                            Satu aplikasi untuk belanja, resep, dan laba
                        </h2>
                        <p className="mt-3 text-muted-foreground">
                            Setiap rupiah keluar-masuk dapur terhubung: dari
                            pembelian bahan sampai margin per menu.
                        </p>
                    </div>
                    <div className="mt-10 grid gap-4 md:grid-cols-2">
                        {capabilities.map((c) => {
                            const Visual = capabilityVisuals[c.visual];
                            return (
                                <FxCard
                                    key={c.code}
                                    className="flex h-full flex-col gap-4 p-6"
                                >
                                    <div className="overflow-hidden rounded-2xl bg-foreground/5 p-4">
                                        <Visual />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold tracking-tight">
                                            {c.title}
                                        </h3>
                                        <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold tracking-wide text-muted-foreground">
                                            {c.code}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {c.description}
                                    </p>
                                </FxCard>
                            );
                        })}
                    </div>
                </section>

                {/* cara kerja */}
                <section
                    id="cara-kerja"
                    className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-20 md:px-6"
                >
                    <FxCard className="overflow-hidden p-6 md:p-10">
                        <div className="mx-auto max-w-2xl text-center">
                            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
                                <CookingPot className="size-3.5" />
                                Cara kerja
                            </span>
                            <h2 className="mt-4 text-3xl font-bold tracking-tight">
                                Tiga langkah, langsung jalan
                            </h2>
                            <p className="mt-3 text-muted-foreground">
                                Tidak perlu spreadsheet. Semua formula dihitung
                                sistem, Anda cukup membaca hasilnya.
                            </p>
                        </div>
                        <div className="relative mt-10 grid gap-8 md:grid-cols-3">
                            <svg
                                aria-hidden="true"
                                viewBox="0 0 600 20"
                                preserveAspectRatio="none"
                                className="absolute top-6 right-[16%] left-[16%] hidden md:block"
                                fill="none"
                            >
                                <path
                                    d="M0 10 H600"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeDasharray="2 10"
                                    strokeLinecap="round"
                                    className="text-primary/40"
                                />
                            </svg>
                            {steps.map((s, i) => (
                                <div
                                    key={s.title}
                                    className="relative flex flex-col items-center gap-3 text-center"
                                >
                                    <span className="relative z-10 flex size-12 items-center justify-center rounded-full fx-coral text-lg font-bold text-white">
                                        {i + 1}
                                    </span>
                                    <h3 className="font-semibold tracking-tight">
                                        {s.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {s.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </FxCard>
                </section>

                {/* FAQ */}
                <section
                    id="faq"
                    className="relative z-10 mx-auto w-full max-w-3xl scroll-mt-24 px-4 pb-20 md:px-6"
                >
                    <div className="text-center">
                        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
                            <CircleHelp className="size-3.5" />
                            Pertanyaan umum
                        </span>
                        <h2 className="mt-4 text-3xl font-bold tracking-tight">
                            Hal yang sering ditanyakan
                        </h2>
                    </div>
                    <div className="mt-8 flex flex-col gap-3">
                        {faqs.map((f) => (
                            <details
                                key={f.q}
                                className="group fx-soft rounded-2xl p-5"
                            >
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">
                                    {f.q}
                                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                                </summary>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    {f.a}
                                </p>
                            </details>
                        ))}
                    </div>
                </section>

                {/* banner CTA */}
                <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 md:px-6">
                    <div className="relative overflow-hidden rounded-[2rem] fx-coral p-8 text-center md:p-12">
                        <div
                            aria-hidden="true"
                            className="absolute inset-y-0 left-0 w-24 fx-hatch-coral opacity-60"
                        />
                        <div
                            aria-hidden="true"
                            className="absolute inset-y-0 right-0 w-24 fx-hatch-coral opacity-60"
                        />
                        <h2 className="text-2xl font-bold tracking-tight text-balance text-white md:text-3xl">
                            Siap mengetahui margin sebenarnya dari tiap menu?
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-sm text-white/90">
                            Mulai dari bahan pertama, biarkan Kulakan yang
                            menghitung sisanya.
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <FxButton
                                variant="soft"
                                size="lg"
                                className="bg-white! text-[#E84B20]! hover:bg-white/90!"
                                onClick={() => router.visit(register())}
                            >
                                Daftar sekarang
                            </FxButton>
                            <FxButton
                                variant="soft"
                                size="lg"
                                className="bg-white/15! text-white! hover:bg-white/25!"
                                onClick={() => router.visit(login())}
                            >
                                Masuk
                            </FxButton>
                        </div>
                    </div>
                </section>

                {/* footer */}
                <footer className="relative z-10 border-t border-border">
                    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-6">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2.5">
                                <img
                                    src="/images/logo.svg"
                                    alt="Logo Kulakan"
                                    className="size-8"
                                />
                                <span className="font-bold tracking-tight">
                                    Kulakan
                                </span>
                            </div>
                            <p className="max-w-sm text-sm text-muted-foreground">
                                Smart Profit &amp; Inventory for Small F&amp;B.
                                Dibangun untuk GTNIC 2026, sub-tema Accelerating
                                Digital Transformation for Business and SMEs.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Dibuat dengan Laravel, Inertia, React, dan
                                PostgreSQL.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <p className="text-sm font-bold">Kapabilitas</p>
                            {[
                                'Reorder Planner',
                                'Recipe-to-Stock',
                                'Profitability',
                                'Smart Recipe Costing',
                            ].map((t) => (
                                <a
                                    key={t}
                                    href="#kapabilitas"
                                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    {t}
                                </a>
                            ))}
                        </div>
                        <div className="flex flex-col gap-3">
                            <p className="text-sm font-bold">Mulai</p>
                            <Link
                                href={login()}
                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Masuk
                            </Link>
                            <Link
                                href={register()}
                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Daftar
                            </Link>
                            <a
                                href="#faq"
                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Pertanyaan umum
                            </a>
                        </div>
                    </div>
                    <div className="border-t border-border">
                        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground md:flex-row md:px-6">
                            <p>GTNIC 2026 · Web Development · Tim Kulakan</p>
                            <p>
                                Demo: owner@kulakan.com · staff@kulakan.com ·
                                kata sandi: password
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
