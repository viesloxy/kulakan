import { Head } from '@inertiajs/react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import StatusBadge, { type MenuStatus } from '@/components/status-badge';
import Reveal from '@/components/motion/reveal';
import { formatPercent, formatRupiah } from '@/lib/format';

type MenuProfit = {
    id: number;
    name: string;
    sellingPrice: number;
    hpp: number;
    marginPct: number;
    status: MenuStatus;
};

// Mock data untuk pengembangan UI. Angka tetap mengikuti contoh kanonik
// (Es Kopi Susu Aren: HPP Rp 11.244, margin 48,89%).
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

    const summary = [
        { key: 'profitable' as const, label: 'Profitable', value: counts.profitable },
        { key: 'watchlist' as const, label: 'Watchlist', value: counts.watchlist },
        { key: 'loss' as const, label: 'Loss', value: counts.loss },
    ];

    return (
        <>
            <Head title="Profitabilitas" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <Reveal>
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">Profitabilitas</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Margin dan status tiap menu, dihitung dari HPP terkini.
                        </p>
                    </div>
                </Reveal>

                <Reveal delay={0.05}>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {summary.map((s) => (
                            <div key={s.key} className="fx-card p-4">
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full" style={{ backgroundColor: statusColor[s.key] }} />
                                    <p className="text-sm text-muted-foreground">{s.label}</p>
                                </div>
                                <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
                            </div>
                        ))}
                    </div>
                </Reveal>

                <Reveal delay={0.1}>
                    <div className="fx-card p-4 md:p-5">
                        <h2 className="text-base font-semibold">Margin per menu</h2>
                        <p className="mb-4 text-xs text-muted-foreground">Persentase margin kotor terhadap harga jual.</p>
                        <div className="fx-soft h-72 w-full p-4">
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
                        </div>
                    </div>
                </Reveal>

                <Reveal delay={0.15}>
                    <div className="fx-card overflow-hidden">
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
                    </div>
                </Reveal>
            </div>
        </>
    );
}