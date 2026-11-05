import { Head } from '@inertiajs/react';
import { ArrowDownLeft, ArrowUpRight, Package, Receipt, TrendingUp, TriangleAlert } from 'lucide-react';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';
import { formatRupiah } from '@/lib/format';
import { alerts, inventoryValue, menuStatus, menus } from '@/lib/mock-data';
import { dashboard } from '@/routes';

const wallets = [
    { label: 'Kas tunai', value: 320000, active: true },
    { label: 'QRIS', value: 180000, active: true },
    { label: 'Cadangan', value: 0, active: false },
];

const profitableCount = menus.filter((m) => menuStatus(m) === 'profitable').length;

const kpis = [
    { label: 'Nilai persediaan', value: formatRupiah(inventoryValue()), icon: Package, trend: '+4%', highlight: true },
    { label: 'Menu profitable', value: String(profitableCount), icon: TrendingUp, trend: '+1', highlight: false },
    { label: 'Alert aktif', value: String(alerts.length), icon: TriangleAlert, trend: '0', highlight: false },
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
                    <section className="grid gap-5 lg:grid-cols-[1fr_1.3fr_1fr]">
                        <FxCard className="p-5">
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

                            <div className="mt-4 flex flex-col gap-2">
                                <FxButton variant="coral" className="w-full">
                                    <ArrowUpRight className="size-4" />
                                    Catat pesanan
                                </FxButton>
                                <FxButton variant="soft" className="w-full">
                                    <ArrowDownLeft className="size-4" />
                                    Rencana belanja
                                </FxButton>
                            </div>

                            <FxSoft className="mt-4 p-4">
                                <div className="mb-3 flex items-center justify-between text-xs font-semibold">
                                    <span>Sumber kas</span>
                                    <span className="font-medium text-muted-foreground">3 akun</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {wallets.map((w) => (
                                        <div key={w.label} className="rounded-2xl bg-card p-3">
                                            <p className="text-[11px] font-semibold text-muted-foreground">{w.label}</p>
                                            <p className="mt-1 text-xs font-bold tabular-nums whitespace-nowrap">
                                                {formatRupiah(w.value)}
                                            </p>
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
                            </FxSoft>
                        </FxCard>

                        <FxCard className="flex flex-col gap-3 p-3.5">
                            <div className="fx-coral flex flex-[1.3] flex-col justify-between rounded-2xl p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-medium text-white">{kpis[0].label}</span>
                                    <IconCircle icon={kpis[0].icon} tone="white" size="sm" />
                                </div>
                                <div className="mt-3">
                                    <p className="text-[1.75rem] font-bold tracking-tight text-white tabular-nums whitespace-nowrap">
                                        {kpis[0].value}
                                    </p>
                                    <p className="mt-1 text-[11px] font-semibold text-white/85">
                                        {kpis[0].trend} dari kemarin
                                    </p>
                                </div>
                            </div>

                            <div className="grid flex-1 grid-cols-3 gap-3">
                                {kpis.slice(1).map((k) => (
                                    <div key={k.label} className="fx-soft flex flex-col justify-between rounded-2xl p-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-medium">{k.label}</span>
                                            <IconCircle icon={k.icon} tone="soft" size="sm" />
                                        </div>
                                        <div className="mt-3">
                                            <p className="text-xl font-bold tracking-tight tabular-nums">{k.value}</p>
                                            <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                                                {k.trend} dari kemarin
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </FxCard>

                        <FxCard className="flex flex-col p-5">
                            <h2 className="text-base font-semibold">Penjualan 7 hari</h2>
                            <p className="text-xs text-muted-foreground">Tren harian</p>
                            <FxSoft className="mt-3 flex h-44 items-end gap-2 p-4">
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
                            </FxSoft>
                        </FxCard>
                    </section>
                </Reveal>

                <Reveal delay={0.1}>
                    <section className="grid gap-5 lg:grid-cols-[1.05fr_2.05fr]">
                        <FxCard className="p-5">
                            <h2 className="text-base font-semibold">Anggaran belanja</h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">Terpakai dari rencana terakhir</p>
                            <div className="fx-hatch mt-4 h-3 w-full overflow-hidden rounded-full bg-[#EBEBE8]">
                                <div
                                    className="h-full w-[97%] rounded-full bg-[#EC582A]"
                                    style={{
                                        backgroundImage:
                                            'repeating-linear-gradient(-45deg, rgba(255,255,255,0.18) 0 3px, transparent 3px 6px)',
                                    }}
                                />
                            </div>
                            <div className="mt-3 flex items-center justify-between text-sm">
                                <span className="font-bold tabular-nums">Rp 483.000</span>
                                <span className="text-muted-foreground">dari Rp 500.000</span>
                            </div>
                        </FxCard>

                        <FxCard className="p-5">
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
                        </FxCard>
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