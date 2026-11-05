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
import { marginPct, menuHpp, menuStatus, menus } from '@/lib/mock-data';

const statusColor: Record<MenuStatus, string> = {
    profitable: '#1D9E53',
    watchlist: '#F2B824',
    loss: '#D93829',
};

export default function Profitability() {
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
                                <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 8 }}>
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
                                        formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Margin']}
                                        contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }}
                                    />
                                    <Bar dataKey="margin" radius={[0, 6, 6, 0]} barSize={18}>
                                        {rows.map((r) => (
                                            <Cell key={r.id} fill={statusColor[r.status]} />
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
                                {rows.map((r) => (
                                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                                        <td className="px-4 py-3 font-medium">{r.name}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(r.price)}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(r.hpp)}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{formatPercent(r.margin)}</td>
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
        </>
    );
}