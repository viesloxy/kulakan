import { Head } from '@inertiajs/react';
import { Box, PackageOpen, Plus, Search, TrendingUp, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';
import PageHeader from '@/components/page-header';
import { formatPercent, formatRupiah } from '@/lib/format';
import { ingredients, inventoryValue, type Abc } from '@/lib/mock-data';

const abcTone: Record<Abc, string> = {
    A: 'bg-[#FDECE7] text-[#EC582A]',
    B: 'bg-[#E7EEFC] text-[#2B6BE6]',
    C: 'bg-secondary text-muted-foreground',
};

const unitLabel: Record<string, string> = { g: 'gram', ml: 'ml', pcs: 'pcs' };

function stockState(stock: number, min: number): 'low' | 'near' | 'safe' {
    if (stock < min) {
        return 'low';
    }
    if (stock < min * 1.25) {
        return 'near';
    }

    return 'safe';
}

const stateConfig = {
    low: { label: 'Menipis', cls: 'bg-[#FCEAE8] text-[#D93829]', dot: 'bg-[#D93829]' },
    near: { label: 'Perhatian', cls: 'bg-[#FEF3D6] text-[#9A6B00]', dot: 'bg-[#F2B824]' },
    safe: { label: 'Aman', cls: 'bg-[#E6F5EC] text-[#1D9E53]', dot: 'bg-[#1D9E53]' },
} as const;

export default function Ingredients() {
    const [query, setQuery] = useState('');
    const [lowOnly, setLowOnly] = useState(false);

    const rows = useMemo(
        () =>
            ingredients.filter((i) => {
                const matches = i.name.toLowerCase().includes(query.toLowerCase());
                const low = stockState(i.stock, i.minStock) !== 'safe';
                return matches && (!lowOnly || low);
            }),
        [query, lowOnly],
    );

    const lowCount = ingredients.filter((i) => stockState(i.stock, i.minStock) === 'low').length;
    const priceUp = ingredients.filter((i) => i.quotePrice && i.quotePrice > i.costPerUnit).length;

    const kpis = [
        { label: 'Total bahan', value: String(ingredients.length), icon: PackageOpen, tone: 'soft' as const },
        { label: 'Nilai persediaan', value: formatRupiah(inventoryValue()), icon: TrendingUp, tone: 'coral' as const, highlight: true },
        { label: 'Stok menipis', value: String(lowCount), icon: TriangleAlert, tone: 'danger' as const },
    ];

    return (
        <>
            <Head title="Bahan Baku" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <Reveal>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <PageHeader
                            title="Bahan Baku"
                            description="Master bahan, stok, biaya rata-rata (WAC), dan riwayat harga."
                        />
                        <FxButton variant="coral">
                            <Plus className="size-4" />
                            Tambah bahan
                        </FxButton>
                    </div>
                </Reveal>

                <Reveal delay={0.05}>
                    <div className="grid gap-4 md:grid-cols-3">
                        {kpis.map((k) => (
                            <FxCard
                                key={k.label}
                                className={`flex flex-col justify-between p-5 ${k.highlight ? 'fx-coral' : ''}`}
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
                                    {k.label === 'Nilai persediaan'
                                        ? `dari ${ingredients.length} bahan aktif`
                                        : k.label === 'Stok menipis'
                                          ? 'di bawah stok minimum'
                                          : `${priceUp} bahan dengan harga penawaran baru`}
                                </p>
                            </FxCard>
                        ))}
                    </div>
                </Reveal>

                <Reveal delay={0.1}>
                    <FxCard className="flex flex-col gap-4 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-base font-semibold">Daftar bahan</h2>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="fx-soft flex h-10 items-center gap-2 px-4">
                                    <Search className="size-4 text-muted-foreground" />
                                    <input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Cari bahan"
                                        className="w-40 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setLowOnly((v) => !v)}
                                    className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
                                        lowOnly ? 'bg-[#1C1B18] text-white' : 'bg-secondary text-foreground hover:bg-[#EBEBE8]'
                                    }`}
                                >
                                    Stok menipis
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-secondary text-left text-xs text-muted-foreground">
                                        <th className="rounded-l-xl px-3 py-2.5 font-medium">Bahan</th>
                                        <th className="px-3 py-2.5 font-medium">Kelas</th>
                                        <th className="px-3 py-2.5 text-right font-medium">Stok</th>
                                        <th className="px-3 py-2.5 text-right font-medium">Min</th>
                                        <th className="px-3 py-2.5 text-right font-medium">WAC</th>
                                        <th className="px-3 py-2.5 text-right font-medium">Kemasan beli</th>
                                        <th className="rounded-r-xl px-3 py-2.5 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((i) => {
                                        const st = stockState(i.stock, i.minStock);
                                        const cfg = stateConfig[st];
                                        const change = ((i.costPerUnit - i.prevCostPerUnit) / i.prevCostPerUnit) * 100;
                                        const quoteChange = i.quotePrice
                                            ? ((i.quotePrice - i.costPerUnit) / i.costPerUnit) * 100
                                            : 0;
                                        return (
                                            <tr key={i.id} className="border-b border-border/60 last:border-0">
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <IconCircle icon={Box} tone="soft" size="sm" />
                                                        <div>
                                                            <p className="font-medium">{i.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                lead time {i.leadTime} hari
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${abcTone[i.abc]}`}
                                                    >
                                                        {i.abc}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    {new Intl.NumberFormat('id-ID').format(i.stock)} {i.unit}
                                                </td>
                                                <td className="px-3 py-3 text-right text-muted-foreground tabular-nums">
                                                    {new Intl.NumberFormat('id-ID').format(i.minStock)}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    <span className="whitespace-nowrap">
                                                        {formatRupiah(i.costPerUnit)}/{i.unit}
                                                        {Math.abs(change) >= 0.5 ? (
                                                            <span
                                                                className={`ml-2 text-[11px] font-semibold ${
                                                                    change > 0 ? 'text-[#D93829]' : 'text-[#1D9E53]'
                                                                }`}
                                                            >
                                                                {change > 0 ? '+' : ''}
                                                                {formatPercent(change, 1)}
                                                            </span>
                                                        ) : null}
                                                    </span>
                                                    {quoteChange >= 1 ? (
                                                        <span className="mt-1 block text-[11px] font-semibold text-[#EC582A]">
                                                            penawaran {formatRupiah(i.quotePrice!)}/{i.unit} (+
                                                            {formatPercent(quoteChange, 0)})
                                                        </span>
                                                    ) : null}
                                                </td>
                                                <td className="px-3 py-3 text-right text-muted-foreground">
                                                    {new Intl.NumberFormat('id-ID').format(i.packSize)} {i.unit} ·{' '}
                                                    {formatRupiah(i.packPrice)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}
                                                    >
                                                        <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <FxSoft className="flex flex-wrap items-center justify-between gap-2 p-4 text-xs text-muted-foreground">
                            <span>Menampilkan {rows.length} dari {ingredients.length} bahan.</span>
                            <span>WAC = Weighted Average Cost dari pembelian terakhir.</span>
                        </FxSoft>
                    </FxCard>
                </Reveal>
            </div>
        </>
    );
}