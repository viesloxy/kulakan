import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion } from 'motion/react';
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
import type { ReactNode } from 'react';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard } from '@/components/fx/fx-card';
import { dashboard, login, register } from '@/routes';

function FadeIn({
    children,
    delay = 0,
    y = 24,
    className = '',
}: {
    children: ReactNode;
    delay?: number;
    y?: number;
    className?: string;
}) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

const navLinks = [
    ['#masalah', 'Masalah'],
    ['#kapabilitas', 'Kapabilitas'],
    ['#cara-kerja', 'Cara kerja'],
    ['#faq', 'FAQ'],
];

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
            'Masukkan kas yang tersedia, sistem menyusun rencana belanja bahan berdasarkan urgensi dan kelas ABC. Rencana disimpan, disetujui, lalu ditandai dibeli dan stok langsung bertambah.',
        visual: 'planner' as const,
    },
    {
        code: 'CAP-B',
        title: 'Recipe-to-Stock',
        description:
            'Susun BOM resep per menu: kuantitas per porsi dan faktor waste. Setiap pesanan di kasir memotong stok bahan lewat ledger append-only yang bisa diaudit.',
        visual: 'recipe' as const,
    },
    {
        code: 'CAP-C',
        title: 'Profitability',
        description:
            'Margin tiap menu diklasifikasi menjadi profitable, watchlist, atau loss. Simulasi harga bahan menjawab bagaimana jika cabai naik 20%, tanpa menyentuh data asli.',
        visual: 'profit' as const,
    },
    {
        code: 'CAP-D',
        title: 'Smart Recipe Costing',
        description:
            'HPP dihitung dari WAC yang diperbarui tiap pembelian, ditambah overhead per porsi. HPP saat penjualan disimpan permanen, laporan lama tidak berubah.',
        visual: 'costing' as const,
    },
];

const steps = [
    {
        title: 'Catat bahan dan harga',
        description:
            'Masukkan bahan beserta kemasan belinya. WAC terbentuk otomatis dari setiap pembelian.',
    },
    {
        title: 'Susun resep menu',
        description:
            'Rangkai BOM per porsi. HPP jual tiap menu langsung terhitung lengkap dengan marginnya.',
    },
    {
        title: 'Jual dan pantau margin',
        description:
            'Catat pesanan di POS. Stok terpotong dan alert menyala saat ada yang perlu ditindak.',
    },
];

const stats = [
    {
        value: 'Rp 11.244',
        label: 'HPP dihitung akurat dari resep',
    },
    {
        value: '-210 g',
        label: 'stok terpotong otomatis per 10 cup',
    },
    {
        value: '48,89%',
        label: 'margin terpantau per menu',
    },
    {
        value: 'Rp 483.000',
        label: 'rencana belanja dari kas Rp 500.000',
    },
];

const faqs = [
    {
        q: 'Dari mana HPP tiap menu dihitung?',
        a: 'Dari BOM resep dikali WAC (Weighted Average Cost) tiap bahan, ditambah overhead standar per porsi. WAC bergerak otomatis setiap pembelian dicatat, jadi HPP selalu mencerminkan biaya terkini.',
    },
    {
        q: 'Apakah stok benar-benar terpotong otomatis?',
        a: 'Ya. Setiap pesanan selesai di POS memotong stok bahan sesuai resep dan faktor waste. Pembatalan pesanan mengembalikan stok lewat jurnal pembalik, sehingga riwayat tetap bisa diaudit.',
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
        a: 'Pemilik mengakses dashboard, profitabilitas, restock, alert, dan pengaturan bahan atau menu. Staf kasir memakai POS dan bisa mencatat penyesuaian stok.',
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

/* ilustrasi vektor untuk banner CTA: cangkir, struk margin, koin */
function CtaIllustration() {
    return (
        <svg
            viewBox="0 0 280 220"
            className="mx-auto h-auto w-full max-w-[280px]"
            fill="none"
            aria-hidden="true"
        >
            <circle cx="140" cy="112" r="94" className="fill-white/10" />
            <circle cx="140" cy="112" r="72" className="fill-white/10" />

            {/* uap */}
            <path
                d="M118 78c-4-8 4-11 0-19M138 78c-4-8 4-11 0-19"
                className="stroke-white/60"
                strokeWidth="4"
                strokeLinecap="round"
            />

            {/* cangkir */}
            <rect
                x="90"
                y="102"
                width="84"
                height="14"
                rx="7"
                className="fill-white"
            />
            <path
                d="M96 120h72l-9 50a11 11 0 0 1-10.8 9h-32.4a11 11 0 0 1-10.8-9z"
                className="fill-white"
            />
            <path d="M106 132h52l-3.5 20h-45z" className="fill-[#C93E17]" />
            <path
                d="M176 126c15 3 15 26-7 30"
                className="stroke-white"
                strokeWidth="6"
                strokeLinecap="round"
            />

            {/* struk margin */}
            <g transform="rotate(9 214 100)">
                <rect
                    x="188"
                    y="56"
                    width="54"
                    height="86"
                    rx="7"
                    className="fill-white"
                />
                <rect
                    x="196"
                    y="68"
                    width="30"
                    height="6"
                    rx="3"
                    className="fill-[#FDB79E]"
                />
                <rect
                    x="196"
                    y="80"
                    width="38"
                    height="6"
                    rx="3"
                    className="fill-[#FDB79E]"
                />
                <rect
                    x="196"
                    y="92"
                    width="24"
                    height="6"
                    rx="3"
                    className="fill-[#FDB79E]"
                />
                <rect
                    x="196"
                    y="108"
                    width="38"
                    height="12"
                    rx="6"
                    className="fill-[#1D9E53]"
                />
                <path
                    d="M204 114l4 4 8-8"
                    className="stroke-white"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>

            {/* koin */}
            <circle cx="74" cy="168" r="14" className="fill-[#F2B824]" />
            <path
                d="M74 161v14M70 164.5h8M70 170.5h8"
                className="stroke-[#8A5A00]"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <circle cx="98" cy="184" r="10" className="fill-[#FFD866]" />
            <circle cx="58" cy="146" r="7" className="fill-white/40" />
        </svg>
    );
}

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Kulakan · Smart Profit & Inventory for Small F&B" />
            <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
                {/* gradasi hangat di belakang heading hero */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-[46rem] bg-[linear-gradient(180deg,rgba(236,88,42,0.12)_0%,rgba(247,148,108,0.07)_42%,rgba(244,244,242,0)_100%)] dark:bg-[linear-gradient(180deg,rgba(236,88,42,0.16)_0%,rgba(236,88,42,0.06)_42%,rgba(18,18,17,0)_100%)]"
                />

                {/* navigasi */}
                <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-md">
                    <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
                        <Link href="/" className="flex items-center gap-2.5">
                            <img
                                src="/images/logo.svg"
                                alt="Logo Kulakan"
                                className="size-8"
                            />
                            <span className="text-lg font-bold tracking-tight">
                                Kulakan
                            </span>
                        </Link>

                        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
                            {navLinks.map(([href, label]) => (
                                <a
                                    key={href}
                                    href={href}
                                    className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
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
                    </div>
                </header>

                {/* hero */}
                <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-16 text-center md:px-6 lg:pt-20">
                    <motion.span
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-xs font-semibold text-primary ring-1 ring-primary/20"
                    >
                        <Sparkles className="size-3.5" />
                        Smart Profit &amp; Inventory for Small F&amp;B
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.7,
                            delay: 0.08,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.06] font-bold tracking-tight text-balance sm:text-6xl"
                    >
                        Stok, HPP, dan margin warungmu, terhitung otomatis.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.7,
                            delay: 0.16,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg"
                    >
                        Kulakan mencatat bahan baku, menyusun resep menjadi
                        stok, menghitung HPP secara akurat, dan menyarankan
                        belanja restock paling hemat.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.7,
                            delay: 0.24,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="mt-8 flex flex-wrap items-center justify-center gap-3"
                    >
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
                    </motion.div>

                    {/* laptop melayang di bawah heading */}
                    <motion.div
                        initial={{ opacity: 0, y: 56, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                            duration: 1,
                            delay: 0.4,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="relative mx-auto mt-16 max-w-4xl"
                    >
                        {/* cahaya latar di belakang laptop */}
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -top-12 left-1/2 h-64 w-[46rem] max-w-none -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(236,88,42,0.18),transparent_65%)]"
                        />
                        <motion.div
                            animate={{ y: [0, -12, 0] }}
                            transition={{
                                duration: 7,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        >
                            <img
                                src="/images/app-preview.svg"
                                alt="Pratinjau antarmuka aplikasi Kulakan"
                                className="mx-auto w-full"
                            />
                        </motion.div>

                        {/* chip info melayang */}
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{
                                duration: 5.5,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                delay: 0.6,
                            }}
                            className="absolute top-[16%] -right-2 hidden items-center gap-2 rounded-2xl bg-card/90 px-4 py-2.5 text-xs font-semibold ring-1 ring-border backdrop-blur md:flex"
                        >
                            <span className="size-1.5 rounded-full bg-success" />
                            Margin 48,9% · Profitable
                        </motion.div>
                        <motion.div
                            animate={{ y: [0, -7, 0] }}
                            transition={{
                                duration: 6.5,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                delay: 1.2,
                            }}
                            className="absolute bottom-[10%] -left-2 hidden items-center gap-2 rounded-2xl bg-card/90 px-4 py-2.5 text-xs font-semibold ring-1 ring-border backdrop-blur md:flex"
                        >
                            <span className="size-1.5 rounded-full bg-warning" />
                            Alert: 2 bahan menipis
                        </motion.div>
                    </motion.div>
                </section>

                {/* angka kanonik */}
                <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-16 pb-4 md:px-6">
                    <FadeIn>
                        <FxCard className="overflow-hidden">
                            <div className="grid grid-cols-2 divide-border/70 lg:grid-cols-4 lg:divide-x">
                                {stats.map((s) => (
                                    <div
                                        key={s.value}
                                        className="flex flex-col gap-1 px-6 py-5 odd:border-r lg:odd:border-r-0"
                                    >
                                        <p className="text-xl font-bold tracking-tight tabular-nums">
                                            {s.value}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {s.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </FxCard>
                    </FadeIn>
                </section>

                {/* masalah */}
                <section
                    id="masalah"
                    className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-20 md:px-6"
                >
                    <FadeIn className="mx-auto max-w-2xl text-center">
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
                    </FadeIn>
                    <div className="mt-10 grid gap-4 md:grid-cols-3">
                        {problems.map((p, i) => (
                            <FadeIn key={p.title} delay={0.08 * i}>
                                <FxCard className="flex h-full flex-col gap-4 p-6">
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
                            </FadeIn>
                        ))}
                    </div>
                </section>

                {/* kapabilitas */}
                <section
                    id="kapabilitas"
                    className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-20 md:px-6"
                >
                    <FadeIn className="mx-auto max-w-2xl text-center">
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
                    </FadeIn>
                    <div className="mt-10 grid gap-4 md:grid-cols-2">
                        {capabilities.map((c, i) => {
                            const Visual = capabilityVisuals[c.visual];
                            return (
                                <FadeIn key={c.code} delay={0.06 * i}>
                                    <FxCard className="flex h-full flex-col gap-4 p-6">
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
                                </FadeIn>
                            );
                        })}
                    </div>
                </section>

                {/* cara kerja */}
                <section
                    id="cara-kerja"
                    className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-20 md:px-6"
                >
                    <FadeIn>
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
                                    Tidak perlu spreadsheet. Semua formula
                                    dihitung sistem, Anda cukup membaca
                                    hasilnya.
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
                    </FadeIn>
                </section>

                {/* FAQ */}
                <section
                    id="faq"
                    className="relative z-10 mx-auto w-full max-w-3xl scroll-mt-24 px-4 pb-20 md:px-6"
                >
                    <FadeIn className="text-center">
                        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
                            <CircleHelp className="size-3.5" />
                            Pertanyaan umum
                        </span>
                        <h2 className="mt-4 text-3xl font-bold tracking-tight">
                            Hal yang sering ditanyakan
                        </h2>
                    </FadeIn>
                    <div className="mt-8 flex flex-col gap-3">
                        {faqs.map((f, i) => (
                            <FadeIn key={f.q} delay={0.05 * i}>
                                <details
                                    className="group fx-soft rounded-2xl p-5"
                                    open={i === 0}
                                >
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">
                                        {f.q}
                                        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                                    </summary>
                                    <p className="mt-3 text-sm text-muted-foreground">
                                        {f.a}
                                    </p>
                                </details>
                            </FadeIn>
                        ))}
                    </div>
                </section>

                {/* banner CTA dengan ilustrasi */}
                <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 md:px-6">
                    <FadeIn>
                        <div className="relative overflow-hidden rounded-[2rem] fx-coral md:p-12">
                            <div
                                aria-hidden="true"
                                className="absolute inset-y-0 left-0 w-24 fx-hatch-coral opacity-60"
                            />
                            <div className="relative grid items-center gap-8 p-8 md:grid-cols-[1.3fr_1fr] md:p-12">
                                <div className="text-center md:text-left">
                                    <h2 className="text-2xl font-bold tracking-tight text-balance text-white md:text-3xl">
                                        Siap mengetahui margin sebenarnya dari
                                        tiap menu?
                                    </h2>
                                    <p className="mt-3 text-sm text-white/90 md:text-base">
                                        Mulai dari bahan pertama, biarkan
                                        Kulakan yang menghitung sisanya.
                                    </p>
                                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                                        <FxButton
                                            variant="soft"
                                            size="lg"
                                            className="bg-white! text-[#E84B20]! hover:bg-white/90!"
                                            onClick={() =>
                                                router.visit(register())
                                            }
                                        >
                                            Daftar sekarang
                                        </FxButton>
                                        <FxButton
                                            variant="soft"
                                            size="lg"
                                            className="bg-white/15! text-white! hover:bg-white/25!"
                                            onClick={() =>
                                                router.visit(login())
                                            }
                                        >
                                            Masuk
                                        </FxButton>
                                    </div>
                                </div>
                                <CtaIllustration />
                            </div>
                        </div>
                    </FadeIn>
                </section>

                {/* footer */}
                <footer className="relative z-10 border-t border-border">
                    <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 md:flex-row md:px-6">
                        <Link href="/" className="flex items-center gap-2.5">
                            <img
                                src="/images/logo.svg"
                                alt="Logo Kulakan"
                                className="size-8"
                            />
                            <span className="font-bold tracking-tight">
                                Kulakan
                            </span>
                        </Link>
                        <nav className="flex items-center gap-6">
                            {navLinks.map(([href, label]) => (
                                <a
                                    key={href}
                                    href={href}
                                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    {label}
                                </a>
                            ))}
                        </nav>
                        <p className="text-xs text-muted-foreground">
                            © 2026 Kulakan
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
