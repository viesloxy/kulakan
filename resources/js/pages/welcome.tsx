import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Calculator,
    Coins,
    CookingPot,
    Layers,
    Package,
    ShoppingBasket,
    Sparkles,
    TrendingUp,
    TriangleAlert,
} from 'lucide-react';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard } from '@/components/fx/fx-card';
import { IconCircle } from '@/components/fx/fx-icon';
import AppLogoIcon from '@/components/app-logo-icon';
import Reveal from '@/components/motion/reveal';
import { dashboard, login, register } from '@/routes';

const capabilities = [
    {
        code: 'CAP-A',
        title: 'Reorder Planner',
        description:
            'Masukkan kas yang tersedia, sistem menyusun rencana belanja bahan sesuai urgensi dan kelas ABC sampai kasnya habis secara efisien.',
        icon: ShoppingBasket,
        tone: 'soft' as const,
    },
    {
        code: 'CAP-B',
        title: 'Recipe-to-Stock',
        description:
            'Susun BOM resep per menu. Setiap pesanan di kasir otomatis memotong stok bahan sesuai kuantitas dan faktor waste.',
        icon: CookingPot,
        tone: 'soft' as const,
    },
    {
        code: 'CAP-C',
        title: 'Profitability',
        description:
            'Margin tiap menu dihitung dari HPP terkini, lengkap dengan status profitable, watchlist, atau loss serta simulasi kenaikan harga.',
        icon: TrendingUp,
        tone: 'soft' as const,
    },
    {
        code: 'CAP-D',
        title: 'Smart Recipe Costing',
        description:
            'HPP dihitung otomatis dari WAC bahan, overhead, dan waste. Proyeksi HPP ikut terbarui saat harga penawaran berubah.',
        icon: Calculator,
        tone: 'soft' as const,
    },
];

const steps = [
    {
        title: 'Catat bahan dan harga',
        description:
            'Masukkan bahan baku beserta kemasan belinya. WAC terbentuk otomatis setiap pembelian tercatat.',
    },
    {
        title: 'Susun resep menu',
        description:
            'Rangkai BOM per porsi. HPP jual tiap menu langsung terhitung, lengkap dengan marginnya.',
    },
    {
        title: 'Jual dan pantau margin',
        description:
            'Catat pesanan di POS. Stok terpotong, HPP ter-snapshot, dan alert menyala saat ada yang perlu ditindak.',
    },
];

const heroBars = [42, 58, 35, 72, 50, 88, 64];
const heroDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Kulakan · Smart Profit & Inventory for Small F&B" />
            <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
                {/* dekorasi latar global */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-40 right-[-10%] size-[34rem] rounded-full bg-[radial-gradient(circle,rgba(236,88,42,0.18),transparent_65%)]"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-[36rem] left-[-12%] size-[26rem] rounded-full bg-[radial-gradient(circle,rgba(43,107,230,0.10),transparent_65%)]"
                />

                {/* navigasi */}
                <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 pt-5 md:px-6">
                    <div className="flex h-12 items-center gap-2.5 fx-pill px-4">
                        <span className="flex size-7 items-center justify-center rounded-lg fx-coral">
                            <AppLogoIcon className="size-4.5 fill-current text-white" />
                        </span>
                        <span className="text-base font-bold tracking-tight">
                            Kulakan
                        </span>
                    </div>

                    <nav className="flex items-center gap-2">
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
                    </nav>
                </header>

                {/* hero */}
                <section className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-14 pb-20 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
                    <Reveal>
                        <div className="flex flex-col items-start gap-5">
                            <span className="inline-flex items-center gap-2 rounded-full bg-coral-soft px-3.5 py-1.5 text-xs font-semibold text-primary">
                                <Sparkles className="size-3.5" />
                                Smart Profit &amp; Inventory for Small F&amp;B
                            </span>
                            <h1 className="text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl">
                                Stok, HPP, dan margin warungmu, terhitung
                                otomatis.
                            </h1>
                            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
                                Kulakan mencatat bahan baku, menyusun resep
                                menjadi stok, menghitung HPP secara akurat, dan
                                menyarankan belanja restock paling hemat. Dibuat
                                untuk pemilik warung dan kafe kecil.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
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
                            <p className="text-xs text-muted-foreground">
                                Akun demo: owner@kulakan.com atau
                                staff@kulakan.com, kata sandi: password
                            </p>
                        </div>
                    </Reveal>

                    {/* visual hero: komposisi kartu + vektor */}
                    <Reveal delay={0.12}>
                        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                            {/* orbit & arsiran dekoratif */}
                            <svg
                                aria-hidden="true"
                                viewBox="0 0 400 400"
                                className="absolute -top-14 -right-10 size-72 text-primary/30"
                                fill="none"
                            >
                                <circle
                                    cx="200"
                                    cy="200"
                                    r="150"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeDasharray="4 10"
                                    strokeLinecap="round"
                                />
                                <circle
                                    cx="200"
                                    cy="50"
                                    r="6"
                                    fill="currentColor"
                                />
                                <circle
                                    cx="350"
                                    cy="200"
                                    r="4"
                                    fill="currentColor"
                                />
                            </svg>
                            <div
                                aria-hidden="true"
                                className="absolute -bottom-10 -left-10 size-40 rounded-full fx-hatch opacity-70"
                            />

                            {/* kartu grafik penjualan */}
                            <FxCard className="relative z-10 flex flex-col gap-3 p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold">
                                            Penjualan 7 hari
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Kopi &amp; Toast Nusantara
                                        </p>
                                    </div>
                                    <IconCircle
                                        icon={Coins}
                                        tone="soft"
                                        size="sm"
                                    />
                                </div>
                                <div className="flex h-28 items-end gap-2">
                                    {heroBars.map((h, i) => (
                                        <div
                                            key={heroDays[i]}
                                            className="flex h-full flex-1 flex-col justify-end gap-1"
                                        >
                                            <div
                                                className="w-full rounded-md bg-primary fx-hatch-coral"
                                                style={{ height: `${h}%` }}
                                            />
                                            <p className="text-center text-[10px] font-semibold text-muted-foreground">
                                                {heroDays[i]}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </FxCard>

                            {/* kartu nilai persediaan (coral) */}
                            <div className="relative z-20 mx-6 -mt-8 flex items-center justify-between rounded-3xl fx-coral p-4">
                                <div>
                                    <p className="text-xs font-medium text-white/90">
                                        Nilai persediaan
                                    </p>
                                    <p className="text-xl font-bold text-white tabular-nums">
                                        Rp 4.238.500
                                    </p>
                                </div>
                                <IconCircle
                                    icon={Package}
                                    tone="white"
                                    size="md"
                                />
                            </div>

                            {/* kartu margin + alert melayang */}
                            <div className="relative z-30 mt-4 flex flex-wrap items-center gap-3">
                                <FxCard className="flex flex-1 items-center gap-3 p-3.5">
                                    <IconCircle
                                        icon={TrendingUp}
                                        tone="soft"
                                        size="sm"
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold">
                                            Es Kopi Susu Aren
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            HPP Rp 11.244 · margin{' '}
                                            <span className="font-semibold text-success">
                                                48,9%
                                            </span>
                                        </p>
                                    </div>
                                </FxCard>
                                <FxCard className="flex items-center gap-3 p-3.5">
                                    <IconCircle
                                        icon={TriangleAlert}
                                        tone="soft"
                                        size="sm"
                                    />
                                    <p className="text-sm font-semibold">
                                        2 bahan menipis
                                    </p>
                                </FxCard>
                            </div>
                        </div>
                    </Reveal>
                </section>

                {/* kapabilitas */}
                <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 md:px-6">
                    <Reveal>
                        <div className="mx-auto max-w-2xl text-center">
                            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
                                <Layers className="size-3.5" />
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
                    </Reveal>
                    <div className="mt-10 grid gap-4 sm:grid-cols-2">
                        {capabilities.map((c, i) => (
                            <Reveal key={c.code} delay={0.05 * i}>
                                <FxCard className="flex h-full flex-col gap-4 p-6">
                                    <div className="flex items-center justify-between">
                                        <IconCircle
                                            icon={c.icon}
                                            tone={c.tone}
                                            size="lg"
                                        />
                                        <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold tracking-wide text-muted-foreground">
                                            {c.code}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold tracking-tight">
                                            {c.title}
                                        </h3>
                                        <p className="mt-1.5 text-sm text-muted-foreground">
                                            {c.description}
                                        </p>
                                    </div>
                                </FxCard>
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* cara kerja */}
                <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 md:px-6">
                    <Reveal>
                        <FxCard className="overflow-hidden p-6 md:p-10">
                            <div className="mx-auto max-w-2xl text-center">
                                <h2 className="text-3xl font-bold tracking-tight">
                                    Tiga langkah, langsung jalan
                                </h2>
                                <p className="mt-3 text-muted-foreground">
                                    Tidak perlu spreadsheet. Semua formula
                                    dihitung sistem, Anda cukup membaca
                                    hasilnya.
                                </p>
                            </div>
                            <div className="relative mt-10 grid gap-8 md:grid-cols-3">
                                {/* garis konektor putus-putus */}
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
                    </Reveal>
                </section>

                {/* banner CTA */}
                <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 md:px-6">
                    <Reveal>
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
                                Siap mengetahui margin sebenarnya dari tiap
                                menu?
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
                    </Reveal>
                </section>

                {/* footer */}
                <footer className="relative z-10 border-t border-border">
                    <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:px-6">
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-7 items-center justify-center rounded-lg fx-coral">
                                <AppLogoIcon className="size-4.5 fill-current text-white" />
                            </span>
                            <span className="font-bold text-foreground">
                                Kulakan
                            </span>
                            <span className="hidden sm:inline">
                                · Smart Profit &amp; Inventory for Small F&amp;B
                            </span>
                        </div>
                        <p>GTNIC 2026 · Web Development · Tim Kulakan</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
