import { router } from '@inertiajs/react';
import { Coins, TrendingUp, TriangleAlert, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { FxField, FxInput, FxModal, FxSelect } from '@/components/fx/fx-form';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';
import PageShell from '@/components/page-shell';
import StatusBadge, { type MenuStatus } from '@/components/status-badge';
import { formatPercent, formatRupiah } from '@/lib/format';

type Category = 'Kopi' | 'Non-Kopi' | 'Makanan';
type BaseUnit = 'gram' | 'ml' | 'pcs';

type ProfitRow = {
    id: number;
    name: string;
    category: Category;
    selling_price: number | string;
    current_hpp: string;
    margin_rupiah: string;
    margin_pct: string;
    status: MenuStatus;
    projected_hpp: string | null;
    projected_margin_pct: string | null;
    projected_status: MenuStatus | null;
};

type SimRow = {
    menu_id: number;
    name: string;
    old_hpp: string;
    old_margin: string;
    old_status: MenuStatus;
    new_hpp: string;
    new_margin: string;
    new_status: MenuStatus;
};

type IngredientOption = {
    id: number;
    name: string;
    base_unit: BaseUnit;
    cost_per_unit: string;
};

type Counts = { profitable: number; watchlist: number; loss: number };

type RankingRow = {
    menu_id: number;
    name: string;
    selling_price: number;
    quantity_sold: number;
    revenue: number;
    cogs: number;
    gross_profit: number;
    gross_margin_pct: string | null;
    contribution_pct: string | null;
};

type Totals = {
    revenue: number;
    cogs: number;
    gross_profit: number;
    quantity_sold: number;
};

type PeriodOption = { key: string; label: string };

type Props = {
    menus: ProfitRow[];
    summary: { total: number; avg_margin: string; counts: Counts };
    period: string;
    periods: PeriodOption[];
    ranking: RankingRow[];
    totals: Totals;
    ingredients: IngredientOption[];
    filters: { sim_ingredient: number | null; sim_price: string };
    simulation: SimRow[] | null;
};

// Warna batang mengikuti token tone status agar ikut menyesuaikan dark mode.
const statusColor: Record<MenuStatus, string> = {
    profitable: 'var(--success)',
    watchlist: 'var(--warning)',
    loss: 'var(--danger)',
};

export default function Profitability({
    menus,
    summary,
    period,
    periods,
    ranking,
    totals,
    ingredients,
    filters,
    simulation,
}: Props) {
    const [simOpen, setSimOpen] = useState(false);

    function changePeriod(key: string) {
        router.get(
            '/profitabilitas',
            { period: key },
            {
                only: ['period', 'ranking', 'totals'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    const chartData = menus.map((m) => ({
        name: m.name,
        margin: Number(m.margin_pct),
        status: m.status,
    }));

    const statusCards = [
        {
            label: 'Profitable',
            value: summary.counts.profitable,
            icon: TrendingUp,
            tone: 'success' as const,
        },
        {
            label: 'Watchlist',
            value: summary.counts.watchlist,
            icon: TriangleAlert,
            tone: 'warning' as const,
        },
        {
            label: 'Loss',
            value: summary.counts.loss,
            icon: XCircle,
            tone: 'danger' as const,
        },
    ];

    return (
        <PageShell
            title="Profitabilitas"
            description="Margin dan status tiap menu, dihitung dari HPP terkini."
            actions={
                <FxButton variant="coral" onClick={() => setSimOpen(true)}>
                    <Coins className="size-4" />
                    Simulasi harga
                </FxButton>
            }
        >
            <Reveal delay={0.05}>
                <div className="grid gap-4 md:grid-cols-4">
                    <FxCard className="flex flex-col justify-between fx-coral p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-white">
                                Margin rata-rata
                            </span>
                            <IconCircle icon={Coins} tone="white" size="sm" />
                        </div>
                        <p className="mt-3 text-2xl font-bold tracking-tight text-white tabular-nums">
                            {formatPercent(summary.avg_margin, 1)}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-white/85">
                            dari {summary.total} menu
                        </p>
                    </FxCard>

                    {statusCards.map((s) => (
                        <FxCard
                            key={s.label}
                            className="flex flex-col justify-between p-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    {s.label}
                                </span>
                                <IconCircle
                                    icon={s.icon}
                                    tone={s.tone}
                                    size="sm"
                                />
                            </div>
                            <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums">
                                {s.value}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                                menu
                            </p>
                        </FxCard>
                    ))}
                </div>
            </Reveal>

            <Reveal delay={0.1}>
                <FxCard className="p-4 md:p-5">
                    <h2 className="text-base font-semibold">Margin per menu</h2>
                    <p className="mb-4 text-xs text-muted-foreground">
                        Persentase margin kotor terhadap harga jual.
                    </p>
                    <FxSoft className="h-72 w-full p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{
                                    top: 0,
                                    right: 28,
                                    bottom: 0,
                                    left: 8,
                                }}
                            >
                                <XAxis
                                    type="number"
                                    domain={[0, 100]}
                                    tickFormatter={(v: number) => `${v}%`}
                                    tick={{
                                        fontSize: 12,
                                        fill: 'var(--muted-foreground)',
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={148}
                                    tick={{
                                        fontSize: 12,
                                        fill: 'var(--foreground)',
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'var(--hover-soft)' }}
                                    formatter={(value) => [
                                        `${Number(value).toFixed(2)}%`,
                                        'Margin',
                                    ]}
                                    contentStyle={{
                                        borderRadius: 12,
                                        border: 'none',
                                        fontSize: 12,
                                        backgroundColor: 'var(--card)',
                                        color: 'var(--foreground)',
                                    }}
                                />
                                <Bar
                                    dataKey="margin"
                                    radius={[0, 6, 6, 0]}
                                    barSize={18}
                                >
                                    {chartData.map((r, index) => (
                                        <Cell
                                            key={`${r.name}-${index}`}
                                            fill={statusColor[r.status]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </FxSoft>
                </FxCard>
            </Reveal>

            <Reveal delay={0.15}>
                <FxCard className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-secondary text-left text-xs text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Menu</th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Harga jual
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    HPP
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Margin Rp
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Margin
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {menus.map((r) => (
                                <tr
                                    key={r.id}
                                    className="border-b border-border/60 last:border-0"
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {r.name}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {formatRupiah(r.selling_price)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {formatRupiah(r.current_hpp)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {formatRupiah(r.margin_rupiah)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {formatPercent(r.margin_pct)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={r.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </FxCard>
            </Reveal>

            <Reveal delay={0.2}>
                <FxCard className="flex flex-col gap-4 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-semibold">
                                Ranking menu
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Agregat periode dari pesanan selesai (BL 7.2),
                                diurutkan menurut laba kotor.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {periods.map((p) => (
                                <button
                                    key={p.key}
                                    onClick={() => changePeriod(p.key)}
                                    className={`h-8 rounded-full px-3 text-xs font-semibold transition-all duration-200 ${
                                        period === p.key
                                            ? 'fx-coral'
                                            : 'bg-secondary text-foreground hover:bg-hover-soft'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <FxSoft className="flex flex-col gap-3 p-4">
                            <p className="text-xs text-muted-foreground">
                                Revenue
                            </p>
                            <p className="text-lg font-bold tabular-nums">
                                {formatRupiah(totals.revenue)}
                            </p>
                        </FxSoft>
                        <FxSoft className="flex flex-col gap-3 p-4">
                            <p className="text-xs text-muted-foreground">
                                HPP terjual
                            </p>
                            <p className="text-lg font-bold tabular-nums">
                                {formatRupiah(totals.cogs)}
                            </p>
                        </FxSoft>
                        <FxSoft className="flex flex-col gap-3 p-4">
                            <p className="text-xs text-muted-foreground">
                                Gross profit
                            </p>
                            <p className="text-lg font-bold tabular-nums">
                                {formatRupiah(totals.gross_profit)}
                            </p>
                        </FxSoft>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-secondary text-left text-xs text-muted-foreground">
                                    <th className="rounded-l-xl px-3 py-2.5 font-medium">
                                        #
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">
                                        Menu
                                    </th>
                                    <th className="px-3 py-2.5 text-right font-medium">
                                        Terjual
                                    </th>
                                    <th className="px-3 py-2.5 text-right font-medium">
                                        Revenue
                                    </th>
                                    <th className="px-3 py-2.5 text-right font-medium">
                                        HPP terjual
                                    </th>
                                    <th className="px-3 py-2.5 text-right font-medium">
                                        Gross profit
                                    </th>
                                    <th className="px-3 py-2.5 text-right font-medium">
                                        GM
                                    </th>
                                    <th className="rounded-r-xl px-3 py-2.5 text-right font-medium">
                                        Kontribusi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {ranking.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-3 py-6 text-center text-muted-foreground"
                                        >
                                            Belum ada penjualan pada periode
                                            ini.
                                        </td>
                                    </tr>
                                ) : (
                                    ranking.map((r, index) => (
                                        <tr
                                            key={r.menu_id}
                                            className="border-b border-border/60 last:border-0"
                                        >
                                            <td className="px-3 py-3 font-semibold text-muted-foreground tabular-nums">
                                                {index + 1}
                                            </td>
                                            <td className="px-3 py-3 font-medium">
                                                {r.name}
                                            </td>
                                            <td className="px-3 py-3 text-right tabular-nums">
                                                {r.quantity_sold}
                                            </td>
                                            <td className="px-3 py-3 text-right tabular-nums">
                                                {formatRupiah(r.revenue)}
                                            </td>
                                            <td className="px-3 py-3 text-right tabular-nums">
                                                {formatRupiah(r.cogs)}
                                            </td>
                                            <td className="px-3 py-3 text-right font-semibold tabular-nums">
                                                {formatRupiah(r.gross_profit)}
                                            </td>
                                            <td className="px-3 py-3 text-right tabular-nums">
                                                {r.gross_margin_pct !== null
                                                    ? formatPercent(
                                                          r.gross_margin_pct,
                                                      )
                                                    : '-'}
                                            </td>
                                            <td className="px-3 py-3 text-right tabular-nums">
                                                {r.contribution_pct !== null
                                                    ? formatPercent(
                                                          r.contribution_pct,
                                                      )
                                                    : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </FxCard>
            </Reveal>

            {simOpen ? (
                <SimulateModal
                    ingredients={ingredients}
                    initialIngredientId={filters.sim_ingredient}
                    initialPrice={filters.sim_price}
                    simulation={simulation}
                    period={period}
                    onClose={() => {
                        setSimOpen(false);
                        router.get(
                            '/profitabilitas',
                            { period },
                            {
                                only: ['simulation'],
                                preserveState: true,
                                preserveScroll: true,
                                replace: true,
                            },
                        );
                    }}
                />
            ) : null}
        </PageShell>
    );
}

function SimulateModal({
    ingredients,
    initialIngredientId,
    initialPrice,
    simulation,
    period,
    onClose,
}: {
    ingredients: IngredientOption[];
    initialIngredientId: number | null;
    initialPrice: string;
    simulation: SimRow[] | null;
    period: string;
    onClose: () => void;
}) {
    const first = ingredients[0];
    const startId = initialIngredientId ?? first?.id ?? 0;
    const startIngredient = ingredients.find((i) => i.id === startId) ?? first;

    const [ingredientId, setIngredientId] = useState(startId);
    const [price, setPrice] = useState(
        initialPrice !== ''
            ? initialPrice
            : (startIngredient?.cost_per_unit ?? '0'),
    );

    const target = ingredients.find((i) => i.id === ingredientId) ?? first;
    const rows = simulation ?? [];

    useEffect(() => {
        const timer = window.setTimeout(() => {
            router.get(
                '/profitabilitas',
                { sim_ingredient: ingredientId, sim_price: price, period },
                {
                    only: ['simulation'],
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);

        return () => window.clearTimeout(timer);
    }, [ingredientId, price, period]);

    if (!first || !target) {
        return (
            <FxModal
                open
                onOpenChange={(o) => !o && onClose()}
                title="Simulasi harga bahan"
                footer={
                    <FxButton variant="soft" onClick={onClose}>
                        Tutup
                    </FxButton>
                }
            >
                <p className="py-4 text-center text-sm text-muted-foreground">
                    Belum ada bahan aktif untuk disimulasikan.
                </p>
            </FxModal>
        );
    }

    return (
        <FxModal
            open
            onOpenChange={(o) => !o && onClose()}
            wide
            title="Simulasi harga bahan"
            description="What-if tanpa menyimpan. Ubah harga satu bahan untuk melihat dampaknya ke HPP dan margin."
            footer={
                <FxButton variant="soft" onClick={onClose}>
                    Tutup
                </FxButton>
            }
        >
            <div className="grid gap-3 sm:grid-cols-2">
                <FxField label="Bahan">
                    <FxSelect
                        value={ingredientId}
                        onChange={(e) => {
                            const id = Number(e.target.value);
                            setIngredientId(id);
                            const next = ingredients.find((i) => i.id === id);
                            setPrice(next?.cost_per_unit ?? '0');
                        }}
                    >
                        {ingredients.map((i) => (
                            <option key={i.id} value={i.id}>
                                {i.name} (WAC {formatRupiah(i.cost_per_unit)}/
                                {i.base_unit})
                            </option>
                        ))}
                    </FxSelect>
                </FxField>
                <FxField
                    label={`Harga simulasi (per ${target.base_unit})`}
                    hint={`WAC saat ini ${formatRupiah(target.cost_per_unit)}`}
                >
                    <FxInput
                        type="number"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </FxField>
            </div>

            {rows.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                    Bahan ini belum dipakai di menu mana pun.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-secondary text-left text-xs text-muted-foreground">
                                <th className="rounded-l-xl px-3 py-2.5 font-medium">
                                    Menu
                                </th>
                                <th className="px-3 py-2.5 text-right font-medium">
                                    HPP lama
                                </th>
                                <th className="px-3 py-2.5 text-right font-medium">
                                    HPP baru
                                </th>
                                <th className="px-3 py-2.5 text-right font-medium">
                                    Margin baru
                                </th>
                                <th className="rounded-r-xl px-3 py-2.5 font-medium">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((a) => (
                                <tr
                                    key={a.menu_id}
                                    className="border-b border-border/60 last:border-0"
                                >
                                    <td className="px-3 py-3 font-medium">
                                        {a.name}
                                    </td>
                                    <td className="px-3 py-3 text-right text-muted-foreground tabular-nums">
                                        {formatRupiah(a.old_hpp)}
                                    </td>
                                    <td className="px-3 py-3 text-right tabular-nums">
                                        {formatRupiah(a.new_hpp)}
                                    </td>
                                    <td className="px-3 py-3 text-right tabular-nums">
                                        {formatPercent(a.new_margin)}
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className="inline-flex items-center gap-2">
                                            <StatusBadge
                                                status={a.old_status}
                                            />
                                            {a.old_status !== a.new_status ? (
                                                <>
                                                    <span className="text-muted-foreground">
                                                        →
                                                    </span>
                                                    <StatusBadge
                                                        status={a.new_status}
                                                    />
                                                </>
                                            ) : null}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <FxSoft className="p-4 text-xs text-muted-foreground">
                Simulasi tidak mengubah data apa pun. Menutup dialog
                mengembalikan nilai asli.
            </FxSoft>
        </FxModal>
    );
}
