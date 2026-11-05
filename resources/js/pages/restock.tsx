import { Head } from '@inertiajs/react';
import { Lightbulb, Save, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import Reveal from '@/components/motion/reveal';
import PageHeader from '@/components/page-header';
import { formatRupiah } from '@/lib/format';
import { ingredientById, purchasePrice, type Abc } from '@/lib/mock-data';

type Item = {
    id: number;
    name: string;
    abc: Abc;
    urgent: boolean;
    packagePrice: number;
    qmin: number;
    qtarget: number;
    priority: number;
};

// Parameter kas-aware reorder (BL §8.5–8.7). Harga beli memakai harga penawaran terbaru bila ada.
const configs: Array<Omit<Item, 'name' | 'packagePrice'>> = [
    { id: 5, abc: 'A', urgent: true, qmin: 5, qtarget: 9, priority: 11.25 },
    { id: 1, abc: 'A', urgent: true, qmin: 1, qtarget: 3, priority: 8.0 },
    { id: 3, abc: 'A', urgent: true, qmin: 1, qtarget: 7, priority: 4.5 },
    { id: 4, abc: 'B', urgent: false, qmin: 0, qtarget: 1, priority: 1.33 },
    { id: 8, abc: 'C', urgent: false, qmin: 0, qtarget: 1, priority: 0.75 },
];

// Contoh kanonik: kas Rp 500.000 -> total Rp 483.000, sisa Rp 17.000.
const items: Item[] = configs.map((c) => ({
    ...c,
    name: ingredientById(c.id).name,
    packagePrice: purchasePrice(ingredientById(c.id)),
}));

function plan(cash: number) {
    let remaining = cash;
    const rec: Record<number, number> = {};
    const sorted = [...items].sort((a, b) => b.priority - a.priority);

    const fund = (it: Item, count: number) => {
        for (let k = 0; k < count; k++) {
            if (remaining >= it.packagePrice) {
                remaining -= it.packagePrice;
                rec[it.id] = (rec[it.id] ?? 0) + 1;
            } else {
                break;
            }
        }
    };

    for (const it of sorted.filter((i) => i.urgent)) {
        fund(it, it.qmin);
    }
    for (const it of sorted.filter((i) => i.urgent)) {
        fund(it, it.qtarget - (rec[it.id] ?? 0));
    }
    for (const it of sorted.filter((i) => !i.urgent)) {
        fund(it, it.qtarget);
    }

    return { rec, remaining };
}

const abcTone: Record<Abc, { bg: string; text: string }> = {
    A: { bg: 'bg-[#FDECE7]', text: 'text-[#EC582A]' },
    B: { bg: 'bg-[#E7EEFC]', text: 'text-[#2B6BE6]' },
    C: { bg: 'bg-secondary', text: 'text-muted-foreground' },
};

function label(it: Item, got: number) {
    if (got <= 0) {
        return it.urgent
            ? { text: 'Kas tidak cukup', cls: 'bg-[#FCEAE8] text-[#D93829]' }
            : { text: 'Tahan dulu', cls: 'bg-secondary text-muted-foreground' };
    }
    if (got >= it.qtarget) {
        return it.urgent
            ? { text: 'Beli sekarang', cls: 'bg-[#E6F5EC] text-[#1D9E53]' }
            : { text: 'Beli opsional', cls: 'bg-[#E7EEFC] text-[#2B6BE6]' };
    }
    return { text: 'Beli sebagian', cls: 'bg-[#FEF3D6] text-[#9A6B00]' };
}

const presets = [300000, 500000, 750000, 1000000];

export default function Restock() {
    const [cash, setCash] = useState(500000);
    const { rec, remaining } = useMemo(() => plan(cash), [cash]);
    const total = cash - remaining;
    const usedPct = cash > 0 ? Math.min(100, (total / cash) * 100) : 0;

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
                                onChange={(e) => setCash(Number(e.target.value))}
                                className="mt-4 w-full accent-[#EC582A]"
                            />

                            <div className="mt-3 flex flex-wrap gap-2">
                                {presets.map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setCash(p)}
                                        className={`h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
                                            cash === p
                                                ? 'bg-[#1C1B18] text-white'
                                                : 'bg-secondary text-foreground hover:bg-[#EBEBE8]'
                                        }`}
                                    >
                                        {(p / 1000) + 'rb'}
                                    </button>
                                ))}
                            </div>

                            <FxSoft className="mt-4 p-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Terpakai</span>
                                    <span className="font-bold tabular-nums">{formatRupiah(total)}</span>
                                </div>
                                <div className="fx-hatch mt-2 h-3 w-full overflow-hidden rounded-full bg-[#EBEBE8]">
                                    <div
                                        className="h-full rounded-full bg-[#EC582A]"
                                        style={{
                                            width: `${usedPct}%`,
                                            backgroundImage:
                                                'repeating-linear-gradient(-45deg, rgba(255,255,255,0.18) 0 3px, transparent 3px 6px)',
                                        }}
                                    />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Sisa kas</span>
                                    <span className="font-semibold text-[#1D9E53] tabular-nums">
                                        {formatRupiah(remaining)}
                                    </span>
                                </div>
                            </FxSoft>
                        </FxCard>

                        <FxCard className="flex flex-col p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-base font-semibold">Rekomendasi belanja</h2>
                                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                                    {items.length} bahan
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-secondary text-left text-xs text-muted-foreground">
                                            <th className="rounded-l-xl px-3 py-2.5 font-medium">Bahan</th>
                                            <th className="px-3 py-2.5 font-medium">Kelas</th>
                                            <th className="px-3 py-2.5 text-right font-medium">Beli</th>
                                            <th className="px-3 py-2.5 text-right font-medium">Estimasi</th>
                                            <th className="rounded-r-xl px-3 py-2.5 font-medium">Label</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((it) => {
                                            const got = rec[it.id] ?? 0;
                                            const lb = label(it, got);
                                            const tone = abcTone[it.abc];
                                            return (
                                                <tr key={it.id} className="border-b border-border/60 last:border-0">
                                                    <td className="px-3 py-3">
                                                        <p className="font-medium">{it.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            target {it.qtarget} pack
                                                        </p>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <span
                                                            className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${tone.bg} ${tone.text}`}
                                                        >
                                                            {it.abc}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-right font-semibold tabular-nums">
                                                        {got} pack
                                                    </td>
                                                    <td className="px-3 py-3 text-right tabular-nums">
                                                        {formatRupiah(got * it.packagePrice)}
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
                                    <Lightbulb className="size-4 text-[#EC582A]" />
                                    Total tidak pernah melebihi kas.
                                </span>
                                <FxButton variant="coral">
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