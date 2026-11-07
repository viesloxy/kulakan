import { Head, router } from '@inertiajs/react';
import {
    Bell,
    Check,
    PackageMinus,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';
import PageHeader from '@/components/page-header';

type AlertType = 'low_stock' | 'margin_drop' | 'price_hike';

type AlertRow = {
    id: number;
    type: AlertType;
    subject_type: string;
    subject_id: number;
    status: string;
    title: string;
    description: string;
    payload: Record<string, unknown>;
    created_at: string | null;
};

type Counts = {
    active: number;
    low_stock: number;
    margin_drop: number;
    price_hike: number;
};

type Props = { alerts: AlertRow[]; counts: Counts };

const typeConfig: Record<
    AlertType,
    {
        icon: typeof Bell;
        tone: 'soft' | 'danger' | 'warning' | 'coral';
        label: string;
        action: string;
        href: string;
    }
> = {
    low_stock: {
        icon: PackageMinus,
        tone: 'danger',
        label: 'Stok rendah',
        action: 'Susun restock',
        href: '/restock',
    },
    margin_drop: {
        icon: TrendingDown,
        tone: 'warning',
        label: 'Margin turun',
        action: 'Lihat menu',
        href: '/menu',
    },
    price_hike: {
        icon: TrendingUp,
        tone: 'soft',
        label: 'Harga naik',
        action: 'Lihat bahan',
        href: '/bahan-baku',
    },
};

function timeLabel(iso: string | null): string {
    if (!iso) {
        return '-';
    }

    const date = new Date(iso);

    return `${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function Alerts({ alerts, counts }: Props) {
    const kpis = [
        {
            label: 'Alert aktif',
            value: String(counts.active),
            icon: Bell,
            tone: 'coral' as const,
            highlight: true,
        },
        {
            label: 'Stok rendah',
            value: String(counts.low_stock),
            icon: PackageMinus,
            tone: 'danger' as const,
        },
        {
            label: 'Margin turun',
            value: String(counts.margin_drop),
            icon: TrendingDown,
            tone: 'warning' as const,
        },
        {
            label: 'Harga naik',
            value: String(counts.price_hike),
            icon: TrendingUp,
            tone: 'soft' as const,
        },
    ];

    function resolve(id: number) {
        router.post(
            `/alert/${id}/resolve`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Alert ditandai selesai'),
                onError: () => toast.error('Gagal menandai alert.'),
            },
        );
    }

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
                                    <span
                                        className={`text-sm ${k.highlight ? 'font-medium text-white' : 'text-muted-foreground'}`}
                                    >
                                        {k.label}
                                    </span>
                                    <IconCircle
                                        icon={k.icon}
                                        tone={k.highlight ? 'white' : k.tone}
                                        size="sm"
                                    />
                                </div>
                                <p
                                    className={`mt-3 text-2xl font-bold tracking-tight tabular-nums ${k.highlight ? 'text-white' : ''}`}
                                >
                                    {k.value}
                                </p>
                                <p
                                    className={`mt-1 text-[11px] font-semibold ${k.highlight ? 'text-white/85' : 'text-muted-foreground'}`}
                                >
                                    aktif
                                </p>
                            </FxCard>
                        ))}
                    </div>
                </Reveal>

                <Reveal delay={0.1}>
                    <FxCard className="flex flex-col gap-3 p-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold">
                                Daftar alert
                            </h2>
                            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                                {alerts.length} aktif
                            </span>
                        </div>

                        {alerts.length === 0 ? (
                            <FxSoft className="flex flex-col items-center gap-2 p-10 text-center">
                                <IconCircle icon={Check} tone="success" />
                                <p className="text-sm text-muted-foreground">
                                    Tidak ada alert aktif. Semua aman.
                                </p>
                            </FxSoft>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {alerts.map((a) => {
                                    const cfg = typeConfig[a.type];
                                    return (
                                        <FxSoft
                                            key={a.id}
                                            className="flex flex-wrap items-center gap-3 p-4"
                                        >
                                            <IconCircle
                                                icon={cfg.icon}
                                                tone={cfg.tone}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-semibold">
                                                        {a.title}
                                                    </p>
                                                    <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {a.description}
                                                </p>
                                                <p className="mt-1 text-[11px] text-muted-foreground">
                                                    AL-{a.id} ·{' '}
                                                    {timeLabel(a.created_at)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FxButton
                                                    variant="soft"
                                                    onClick={() =>
                                                        router.visit(cfg.href)
                                                    }
                                                >
                                                    {cfg.action}
                                                </FxButton>
                                                <FxButton
                                                    variant="soft"
                                                    onClick={() =>
                                                        resolve(a.id)
                                                    }
                                                >
                                                    <Check className="size-4" />
                                                    Selesai
                                                </FxButton>
                                            </div>
                                        </FxSoft>
                                    );
                                })}
                            </div>
                        )}
                    </FxCard>
                </Reveal>
            </div>
        </>
    );
}
