import { Head, router } from '@inertiajs/react';
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
import PageHeader from '@/components/page-header';
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

type Props = {
    menus: ProfitRow[];
    summary: { total: number; avg_margin: string; counts: Counts };
    ingredients: IngredientOption[];
    filters: { sim_ingredient: number | null; sim_price: string };
    simulation: SimRow[] | null;
};

const statusColor: Record<MenuStatus, string> = {
    profitable: '#1D9E53',
    watchlist: '#F2B824',
    loss: '#D93829',
};

export default function Profitability({
    menus,
    summary,
    ingredients,
    filters,
    simulation,
}: Props) {
    const [simOpen, setSimOpen] = useState(false);

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
        <>
            <Head title="Profitabilitas" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <Reveal>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <PageHeader
                            title="Profitabilitas"
                            description="Margin dan status tiap menu, dihitung dari HPP terkini."
                        />
                        <FxButton
                            variant="coral"
                            onClick={() => setSimOpen(true)}
                        >
                            <Coins className="size-4" />
                            Simulasi harga
                        </FxButton>
                    </div>
                </Reveal>

                <Reveal delay={0.05}>
                    <div className="grid gap-4 md:grid-cols-4">
                        <FxCard className="flex flex-col justify-between fx-coral p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-white">
                                    Margin rata-rata
                                </span>
                                <IconCircle
                                    icon={Coins}
                                    tone="white"
                                    size="sm"
                                />
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
                        <h2 className="text-base font-semibold">
                            Margin per menu
                        </h2>
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
                                        tick={{ fontSize: 12, fill: '#6E6E6A' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={148}
                                        tick={{ fontSize: 12, fill: '#161615' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(22,22,21,0.04)' }}
                                        formatter={(value) => [
                                            `${Number(value).toFixed(2)}%`,
                                            'Margin',
                                        ]}
                                        contentStyle={{
                                            borderRadius: 12,
                                            border: 'none',
                                            fontSize: 12,
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
                    <FxCard className="overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-secondary text-left text-xs text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">
                                        Menu
                                    </th>
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
            </div>

            {simOpen ? (
                <SimulateModal
                    ingredients={ingredients}
                    initialIngredientId={filters.sim_ingredient}
                    initialPrice={filters.sim_price}
                    simulation={simulation}
                    onClose={() => {
                        setSimOpen(false);
                        router.get(
                            '/profitabilitas',
                            {},
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
        </>
    );
}

function SimulateModal({
    ingredients,
    initialIngredientId,
    initialPrice,
    simulation,
    onClose,
}: {
    ingredients: IngredientOption[];
    initialIngredientId: number | null;
    initialPrice: string;
    simulation: SimRow[] | null;
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
                { sim_ingredient: ingredientId, sim_price: price },
                {
                    only: ['simulation'],
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);

        return () => window.clearTimeout(timer);
    }, [ingredientId, price]);

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
