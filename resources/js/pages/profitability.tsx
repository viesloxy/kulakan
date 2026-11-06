import { Head } from '@inertiajs/react';
import { Coins, TrendingUp, TriangleAlert, XCircle } from 'lucide-react';
import { useState } from 'react';
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
import {
    ingredientById,
    ingredients,
    marginPct,
    menuHpp,
    menuStatus,
    menus,
    type Menu,
} from '@/lib/mock-data';

const statusColor: Record<MenuStatus, string> = {
    profitable: '#1D9E53',
    watchlist: '#F2B824',
    loss: '#D93829',
};

export default function Profitability() {
    const [simOpen, setSimOpen] = useState(false);

    const rows = menus.map((m) => ({
        ...m,
        hpp: menuHpp(m),
        margin: marginPct(m),
        status: menuStatus(m),
    }));

    const counts = { profitable: 0, watchlist: 0, loss: 0 };
    for (const r of rows) {
        counts[r.status] += 1;
    }

    const avgMargin = rows.reduce((sum, r) => sum + r.margin, 0) / rows.length;

    const statusCards = [
        {
            label: 'Profitable',
            value: counts.profitable,
            icon: TrendingUp,
            tone: 'success' as const,
        },
        {
            label: 'Watchlist',
            value: counts.watchlist,
            icon: TriangleAlert,
            tone: 'warning' as const,
        },
        {
            label: 'Loss',
            value: counts.loss,
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
                                {formatPercent(avgMargin, 1)}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-white/85">
                                dari {menus.length} menu
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
                                    data={rows}
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
                                        {rows.map((r) => (
                                            <Cell
                                                key={r.id}
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
                                        Margin
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr
                                        key={r.id}
                                        className="border-b border-border/60 last:border-0"
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            {r.name}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {formatRupiah(r.price)}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {formatRupiah(r.hpp)}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {formatPercent(r.margin)}
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
                <SimulateModal onClose={() => setSimOpen(false)} />
            ) : null}
        </>
    );
}

function statusFromMargin(margin: number): MenuStatus {
    if (margin > 45) {
        return 'profitable';
    }
    if (margin >= 25) {
        return 'watchlist';
    }

    return 'loss';
}

function SimulateModal({ onClose }: { onClose: () => void }) {
    const [ingredientId, setIngredientId] = useState(ingredients[0].id);
    const [price, setPrice] = useState(String(ingredients[0].costPerUnit));

    const target = ingredientById(ingredientId);
    const newPrice = Number(price) || 0;

    const affected = menus
        .filter((m) => m.bom.some((b) => b.ingredientId === ingredientId))
        .map((m: Menu) => {
            const oldHpp = menuHpp(m);
            const simBahan = m.bom.reduce((sum, b) => {
                const ing = ingredientById(b.ingredientId);
                const cost =
                    b.ingredientId === ingredientId
                        ? newPrice
                        : ing.costPerUnit;
                return sum + b.qty * (1 + b.wastePct / 100) * cost;
            }, 0);
            const simHpp = simBahan + m.overhead;
            const simMargin = ((m.price - simHpp) / m.price) * 100;
            return {
                menu: m,
                oldHpp,
                simHpp,
                simMargin,
                oldStatus: menuStatus(m),
                simStatus: statusFromMargin(simMargin),
            };
        });

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
                            setPrice(String(ingredientById(id).costPerUnit));
                        }}
                    >
                        {ingredients.map((i) => (
                            <option key={i.id} value={i.id}>
                                {i.name} (WAC {formatRupiah(i.costPerUnit)}/
                                {i.unit})
                            </option>
                        ))}
                    </FxSelect>
                </FxField>
                <FxField
                    label={`Harga simulasi (per ${target.unit})`}
                    hint={`WAC saat ini ${formatRupiah(target.costPerUnit)}`}
                >
                    <FxInput
                        type="number"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </FxField>
            </div>

            {affected.length === 0 ? (
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
                            {affected.map((a) => (
                                <tr
                                    key={a.menu.id}
                                    className="border-b border-border/60 last:border-0"
                                >
                                    <td className="px-3 py-3 font-medium">
                                        {a.menu.name}
                                    </td>
                                    <td className="px-3 py-3 text-right text-muted-foreground tabular-nums">
                                        {formatRupiah(a.oldHpp)}
                                    </td>
                                    <td className="px-3 py-3 text-right tabular-nums">
                                        {formatRupiah(a.simHpp)}
                                    </td>
                                    <td className="px-3 py-3 text-right tabular-nums">
                                        {formatPercent(a.simMargin)}
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className="inline-flex items-center gap-2">
                                            <StatusBadge status={a.oldStatus} />
                                            {a.oldStatus !== a.simStatus ? (
                                                <>
                                                    <span className="text-muted-foreground">
                                                        →
                                                    </span>
                                                    <StatusBadge
                                                        status={a.simStatus}
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
                Simulasi tidak mengubah data apa pun. Keluar dari dialog
                mengembalikan semua nilai.
            </FxSoft>
        </FxModal>
    );
}
