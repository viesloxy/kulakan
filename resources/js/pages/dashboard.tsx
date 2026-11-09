import { router } from '@inertiajs/react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    Award,
    Box,
    Crown,
    Medal,
    Package,
    Receipt,
    ShoppingBasket,
    TrendingUp,
    TriangleAlert,
    Utensils,
    Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';
import PageShell from '@/components/page-shell';
import { formatPercent, formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

type MenuCounts = {
    profitable: number;
    watchlist: number;
    loss: number;
    total: number;
};
type ChartPoint = { date: string; label: string; total: number };
type RecentOrder = {
    id: string;
    db_id: number;
    description: string;
    total: number;
    status: string;
    can_void: boolean;
};
type RestockSummary = {
    total_cost: number;
    remaining_cash: number;
    cash_amount: number;
    status: string;
    exists: boolean;
};
type PurchaseItem = {
    ingredient: string;
    base_unit: string;
    quantity: string;
    unit_price: string;
    total: number;
    reason: string | null;
    created_at: string | null;
};
type DailyReport = {
    date: string;
    sales: {
        orders: number;
        revenue: number;
        items: number;
        cash: number;
        qris: number;
    };
    purchases: { count: number; total_value: number; items: PurchaseItem[] };
    orders: RecentOrder[];
};

type TopProfitableMenu = {
    id: number;
    name: string;
    category: string;
    selling_price: number;
    current_hpp: number;
    margin_rupiah: number;
    margin_pct: number;
    status: string;
    image_url: string | null;
};

type Props = {
    greeting_name: string;
    inventory_value: number;
    low_stock_count: number;
    menu_counts: MenuCounts;
    active_alerts_count: number;
    orders_today_count: number;
    sales_today: number;
    wallets: { cash: number; qris: number };
    cash_budget: number;
    restock: RestockSummary;
    chart: ChartPoint[];
    recent_orders: RecentOrder[];
    daily_report: DailyReport;
    top_profitable_menus?: TopProfitableMenu[];
};

export default function Dashboard({
    greeting_name,
    inventory_value,
    low_stock_count,
    menu_counts,
    active_alerts_count,
    orders_today_count,
    sales_today,
    wallets,
    cash_budget,
    restock,
    chart,
    recent_orders,
    daily_report,
    top_profitable_menus = [],
}: Props) {
    const kpis = [
        {
            label: 'Nilai persediaan',
            value: formatRupiah(inventory_value),
            caption: `${low_stock_count} bahan menipis`,
            icon: Package,
            tone: 'coral' as const,
            highlight: true,
            href: '/bahan-baku',
        },
        {
            label: 'Menu profitable',
            value: String(menu_counts.profitable),
            caption: `dari ${menu_counts.total} menu`,
            icon: TrendingUp,
            tone: 'soft' as const,
            href: '/profitabilitas',
        },
        {
            label: 'Alert aktif',
            value: String(active_alerts_count),
            caption: 'perlu tindakan',
            icon: TriangleAlert,
            tone: 'danger' as const,
            href: '/alert',
        },
        {
            label: 'Pesanan',
            value: String(orders_today_count),
            caption: formatRupiah(sales_today),
            icon: Receipt,
            tone: 'soft' as const,
            href: '/pesanan',
        },
    ];

    const quickActions = [
        {
            title: 'POS Kasir',
            description: 'Catat transaksi baru',
            href: '/pos',
            icon: Receipt,
            badge: `${orders_today_count} transaksi`,
            badgeTone: 'default' as const,
        },
        {
            title: 'Rencana Belanja',
            description: 'Kalkulator restock kas',
            href: '/restock',
            icon: ShoppingBasket,
            badge: restock.exists ? restock.status : 'Preview',
            badgeTone: restock.exists
                ? ('success' as const)
                : ('default' as const),
        },
        {
            title: 'Bahan Baku',
            description: 'Stok & mutasi bahan',
            href: '/bahan-baku',
            icon: Box,
            badge:
                low_stock_count > 0
                    ? `${low_stock_count} menipis`
                    : 'Stok aman',
            badgeTone:
                low_stock_count > 0
                    ? ('danger' as const)
                    : ('success' as const),
        },
        {
            title: 'Menu & Resep',
            description: 'BOM & kalkulasi HPP',
            href: '/menu',
            icon: Utensils,
            badge: `${menu_counts.total} menu`,
            badgeTone: 'default' as const,
        },
        {
            title: 'Profitabilitas',
            description: 'Analisis margin menu',
            href: '/profitabilitas',
            icon: TrendingUp,
            badge: `${menu_counts.profitable} untung`,
            badgeTone: 'success' as const,
        },
        {
            title: 'Alert Sistem',
            description: 'Peringatan & anomali',
            href: '/alert',
            icon: TriangleAlert,
            badge:
                active_alerts_count > 0
                    ? `${active_alerts_count} perlu aksi`
                    : 'Semua aman',
            badgeTone:
                active_alerts_count > 0
                    ? ('danger' as const)
                    : ('success' as const),
        },
    ];

    const maxBar = Math.max(1, ...chart.map((c) => c.total));
    const usedPct =
        restock.cash_amount > 0
            ? Math.min(100, (restock.total_cost / restock.cash_amount) * 100)
            : 0;

    function voidOrder(order: RecentOrder) {
        router.post(
            `/pos/${order.db_id}/void`,
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Pesanan dibatalkan', {
                        description: `${order.id}: stok dikembalikan.`,
                    }),
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ??
                            'Gagal membatalkan pesanan.',
                    ),
            },
        );
    }

    function changeReportDate(date: string) {
        router.get(
            '/dashboard',
            { report_date: date },
            {
                only: ['daily_report'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    return (
        <PageShell
            title={`Selamat datang, ${greeting_name}`}
            headTitle="Dashboard"
            description="Ringkasan kas, stok, dan margin dapur hari ini."
        >
            {/* 1. Akses Cepat (Quick Actions Bar) */}
            <Reveal delay={0.03} className="w-full min-w-0">
                <FxCard className="w-full min-w-0 p-4 sm:p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="flex size-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Zap className="size-4" />
                            </span>
                            <div>
                                <h2 className="text-xs font-semibold text-foreground sm:text-sm">
                                    Akses Cepat
                                </h2>
                                <p className="text-[10px] text-muted-foreground sm:text-[11px]">
                                    Pintasan navigasi langsung ke modul
                                    operasional utama
                                </p>
                            </div>
                        </div>
                        <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">
                            Pilih modul untuk langsung bekerja
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-6">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.title}
                                    type="button"
                                    onClick={() => router.visit(action.href)}
                                    className="group relative flex flex-col justify-between rounded-2xl border border-border/50 bg-secondary/40 p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:p-3"
                                >
                                    <div className="flex items-start justify-between gap-1.5">
                                        <div className="flex size-7 items-center justify-center rounded-xl bg-card text-foreground shadow-xs transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:size-8">
                                            <Icon className="size-3.5 sm:size-4" />
                                        </div>
                                        <ArrowUpRight className="size-3.5 text-muted-foreground opacity-30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary group-hover:opacity-100" />
                                    </div>
                                    <div className="mt-2.5 sm:mt-3">
                                        <p className="text-xs leading-tight font-bold text-foreground transition-colors group-hover:text-primary">
                                            {action.title}
                                        </p>
                                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-[11px]">
                                            {action.description}
                                        </p>
                                        {action.badge ? (
                                            <span
                                                className={cn(
                                                    'mt-1.5 inline-block max-w-full truncate rounded-full px-2 py-0.5 text-[9px] font-semibold sm:mt-2 sm:text-[10px]',
                                                    action.badgeTone ===
                                                        'danger'
                                                        ? 'bg-danger-soft text-danger'
                                                        : action.badgeTone ===
                                                            'success'
                                                          ? 'bg-success-soft text-success'
                                                          : 'border border-border/50 bg-card text-muted-foreground',
                                                )}
                                            >
                                                {action.badge}
                                            </span>
                                        ) : null}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </FxCard>
            </Reveal>

            <Reveal delay={0.06} className="w-full min-w-0">
                <section className="grid w-full min-w-0 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-[1fr_1.3fr_1fr]">
                    <FxCard className="flex min-w-0 flex-col justify-between p-4 sm:p-5">
                        <div>
                            <div className="flex items-start justify-between">
                                <span className="text-xs text-muted-foreground sm:text-sm">
                                    Kas untuk belanja
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:py-1 sm:text-xs">
                                    <span className="size-1.5 rounded-full bg-success" />
                                    Hari ini
                                </span>
                            </div>
                            <p className="mt-1 text-2xl leading-tight font-bold tracking-tight break-words tabular-nums sm:text-3xl sm:whitespace-nowrap lg:text-[2rem]">
                                {formatRupiah(cash_budget)}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="rounded-full bg-success-soft px-2 py-0.5 font-semibold text-success">
                                    {restock.exists
                                        ? restock.status
                                        : 'preview'}
                                </span>
                                rencana restock
                            </div>

                            <div className="mt-4 flex flex-col gap-2 sm:flex-row md:flex-col">
                                <FxButton
                                    variant="coral"
                                    className="h-9 w-full text-xs sm:h-10 sm:text-sm"
                                    onClick={() => router.visit('/pos')}
                                >
                                    <ArrowUpRight className="size-4" />
                                    Catat pesanan
                                </FxButton>
                                <FxButton
                                    variant="soft"
                                    className="h-9 w-full text-xs sm:h-10 sm:text-sm"
                                    onClick={() => router.visit('/restock')}
                                >
                                    <ArrowDownLeft className="size-4" />
                                    Rencana belanja
                                </FxButton>
                            </div>
                        </div>

                        <FxSoft className="mt-4 p-3 sm:p-4">
                            <div className="mb-2.5 flex items-center justify-between text-xs font-semibold">
                                <span>Penjualan hari ini</span>
                                <span className="font-medium text-muted-foreground">
                                    {formatRupiah(sales_today)}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                                <div
                                    className="flex flex-col justify-between rounded-xl bg-card p-2 sm:rounded-2xl sm:p-2.5 md:p-3"
                                    title={`Kas tunai: ${formatRupiah(wallets.cash)}`}
                                >
                                    <p className="truncate text-[10px] font-semibold text-muted-foreground sm:text-[11px]">
                                        Kas tunai
                                    </p>
                                    <p className="mt-0.5 truncate text-[11px] font-bold tabular-nums sm:mt-1 sm:text-xs md:text-sm">
                                        {formatRupiah(wallets.cash)}
                                    </p>
                                    <p className="mt-0.5 truncate text-[9px] font-semibold text-success sm:mt-1 sm:text-[10px] md:text-[11px]">
                                        Tunai
                                    </p>
                                </div>
                                <div
                                    className="flex flex-col justify-between rounded-xl bg-card p-2 sm:rounded-2xl sm:p-2.5 md:p-3"
                                    title={`QRIS: ${formatRupiah(wallets.qris)}`}
                                >
                                    <p className="truncate text-[10px] font-semibold text-muted-foreground sm:text-[11px]">
                                        QRIS
                                    </p>
                                    <p className="mt-0.5 truncate text-[11px] font-bold tabular-nums sm:mt-1 sm:text-xs md:text-sm">
                                        {formatRupiah(wallets.qris)}
                                    </p>
                                    <p className="mt-0.5 truncate text-[9px] font-semibold text-success sm:mt-1 sm:text-[10px] md:text-[11px]">
                                        Digital
                                    </p>
                                </div>
                                <div
                                    className="flex flex-col justify-between rounded-xl bg-card p-2 sm:rounded-2xl sm:p-2.5 md:p-3"
                                    title={`Total: ${formatRupiah(wallets.cash + wallets.qris)}`}
                                >
                                    <p className="truncate text-[10px] font-semibold text-muted-foreground sm:text-[11px]">
                                        Total
                                    </p>
                                    <p className="mt-0.5 truncate text-[11px] font-bold tabular-nums sm:mt-1 sm:text-xs md:text-sm">
                                        {formatRupiah(
                                            wallets.cash + wallets.qris,
                                        )}
                                    </p>
                                    <p className="mt-0.5 truncate text-[9px] font-semibold text-success sm:mt-1 sm:text-[10px] md:text-[11px]">
                                        Hari ini
                                    </p>
                                </div>
                            </div>
                        </FxSoft>
                    </FxCard>

                    <FxCard className="flex min-w-0 flex-col gap-3 p-3 sm:p-4">
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => router.visit(kpis[0].href)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && router.visit(kpis[0].href)
                            }
                            title="Klik untuk melihat & kelola Bahan Baku"
                            className="group flex flex-[1.2] cursor-pointer flex-col justify-between rounded-xl fx-coral p-3.5 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:rounded-2xl sm:p-4"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-medium text-white sm:text-sm">
                                    {kpis[0].label}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span className="hidden items-center gap-1 text-[11px] font-medium text-white/80 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
                                        Bahan baku
                                        <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </span>
                                    <IconCircle
                                        icon={kpis[0].icon}
                                        tone="white"
                                        size="sm"
                                    />
                                </div>
                            </div>
                            <div className="mt-3">
                                <p
                                    className="truncate text-xl font-bold tracking-tight text-white tabular-nums sm:text-2xl lg:text-[1.75rem]"
                                    title={kpis[0].value}
                                >
                                    {kpis[0].value}
                                </p>
                                <p className="mt-1 flex items-center justify-between text-[10px] font-semibold text-white/90 sm:text-[11px] md:text-xs">
                                    <span>{kpis[0].caption}</span>
                                    <span className="underline underline-offset-2 opacity-90 group-hover:opacity-100">
                                        Kelola stok &rarr;
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* KPI Sub-cards: responsif dengan 1-kolom di HP agar mudah dibaca, 3-kolom di tablet/desktop */}
                        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:gap-3">
                            {kpis.slice(1).map((k) => (
                                <div
                                    key={k.label}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => router.visit(k.href)}
                                    onKeyDown={(e) =>
                                        e.key === 'Enter' &&
                                        router.visit(k.href)
                                    }
                                    title={`Klik untuk ke halaman ${k.label}`}
                                    className="group flex cursor-pointer flex-row items-center justify-between fx-soft rounded-xl p-3 transition-all duration-200 hover:scale-[1.01] hover:bg-hover-soft hover:shadow-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:flex-col sm:items-stretch sm:justify-between sm:rounded-2xl sm:p-3.5 sm:hover:scale-[1.02]"
                                >
                                    <div className="flex items-center gap-2.5 sm:items-start sm:justify-between sm:gap-1.5">
                                        <div className="sm:hidden">
                                            <IconCircle
                                                icon={k.icon}
                                                tone={k.tone}
                                                size="sm"
                                            />
                                        </div>
                                        <span className="text-xs font-medium transition-colors group-hover:text-primary sm:text-sm">
                                            {k.label}
                                        </span>
                                        <div className="hidden sm:flex sm:items-center sm:gap-1">
                                            <ArrowUpRight className="size-3 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary group-hover:opacity-100" />
                                            <IconCircle
                                                icon={k.icon}
                                                tone={k.tone}
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-right sm:mt-2.5 sm:block sm:text-left">
                                        <div>
                                            <p className="text-base font-bold tracking-tight tabular-nums transition-colors group-hover:text-primary sm:text-lg md:text-xl">
                                                {k.value}
                                            </p>
                                            <p className="truncate text-[10px] font-semibold text-muted-foreground sm:text-[11px]">
                                                {k.caption}
                                            </p>
                                        </div>
                                        <ArrowUpRight className="size-3.5 text-muted-foreground sm:hidden" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </FxCard>

                    <FxCard className="flex min-w-0 flex-col p-4 sm:p-5 md:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-semibold sm:text-base">
                                    Penjualan 7 hari
                                </h2>
                                <p className="text-[11px] text-muted-foreground sm:text-xs">
                                    Tren harian
                                </p>
                            </div>
                        </div>
                        <FxSoft className="mt-3 flex h-36 items-end gap-1.5 p-2.5 sm:h-44 sm:gap-2 sm:p-4">
                            {chart.map((c) => (
                                <div
                                    key={c.date}
                                    className="flex h-full flex-1 flex-col justify-end gap-1"
                                >
                                    <div
                                        className="w-full rounded-md bg-primary fx-hatch-coral transition-transform hover:scale-y-105"
                                        style={{
                                            height: `${Math.max(6, (c.total / maxBar) * 100)}%`,
                                        }}
                                        title={`${c.label}: ${formatRupiah(c.total)}`}
                                    />
                                    <p className="truncate text-center text-[9px] font-semibold text-muted-foreground sm:text-[10px]">
                                        {c.label}
                                    </p>
                                </div>
                            ))}
                        </FxSoft>
                    </FxCard>
                </section>
            </Reveal>

            {/* Top 3 Produk Paling Profitable */}
            <Reveal delay={0.08} className="w-full min-w-0">
                <FxCard className="w-full min-w-0 p-4 sm:p-5">
                    <div className="flex flex-col gap-2 border-b border-border/50 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <TrendingUp className="size-4" />
                            </span>
                            <div>
                                <h2 className="flex items-center gap-2 text-sm font-semibold sm:text-base">
                                    3 Produk Paling Profitable
                                    <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">
                                        Margin Tertinggi
                                    </span>
                                </h2>
                                <p className="text-[11px] text-muted-foreground sm:text-xs">
                                    Menu penyumbang rasio margin keuntungan
                                    terbesar untuk kas usaha
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.visit('/profitabilitas')}
                            className="group inline-flex items-center gap-1.5 self-start rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary hover:text-white sm:self-auto"
                        >
                            Analisis Lengkap
                            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                        {top_profitable_menus.length > 0 ? (
                            top_profitable_menus.map((item, idx) => {
                                const rankColors = [
                                    {
                                        badge: 'bg-amber-500 text-white',
                                        border: 'border-amber-500/30 hover:border-amber-500/60',
                                        bg: 'bg-amber-500/5',
                                        icon: Crown,
                                        label: 'Juara #1 Profit',
                                    },
                                    {
                                        badge: 'bg-slate-400 text-white',
                                        border: 'border-slate-400/30 hover:border-slate-400/60',
                                        bg: 'bg-slate-400/5',
                                        icon: Medal,
                                        label: 'Peringkat #2',
                                    },
                                    {
                                        badge: 'bg-amber-700 text-white',
                                        border: 'border-amber-700/30 hover:border-amber-700/60',
                                        bg: 'bg-amber-700/5',
                                        icon: Award,
                                        label: 'Peringkat #3',
                                    },
                                ];
                                const rank = rankColors[idx] ?? rankColors[2];
                                const RankIcon = rank.icon;

                                return (
                                    <div
                                        key={item.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() =>
                                            router.visit('/profitabilitas')
                                        }
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' &&
                                            router.visit('/profitabilitas')
                                        }
                                        className={cn(
                                            'group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                                            rank.border,
                                            rank.bg,
                                        )}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-xs',
                                                        rank.badge,
                                                    )}
                                                >
                                                    <RankIcon className="size-3" />
                                                    {rank.label}
                                                </span>
                                                <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-bold text-success tabular-nums">
                                                    +
                                                    {formatPercent(
                                                        item.margin_pct,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="mt-3">
                                                <p className="text-[11px] font-medium text-muted-foreground">
                                                    {item.category}
                                                </p>
                                                <h3 className="line-clamp-1 text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                                                    {item.name}
                                                </h3>
                                            </div>

                                            <div className="mt-3 space-y-1.5 rounded-xl border border-border/40 bg-card/85 p-2.5 text-xs">
                                                <div className="flex items-center justify-between text-muted-foreground">
                                                    <span>Harga Jual</span>
                                                    <span className="font-semibold text-foreground tabular-nums">
                                                        {formatRupiah(
                                                            item.selling_price,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-muted-foreground">
                                                    <span>HPP Modal</span>
                                                    <span className="font-medium tabular-nums">
                                                        {formatRupiah(
                                                            item.current_hpp,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between border-t border-border/40 pt-1.5">
                                                    <span className="font-medium text-success">
                                                        Untung per Porsi
                                                    </span>
                                                    <span className="font-bold text-success tabular-nums">
                                                        +
                                                        {formatRupiah(
                                                            item.margin_rupiah,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                                            <span className="font-medium text-primary group-hover:underline">
                                                Lihat analisis margin &rarr;
                                            </span>
                                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                Profitable
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-3 py-6 text-center text-sm text-muted-foreground">
                                Belum ada menu dengan kategori profitable.
                            </div>
                        )}
                    </div>
                </FxCard>
            </Reveal>

            <Reveal delay={0.1} className="w-full min-w-0">
                <section className="grid w-full min-w-0 gap-4 sm:gap-5 lg:grid-cols-[1.05fr_2.05fr]">
                    <FxCard className="min-w-0 p-4 sm:p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-sm font-semibold sm:text-base">
                                    Anggaran belanja
                                </h2>
                                <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
                                    {restock.exists
                                        ? 'Terpakai dari rencana terakhir'
                                        : 'Preview rencana kas'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.visit('/restock')}
                                className="group inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary hover:text-white"
                            >
                                Planner
                                <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </button>
                        </div>
                        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-hover-soft fx-hatch sm:h-3">
                            <div
                                className="h-full rounded-full bg-primary"
                                style={{
                                    width: `${usedPct}%`,
                                    backgroundImage:
                                        'repeating-linear-gradient(-45deg, rgba(255,255,255,0.18) 0 3px, transparent 3px 6px)',
                                }}
                            />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-1 text-xs sm:text-sm">
                            <span className="font-bold tabular-nums">
                                {formatRupiah(restock.total_cost)}
                            </span>
                            <span className="text-muted-foreground">
                                dari {formatRupiah(restock.cash_amount)}
                            </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Sisa kas{' '}
                            <span className="font-semibold text-success">
                                {formatRupiah(restock.remaining_cash)}
                            </span>
                        </p>
                    </FxCard>

                    <FxCard className="min-w-0 overflow-hidden">
                        <div className="flex items-center justify-between gap-2 p-4 pb-3 sm:p-5 sm:pb-3.5">
                            <h2 className="text-sm font-semibold sm:text-base">
                                Aktivitas terbaru
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => router.visit('/pesanan')}
                                    className="group inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary hover:text-white"
                                >
                                    Semua
                                    <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.visit('/pos')}
                                    className="group inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary hover:text-white"
                                >
                                    POS
                                    <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </button>
                            </div>
                        </div>
                        <div className="w-full overflow-x-auto">
                            <table className="w-full min-w-[480px] text-xs sm:min-w-full sm:text-sm">
                                <thead>
                                    <tr className="bg-secondary text-left text-[11px] text-muted-foreground sm:text-xs">
                                        <th className="px-3.5 py-2.5 font-medium sm:px-4 sm:py-3">
                                            Pesanan
                                        </th>
                                        <th className="px-3.5 py-2.5 font-medium sm:px-4 sm:py-3">
                                            Item
                                        </th>
                                        <th className="px-3.5 py-2.5 text-right font-medium sm:px-4 sm:py-3">
                                            Total
                                        </th>
                                        <th className="px-3.5 py-2.5 font-medium sm:px-4 sm:py-3">
                                            Status
                                        </th>
                                        <th className="px-3.5 py-2.5 font-medium sm:px-4 sm:py-3">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent_orders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                                        >
                                            <td className="px-3.5 py-2.5 font-medium tabular-nums sm:px-4 sm:py-3">
                                                {order.id}
                                            </td>
                                            <td className="px-3.5 py-2.5 text-muted-foreground sm:px-4 sm:py-3">
                                                {order.description}
                                            </td>
                                            <td className="px-3.5 py-2.5 text-right tabular-nums sm:px-4 sm:py-3">
                                                {formatRupiah(order.total)}
                                            </td>
                                            <td className="px-3.5 py-2.5 sm:px-4 sm:py-3">
                                                {(() => {
                                                    const isVoid =
                                                        order.status === 'void';
                                                    const isPrep =
                                                        order.status ===
                                                        'preparing';
                                                    const isReady =
                                                        order.status ===
                                                        'ready';
                                                    const label = isVoid
                                                        ? 'Void'
                                                        : isPrep
                                                          ? 'Disiapkan'
                                                          : isReady
                                                            ? 'Siap Diambil'
                                                            : 'Selesai';
                                                    const colorClass = isVoid
                                                        ? 'text-danger'
                                                        : isPrep
                                                          ? 'text-amber-600 dark:text-amber-400'
                                                          : isReady
                                                            ? 'text-sky-600 dark:text-sky-400'
                                                            : 'text-success';
                                                    const dotClass = isVoid
                                                        ? 'bg-danger'
                                                        : isPrep
                                                          ? 'bg-amber-500 animate-pulse'
                                                          : isReady
                                                            ? 'bg-sky-500'
                                                            : 'bg-success';
                                                    return (
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${colorClass}`}
                                                        >
                                                            <span
                                                                className={`size-1.5 rounded-full ${dotClass}`}
                                                            />
                                                            {label}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-3.5 py-2.5 sm:px-4 sm:py-3">
                                                {order.can_void ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            voidOrder(order)
                                                        }
                                                        className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-destructive hover:text-white sm:px-3 sm:py-1"
                                                    >
                                                        Void
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </FxCard>
                </section>
            </Reveal>

            <Reveal delay={0.15} className="w-full min-w-0">
                <section className="flex w-full min-w-0 flex-col gap-4 sm:gap-5">
                    <FxCard className="flex min-w-0 flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
                        <div>
                            <h2 className="text-sm font-semibold sm:text-base">
                                Laporan harian
                            </h2>
                            <p className="text-[11px] text-muted-foreground sm:text-xs">
                                Penjualan &amp; pembelian pada tanggal terpilih.
                            </p>
                        </div>
                        <input
                            type="date"
                            value={daily_report.date}
                            onChange={(e) => changeReportDate(e.target.value)}
                            className="h-9 w-full rounded-xl bg-secondary px-3.5 text-xs outline-none sm:h-10 sm:w-auto sm:rounded-2xl sm:px-4 sm:text-sm"
                        />
                    </FxCard>

                    <div className="grid w-full min-w-0 gap-4 sm:gap-5 md:grid-cols-2">
                        <FxCard className="flex min-w-0 flex-col gap-3.5 p-4 sm:gap-4 sm:p-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-semibold sm:text-sm">
                                    Penjualan
                                </h3>
                                <IconCircle
                                    icon={Receipt}
                                    tone="soft"
                                    size="sm"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                                <div className="fx-soft rounded-xl p-2 sm:rounded-2xl sm:p-3">
                                    <p className="truncate text-[10px] font-semibold text-muted-foreground sm:text-[11px]">
                                        Pesanan
                                    </p>
                                    <p className="mt-0.5 text-sm font-bold tabular-nums sm:mt-1 sm:text-base md:text-lg">
                                        {daily_report.sales.orders}
                                    </p>
                                </div>
                                <div className="fx-soft rounded-xl p-2 sm:rounded-2xl sm:p-3">
                                    <p className="truncate text-[10px] font-semibold text-muted-foreground sm:text-[11px]">
                                        Item terjual
                                    </p>
                                    <p className="mt-0.5 text-sm font-bold tabular-nums sm:mt-1 sm:text-base md:text-lg">
                                        {daily_report.sales.items}
                                    </p>
                                </div>
                                <div
                                    className="fx-soft rounded-xl p-2 sm:rounded-2xl sm:p-3"
                                    title={`Revenue: ${formatRupiah(daily_report.sales.revenue)}`}
                                >
                                    <p className="truncate text-[10px] font-semibold text-muted-foreground sm:text-[11px]">
                                        Revenue
                                    </p>
                                    <p className="mt-0.5 truncate text-sm font-bold tabular-nums sm:mt-1 sm:text-base md:text-lg">
                                        {formatRupiah(
                                            daily_report.sales.revenue,
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted-foreground sm:text-xs">
                                <span>
                                    Tunai{' '}
                                    {formatRupiah(daily_report.sales.cash)}
                                </span>
                                <span>
                                    QRIS {formatRupiah(daily_report.sales.qris)}
                                </span>
                            </div>
                        </FxCard>

                        <FxCard className="flex min-w-0 flex-col gap-3.5 p-4 sm:gap-4 sm:p-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-semibold sm:text-sm">
                                    Pembelian (stock-in)
                                </h3>
                                <IconCircle
                                    icon={Package}
                                    tone="soft"
                                    size="sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                <div className="fx-soft rounded-xl p-2.5 sm:rounded-2xl sm:p-3">
                                    <p className="truncate text-[10px] font-semibold text-muted-foreground sm:text-[11px]">
                                        Transaksi
                                    </p>
                                    <p className="mt-0.5 text-sm font-bold tabular-nums sm:mt-1 sm:text-base md:text-lg">
                                        {daily_report.purchases.count}
                                    </p>
                                </div>
                                <div
                                    className="fx-soft rounded-xl p-2.5 sm:rounded-2xl sm:p-3"
                                    title={`Nilai: ${formatRupiah(daily_report.purchases.total_value)}`}
                                >
                                    <p className="truncate text-[10px] font-semibold text-muted-foreground sm:text-[11px]">
                                        Nilai
                                    </p>
                                    <p className="mt-0.5 truncate text-sm font-bold tabular-nums sm:mt-1 sm:text-base md:text-lg">
                                        {formatRupiah(
                                            daily_report.purchases.total_value,
                                        )}
                                    </p>
                                </div>
                            </div>
                        </FxCard>
                    </div>

                    <FxCard className="min-w-0 overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-2.5 p-4 pb-2.5 sm:p-5 sm:pb-3">
                            <h3 className="text-xs font-semibold sm:text-sm">
                                Pesanan {daily_report.date}
                            </h3>
                            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold sm:px-3 sm:py-1 sm:text-xs">
                                {daily_report.orders.length} pesanan
                            </span>
                        </div>
                        <div className="w-full overflow-x-auto">
                            <table className="w-full min-w-[480px] text-xs sm:min-w-full sm:text-sm">
                                <thead>
                                    <tr className="bg-secondary text-left text-[11px] text-muted-foreground sm:text-xs">
                                        <th className="px-3 py-2.5 font-medium sm:px-4 sm:py-3">
                                            Pesanan
                                        </th>
                                        <th className="px-3 py-2.5 font-medium sm:px-4 sm:py-3">
                                            Item
                                        </th>
                                        <th className="px-3 py-2.5 text-right font-medium sm:px-4 sm:py-3">
                                            Total
                                        </th>
                                        <th className="px-3 py-2.5 font-medium sm:px-4 sm:py-3">
                                            Status
                                        </th>
                                        <th className="px-3 py-2.5 font-medium sm:px-4 sm:py-3">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {daily_report.orders.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-6 text-center text-muted-foreground"
                                            >
                                                Tidak ada pesanan pada tanggal
                                                ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        daily_report.orders.map((order) => (
                                            <tr
                                                key={order.id}
                                                className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                                            >
                                                <td className="px-3 py-2.5 font-medium tabular-nums sm:px-4 sm:py-3">
                                                    {order.id}
                                                </td>
                                                <td className="px-3 py-2.5 text-muted-foreground sm:px-4 sm:py-3">
                                                    {order.description}
                                                </td>
                                                <td className="px-3 py-2.5 text-right tabular-nums sm:px-4 sm:py-3">
                                                    {formatRupiah(order.total)}
                                                </td>
                                                <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                                                    {(() => {
                                                        const isVoid =
                                                            order.status ===
                                                            'void';
                                                        const isPrep =
                                                            order.status ===
                                                            'preparing';
                                                        const isReady =
                                                            order.status ===
                                                            'ready';
                                                        const label = isVoid
                                                            ? 'Void'
                                                            : isPrep
                                                              ? 'Disiapkan'
                                                              : isReady
                                                                ? 'Siap Diambil'
                                                                : 'Selesai';
                                                        const colorClass =
                                                            isVoid
                                                                ? 'text-danger'
                                                                : isPrep
                                                                  ? 'text-amber-600 dark:text-amber-400'
                                                                  : isReady
                                                                    ? 'text-sky-600 dark:text-sky-400'
                                                                    : 'text-success';
                                                        return (
                                                            <span
                                                                className={`text-xs font-semibold ${colorClass}`}
                                                            >
                                                                {label}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                                                    {order.can_void ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                voidOrder(order)
                                                            }
                                                            className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-destructive hover:text-white sm:px-3 sm:py-1"
                                                        >
                                                            Void
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            -
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </FxCard>

                    {daily_report.purchases.items.length > 0 ? (
                        <FxCard className="min-w-0 overflow-hidden">
                            <div className="p-4 pb-2.5 sm:p-5 sm:pb-3">
                                <h3 className="text-xs font-semibold sm:text-sm">
                                    Pembelian {daily_report.date}
                                </h3>
                            </div>
                            <div className="w-full overflow-x-auto">
                                <table className="w-full min-w-[520px] text-xs sm:min-w-full sm:text-sm">
                                    <thead>
                                        <tr className="bg-secondary text-left text-[11px] text-muted-foreground sm:text-xs">
                                            <th className="px-3 py-2.5 font-medium sm:px-4 sm:py-3">
                                                Bahan
                                            </th>
                                            <th className="px-3 py-2.5 text-right font-medium sm:px-4 sm:py-3">
                                                Kuantitas
                                            </th>
                                            <th className="px-3 py-2.5 text-right font-medium sm:px-4 sm:py-3">
                                                Harga/satuan
                                            </th>
                                            <th className="px-3 py-2.5 text-right font-medium sm:px-4 sm:py-3">
                                                Nilai
                                            </th>
                                            <th className="px-3 py-2.5 font-medium sm:px-4 sm:py-3">
                                                Alasan
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {daily_report.purchases.items.map(
                                            (p, index) => (
                                                <tr
                                                    key={index}
                                                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                                                >
                                                    <td className="px-3 py-2.5 font-medium sm:px-4 sm:py-3">
                                                        {p.ingredient}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right tabular-nums sm:px-4 sm:py-3">
                                                        {p.quantity}{' '}
                                                        {p.base_unit}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right tabular-nums sm:px-4 sm:py-3">
                                                        {formatRupiah(
                                                            p.unit_price,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums sm:px-4 sm:py-3">
                                                        {formatRupiah(p.total)}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-muted-foreground sm:px-4 sm:py-3">
                                                        {p.reason ?? '-'}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </FxCard>
                    ) : null}
                </section>
            </Reveal>
        </PageShell>
    );
}
