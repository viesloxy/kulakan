import { Head } from '@inertiajs/react';
import { Coins, TrendingUp, TriangleAlert, XCircle } from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';
import PageHeader from '@/components/page-header';
import StatusBadge, { type MenuStatus } from '@/components/status-badge';
import { formatPercent, formatRupiah } from '@/lib/format';

type MenuProfit = {
    id: number;
    name: string;
    sellingPrice: number;
    hpp: number;
    marginPct: number;
    status: MenuStatus;
};

// Mock data. Angka mengikuti contoh kanonik (Es Kopi Susu Aren: HPP Rp 11.244, margin 48,89%).
const menus: MenuProfit[] = [
    { id: 1, name: 'Kopi Hitam', sellingPrice: 15000, hpp: 5200, marginPct: 65.33, status: 'profitable' },
    { id: 2, name: 'Roti Bakar Keju', sellingPrice: 18000, hpp: 9000, marginPct: 50.0, status: 'profitable' },
    { id: 3, name: 'Es Kopi Susu Aren', sellingPrice: 22000, hpp: 11244, marginPct: 48.89, status: 'profitable' },
    { id: 4, name: 'Hazelnut Latte', sellingPrice: 25000, hpp: 17500, marginPct: 30.0, status: 'watchlist' },
    { id: 5, name: 'Matcha Latte', sellingPrice: 26000, hpp: 19500, marginPct: 25.0, status: 'watchlist' },
    { id: 6, name: 'Cokelat Panas', sellingPrice: 20000, hpp: 15800, marginPct: 21.0, status: 'loss' },
];

const statusColor: Record<MenuStatus, string> = {
    profitable: '#1D9E53',
    watchlist: '#F2B824',
    loss: '#D93829',
};

export default function Profitability() {
    const counts = { profitable: 0, watchlist: 0, loss: 0 };
    for (const m of menus) {
        counts[m.status] += 1;
    }

    const avgMargin = menus.reduce((sum, m) => sum + m.marginPct, 0) / menus.length;

    const statusCards = [
        { label: 'Profitable', value: counts.profitable, icon: TrendingUp, tone: 'success' as const },
        { label: 'Watchlist', value: counts.watchlist, icon: TriangleAlert, tone: 'warning' as const },
        { label: 'Loss', value: counts.loss, icon: XCircle, tone: 'danger' as const },
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
                        <FxButton variant="coral">
                            <Coins className="size-4" />
                            Simulasi harga
                        </FxButton>
                    </div>
                </Reveal>

                <Reveal delay={0.05}>
                    <div className="grid gap-4 md:grid-cols-4">
                        <FxCard className="fx-coral flex flex-col justify-between p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-white">Margin rata-rata</span>
                                <IconCircle icon={Coins} tone="white" size="sm" />
                            </div>
                            <p className="mt-3 text-2xl font-bold tracking-tight text-white tabular-nums">
                                {formatPercent(avgMargin, 1)}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-white/85">dari {menus.length} menu</p>
                        </FxCard>

                        {statusCards.map((s) => (
                            <FxCard key={s.label} className="flex flex-col justify-between p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">{s.label}</span>
                                    <IconCircle icon={s.icon} tone={s.tone} size="sm" />
                                </div>
                                <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums">{s.value}</p>
                                <p className="mt-1 text-[11px] font-semibold text-muted-foreground">menu</p>
                            </FxCard>
                        ))}
                    </div>
                </Reveal>

                <Reveal delay={0.1}>
                    <FxCard className="p-4 md:p-5">
                        <h2 className="text-base font-semibold">Margin per menu</h2>
                        <p className="mb-4 text-xs text-muted-foreground">Persentase margin kotor terhadap harga jual.</p>
                        <FxSoft className="h-72 w-full p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={menus} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 8 }}>
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
                                        formatter={(value) => [`${value}%`, 'Margin']}
                                        contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }}
                                    />
                                    <Bar dataKey="marginPct" radius={[0, 6, 6, 0]} barSize={18}>
                                        {menus.map((m) => (
                                            <Cell key={m.id} fill={statusColor[m.status]} />
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
                                    <th className="px-4 py-3 font-medium">Menu</th>
                                    <th className="px-4 py-3 text-right font-medium">Harga jual</th>
                                    <th className="px-4 py-3 text-right font-medium">HPP</th>
                                    <th className="px-4 py-3 text-right font-medium">Margin</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {menus.map((m) => (
                                    <tr key={m.id} className="border-b border-border/60 last:border-0">
                                        <td className="px-4 py-3 font-medium">{m.name}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(m.sellingPrice)}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(m.hpp)}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{formatPercent(m.marginPct)}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={m.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </FxCard>
                </Reveal>
            </div>
        </>
    );
}