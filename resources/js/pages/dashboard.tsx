import { Head, router } from '@inertiajs/react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    Package,
    Receipt,
    TrendingUp,
    TriangleAlert,
} from 'lucide-react';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';
import { formatRupiah } from '@/lib/format';

type MenuCounts = {
    profitable: number;
    watchlist: number;
    loss: number;
    total: number;
};
type ChartPoint = { date: string; label: string; total: number };
type RecentOrder = {
    id: string;
    description: string;
    total: number;
    status: string;
};
type RestockSummary = {
    total_cost: number;
    remaining_cash: number;
    cash_amount: number;
    status: string;
    exists: boolean;
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
}: Props) {
    const kpis = [
        {
            label: 'Nilai persediaan',
            value: formatRupiah(inventory_value),
            caption: `${low_stock_count} bahan menipis`,
            icon: Package,
            tone: 'coral' as const,
            highlight: true,
        },
        {
            label: 'Menu profitable',
            value: String(menu_counts.profitable),
            caption: `dari ${menu_counts.total} menu`,
            icon: TrendingUp,
            tone: 'soft' as const,
        },
        {
            label: 'Alert aktif',
            value: String(active_alerts_count),
            caption: 'perlu tindakan',
            icon: TriangleAlert,
            tone: 'danger' as const,
        },
        {
            label: 'Pesanan',
            value: String(orders_today_count),
            caption: formatRupiah(sales_today),
            icon: Receipt,
            tone: 'soft' as const,
        },
    ];

    const maxBar = Math.max(1, ...chart.map((c) => c.total));
    const usedPct =
        restock.cash_amount > 0
            ? Math.min(100, (restock.total_cost / restock.cash_amount) * 100)
            : 0;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <Reveal>
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Selamat datang, {greeting_name}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Ringkasan kas, stok, dan margin dapur hari ini.
                        </p>
                    </div>
                </Reveal>

                <Reveal delay={0.05}>
                    <section className="grid gap-5 lg:grid-cols-[1fr_1.3fr_1fr]">
                        <FxCard className="p-5">
                            <div className="flex items-start justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Kas untuk belanja
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
                                    <span className="size-1.5 rounded-full bg-[#1D9E53]" />
                                    Hari ini
                                </span>
                            </div>
                            <p className="mt-1 text-[2rem] leading-tight font-bold tracking-tight tabular-nums">
                                {formatRupiah(cash_budget)}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="rounded-full bg-[#E6F5EC] px-2 py-0.5 font-semibold text-[#1D9E53]">
                                    {restock.exists
                                        ? restock.status
                                        : 'preview'}
                                </span>
                                rencana restock
                            </div>

                            <div className="mt-4 flex flex-col gap-2">
                                <FxButton
                                    variant="coral"
                                    className="w-full"
                                    onClick={() => router.visit('/pos')}
                                >
                                    <ArrowUpRight className="size-4" />
                                    Catat pesanan
                                </FxButton>
                                <FxButton
                                    variant="soft"
                                    className="w-full"
                                    onClick={() => router.visit('/restock')}
                                >
                                    <ArrowDownLeft className="size-4" />
                                    Rencana belanja
                                </FxButton>
                            </div>

                            <FxSoft className="mt-4 p-4">
                                <div className="mb-3 flex items-center justify-between text-xs font-semibold">
                                    <span>Penjualan hari ini</span>
                                    <span className="font-medium text-muted-foreground">
                                        {formatRupiah(sales_today)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="rounded-2xl bg-card p-3">
                                        <p className="text-[11px] font-semibold text-muted-foreground">
                                            Kas tunai
                                        </p>
                                        <p className="mt-1 text-[11px] font-bold whitespace-nowrap tabular-nums">
                                            {formatRupiah(wallets.cash)}
                                        </p>
                                        <p className="mt-1 text-[11px] font-semibold text-[#1D9E53]">
                                            Tunai
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-card p-3">
                                        <p className="text-[11px] font-semibold text-muted-foreground">
                                            QRIS
                                        </p>
                                        <p className="mt-1 text-[11px] font-bold whitespace-nowrap tabular-nums">
                                            {formatRupiah(wallets.qris)}
                                        </p>
                                        <p className="mt-1 text-[11px] font-semibold text-[#1D9E53]">
                                            Digital
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-card p-3">
                                        <p className="text-[11px] font-semibold text-muted-foreground">
                                            Total
                                        </p>
                                        <p className="mt-1 text-[11px] font-bold whitespace-nowrap tabular-nums">
                                            {formatRupiah(
                                                wallets.cash + wallets.qris,
                                            )}
                                        </p>
                                        <p className="mt-1 text-[11px] font-semibold text-[#1D9E53]">
                                            Hari ini
                                        </p>
                                    </div>
                                </div>
                            </FxSoft>
                        </FxCard>

                        <FxCard className="flex flex-col gap-3 p-3.5">
                            <div className="flex flex-[1.3] flex-col justify-between rounded-2xl fx-coral p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-sm font-medium text-white">
                                        {kpis[0].label}
                                    </span>
                                    <IconCircle
                                        icon={kpis[0].icon}
                                        tone="white"
                                        size="sm"
                                    />
                                </div>
                                <div className="mt-3">
                                    <p className="text-[1.75rem] font-bold tracking-tight whitespace-nowrap text-white tabular-nums">
                                        {kpis[0].value}
                                    </p>
                                    <p className="mt-1 text-[11px] font-semibold text-white/85">
                                        {kpis[0].caption}
                                    </p>
                                </div>
                            </div>

                            <div className="grid flex-1 grid-cols-3 gap-3">
                                {kpis.slice(1).map((k) => (
                                    <div
                                        key={k.label}
                                        className="flex flex-col justify-between fx-soft rounded-2xl p-4"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-sm font-medium">
                                                {k.label}
                                            </span>
                                            <IconCircle
                                                icon={k.icon}
                                                tone={k.tone}
                                                size="sm"
                                            />
                                        </div>
                                        <div className="mt-3">
                                            <p className="text-xl font-bold tracking-tight tabular-nums">
                                                {k.value}
                                            </p>
                                            <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                                                {k.caption}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </FxCard>

                        <FxCard className="flex flex-col p-5">
                            <h2 className="text-base font-semibold">
                                Penjualan 7 hari
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Tren harian
                            </p>
                            <FxSoft className="mt-3 flex h-44 items-end gap-2 p-4">
                                {chart.map((c) => (
                                    <div
                                        key={c.date}
                                        className="flex h-full flex-1 flex-col justify-end gap-1"
                                    >
                                        <div
                                            className="w-full rounded-md bg-[#EC582A] fx-hatch-coral"
                                            style={{
                                                height: `${(c.total / maxBar) * 100}%`,
                                            }}
                                            title={formatRupiah(c.total)}
                                        />
                                        <p className="text-center text-[10px] font-semibold text-muted-foreground">
                                            {c.label}
                                        </p>
                                    </div>
                                ))}
                            </FxSoft>
                        </FxCard>
                    </section>
                </Reveal>

                <Reveal delay={0.1}>
                    <section className="grid gap-5 lg:grid-cols-[1.05fr_2.05fr]">
                        <FxCard className="p-5">
                            <h2 className="text-base font-semibold">
                                Anggaran belanja
                            </h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {restock.exists
                                    ? 'Terpakai dari rencana terakhir'
                                    : 'Preview rencana kas'}
                            </p>
                            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[#EBEBE8] fx-hatch">
                                <div
                                    className="h-full rounded-full bg-[#EC582A]"
                                    style={{
                                        width: `${usedPct}%`,
                                        backgroundImage:
                                            'repeating-linear-gradient(-45deg, rgba(255,255,255,0.18) 0 3px, transparent 3px 6px)',
                                    }}
                                />
                            </div>
                            <div className="mt-3 flex items-center justify-between text-sm">
                                <span className="font-bold tabular-nums">
                                    {formatRupiah(restock.total_cost)}
                                </span>
                                <span className="text-muted-foreground">
                                    dari {formatRupiah(restock.cash_amount)}
                                </span>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Sisa kas{' '}
                                <span className="font-semibold text-[#1D9E53]">
                                    {formatRupiah(restock.remaining_cash)}
                                </span>
                            </p>
                        </FxCard>

                        <FxCard className="p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-base font-semibold">
                                    Aktivitas terbaru
                                </h2>
                                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                                    Terbaru
                                </span>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-secondary text-left text-xs text-muted-foreground">
                                        <th className="rounded-l-xl px-3 py-2.5 font-medium">
                                            Pesanan
                                        </th>
                                        <th className="px-3 py-2.5 font-medium">
                                            Item
                                        </th>
                                        <th className="px-3 py-2.5 text-right font-medium">
                                            Total
                                        </th>
                                        <th className="rounded-r-xl px-3 py-2.5 font-medium">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent_orders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="border-b border-border/60 last:border-0"
                                        >
                                            <td className="px-3 py-3 font-medium tabular-nums">
                                                {order.id}
                                            </td>
                                            <td className="px-3 py-3 text-muted-foreground">
                                                {order.description}
                                            </td>
                                            <td className="px-3 py-3 text-right tabular-nums">
                                                {formatRupiah(order.total)}
                                            </td>
                                            <td className="px-3 py-3">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                                                        order.status === 'void'
                                                            ? 'text-[#D93829]'
                                                            : 'text-[#1D9E53]'
                                                    }`}
                                                >
                                                    <span
                                                        className={`size-1.5 rounded-full ${
                                                            order.status ===
                                                            'void'
                                                                ? 'bg-[#D93829]'
                                                                : 'bg-[#1D9E53]'
                                                        }`}
                                                    />
                                                    {order.status === 'void'
                                                        ? 'Void'
                                                        : 'Selesai'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </FxCard>
                    </section>
                </Reveal>
            </div>
        </>
    );
}
