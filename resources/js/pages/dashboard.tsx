import { Head } from '@inertiajs/react';
import { ArrowDownLeft, ArrowUpRight, Package, Receipt, TrendingUp, TriangleAlert } from 'lucide-react';
import Reveal from '@/components/motion/reveal';
import { formatRupiah } from '@/lib/format';
import { dashboard } from '@/routes';

const wallets = [
    { label: 'Kas tunai', value: 320000, active: true },
    { label: 'QRIS', value: 180000, active: true },
    { label: 'Cadangan', value: 0, active: false },
];

const kpis = [
    { label: 'Nilai persediaan', value: formatRupiah(1485000), icon: Package, trend: '+4%', highlight: true },
    { label: 'Menu profitable', value: '3', icon: TrendingUp, trend: '+1', highlight: false },
    { label: 'Alert aktif', value: '2', icon: TriangleAlert, trend: '0', highlight: false },
    { label: 'Pesanan hari ini', value: '18', icon: Receipt, trend: '+6', highlight: false },
];

const bars = [46, 62, 38, 74, 54, 84, 66];

const activities = [
    { id: 'ORD-20261105-0012', desc: 'Es Kopi Susu Aren x2', amount: 44000 },
    { id: 'ORD-20261105-0011', desc: 'Kopi Hitam x3', amount: 45000 },
    { id: 'ORD-20261105-0010', desc: 'Hazelnut Latte x1', amount: 25000 },
    { id: 'ORD-20261105-0009', desc: 'Roti Bakar Keju x2', amount: 36000 },
];

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <Reveal>
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">Selamat datang, Bu Rina</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Ringkasan kas, stok, dan margin dapur hari ini.
                        </p>
                    </div>
                </Reveal>

                <Reveal delay={0.05}>
                    <section className="grid gap-5 lg:grid-cols-[1.05fr_1fr_1.05fr]">
                        <div className="fx-card p-5">
                            <div className="flex items-start justify-between">
                                <span className="text-sm text-muted-foreground">Kas untuk belanja</span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
                                    <span className="size-1.5 rounded-full bg-[#1D9E53]" />
                                    Hari ini
                                </span>
                            </div>
                            <p className="mt-1 text-[2rem] leading-tight font-bold tracking-tight tabular-nums">
                                {formatRupiah(500000)}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="rounded-full bg-[#E6F5EC] px-2 py-0.5 font-semibold text-[#1D9E53]">
                                    +12%
                                </span>
                                dari kemarin
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1C1B18] text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
                                    <ArrowUpRight className="size-4" />
                                    Catat pesanan
                                </button>
                                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-secondary text-sm font-semibold transition-colors hover:bg-[#EBEBE8]">
                                    <ArrowDownLeft className="size-4" />
                                    Rencana belanja
                                </button>
                            </div>

                            <div className="fx-soft mt-4 p-4">
                                <div className="mb-3 flex items-center justify-between text-xs font-semibold">
                                    <span>Sumber kas</span>
                                    <span className="font-medium text-muted-foreground">3 akun</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {wallets.map((w) => (
                                        <div key={w.label} className="rounded-2xl bg-card p-3">
                                            <p className="text-[11px] font-semibold text-muted-foreground">{w.label}</p>
                                            <p className="mt-1 text-sm font-bold tabular-nums">{formatRupiah(w.value)}</p>
                                            <p
                                                className={`mt-1 text-[11px] font-semibold ${
                                                    w.active ? 'text-[#1D9E53]' : 'text-[#D93829]'
                                                }`}
                                            >
                                                {w.active ? 'Aktif' : 'Kosong'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="fx-card grid grid-cols-2 grid-rows-2 gap-3 p-3.5">
                            {kpis.map((k) => (
                                <div
                                    key={k.label}
                                    className={`flex flex-col justify-between rounded-2xl p-4 ${
                                        k.highlight ? 'fx-coral' : 'fx-soft'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`text-sm font-medium ${k.highlight ? 'text-white' : ''}`}>
                                            {k.label}
                                        </span>
                                        <span
                                            className={`flex size-8 items-center justify-center rounded-full ${
                                                k.highlight ? 'bg-white/20 text-white' : 'bg-[rgba(22,22,21,0.05)]'
                                            }`}
                                        >
                                            <k.icon className="size-4" />
                                        </span>
                                    </div>
                                    <div>
                                        <p
                                            className={`mt-3 text-2xl font-bold tracking-tight tabular-nums ${
                                                k.highlight ? 'text-white' : ''
                                            }`}
                                        >
                                            {k.value}
                                        </p>
                                        <p
                                            className={`mt-1 text-[11px] font-semibold ${
                                                k.highlight ? 'text-white/85' : 'text-muted-foreground'
                                            }`}
                                        >
                                            {k.trend} dari kemarin
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="fx-card flex flex-col p-5">
                            <h2 className="text-base font-semibold">Penjualan 7 hari</h2>
                            <p className="text-xs text-muted-foreground">Tren harian</p>
                            <div className="fx-soft mt-3 flex h-44 items-end gap-2 p-4">
                                {bars.map((h, i) => (
                                    <div key={i} className="flex h-full flex-1 flex-col justify-end gap-[3px]">
                                        <div
                                            className="fx-hatch-coral w-full rounded-md bg-[#EC582A]"
                                            style={{ height: `${h}%` }}
                                        />
                                        <div
                                            className="w-full rounded-md bg-[#1C1B18]"
                                            style={{ height: `${Math.max(10, 100 - h)}%` }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </Reveal>

                <Reveal delay={0.1}>
                    <section className="grid gap-5 lg:grid-cols-[1.05fr_2.05fr]">
                        <div className="fx-card p-5">
                            <h2 className="text-base font-semibold">Anggaran belanja</h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">Terpakai dari rencana terakhir</p>
                            <div className="fx-hatch mt-4 h-3 w-full overflow-hidden rounded-full bg-[#EBEBE8]">
                                <div
                                    className="h-full w-[62%] rounded-full bg-[#EC582A]"
                                    style={{
                                        backgroundImage:
                                            'repeating-linear-gradient(-45deg, rgba(255,255,255,0.18) 0 3px, transparent 3px 6px)',
                                    }}
                                />
                            </div>
                            <div className="mt-3 flex items-center justify-between text-sm">
                                <span className="font-bold tabular-nums">Rp 310.000</span>
                                <span className="text-muted-foreground">dari Rp 500.000</span>
                            </div>
                        </div>

                        <div className="fx-card p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-base font-semibold">Aktivitas terbaru</h2>
                                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">Hari ini</span>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-secondary text-left text-xs text-muted-foreground">
                                        <th className="rounded-l-xl px-3 py-2.5 font-medium">Pesanan</th>
                                        <th className="px-3 py-2.5 font-medium">Item</th>
                                        <th className="px-3 py-2.5 text-right font-medium">Total</th>
                                        <th className="rounded-r-xl px-3 py-2.5 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activities.map((a) => (
                                        <tr key={a.id} className="border-b border-border/60 last:border-0">
                                            <td className="px-3 py-3 font-medium tabular-nums">{a.id}</td>
                                            <td className="px-3 py-3 text-muted-foreground">{a.desc}</td>
                                            <td className="px-3 py-3 text-right tabular-nums">{formatRupiah(a.amount)}</td>
                                            <td className="px-3 py-3">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D9E53]">
                                                    <span className="size-1.5 rounded-full bg-[#1D9E53]" />
                                                    Selesai
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </Reveal>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};