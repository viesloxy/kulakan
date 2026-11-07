import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Lightbulb, Save, SlidersHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import Reveal from '@/components/motion/reveal';
import PageHeader from '@/components/page-header';
import { formatRupiah } from '@/lib/format';

type Abc = 'A' | 'B' | 'C';
type BaseUnit = 'gram' | 'ml' | 'pcs';
type Label =
    | 'beli_sekarang'
    | 'beli_sekarang_parsial'
    | 'beli_opsional'
    | 'tahan_dulu'
    | 'kas_tidak_cukup';

type RestockItem = {
    ingredient_id: number;
    name: string;
    base_unit: BaseUnit;
    abc_class: Abc;
    is_urgent: boolean;
    urgency: string;
    priority_score: string;
    qmin_packages: number;
    qtarget_packages: number;
    recommended_packages: number;
    package_size: string;
    package_price: number;
    estimated_cost: number;
    label: Label;
};

type Plan = {
    cash_amount: number;
    total_cost: number;
    remaining_cash: number;
    items: RestockItem[];
};

type LastPlan = {
    id: number;
    status: 'draft' | 'approved' | 'purchased';
    cash_amount: number;
    total_cost: number;
    remaining_cash: number;
    created_at: string | null;
    purchased_at: string | null;
    items: {
        ingredient_id: number;
        recommended_packages: number;
        estimated_cost: number;
        label: string | null;
        purchased_packages: number | null;
    }[];
};

type Props = {
    default_cash_amount: number;
    max_days_lead_time: number;
    presets: number[];
    plan: Plan;
    last_plan: LastPlan | null;
};

const abcTone: Record<Abc, { bg: string; text: string }> = {
    A: { bg: 'bg-coral-soft', text: 'text-primary' },
    B: { bg: 'bg-info-soft', text: 'text-info' },
    C: { bg: 'bg-secondary', text: 'text-muted-foreground' },
};

const labelConfig: Record<Label, { text: string; cls: string }> = {
    beli_sekarang: {
        text: 'Beli sekarang',
        cls: 'bg-success-soft text-success',
    },
    beli_sekarang_parsial: {
        text: 'Beli sebagian',
        cls: 'bg-warning-soft text-warning-ink',
    },
    beli_opsional: {
        text: 'Beli opsional',
        cls: 'bg-info-soft text-info',
    },
    tahan_dulu: {
        text: 'Tahan dulu',
        cls: 'bg-secondary text-muted-foreground',
    },
    kas_tidak_cukup: {
        text: 'Kas tidak cukup',
        cls: 'bg-danger-soft text-danger',
    },
};

const statusLabel: Record<LastPlan['status'], string> = {
    draft: 'Draft',
    approved: 'Disetujui',
    purchased: 'Dibeli',
};

export default function Restock({
    default_cash_amount,
    max_days_lead_time,
    presets,
    plan,
    last_plan,
}: Props) {
    const [cash, setCash] = useState(default_cash_amount);
    const firstRun = useRef(true);

    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }

        const timer = window.setTimeout(() => {
            router.get(
                '/restock',
                { cash },
                {
                    only: ['plan'],
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 250);

        return () => window.clearTimeout(timer);
    }, [cash]);

    const total = plan.total_cost;
    const remaining = plan.remaining_cash;
    const usedPct = cash > 0 ? Math.min(100, (total / cash) * 100) : 0;
    const boughtCount = plan.items.filter(
        (it) => it.recommended_packages > 0,
    ).length;

    function savePlan() {
        router.post(
            '/restock/plans',
            { cash_amount: cash, max_days_lead_time },
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Rencana belanja tersimpan (draft)'),
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ?? 'Gagal menyimpan rencana.',
                    ),
            },
        );
    }

    function purchase(planId: number) {
        router.post(
            `/restock/plans/${planId}/purchase`,
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Rencana ditandai dibeli', {
                        description: 'Stok bahan bertambah sesuai rekomendasi.',
                    }),
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ?? 'Gagal menandai dibeli.',
                    ),
            },
        );
    }

    return (
        <>
            <Head title="Restock Planner" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <Reveal>
                    <PageHeader
                        title="Restock Planner"
                        description="Masukkan kas, sistem menyusun rencana belanja sesuai urgensi dan kelas ABC."
                    />
                </Reveal>

                <Reveal delay={0.05}>
                    <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
                        <FxCard className="p-5">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <SlidersHorizontal className="size-4" />
                                Kas tersedia
                            </div>
                            <p className="mt-2 text-[2rem] leading-tight font-bold tracking-tight tabular-nums">
                                {formatRupiah(cash)}
                            </p>

                            <input
                                type="range"
                                min={100000}
                                max={1500000}
                                step={10000}
                                value={cash}
                                onChange={(e) =>
                                    setCash(Number(e.target.value))
                                }
                                className="mt-4 w-full accent-primary"
                            />

                            <div className="mt-3 flex flex-wrap gap-2">
                                {presets.map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setCash(p)}
                                        className={`h-8 rounded-full px-3 text-xs font-semibold transition-all duration-200 ${
                                            cash === p
                                                ? 'fx-coral'
                                                : 'bg-secondary text-foreground hover:bg-hover-soft'
                                        }`}
                                    >
                                        {p / 1000 + 'rb'}
                                    </button>
                                ))}
                            </div>

                            <FxSoft className="mt-4 p-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Terpakai
                                    </span>
                                    <span className="font-bold tabular-nums">
                                        {formatRupiah(total)}
                                    </span>
                                </div>
                                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-hover-soft fx-hatch">
                                    <div
                                        className="h-full rounded-full bg-primary"
                                        style={{
                                            width: `${usedPct}%`,
                                            backgroundImage:
                                                'repeating-linear-gradient(-45deg, rgba(255,255,255,0.18) 0 3px, transparent 3px 6px)',
                                        }}
                                    />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                        Sisa kas
                                    </span>
                                    <span className="font-semibold text-success tabular-nums">
                                        {formatRupiah(remaining)}
                                    </span>
                                </div>
                            </FxSoft>

                            {last_plan ? (
                                <FxSoft className="mt-4 flex flex-col gap-3 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold">
                                            Rencana #{last_plan.id}
                                        </span>
                                        <span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-semibold">
                                            {statusLabel[last_plan.status]}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>
                                            Total{' '}
                                            {formatRupiah(last_plan.total_cost)}
                                        </span>
                                        <span>
                                            Sisa{' '}
                                            {formatRupiah(
                                                last_plan.remaining_cash,
                                            )}
                                        </span>
                                    </div>
                                    {last_plan.status !== 'purchased' ? (
                                        <FxButton
                                            variant="soft"
                                            className="w-full"
                                            onClick={() =>
                                                purchase(last_plan.id)
                                            }
                                        >
                                            <CheckCircle2 className="size-4" />
                                            Tandai dibeli
                                        </FxButton>
                                    ) : (
                                        <p className="inline-flex items-center gap-2 text-xs font-semibold text-success">
                                            <CheckCircle2 className="size-4" />
                                            Sudah dibeli, stok bertambah.
                                        </p>
                                    )}
                                </FxSoft>
                            ) : null}
                        </FxCard>

                        <FxCard className="flex flex-col p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-base font-semibold">
                                    Rekomendasi belanja
                                </h2>
                                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                                    {plan.items.length} bahan
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-secondary text-left text-xs text-muted-foreground">
                                            <th className="rounded-l-xl px-3 py-2.5 font-medium">
                                                Bahan
                                            </th>
                                            <th className="px-3 py-2.5 font-medium">
                                                Kelas
                                            </th>
                                            <th className="px-3 py-2.5 text-right font-medium">
                                                Beli
                                            </th>
                                            <th className="px-3 py-2.5 text-right font-medium">
                                                Estimasi
                                            </th>
                                            <th className="rounded-r-xl px-3 py-2.5 font-medium">
                                                Label
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {plan.items.map((it) => {
                                            const tone = abcTone[it.abc_class];
                                            const lb = labelConfig[it.label];
                                            return (
                                                <tr
                                                    key={it.ingredient_id}
                                                    className="border-b border-border/60 last:border-0"
                                                >
                                                    <td className="px-3 py-3">
                                                        <p className="font-medium">
                                                            {it.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            target{' '}
                                                            {
                                                                it.qtarget_packages
                                                            }{' '}
                                                            pack · prioritas{' '}
                                                            {Number(
                                                                it.priority_score,
                                                            ).toFixed(2)}
                                                        </p>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <span
                                                            className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${tone.bg} ${tone.text}`}
                                                        >
                                                            {it.abc_class}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-right font-semibold tabular-nums">
                                                        {
                                                            it.recommended_packages
                                                        }{' '}
                                                        pack
                                                    </td>
                                                    <td className="px-3 py-3 text-right tabular-nums">
                                                        {formatRupiah(
                                                            it.estimated_cost,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${lb.cls}`}
                                                        >
                                                            {lb.text}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                    <Lightbulb className="size-4 text-muted-foreground" />
                                    Total tidak pernah melebihi kas.{' '}
                                    {boughtCount} bahan direkomendasikan dibeli.
                                </span>
                                <FxButton variant="coral" onClick={savePlan}>
                                    <Save className="size-4" />
                                    Simpan rencana
                                </FxButton>
                            </div>
                        </FxCard>
                    </div>
                </Reveal>
            </div>
        </>
    );
}
