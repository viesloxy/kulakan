import { Head } from '@inertiajs/react';
import { Bell, PackageMinus, TrendingDown, TrendingUp } from 'lucide-react';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';
import PageHeader from '@/components/page-header';
import { alerts, type AlertType } from '@/lib/mock-data';

const typeConfig: Record<
    AlertType,
    { icon: typeof Bell; tone: 'danger' | 'warning' | 'coral'; label: string; action: string }
> = {
    stock: { icon: PackageMinus, tone: 'danger', label: 'Stok rendah', action: 'Susun restock' },
    margin: { icon: TrendingDown, tone: 'warning', label: 'Margin turun', action: 'Lihat menu' },
    price: { icon: TrendingUp, tone: 'coral', label: 'Harga naik', action: 'Lihat bahan' },
};

export default function Alerts() {
    const counts = {
        stock: alerts.filter((a) => a.type === 'stock').length,
        margin: alerts.filter((a) => a.type === 'margin').length,
        price: alerts.filter((a) => a.type === 'price').length,
    };

    const kpis = [
        { label: 'Alert aktif', value: String(alerts.length), icon: Bell, tone: 'coral' as const, highlight: true },
        { label: 'Stok rendah', value: String(counts.stock), icon: PackageMinus, tone: 'danger' as const },
        { label: 'Margin turun', value: String(counts.margin), icon: TrendingDown, tone: 'warning' as const },
        { label: 'Harga naik', value: String(counts.price), icon: TrendingUp, tone: 'soft' as const },
    ];

    return (
        <>
            <Head title="Alert" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <Reveal>
                    <PageHeader
                        title="Alert"
                        description="Pantau stok menipis, margin turun, dan kenaikan harga bahan. Dibuat setelah transaksi tersimpan."
                    />
                </Reveal>

                <Reveal delay={0.05}>
                    <div className="grid gap-4 md:grid-cols-4">
                        {kpis.map((k) => (
                            <FxCard
                                key={k.label}
                                className={`flex flex-col justify-between p-4 ${k.highlight ? 'fx-coral' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${k.highlight ? 'font-medium text-white' : 'text-muted-foreground'}`}>
                                        {k.label}
                                    </span>
                                    <IconCircle icon={k.icon} tone={k.highlight ? 'white' : k.tone} size="sm" />
                                </div>
                                <p
                                    className={`mt-3 text-2xl font-bold tracking-tight tabular-nums ${
                                        k.highlight ? 'text-white' : ''
                                    }`}
                                >
                                    {k.value}
                                </p>
                                <p className={`mt-1 text-[11px] font-semibold ${k.highlight ? 'text-white/85' : 'text-muted-foreground'}`}>
                                    hari ini
                                </p>
                            </FxCard>
                        ))}
                    </div>
                </Reveal>

                <Reveal delay={0.1}>
                    <FxCard className="flex flex-col gap-3 p-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold">Daftar alert</h2>
                            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                                {alerts.length} aktif
                            </span>
                        </div>

                        <div className="flex flex-col gap-3">
                            {alerts.map((a) => {
                                const cfg = typeConfig[a.type];
                                return (
                                    <FxSoft key={a.id} className="flex flex-wrap items-center gap-3 p-4">
                                        <IconCircle icon={cfg.icon} tone={cfg.tone} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold">{a.title}</p>
                                                <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                                            <p className="mt-1 text-[11px] text-muted-foreground">
                                                {a.id} · {a.time}
                                            </p>
                                        </div>
                                        <FxButton variant="soft">{cfg.action}</FxButton>
                                    </FxSoft>
                                );
                            })}
                        </div>
                    </FxCard>
                </Reveal>
            </div>
        </>
    );
}