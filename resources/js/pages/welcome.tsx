import { Head, Link, router, usePage } from '@inertiajs/react';
import { animate, motion, useInView } from 'motion/react';
import {
    ArrowRight,
    Calculator,
    Camera,
    Check,
    ChevronDown,
    CircleHelp,
    CookingPot,
    Gauge,
    Layers,
    Moon,
    Package,
    RefreshCw,
    ShieldCheck,
    Sun,
    TriangleAlert,
} from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard } from '@/components/fx/fx-card';
import { useAppearance } from '@/hooks/use-appearance';
import { dashboard, login } from '@/routes';

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

function CountUp({
    target,
    prefix = '',
    suffix = '',
    decimals = 0,
}: {
    target: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: '-40px' });
    const format = (v: number) =>
        prefix +
        new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(v) +
        suffix;

    useEffect(() => {
        if (!inView || !ref.current) {
            return;
        }
        const controls = animate(0, target, {
            duration: 1.6,
            ease: [0.22, 1, 0.36, 1],
            onUpdate: (v) => {
                if (ref.current) {
                    ref.current.textContent = format(v);
                }
            },
        });
        return () => controls.stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inView, target]);

    return <span ref={ref}>{format(0)}</span>;
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

const dailyOps = [
    {
        icon: RefreshCw,
        text: 'WAC bergerak otomatis dari setiap pembelian',
    },
    {
        icon: Camera,
        text: 'HPP tersnapshot saat penjualan, laporan lama tidak berubah',
    },
    {
        icon: Layers,
        text: 'Ledger append-only: waste dan penyesuaian tercatat rapi',
    },
    {
        icon: ShieldCheck,
        text: 'Peran owner dan kasir dengan hak akses berbeda',
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
    { prefix: 'Rp ', target: 11244, label: 'HPP dihitung akurat dari resep' },
    {
        prefix: '',
        target: -210,
        suffix: ' g',
        label: 'stok terpotong otomatis per 10 cup',
    },
    {
        prefix: '',
        target: 48.89,
        suffix: '%',
        decimals: 2,
        label: 'margin terpantau per menu',
    },
    {
        prefix: 'Rp ',
        target: 483000,
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

const capabilityVisuals = {
    planner: '/images/cap-reorder.png',
    recipe: '/images/cap-recipe.png',
    profit: '/images/cap-profit.png',
    costing: '/images/cap-costing.png',
};

export default function Welcome() {
    const { auth } = usePage().props;
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    return (
        <>
            <Head title="Kulakan · Smart Profit & Inventory for Small F&B" />
            <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
                {/* gradasi coral yang jelas terlihat di belakang heading, latar tetap terang */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-[42rem]"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(236,88,42,0.32)_0%,rgba(247,148,108,0.20)_42%,rgba(244,244,242,0)_100%)] dark:bg-[linear-gradient(180deg,rgba(236,88,42,0.38)_0%,rgba(236,88,42,0.16)_45%,rgba(18,18,17,0)_100%)]" />
                    <div className="absolute -top-40 left-1/2 h-[26rem] w-[62rem] max-w-none -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(236,88,42,0.30),transparent_62%)]" />
                    <div className="absolute top-24 -left-24 size-[22rem] rounded-full bg-[radial-gradient(circle,rgba(247,148,108,0.26),transparent_65%)] blur-2xl" />
                    <div className="absolute top-10 -right-20 size-[20rem] rounded-full bg-[radial-gradient(circle,rgba(236,88,42,0.24),transparent_65%)] blur-2xl" />
                </div>

                {/* navbar kapsul responsif */}
                <div className="sticky top-2 z-40 px-3 pt-2 sm:top-3 sm:px-4 sm:pt-3 md:top-4 md:pt-4">
                    <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 rounded-full bg-card/90 px-3 ring-1 ring-border backdrop-blur-md sm:gap-4 sm:px-5 md:h-16 md:px-6">
                        <Link
                            href="/"
                            className="flex shrink-0 items-center gap-2 sm:gap-3"
                        >
                            <img
                                src="/images/logo.svg"
                                alt="Logo Kulakan"
                                className="size-7 sm:size-8 md:size-9"
                            />
                            <span className="text-lg font-bold tracking-tight sm:text-xl">
                                Kulakan
                            </span>
                        </Link>

                        <div className="hidden items-center gap-1 lg:flex">
                            {navLinks.map(([href, label]) => (
                                <a
                                    key={href}
                                    href={href}
                                    className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                >
                                    {label}
                                </a>
                            ))}
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    updateAppearance(isDark ? 'light' : 'dark')
                                }
                                aria-label={
                                    isDark
                                        ? 'Aktifkan mode terang'
                                        : 'Aktifkan mode gelap'
                                }
                                title={isDark ? 'Mode terang' : 'Mode gelap'}
                                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary sm:size-10"
                            >
                                {isDark ? (
                                    <Sun className="size-4 sm:size-[18px]" />
                                ) : (
                                    <Moon className="size-4 sm:size-[18px]" />
                                )}
                            </button>

                            {auth.user ? (
                                <FxButton
                                    variant="coral"
                                    className="h-9 px-3.5 text-xs sm:h-10 sm:px-4 sm:text-sm"
                                    onClick={() => router.visit(dashboard())}
                                >
                                    <span className="hidden sm:inline">
                                        Buka Dashboard
                                    </span>
                                    <span className="sm:hidden">Dashboard</span>
                                    <ArrowRight className="size-3.5 sm:size-4" />
                                </FxButton>
                            ) : (
                                <FxButton
                                    variant="coral"
                                    className="h-9 px-3.5 text-xs sm:h-10 sm:px-4 sm:text-sm"
                                    onClick={() => router.visit(login())}
                                >
                                    Masuk
                                    <ArrowRight className="size-3.5 sm:size-4" />
                                </FxButton>
                            )}
                        </div>
                    </nav>
                </div>

                {/* hero di atas gradasi coral */}
                <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-10 text-center sm:pt-14 md:px-6 lg:pt-20">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="mx-auto max-w-3xl text-3xl leading-[1.14] font-semibold tracking-tight text-balance sm:text-5xl sm:leading-[1.06] md:text-6xl lg:text-7xl"
                    >
                        Stok, HPP, dan margin warungmu, terhitung otomatis.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.8,
                            delay: 0.1,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-base md:text-lg"
                    >
                        Kulakan mencatat bahan baku, menyusun resep menjadi
                        stok, menghitung HPP secara akurat, dan menyarankan
                        belanja restock paling hemat.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.8,
                            delay: 0.2,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="mt-6 flex w-full flex-col items-center justify-center gap-3 sm:mt-8 sm:w-auto sm:flex-row"
                    >
                        <FxButton
                            variant="coral"
                            size="lg"
                            className="w-full sm:w-auto"
                            onClick={() => router.visit(login())}
                        >
                            Masuk ke aplikasi
                            <ArrowRight className="size-4" />
                        </FxButton>
                    </motion.div>

                    {/* laptop melayang di bawah heading */}
                    <motion.div
                        initial={{ opacity: 0, y: 56, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                            duration: 1,
                            delay: 0.35,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="relative z-20 mx-auto mt-4 max-w-4xl px-1 sm:mt-6 sm:px-6"
                    >
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

                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{
                                duration: 5.5,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                delay: 0.6,
                            }}
                            className="absolute top-[16%] right-3 hidden items-center gap-2 rounded-2xl bg-card/90 px-3.5 py-2 text-xs font-semibold shadow-sm ring-1 ring-border backdrop-blur md:right-6 md:flex"
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
                            className="absolute bottom-[10%] left-3 hidden items-center gap-2 rounded-2xl bg-card/90 px-3.5 py-2 text-xs font-semibold shadow-sm ring-1 ring-border backdrop-blur md:left-6 md:flex"
                        >
                            <span className="size-1.5 rounded-full bg-warning" />
                            Alert: 2 bahan menipis
                        </motion.div>
                    </motion.div>

                    {/* micro-badges untuk mobile di bawah preview laptop */}
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 md:hidden">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 text-[11px] font-semibold shadow-sm ring-1 ring-border backdrop-blur">
                            <span className="size-1.5 rounded-full bg-success" />
                            Margin 48,9% · Profitable
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 text-[11px] font-semibold shadow-sm ring-1 ring-border backdrop-blur">
                            <span className="size-1.5 rounded-full bg-warning" />
                            Alert: 2 bahan menipis
                        </span>
                    </div>
                </section>

                {/* angka kanonik */}
                <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-12 pb-6 sm:pt-16 md:px-6">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-y-12 lg:grid-cols-4">
                        {stats.map((s, i) => (
                            <FadeIn
                                key={s.label}
                                delay={0.1 * i}
                                className="flex flex-col items-center gap-1.5 px-1 text-center sm:gap-2.5"
                            >
                                <p className="text-2xl font-semibold tracking-tight text-primary tabular-nums sm:text-4xl md:text-5xl">
                                    <CountUp
                                        target={s.target}
                                        prefix={s.prefix}
                                        suffix={s.suffix ?? ''}
                                        decimals={s.decimals ?? 0}
                                    />
                                </p>
                                <p className="max-w-[14rem] text-xs leading-snug text-muted-foreground sm:max-w-[16rem] sm:text-sm sm:leading-normal">
                                    {s.label}
                                </p>
                            </FadeIn>
                        ))}
                    </div>
                </section>

                {/* masalah */}
                <section
                    id="masalah"
                    className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-14 sm:scroll-mt-28 sm:py-20 md:px-6"
                >
                    <FadeIn className="mx-auto max-w-2xl text-center">
                        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
                            <TriangleAlert className="size-3.5" />
                            Masalah yang diselesaikan
                        </span>
                        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-balance sm:text-3xl md:text-4xl">
                            Tiga hal yang menggerus laba warung
                        </h2>
                        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                            Warung kecil jarang kekurangan penjualan; yang
                            menipis adalah pemahaman terhadap biaya dan stok.
                        </p>
                    </FadeIn>
                    <div className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-3">
                        {problems.map((p, i) => (
                            <FadeIn key={p.title} delay={0.08 * i}>
                                <FxCard className="flex h-full flex-col gap-3.5 p-5 sm:gap-4 sm:p-6">
                                    <span className="flex size-10 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground">
                                        <p.icon className="size-5" />
                                    </span>
                                    <div>
                                        <h3 className="text-base font-semibold tracking-tight sm:text-lg">
                                            {p.title}
                                        </h3>
                                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
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
                    className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-20 px-4 pb-14 sm:scroll-mt-28 sm:pb-20 md:px-6"
                >
                    <FadeIn className="mx-auto max-w-2xl text-center">
                        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
                            <Calculator className="size-3.5" />
                            Empat kapabilitas inti
                        </span>
                        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-balance sm:text-3xl md:text-4xl">
                            Satu aplikasi untuk belanja, resep, dan laba
                        </h2>
                        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                            Setiap rupiah keluar-masuk dapur terhubung: dari
                            pembelian bahan sampai margin per menu.
                        </p>
                    </FadeIn>
                    <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-2">
                        {capabilities.map((c, i) => {
                            const Visual = capabilityVisuals[c.visual];
                            return (
                                <FadeIn key={c.code} delay={0.06 * i}>
                                    <FxCard className="flex h-full flex-col gap-3.5 p-4 sm:gap-4 sm:p-5 md:p-6">
                                        <div className="overflow-hidden rounded-xl ring-1 ring-border sm:rounded-2xl">
                                            <img
                                                src={Visual}
                                                alt={`Tampilan fitur ${c.title}`}
                                                className="aspect-[16/10] w-full object-cover object-top"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-base font-semibold tracking-tight sm:text-lg">
                                                {c.title}
                                            </h3>
                                            <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground sm:px-3 sm:py-1 sm:text-[11px]">
                                                {c.code}
                                            </span>
                                        </div>
                                        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                            {c.description}
                                        </p>
                                    </FxCard>
                                </FadeIn>
                            );
                        })}
                    </div>
                </section>

                {/* untuk operasi harian, dengan foto */}
                <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 sm:pb-24 md:px-6">
                    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
                        <FadeIn>
                            <div className="relative mb-6 sm:mb-8 lg:mb-0">
                                <div className="overflow-hidden rounded-2xl ring-1 ring-border sm:rounded-[2rem]">
                                    <img
                                        src="/images/operasi-kedai.jpg"
                                        alt="Suasana kedai kopi yang beroperasi setiap hari"
                                        className="aspect-[4/3] w-full object-cover"
                                    />
                                </div>
                                <motion.div
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{
                                        duration: 6,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }}
                                    className="absolute -bottom-5 left-3 flex items-center gap-2.5 rounded-xl bg-card/95 px-3 py-2 shadow-md ring-1 ring-border backdrop-blur sm:-bottom-7 sm:left-6 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3"
                                >
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-soft text-success sm:size-9">
                                        <Check className="size-3.5 sm:size-4" />
                                    </span>
                                    <div className="text-left">
                                        <p className="text-[11px] font-semibold sm:text-xs">
                                            HPP tersnapshot
                                        </p>
                                        <p className="text-[10px] text-muted-foreground sm:text-[11px]">
                                            Rp 11.244 tercatat per porsi
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        </FadeIn>
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
                                <Gauge className="size-3.5" />
                                Untuk operasi harian
                            </span>
                            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-balance sm:text-3xl md:text-4xl">
                                Dirancang untuk kenyataan kedai, bukan laporan
                                ideal
                            </h2>
                            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                                Data yang masuk adalah yang terjadi di kasir dan
                                dapur: pembelian, penjualan, waste, dan
                                perubahan harga.
                            </p>
                            <ul className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:gap-3">
                                {dailyOps.map((item, i) => (
                                    <FadeIn
                                        key={item.text}
                                        delay={0.08 * i}
                                        y={16}
                                    >
                                        <li className="flex items-center gap-3.5 rounded-xl bg-secondary/70 p-3.5 sm:gap-4 sm:rounded-2xl sm:p-4">
                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-primary ring-1 ring-primary/25 sm:size-10">
                                                <item.icon className="size-4 sm:size-[18px]" />
                                            </span>
                                            <p className="text-xs font-medium sm:text-sm">
                                                {item.text}
                                            </p>
                                        </li>
                                    </FadeIn>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* cara kerja: timeline vertikal beranimasi */}
                <section
                    id="cara-kerja"
                    className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-20 px-4 pb-16 sm:scroll-mt-28 sm:pb-24 md:px-6"
                >
                    <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
                        <FadeIn className="lg:sticky lg:top-28 lg:self-start">
                            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
                                <CookingPot className="size-3.5" />
                                Cara kerja
                            </span>
                            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-balance sm:text-3xl md:text-4xl">
                                Tiga langkah, langsung jalan
                            </h2>
                            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                                Tidak perlu spreadsheet. Semua formula dihitung
                                sistem, Anda cukup membaca hasilnya.
                            </p>
                            <p className="mt-6 hidden rounded-2xl bg-secondary/70 p-4 text-sm text-muted-foreground sm:mt-8 lg:block">
                                Seluruh perhitungan mengikuti rumus bisnis yang
                                baku, tanpa entri manual dan tanpa excel.
                            </p>
                        </FadeIn>

                        <div className="flex flex-col">
                            {steps.map((s, i) => (
                                <motion.div
                                    key={s.title}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-60px' }}
                                    transition={{
                                        duration: 0.7,
                                        delay: 0.1 * i,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    className="relative flex gap-4 pb-8 last:pb-0 sm:gap-6 sm:pb-12"
                                >
                                    <div className="flex flex-col items-center">
                                        <motion.span
                                            initial={{ scale: 0.6, opacity: 0 }}
                                            whileInView={{
                                                scale: 1,
                                                opacity: 1,
                                            }}
                                            viewport={{
                                                once: true,
                                                margin: '-60px',
                                            }}
                                            transition={{
                                                duration: 0.5,
                                                delay: 0.15 + 0.1 * i,
                                                ease: [0.22, 1, 0.36, 1],
                                            }}
                                            className="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full fx-coral text-base font-semibold text-white sm:size-14 sm:text-xl"
                                        >
                                            {i + 1}
                                        </motion.span>
                                        {i < steps.length - 1 ? (
                                            <motion.span
                                                initial={{ scaleY: 0 }}
                                                whileInView={{ scaleY: 1 }}
                                                viewport={{
                                                    once: true,
                                                    margin: '-60px',
                                                }}
                                                transition={{
                                                    duration: 0.6,
                                                    delay: 0.3 + 0.1 * i,
                                                    ease: 'easeOut',
                                                }}
                                                className="mt-2.5 w-px flex-1 origin-top bg-gradient-to-b from-primary/50 to-border sm:mt-3"
                                            />
                                        ) : null}
                                    </div>
                                    <div className="pt-1 pb-2 text-left">
                                        <h3 className="text-lg font-semibold tracking-tight sm:text-xl">
                                            {s.title}
                                        </h3>
                                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:mt-2 sm:text-sm">
                                            {s.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section
                    id="faq"
                    className="relative z-10 mx-auto w-full max-w-3xl scroll-mt-20 px-4 pb-16 sm:scroll-mt-28 sm:pb-20 md:px-6"
                >
                    <FadeIn className="text-center">
                        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
                            <CircleHelp className="size-3.5" />
                            Pertanyaan umum
                        </span>
                        <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
                            Hal yang sering ditanyakan
                        </h2>
                    </FadeIn>
                    <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:gap-3">
                        {faqs.map((f, i) => (
                            <FadeIn key={f.q} delay={0.05 * i}>
                                <details
                                    className="group fx-soft rounded-xl p-4 sm:rounded-2xl sm:p-5"
                                    open={i === 0}
                                >
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold sm:text-base [&::-webkit-details-marker]:hidden">
                                        {f.q}
                                        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                                    </summary>
                                    <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground sm:mt-3 sm:text-sm">
                                        {f.a}
                                    </p>
                                </details>
                            </FadeIn>
                        ))}
                    </div>
                </section>

                {/* CTA: foto kedai penuh dengan overlay gelap, konten ketengah */}
                <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 sm:pb-24 md:px-6">
                    <FadeIn>
                        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl md:rounded-[2.5rem]">
                            <img
                                src="/images/cta-kedai.jpg"
                                alt="Kedai kopi yang mengelola bahan dan margin dengan Kulakan"
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,18,13,0.82)_0%,rgba(58,26,12,0.72)_55%,rgba(127,26,0,0.78)_100%)]" />
                            <div className="relative flex flex-col items-center gap-4 px-4 py-12 text-center sm:gap-5 sm:px-6 sm:py-16 md:py-24">
                                <h2 className="max-w-2xl text-2xl leading-[1.14] font-semibold tracking-tight text-balance text-white sm:text-3xl sm:leading-[1.1] md:text-5xl">
                                    Siap mengetahui margin sebenarnya dari tiap
                                    menu?
                                </h2>
                                <p className="max-w-xl text-sm text-white/85 sm:text-base md:text-lg">
                                    Mulai dari bahan pertama, biarkan Kulakan
                                    yang menghitung sisanya.
                                </p>
                                <div className="mt-2 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
                                    <FxButton
                                        variant="coral"
                                        size="lg"
                                        className="ring-1! ring-white/30!"
                                        onClick={() => router.visit(login())}
                                    >
                                        Masuk ke Kulakan
                                        <ArrowRight className="size-4" />
                                    </FxButton>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium text-white/75 sm:mt-4 sm:text-xs">
                                    {[
                                        'Gratis untuk dicoba',
                                        'Data contoh siap pakai',
                                        'Tanpa instalasi',
                                    ].map((t) => (
                                        <span
                                            key={t}
                                            className="inline-flex items-center gap-1.5"
                                        >
                                            <Check className="size-3.5" />
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </section>

                {/* footer */}
                <footer className="relative z-10 border-t border-border">
                    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:gap-10 sm:py-12 md:grid-cols-[1.5fr_1fr] md:px-6">
                        <div>
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <img
                                    src="/images/logo.svg"
                                    alt="Logo Kulakan"
                                    className="size-8 sm:size-9"
                                />
                                <span className="text-base font-bold tracking-tight sm:text-lg">
                                    Kulakan
                                </span>
                            </div>
                            <p className="mt-3 max-w-md text-xs leading-relaxed text-muted-foreground sm:mt-4 sm:text-sm">
                                Aplikasi stok, HPP, dan margin untuk warung dan
                                kafe kecil. Dari bahan baku sampai laba,
                                semuanya dalam satu tempat.
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold sm:text-sm">
                                Kapabilitas
                            </p>
                            <ul className="mt-2.5 flex flex-col gap-2 text-xs text-muted-foreground sm:mt-3 sm:gap-2.5 sm:text-sm">
                                {capabilities.map((c) => (
                                    <li key={c.code}>
                                        <a
                                            href="#kapabilitas"
                                            className="transition-colors hover:text-foreground"
                                        >
                                            {c.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-border">
                        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:py-5 md:px-6">
                            <p className="text-[11px] text-muted-foreground sm:text-xs">
                                © 2026 Kulakan
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
