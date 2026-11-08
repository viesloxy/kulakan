import { router } from '@inertiajs/react';
import {
    ArrowUpRight,
    BellRing,
    CheckCircle2,
    ChefHat,
    ChevronLeft,
    ChevronRight,
    Clock,
    CreditCard,
    Eye,
    PackageX,
    Printer,
    Receipt,
    RotateCcw,
    Search,
    ShoppingBag,
    TrendingUp,
    TriangleAlert,
    X,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard } from '@/components/fx/fx-card';
import { FxModal } from '@/components/fx/fx-form';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';
import PageShell from '@/components/page-shell';
import { formatPercent, formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

export type OrderItem = {
    id: number;
    menu_id: number;
    menu_name: string;
    menu_category: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    unit_hpp: number | null;
    subtotal_hpp: number | null;
};

export type OrderRecord = {
    id: string;
    db_id: number;
    created_at: string;
    created_at_human: string;
    cashier: string;
    cashier_role: string;
    total_amount: number;
    payment_method: 'cash' | 'qris';
    status: 'preparing' | 'ready' | 'completed' | 'void';
    description: string;
    items_count: number;
    can_mark_ready: boolean;
    can_mark_completed: boolean;
    can_void: boolean;
    void_reason: string | null;
    void_type: 'restored' | 'wasted' | null;
    voided_at: string | null;
    voided_at_human: string | null;
    voided_by_name: string | null;
    items: OrderItem[];
    total_hpp: number;
    gross_profit: number;
    margin_pct: number;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedOrders = {
    data: OrderRecord[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Summary = {
    total_orders: number;
    active_orders: number;
    preparing_count: number;
    ready_count: number;
    completed_count: number;
    void_count: number;
    total_revenue: number;
    cash_revenue: number;
    qris_revenue: number;
};

type Filters = {
    search: string;
    status: 'all' | 'preparing' | 'ready' | 'completed' | 'void';
    payment: 'all' | 'cash' | 'qris';
    period: 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'custom';
    start_date: string;
    end_date: string;
};

type Props = {
    orders: PaginatedOrders;
    summary: Summary;
    filters: Filters;
    is_owner: boolean;
};

function StatusBadge({
    status,
    voidType,
    className,
}: {
    status: OrderRecord['status'];
    voidType?: OrderRecord['void_type'];
    className?: string;
}) {
    switch (status) {
        case 'preparing':
            return (
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300',
                        className,
                    )}
                >
                    <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
                    <Clock className="size-3 text-amber-600 dark:text-amber-400" />
                    Disiapkan
                </span>
            );
        case 'ready':
            return (
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-300',
                        className,
                    )}
                >
                    <span className="size-1.5 rounded-full bg-sky-500" />
                    <BellRing className="size-3 text-sky-600 dark:text-sky-400" />
                    Siap Diambil
                </span>
            );
        case 'completed':
            return (
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300',
                        className,
                    )}
                >
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                    Selesai
                </span>
            );
        case 'void':
            return (
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border border-destructive/25 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive',
                        className,
                    )}
                >
                    <span className="size-1.5 rounded-full bg-destructive" />
                    Void {voidType === 'wasted' ? '(Waste)' : '(Restored)'}
                </span>
            );
    }
}

export default function Orders({ orders, summary, filters, is_owner }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(
        null,
    );
    const [voidConfirmOrder, setVoidConfirmOrder] =
        useState<OrderRecord | null>(null);
    const [voidHandling, setVoidHandling] = useState<'restored' | 'wasted'>(
        'restored',
    );
    const [voidReason, setVoidReason] = useState('');
    const [isVoiding, setIsVoiding] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Filter local states
    const [period, setPeriod] = useState<Filters['period']>(
        filters.period ?? 'all',
    );
    const [status, setStatus] = useState<Filters['status']>(
        filters.status ?? 'all',
    );
    const [payment, setPayment] = useState<Filters['payment']>(
        filters.payment ?? 'all',
    );
    const [startDate, setStartDate] = useState(filters.start_date ?? '');
    const [endDate, setEndDate] = useState(filters.end_date ?? '');

    function applyFilters(newFilters: Partial<Filters>) {
        const payload: Record<string, string> = {
            search: search.trim(),
            period,
            status,
            payment,
            start_date: startDate,
            end_date: endDate,
            ...newFilters,
        };

        const query: Record<string, string> = {};
        for (const [key, val] of Object.entries(payload)) {
            if (val && val !== 'all') {
                query[key] = val;
            }
        }

        router.get('/pesanan', query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function resetFilters() {
        setSearch('');
        setPeriod('all');
        setStatus('all');
        setPayment('all');
        setStartDate('');
        setEndDate('');
        router.get(
            '/pesanan',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function handleUpdateStatus(
        order: OrderRecord,
        newStatus: 'ready' | 'completed',
    ) {
        setIsUpdatingStatus(true);
        router.patch(
            `/pesanan/${order.db_id}/status`,
            { status: newStatus },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsUpdatingStatus(false);
                    const label =
                        newStatus === 'ready' ? 'Siap Diambil' : 'Selesai';
                    if (selectedOrder?.db_id === order.db_id) {
                        setSelectedOrder((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      status: newStatus,
                                      can_mark_ready: false,
                                      can_mark_completed: newStatus === 'ready',
                                  }
                                : null,
                        );
                    }
                    toast.success(
                        `Pesanan ${order.id} ditandai sebagai ${label}.`,
                    );
                },
                onError: (errs) => {
                    setIsUpdatingStatus(false);
                    toast.error(
                        Object.values(errs)[0] ?? 'Gagal memperbarui status.',
                    );
                },
            },
        );
    }

    function handleVoid(order: OrderRecord) {
        setIsVoiding(true);
        const reasonText = voidReason.trim() || 'Pembatalan kasir';

        router.post(
            `/pesanan/${order.db_id}/void`,
            {
                handling: voidHandling,
                reason: reasonText,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsVoiding(false);
                    setVoidConfirmOrder(null);
                    setVoidReason('');
                    setVoidHandling('restored');
                    if (selectedOrder?.db_id === order.db_id) {
                        setSelectedOrder((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      status: 'void',
                                      can_mark_ready: false,
                                      can_mark_completed: false,
                                      can_void: false,
                                      void_type: voidHandling,
                                      void_reason: reasonText,
                                  }
                                : null,
                        );
                    }
                    const msg =
                        voidHandling === 'wasted'
                            ? `${order.id}: Dibatalkan; bahan dicatat sebagai limbah/waste operasional.`
                            : `${order.id}: Dibatalkan; stok bahan baku dipulihkan ke rak.`;
                    toast.success('Pesanan berhasil dibatalkan', {
                        description: msg,
                    });
                },
                onError: (errors) => {
                    setIsVoiding(false);
                    toast.error(
                        Object.values(errors)[0] ??
                            'Gagal membatalkan pesanan.',
                    );
                },
            },
        );
    }

    function handlePrint(order?: OrderRecord | null) {
        const target = order ?? selectedOrder;
        if (!target) {
            return;
        }
        window.open(`/pesanan/${target.db_id}/cetak?auto=1`, '_blank');
    }

    const hasActiveFilters =
        search.trim() !== '' ||
        period !== 'all' ||
        status !== 'all' ||
        payment !== 'all' ||
        startDate !== '' ||
        endDate !== '';

    const activeQueueTotal = summary.preparing_count + summary.ready_count;

    return (
        <PageShell
            title="Riwayat Pesanan"
            headTitle="Riwayat Pesanan Pelanggan"
            description="Audit data penjualan, struk kasir, antrean barista, dan pencatatan limbah."
            actions={
                <FxButton
                    variant="coral"
                    size="sm"
                    className="gap-1.5 text-xs font-semibold"
                    onClick={() => router.visit('/pos')}
                >
                    <ShoppingBag className="size-3.5" />
                    Buka Kasir POS
                    <ArrowUpRight className="size-3.5" />
                </FxButton>
            }
        >
            {/* 1. Ringkasan Metrik (KPI Summary) */}
            <Reveal delay={0.03} className="w-full min-w-0">
                <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    {/* KPI 1: Total Omzet */}
                    <FxCard className="flex min-w-0 flex-col justify-between p-3.5 sm:p-5">
                        <div className="flex items-center justify-between gap-1.5">
                            <span className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
                                Total Omzet
                            </span>
                            <IconCircle
                                icon={TrendingUp}
                                tone="coral"
                                size="sm"
                            />
                        </div>
                        <div className="mt-3">
                            <p
                                className="truncate text-lg font-bold tracking-tight text-foreground tabular-nums sm:text-2xl"
                                title={formatRupiah(summary.total_revenue)}
                            >
                                {formatRupiah(summary.total_revenue)}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-success sm:text-xs">
                                <span className="size-1.5 rounded-full bg-success" />
                                {summary.active_orders} pesanan aktif
                            </p>
                        </div>
                    </FxCard>

                    {/* KPI 2: Antrean Dapur & Barista */}
                    <FxCard className="flex min-w-0 flex-col justify-between p-3.5 sm:p-5">
                        <div className="flex items-center justify-between gap-1.5">
                            <span className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
                                Antrean Berjalan
                            </span>
                            <IconCircle
                                icon={ChefHat}
                                tone={activeQueueTotal > 0 ? 'coral' : 'soft'}
                                size="sm"
                            />
                        </div>
                        <div className="mt-3">
                            <p
                                className={cn(
                                    'text-lg font-bold tracking-tight tabular-nums sm:text-2xl',
                                    activeQueueTotal > 0
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-foreground',
                                )}
                            >
                                {activeQueueTotal}
                            </p>
                            <p className="mt-1 truncate text-[10px] font-medium text-muted-foreground sm:text-xs">
                                {summary.preparing_count} disiapkan ·{' '}
                                {summary.ready_count} siap diambil
                            </p>
                        </div>
                    </FxCard>

                    {/* KPI 3: Pembayaran Tunai vs QRIS */}
                    <FxCard className="flex min-w-0 flex-col justify-between p-3.5 sm:p-5">
                        <div className="flex items-center justify-between gap-1.5">
                            <span className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
                                Pembayaran
                            </span>
                            <IconCircle
                                icon={CreditCard}
                                tone="soft"
                                size="sm"
                            />
                        </div>
                        <div className="mt-2.5 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[11px] text-muted-foreground sm:text-xs">
                                    Tunai:
                                </span>
                                <span className="font-bold text-foreground tabular-nums">
                                    {formatRupiah(summary.cash_revenue)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[11px] text-muted-foreground sm:text-xs">
                                    QRIS:
                                </span>
                                <span className="font-bold text-foreground tabular-nums">
                                    {formatRupiah(summary.qris_revenue)}
                                </span>
                            </div>
                        </div>
                    </FxCard>

                    {/* KPI 4: Selesai vs Dibatalkan (Void) */}
                    <FxCard className="flex min-w-0 flex-col justify-between p-3.5 sm:p-5">
                        <div className="flex items-center justify-between gap-1.5">
                            <span className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
                                Status Akhir
                            </span>
                            <IconCircle
                                icon={
                                    summary.void_count > 0
                                        ? TriangleAlert
                                        : CheckCircle2
                                }
                                tone={
                                    summary.void_count > 0 ? 'danger' : 'soft'
                                }
                                size="sm"
                            />
                        </div>
                        <div className="mt-3">
                            <div className="flex items-baseline gap-2">
                                <p className="text-lg font-bold tracking-tight text-foreground tabular-nums sm:text-2xl">
                                    {summary.completed_count}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                    selesai
                                </span>
                                {summary.void_count > 0 ? (
                                    <span className="text-xs font-bold text-danger tabular-nums">
                                        ({summary.void_count} void)
                                    </span>
                                ) : null}
                            </div>
                            <p className="mt-1 truncate text-[10px] font-medium text-muted-foreground sm:text-xs">
                                Total {summary.total_orders} transaksi tercatat
                            </p>
                        </div>
                    </FxCard>
                </div>
            </Reveal>

            {/* 2. Filter & Pencarian */}
            <Reveal delay={0.06} className="w-full min-w-0">
                <FxCard className="w-full min-w-0 p-4 sm:p-5">
                    <div className="flex flex-col gap-3.5">
                        {/* Baris Atas: Search & Quick Reset */}
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            applyFilters({
                                                search: search.trim(),
                                            });
                                        }
                                    }}
                                    placeholder="Cari nomor pesanan (ORD-...) atau nama menu..."
                                    className="h-10 w-full rounded-2xl bg-secondary pr-10 pl-10 text-xs transition-shadow outline-none focus:ring-2 focus:ring-primary/30 sm:text-sm"
                                />
                                {search ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            applyFilters({ search: '' });
                                        }}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                ) : null}
                            </div>

                            <div className="flex items-center gap-2">
                                <FxButton
                                    variant="coral"
                                    size="sm"
                                    className="h-10 px-4 text-xs font-semibold"
                                    onClick={() =>
                                        applyFilters({ search: search.trim() })
                                    }
                                >
                                    <Search className="size-3.5" />
                                    Cari
                                </FxButton>

                                {hasActiveFilters ? (
                                    <FxButton
                                        variant="soft"
                                        size="sm"
                                        className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground"
                                        onClick={resetFilters}
                                        title="Reset semua filter"
                                    >
                                        <RotateCcw className="size-3.5" />
                                        Reset
                                    </FxButton>
                                ) : null}
                            </div>
                        </div>

                        {/* Baris Bawah: Filter Periode, Status Lifecycle, & Pembayaran */}
                        <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-1">
                            {/* Filter Periode */}
                            <div className="flex items-center gap-1 overflow-x-auto py-1 text-xs">
                                <span className="mr-1 text-[11px] font-semibold text-muted-foreground">
                                    Periode:
                                </span>
                                {(
                                    [
                                        ['all', 'Semua'],
                                        ['today', 'Hari Ini'],
                                        ['yesterday', 'Kemarin'],
                                        ['7d', '7 Hari'],
                                        ['30d', '30 Hari'],
                                        ['custom', 'Kustom'],
                                    ] as const
                                ).map(([val, label]) => {
                                    const active = period === val;
                                    return (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => {
                                                setPeriod(val);
                                                if (val !== 'custom') {
                                                    applyFilters({
                                                        period: val,
                                                    });
                                                }
                                            }}
                                            className={cn(
                                                'h-7 rounded-full px-2.5 text-[11px] font-semibold transition-all duration-150',
                                                active
                                                    ? 'bg-primary text-white shadow-xs'
                                                    : 'bg-secondary text-muted-foreground hover:bg-hover-soft hover:text-foreground',
                                            )}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Separator */}
                            <span className="hidden text-border sm:inline">
                                |
                            </span>

                            {/* Filter Status (Lifecycle) */}
                            <div className="flex flex-wrap items-center gap-1 text-xs">
                                <span className="mr-1 text-[11px] font-semibold text-muted-foreground">
                                    Status:
                                </span>
                                {(
                                    [
                                        ['all', 'Semua', null],
                                        [
                                            'preparing',
                                            'Disiapkan',
                                            summary.preparing_count,
                                        ],
                                        [
                                            'ready',
                                            'Siap Diambil',
                                            summary.ready_count,
                                        ],
                                        ['completed', 'Selesai', null],
                                        ['void', 'Void', summary.void_count],
                                    ] as const
                                ).map(([val, label, count]) => {
                                    const active = status === val;
                                    return (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => {
                                                setStatus(val);
                                                applyFilters({ status: val });
                                            }}
                                            className={cn(
                                                'inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold transition-all duration-150',
                                                active
                                                    ? 'bg-foreground text-background shadow-xs'
                                                    : 'bg-secondary text-muted-foreground hover:bg-hover-soft hover:text-foreground',
                                            )}
                                        >
                                            <span>{label}</span>
                                            {count && count > 0 ? (
                                                <span
                                                    className={cn(
                                                        'py-0.2 rounded-full px-1.5 text-[9px] font-bold',
                                                        active
                                                            ? 'bg-background/25 text-background'
                                                            : val ===
                                                                'preparing'
                                                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                                              : val === 'ready'
                                                                ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400'
                                                                : 'bg-destructive/20 text-destructive',
                                                    )}
                                                >
                                                    {count}
                                                </span>
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Separator */}
                            <span className="hidden text-border sm:inline">
                                |
                            </span>

                            {/* Filter Pembayaran */}
                            <div className="flex items-center gap-1 text-xs">
                                <span className="mr-1 text-[11px] font-semibold text-muted-foreground">
                                    Metode:
                                </span>
                                {(
                                    [
                                        ['all', 'Semua'],
                                        ['cash', 'Tunai'],
                                        ['qris', 'QRIS'],
                                    ] as const
                                ).map(([val, label]) => {
                                    const active = payment === val;
                                    return (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => {
                                                setPayment(val);
                                                applyFilters({ payment: val });
                                            }}
                                            className={cn(
                                                'h-7 rounded-full px-2.5 text-[11px] font-semibold transition-all duration-150',
                                                active
                                                    ? 'bg-foreground text-background shadow-xs'
                                                    : 'bg-secondary text-muted-foreground hover:bg-hover-soft hover:text-foreground',
                                            )}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Input Rentang Tanggal jika "Kustom" dipilih */}
                        {period === 'custom' ? (
                            <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-muted-foreground">
                                        Dari:
                                    </span>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) =>
                                            setStartDate(e.target.value)
                                        }
                                        className="h-8 rounded-xl bg-secondary px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-muted-foreground">
                                        Sampai:
                                    </span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) =>
                                            setEndDate(e.target.value)
                                        }
                                        className="h-8 rounded-xl bg-secondary px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <FxButton
                                    variant="soft"
                                    size="sm"
                                    className="h-8 px-3 text-xs"
                                    onClick={() =>
                                        applyFilters({
                                            period: 'custom',
                                            start_date: startDate,
                                            end_date: endDate,
                                        })
                                    }
                                >
                                    Terapkan Tanggal
                                </FxButton>
                            </div>
                        ) : null}
                    </div>
                </FxCard>
            </Reveal>

            {/* 3. Daftar Pesanan Pelanggan (Tabel & Mobile Cards) */}
            <Reveal delay={0.09} className="w-full min-w-0">
                <FxCard className="w-full min-w-0 overflow-hidden">
                    {/* Header List */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-3 sm:p-5 sm:pb-3.5">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground sm:text-base">
                                Riwayat Transaksi
                            </h2>
                            <p className="text-[11px] text-muted-foreground sm:text-xs">
                                Menampilkan {orders.from ?? 0}-{orders.to ?? 0}{' '}
                                dari total {orders.total} transaksi
                            </p>
                        </div>
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                            Halaman {orders.current_page} dari{' '}
                            {orders.last_page}
                        </span>
                    </div>

                    {orders.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center sm:p-12">
                            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                                <Receipt className="size-6" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">
                                Tidak ada data pesanan
                            </h3>
                            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                                {hasActiveFilters
                                    ? 'Tidak ditemukan pesanan dengan kriteria filter saat ini. Coba reset filter.'
                                    : 'Belum ada transaksi penjualan yang dicatat. Buat pesanan baru lewat POS Kasir.'}
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                                {hasActiveFilters ? (
                                    <FxButton
                                        variant="soft"
                                        size="sm"
                                        onClick={resetFilters}
                                    >
                                        Reset Filter
                                    </FxButton>
                                ) : (
                                    <FxButton
                                        variant="coral"
                                        size="sm"
                                        onClick={() => router.visit('/pos')}
                                    >
                                        Buka POS Kasir
                                    </FxButton>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Tampilan Desktop & Tablet: Tabel Responsif */}
                            <div className="w-full overflow-x-auto">
                                <table className="w-full min-w-[760px] text-xs sm:min-w-full sm:text-sm">
                                    <thead>
                                        <tr className="bg-secondary text-left text-[11px] text-muted-foreground sm:text-xs">
                                            <th className="px-3.5 py-2.5 font-medium sm:px-4 sm:py-3">
                                                No. Pesanan
                                            </th>
                                            <th className="px-3.5 py-2.5 font-medium sm:px-4 sm:py-3">
                                                Waktu
                                            </th>
                                            <th className="px-3.5 py-2.5 font-medium sm:px-4 sm:py-3">
                                                Kasir
                                            </th>
                                            <th className="px-3.5 py-2.5 font-medium sm:px-4 sm:py-3">
                                                Item Menu
                                            </th>
                                            <th className="px-3.5 py-2.5 font-medium sm:px-4 sm:py-3">
                                                Metode
                                            </th>
                                            <th className="px-3.5 py-2.5 text-right font-medium sm:px-4 sm:py-3">
                                                Total
                                            </th>
                                            <th className="px-3.5 py-2.5 font-medium sm:px-4 sm:py-3">
                                                Status
                                            </th>
                                            <th className="px-3.5 py-2.5 text-center font-medium sm:px-4 sm:py-3">
                                                Aksi Operasional
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.data.map((order) => {
                                            return (
                                                <tr
                                                    key={order.id}
                                                    className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                                                    onClick={() =>
                                                        setSelectedOrder(order)
                                                    }
                                                >
                                                    {/* No. Pesanan */}
                                                    <td className="px-3.5 py-3 font-bold text-foreground tabular-nums sm:px-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <span>
                                                                {order.id}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Waktu */}
                                                    <td className="px-3.5 py-3 sm:px-4">
                                                        <p className="font-medium text-foreground">
                                                            {
                                                                order.created_at.split(
                                                                    ' ',
                                                                )[1]
                                                            }
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground sm:text-[11px]">
                                                            {
                                                                order.created_at.split(
                                                                    ' ',
                                                                )[0]
                                                            }
                                                        </p>
                                                    </td>

                                                    {/* Kasir */}
                                                    <td className="px-3.5 py-3 text-muted-foreground sm:px-4">
                                                        <span className="font-medium text-foreground">
                                                            {order.cashier}
                                                        </span>
                                                        <span className="block text-[10px] text-muted-foreground capitalize">
                                                            {order.cashier_role}
                                                        </span>
                                                    </td>

                                                    {/* Item Menu */}
                                                    <td className="max-w-[200px] truncate px-3.5 py-3 text-muted-foreground sm:px-4">
                                                        <span
                                                            title={
                                                                order.description
                                                            }
                                                        >
                                                            {order.description}
                                                        </span>
                                                        <span className="block text-[10px] text-muted-foreground">
                                                            {order.items_count}{' '}
                                                            porsi total
                                                        </span>
                                                    </td>

                                                    {/* Metode Bayar */}
                                                    <td className="px-3.5 py-3 sm:px-4">
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                                                                order.payment_method ===
                                                                    'cash'
                                                                    ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                                    : 'border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
                                                            )}
                                                        >
                                                            {order.payment_method ===
                                                            'cash'
                                                                ? 'Tunai'
                                                                : 'QRIS'}
                                                        </span>
                                                    </td>

                                                    {/* Total */}
                                                    <td className="px-3.5 py-3 text-right font-bold text-foreground tabular-nums sm:px-4">
                                                        {formatRupiah(
                                                            order.total_amount,
                                                        )}
                                                    </td>

                                                    {/* Status Badge */}
                                                    <td className="px-3.5 py-3 sm:px-4">
                                                        <StatusBadge
                                                            status={
                                                                order.status
                                                            }
                                                            voidType={
                                                                order.void_type
                                                            }
                                                        />
                                                    </td>

                                                    {/* Aksi Operasional */}
                                                    <td
                                                        className="px-3.5 py-3 text-center sm:px-4"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {/* 1-Click Status Update Actions */}
                                                            {order.can_mark_ready ? (
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        isUpdatingStatus
                                                                    }
                                                                    onClick={() =>
                                                                        handleUpdateStatus(
                                                                            order,
                                                                            'ready',
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-1 rounded-xl bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-500 hover:text-white dark:text-sky-300"
                                                                    title="Tandai pesanan selesai diracik (Siap Diambil)"
                                                                >
                                                                    <BellRing className="size-3" />
                                                                    Siap
                                                                </button>
                                                            ) : null}

                                                            {order.can_mark_completed ? (
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        isUpdatingStatus
                                                                    }
                                                                    onClick={() =>
                                                                        handleUpdateStatus(
                                                                            order,
                                                                            'completed',
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500 hover:text-white dark:text-emerald-300"
                                                                    title="Tandai pesanan telah diserahkan (Selesai)"
                                                                >
                                                                    <CheckCircle2 className="size-3" />
                                                                    Selesai
                                                                </button>
                                                            ) : null}

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelectedOrder(
                                                                        order,
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1 rounded-xl bg-secondary px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-hover-soft"
                                                                title="Lihat Struk & Rincian"
                                                            >
                                                                <Eye className="size-3 text-muted-foreground" />
                                                                Struk
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handlePrint(
                                                                        order,
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1 rounded-xl bg-secondary px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-hover-soft"
                                                                title="Cetak Struk di Tab Baru"
                                                            >
                                                                <Printer className="size-3 text-muted-foreground" />
                                                                Cetak
                                                            </button>

                                                            {order.can_void ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setVoidConfirmOrder(
                                                                            order,
                                                                        );
                                                                        setVoidHandling(
                                                                            'restored',
                                                                        );
                                                                        setVoidReason(
                                                                            '',
                                                                        );
                                                                    }}
                                                                    className="rounded-xl bg-secondary px-2.5 py-1 text-xs font-semibold text-danger transition-colors hover:bg-destructive hover:text-white"
                                                                    title="Batalkan Pesanan (Void)"
                                                                >
                                                                    Void
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {orders.last_page > 1 ? (
                                <div className="flex flex-col items-center justify-between gap-3 border-t border-border/50 p-4 text-xs sm:flex-row">
                                    <span className="text-muted-foreground">
                                        Menampilkan {orders.from} sampai{' '}
                                        {orders.to} dari {orders.total} data
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <FxButton
                                            variant="soft"
                                            size="sm"
                                            disabled={!orders.prev_page_url}
                                            onClick={() => {
                                                if (orders.prev_page_url) {
                                                    router.visit(
                                                        orders.prev_page_url,
                                                        {
                                                            preserveState: true,
                                                            preserveScroll: true,
                                                        },
                                                    );
                                                }
                                            }}
                                            className="h-8 px-2.5"
                                        >
                                            <ChevronLeft className="size-4" />
                                            Sebelumnya
                                        </FxButton>
                                        <span className="px-2 font-semibold text-foreground">
                                            {orders.current_page} /{' '}
                                            {orders.last_page}
                                        </span>
                                        <FxButton
                                            variant="soft"
                                            size="sm"
                                            disabled={!orders.next_page_url}
                                            onClick={() => {
                                                if (orders.next_page_url) {
                                                    router.visit(
                                                        orders.next_page_url,
                                                        {
                                                            preserveState: true,
                                                            preserveScroll: true,
                                                        },
                                                    );
                                                }
                                            }}
                                            className="h-8 px-2.5"
                                        >
                                            Selanjutnya
                                            <ChevronRight className="size-4" />
                                        </FxButton>
                                    </div>
                                </div>
                            ) : null}
                        </>
                    )}
                </FxCard>
            </Reveal>

            {/* 4. Modal Detail Struk Digital */}
            <FxModal
                open={selectedOrder !== null}
                onOpenChange={(open) => !open && setSelectedOrder(null)}
                title="Struk Pesanan Digital"
                description={selectedOrder?.id}
                className="max-w-md"
                footer={
                    <div className="flex w-full flex-wrap items-center justify-between gap-2">
                        <FxButton
                            variant="soft"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handlePrint(selectedOrder)}
                        >
                            <Printer className="size-4" />
                            Cetak Struk
                        </FxButton>
                        <div className="flex items-center gap-2">
                            {selectedOrder?.can_mark_ready ? (
                                <FxButton
                                    variant="soft"
                                    size="sm"
                                    className="gap-1 bg-sky-500/15 text-sky-700 hover:bg-sky-500 hover:text-white dark:text-sky-300"
                                    disabled={isUpdatingStatus}
                                    onClick={() =>
                                        handleUpdateStatus(
                                            selectedOrder,
                                            'ready',
                                        )
                                    }
                                >
                                    <BellRing className="size-3.5" />
                                    Tandai Siap
                                </FxButton>
                            ) : null}

                            {selectedOrder?.can_mark_completed ? (
                                <FxButton
                                    variant="soft"
                                    size="sm"
                                    className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500 hover:text-white dark:text-emerald-300"
                                    disabled={isUpdatingStatus}
                                    onClick={() =>
                                        handleUpdateStatus(
                                            selectedOrder,
                                            'completed',
                                        )
                                    }
                                >
                                    <CheckCircle2 className="size-3.5" />
                                    Tandai Selesai
                                </FxButton>
                            ) : null}

                            {selectedOrder?.can_void ? (
                                <FxButton
                                    variant="soft"
                                    size="sm"
                                    className="text-danger hover:bg-destructive hover:text-white"
                                    onClick={() => {
                                        setVoidConfirmOrder(selectedOrder);
                                        setVoidHandling('restored');
                                        setVoidReason('');
                                    }}
                                >
                                    Void Pesanan
                                </FxButton>
                            ) : null}
                            <FxButton
                                variant="coral"
                                size="sm"
                                onClick={() => setSelectedOrder(null)}
                            >
                                Tutup
                            </FxButton>
                        </div>
                    </div>
                }
            >
                {selectedOrder ? (
                    <div className="receipt-container flex flex-col font-mono text-xs text-foreground">
                        {/* Header Struk */}
                        <div className="py-2 text-center">
                            <div className="mb-1 flex items-center justify-center gap-1.5">
                                <Receipt className="size-5 text-primary" />
                                <h3 className="text-sm font-bold tracking-tight">
                                    KULAKAN F&B
                                </h3>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Sistem Manajemen Resep & POS
                            </p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                                {selectedOrder.created_at} · Kasir:{' '}
                                {selectedOrder.cashier}
                            </p>
                            <div className="mt-2">
                                <StatusBadge
                                    status={selectedOrder.status}
                                    voidType={selectedOrder.void_type}
                                />
                            </div>
                        </div>

                        {/* Audit Pembatalan / Void jika dibatalkan */}
                        {selectedOrder.status === 'void' ? (
                            <div className="my-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 font-sans text-xs text-destructive">
                                <div className="flex items-center gap-1.5 font-bold">
                                    <TriangleAlert className="size-4 shrink-0" />
                                    <span>Detail Pembatalan (Void)</span>
                                </div>
                                <div className="mt-2 space-y-1 text-[11px] text-foreground">
                                    <p>
                                        <span className="text-muted-foreground">
                                            Penanganan Bahan:
                                        </span>{' '}
                                        <strong>
                                            {selectedOrder.void_type ===
                                            'wasted'
                                                ? 'Dicatat sebagai Waste / Limbah'
                                                : 'Stok Dikembalikan ke Rak (Restored)'}
                                        </strong>
                                    </p>
                                    <p>
                                        <span className="text-muted-foreground">
                                            Alasan:
                                        </span>{' '}
                                        {selectedOrder.void_reason ?? '-'}
                                    </p>
                                    <p>
                                        <span className="text-muted-foreground">
                                            Waktu Void:
                                        </span>{' '}
                                        {selectedOrder.voided_at ?? '-'}{' '}
                                        {selectedOrder.voided_at_human
                                            ? `(${selectedOrder.voided_at_human})`
                                            : ''}
                                    </p>
                                    {selectedOrder.voided_by_name ? (
                                        <p>
                                            <span className="text-muted-foreground">
                                                Dibatalkan oleh:
                                            </span>{' '}
                                            {selectedOrder.voided_by_name}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}

                        {/* Garis Pemisah Putus-putus */}
                        <div className="my-2.5 border-b border-dashed border-border/80" />

                        {/* Rincian Menu */}
                        <div className="space-y-2 py-1">
                            {selectedOrder.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex flex-col gap-0.5"
                                >
                                    <div className="flex items-start justify-between">
                                        <span className="font-semibold text-foreground">
                                            {item.menu_name}
                                        </span>
                                        <span className="font-bold tabular-nums">
                                            {formatRupiah(item.subtotal)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span>
                                            {item.quantity} x{' '}
                                            {formatRupiah(item.unit_price)}
                                        </span>
                                        {is_owner &&
                                        item.subtotal_hpp !== null ? (
                                            <span className="text-[10px] text-muted-foreground">
                                                HPP:{' '}
                                                {formatRupiah(
                                                    item.subtotal_hpp,
                                                )}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Garis Pemisah Putus-putus */}
                        <div className="my-2.5 border-b border-dashed border-border/80" />

                        {/* Ringkasan Pembayaran */}
                        <div className="space-y-1.5 py-1">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span>Total Item</span>
                                <span className="font-medium tabular-nums">
                                    {selectedOrder.items_count} porsi
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span>Metode Pembayaran</span>
                                <span className="font-semibold text-foreground uppercase">
                                    {selectedOrder.payment_method === 'cash'
                                        ? 'Tunai (Cash)'
                                        : 'QRIS Digital'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-border/40 pt-1 text-sm font-bold text-foreground">
                                <span>TOTAL AKHIR</span>
                                <span className="text-base text-primary tabular-nums">
                                    {formatRupiah(selectedOrder.total_amount)}
                                </span>
                            </div>
                        </div>

                        {/* Garis Pemisah Putus-putus */}
                        <div className="my-2.5 border-b border-dashed border-border/80" />

                        {/* Insight Finansial Khusus Owner */}
                        {is_owner ? (
                            <div className="my-1 rounded-xl bg-secondary/80 p-2.5 font-sans text-[11px]">
                                <div className="mb-1.5 flex items-center gap-1 font-bold text-foreground">
                                    <Zap className="size-3 text-primary" />
                                    <span>Analisis Margin (Owner Only)</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5 text-center">
                                    <div className="rounded-lg bg-card p-1.5">
                                        <p className="text-[10px] text-muted-foreground">
                                            HPP Bahan
                                        </p>
                                        <p className="mt-0.5 font-bold text-foreground tabular-nums">
                                            {formatRupiah(
                                                selectedOrder.total_hpp,
                                            )}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-card p-1.5">
                                        <p className="text-[10px] text-muted-foreground">
                                            Laba Kotor
                                        </p>
                                        <p className="mt-0.5 font-bold text-success tabular-nums">
                                            {formatRupiah(
                                                selectedOrder.gross_profit,
                                            )}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-card p-1.5">
                                        <p className="text-[10px] text-muted-foreground">
                                            Margin
                                        </p>
                                        <p className="mt-0.5 font-bold text-foreground tabular-nums">
                                            {formatPercent(
                                                selectedOrder.margin_pct,
                                                1,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* Footer Struk */}
                        <div className="pt-2 text-center text-[10px] text-muted-foreground">
                            <p>Terima kasih atas pesanan Anda!</p>
                            <p className="mt-0.5">
                                Simpan struk ini sebagai bukti transaksi yang
                                sah.
                            </p>
                        </div>
                    </div>
                ) : null}
            </FxModal>

            {/* 5. Modal Konfirmasi Void Pesanan dengan Pembedaan Void vs Waste */}
            <FxModal
                open={voidConfirmOrder !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setVoidConfirmOrder(null);
                        setVoidReason('');
                        setVoidHandling('restored');
                    }
                }}
                title="Batalkan Pesanan (Void)?"
                description={voidConfirmOrder?.id}
                className="max-w-lg"
                footer={
                    <div className="flex w-full items-center justify-end gap-2">
                        <FxButton
                            variant="soft"
                            size="sm"
                            disabled={isVoiding}
                            onClick={() => {
                                setVoidConfirmOrder(null);
                                setVoidReason('');
                                setVoidHandling('restored');
                            }}
                        >
                            Batal
                        </FxButton>
                        <FxButton
                            variant="coral"
                            size="sm"
                            disabled={isVoiding}
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() =>
                                voidConfirmOrder && handleVoid(voidConfirmOrder)
                            }
                        >
                            {isVoiding
                                ? 'Membatalkan...'
                                : 'Konfirmasi Batalkan Pesanan'}
                        </FxButton>
                    </div>
                }
            >
                {voidConfirmOrder ? (
                    <div className="space-y-4 text-xs text-foreground sm:text-sm">
                        {/* Alert Ringkasan */}
                        <div className="flex items-start gap-3 rounded-2xl bg-danger-soft p-3.5 text-danger">
                            <TriangleAlert className="mt-0.5 size-5 shrink-0" />
                            <div className="space-y-1">
                                <p className="font-bold">
                                    Konfirmasi Pembatalan Pesanan Kasir
                                </p>
                                <p className="text-xs leading-relaxed text-danger/90">
                                    Pesanan{' '}
                                    <strong>{voidConfirmOrder.id}</strong>{' '}
                                    senilai{' '}
                                    <strong>
                                        {formatRupiah(
                                            voidConfirmOrder.total_amount,
                                        )}
                                    </strong>{' '}
                                    akan dibatalkan dan nominalnya dikecualikan
                                    dari omzet kasir.
                                </p>
                            </div>
                        </div>

                        {/* Pilihan Penanganan Persediaan Bahan: Restored vs Wasted */}
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-foreground">
                                Pilih Penanganan Persediaan Bahan Baku:
                            </label>
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                {/* Opsi A: Restored (Kembalikan ke Stok) */}
                                <div
                                    onClick={() => setVoidHandling('restored')}
                                    className={cn(
                                        'cursor-pointer rounded-2xl border p-3 transition-all duration-150',
                                        voidHandling === 'restored'
                                            ? 'border-emerald-500 bg-emerald-500/10 shadow-xs'
                                            : 'border-border/60 bg-secondary/50 hover:bg-secondary',
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                                            <RotateCcw className="size-4 text-emerald-600 dark:text-emerald-400" />
                                            <span>Kembalikan Stok</span>
                                        </div>
                                        <input
                                            type="radio"
                                            checked={
                                                voidHandling === 'restored'
                                            }
                                            onChange={() =>
                                                setVoidHandling('restored')
                                            }
                                            className="text-emerald-600"
                                        />
                                    </div>
                                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                                        Bahan{' '}
                                        <strong>belum sempat diolah</strong> /
                                        diracik. Fisik bahan masih utuh dan stok
                                        sistem akan dikembalikan ke rak.
                                    </p>
                                </div>

                                {/* Opsi B: Wasted (Catat sebagai Limbah) */}
                                <div
                                    onClick={() => setVoidHandling('wasted')}
                                    className={cn(
                                        'cursor-pointer rounded-2xl border p-3 transition-all duration-150',
                                        voidHandling === 'wasted'
                                            ? 'border-destructive bg-destructive/10 shadow-xs'
                                            : 'border-border/60 bg-secondary/50 hover:bg-secondary',
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                                            <PackageX className="size-4 text-destructive" />
                                            <span>Catat Waste</span>
                                        </div>
                                        <input
                                            type="radio"
                                            checked={voidHandling === 'wasted'}
                                            onChange={() =>
                                                setVoidHandling('wasted')
                                            }
                                            className="text-destructive"
                                        />
                                    </div>
                                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                                        Bahan{' '}
                                        <strong>sudah terlanjur dibuat</strong>,
                                        tumpah, atau rusak. Stok{' '}
                                        <strong>tidak dipulihkan</strong> dan
                                        dicatat sebagai limbah operasional.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Input Alasan Pembatalan */}
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-foreground">
                                Alasan Pembatalan:
                            </label>
                            {/* Chips Alasan Cepat */}
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    'Pelanggan salah pesan',
                                    'Pesanan ganda',
                                    'Salah racik / tumpah',
                                    'Pelanggan batal menunggu',
                                ].map((reasonText) => (
                                    <button
                                        key={reasonText}
                                        type="button"
                                        onClick={() =>
                                            setVoidReason(reasonText)
                                        }
                                        className={cn(
                                            'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                                            voidReason === reasonText
                                                ? 'bg-primary text-white'
                                                : 'bg-secondary text-muted-foreground hover:bg-hover-soft hover:text-foreground',
                                        )}
                                    >
                                        {reasonText}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={voidReason}
                                onChange={(e) => setVoidReason(e.target.value)}
                                placeholder="Tuliskan catatan / alasan pembatalan..."
                                className="h-9 w-full rounded-xl bg-secondary px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                ) : null}
            </FxModal>
        </PageShell>
    );
}
