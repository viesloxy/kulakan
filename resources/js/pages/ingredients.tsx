import { Head } from '@inertiajs/react';
import {
    ArrowDownToLine,
    Box,
    Clock,
    PackageOpen,
    Plus,
    Search,
    Tag,
    TrendingUp,
    TriangleAlert,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { FxField, FxInput, FxModal, FxSelect } from '@/components/fx/fx-form';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';
import PageHeader from '@/components/page-header';
import { formatPercent, formatRupiah } from '@/lib/format';
import {
    ingredients as seedIngredients,
    type Abc,
    type BaseUnit,
    type Ingredient,
} from '@/lib/mock-data';

const abcTone: Record<Abc, string> = {
    A: 'bg-[#FDECE7] text-[#EC582A]',
    B: 'bg-[#E7EEFC] text-[#2B6BE6]',
    C: 'bg-secondary text-muted-foreground',
};

const unitLabel: Record<BaseUnit, string> = { g: 'gram', ml: 'ml', pcs: 'pcs' };

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
    low: {
        label: 'Menipis',
        cls: 'bg-[#FCEAE8] text-[#D93829]',
        dot: 'bg-[#D93829]',
    },
    near: {
        label: 'Perhatian',
        cls: 'bg-[#FEF3D6] text-[#9A6B00]',
        dot: 'bg-[#F2B824]',
    },
    safe: {
        label: 'Aman',
        cls: 'bg-[#E6F5EC] text-[#1D9E53]',
        dot: 'bg-[#1D9E53]',
    },
} as const;

const fieldRow = 'grid gap-3 sm:grid-cols-2';

export default function Ingredients() {
    const [items, setItems] = useState<Ingredient[]>(seedIngredients);
    const [query, setQuery] = useState('');
    const [lowOnly, setLowOnly] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [stockIn, setStockIn] = useState<Ingredient | null>(null);
    const [quote, setQuote] = useState<Ingredient | null>(null);
    const [history, setHistory] = useState<Ingredient | null>(null);

    const rows = useMemo(
        () =>
            items.filter((i) => {
                const matches = i.name
                    .toLowerCase()
                    .includes(query.toLowerCase());
                const low = stockState(i.stock, i.minStock) !== 'safe';
                return matches && (!lowOnly || low);
            }),
        [items, query, lowOnly],
    );

    const inventoryValue = items.reduce(
        (sum, i) => sum + i.stock * i.costPerUnit,
        0,
    );
    const lowCount = items.filter(
        (i) => stockState(i.stock, i.minStock) === 'low',
    ).length;
    const priceUp = items.filter(
        (i) => i.quotePrice && i.quotePrice > i.costPerUnit,
    ).length;

    function handleCreate(data: {
        name: string;
        unit: BaseUnit;
        minStock: number;
        leadTime: number;
        packSize: number;
        packPrice: number;
        costPerUnit: number;
    }) {
        const id = Math.max(0, ...items.map((i) => i.id)) + 1;
        const next: Ingredient = {
            id,
            name: data.name,
            abc: 'C',
            unit: data.unit,
            stock: 0,
            minStock: data.minStock,
            leadTime: data.leadTime,
            packSize: data.packSize,
            packPrice: data.packPrice,
            costPerUnit: data.costPerUnit,
            prevCostPerUnit: data.costPerUnit,
        };
        setItems((list) => [...list, next]);
        toast.success('Bahan ditambahkan', {
            description: `${data.name} tersimpan dengan stok awal 0.`,
        });
    }

    function handleStockIn(
        target: Ingredient,
        packages: number,
        pricePerPackage: number,
    ) {
        const addedQty = packages * (target.packSize || 1);
        const unitPrice = pricePerPackage / (target.packSize || 1);
        const newStock = target.stock + addedQty;
        const newWac =
            (target.stock * target.costPerUnit + addedQty * unitPrice) /
            newStock;

        setItems((list) =>
            list.map((i) =>
                i.id === target.id
                    ? {
                          ...i,
                          stock: newStock,
                          costPerUnit: newWac,
                          prevCostPerUnit: i.costPerUnit,
                          packPrice: pricePerPackage,
                      }
                    : i,
            ),
        );
        toast.success('Stock-in tersimpan', {
            description: `${target.name} +${packages} kemasan. WAC ${formatRupiah(target.costPerUnit)} menjadi ${formatRupiah(newWac)}.`,
        });
    }

    function handleQuote(target: Ingredient, quotePrice: number) {
        setItems((list) =>
            list.map((i) => (i.id === target.id ? { ...i, quotePrice } : i)),
        );
        const change =
            ((quotePrice - target.costPerUnit) / target.costPerUnit) * 100;
        const description =
            change > 10
                ? `${target.name} naik ${formatPercent(change, 1)}, melewati ambang alert 10%. HPP proyeksi menu terkait dihitung ulang.`
                : `${target.name} ${formatRupiah(quotePrice)}/${target.unit}. HPP proyeksi menu terkait dihitung ulang.`;
        toast.success('Harga penawaran diperbarui', { description });
    }

    const kpis = [
        {
            label: 'Total bahan',
            value: String(items.length),
            icon: PackageOpen,
            tone: 'soft' as const,
        },
        {
            label: 'Nilai persediaan',
            value: formatRupiah(inventoryValue),
            icon: TrendingUp,
            tone: 'coral' as const,
            highlight: true,
        },
        {
            label: 'Stok menipis',
            value: String(lowCount),
            icon: TriangleAlert,
            tone: 'danger' as const,
        },
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
                        <FxButton
                            variant="coral"
                            onClick={() => setCreateOpen(true)}
                        >
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
                                    className={`mt-3 text-2xl font-bold tracking-tight tabular-nums ${
                                        k.highlight ? 'text-white' : ''
                                    }`}
                                >
                                    {k.value}
                                </p>
                                <p
                                    className={`mt-1 text-[11px] font-semibold ${k.highlight ? 'text-white/85' : 'text-muted-foreground'}`}
                                >
                                    {k.label === 'Nilai persediaan'
                                        ? `dari ${items.length} bahan aktif`
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
                            <h2 className="text-base font-semibold">
                                Daftar bahan
                            </h2>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex h-10 items-center gap-2 fx-soft px-4">
                                    <Search className="size-4 text-muted-foreground" />
                                    <input
                                        value={query}
                                        onChange={(e) =>
                                            setQuery(e.target.value)
                                        }
                                        placeholder="Cari bahan"
                                        className="w-40 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setLowOnly((v) => !v)}
                                    className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
                                        lowOnly
                                            ? 'bg-[#1C1B18] text-white'
                                            : 'bg-secondary text-foreground hover:bg-[#EBEBE8]'
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
                                        <th className="rounded-l-xl px-3 py-2.5 font-medium">
                                            Bahan
                                        </th>
                                        <th className="px-3 py-2.5 font-medium">
                                            Kelas
                                        </th>
                                        <th className="px-3 py-2.5 text-right font-medium">
                                            Stok
                                        </th>
                                        <th className="px-3 py-2.5 text-right font-medium">
                                            Min
                                        </th>
                                        <th className="px-3 py-2.5 text-right font-medium">
                                            WAC
                                        </th>
                                        <th className="px-3 py-2.5 text-right font-medium">
                                            Kemasan beli
                                        </th>
                                        <th className="px-3 py-2.5 font-medium">
                                            Status
                                        </th>
                                        <th className="rounded-r-xl px-3 py-2.5 text-center font-medium">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((i) => {
                                        const st = stockState(
                                            i.stock,
                                            i.minStock,
                                        );
                                        const cfg = stateConfig[st];
                                        const change =
                                            ((i.costPerUnit -
                                                i.prevCostPerUnit) /
                                                i.prevCostPerUnit) *
                                            100;
                                        const quoteChange = i.quotePrice
                                            ? ((i.quotePrice - i.costPerUnit) /
                                                  i.costPerUnit) *
                                              100
                                            : 0;
                                        return (
                                            <tr
                                                key={i.id}
                                                className="border-b border-border/60 last:border-0"
                                            >
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <IconCircle
                                                            icon={Box}
                                                            tone="soft"
                                                            size="sm"
                                                        />
                                                        <div>
                                                            <p className="font-medium">
                                                                {i.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                lead time{' '}
                                                                {i.leadTime}{' '}
                                                                hari
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
                                                    {new Intl.NumberFormat(
                                                        'id-ID',
                                                    ).format(i.stock)}{' '}
                                                    {i.unit}
                                                </td>
                                                <td className="px-3 py-3 text-right text-muted-foreground tabular-nums">
                                                    {new Intl.NumberFormat(
                                                        'id-ID',
                                                    ).format(i.minStock)}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    <span className="whitespace-nowrap">
                                                        {formatRupiah(
                                                            i.costPerUnit,
                                                        )}
                                                        /{i.unit}
                                                        {Math.abs(change) >=
                                                        0.5 ? (
                                                            <span
                                                                className={`ml-2 text-[11px] font-semibold ${
                                                                    change > 0
                                                                        ? 'text-[#D93829]'
                                                                        : 'text-[#1D9E53]'
                                                                }`}
                                                            >
                                                                {change > 0
                                                                    ? '+'
                                                                    : ''}
                                                                {formatPercent(
                                                                    change,
                                                                    1,
                                                                )}
                                                            </span>
                                                        ) : null}
                                                    </span>
                                                    {quoteChange >= 1 ? (
                                                        <span className="mt-1 block text-[11px] font-semibold text-[#EC582A]">
                                                            penawaran{' '}
                                                            {formatRupiah(
                                                                i.quotePrice!,
                                                            )}
                                                            /{i.unit} (+
                                                            {formatPercent(
                                                                quoteChange,
                                                                0,
                                                            )}
                                                            )
                                                        </span>
                                                    ) : null}
                                                </td>
                                                <td className="px-3 py-3 text-right text-muted-foreground">
                                                    {new Intl.NumberFormat(
                                                        'id-ID',
                                                    ).format(i.packSize)}{' '}
                                                    {i.unit} ·{' '}
                                                    {formatRupiah(i.packPrice)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}
                                                    >
                                                        <span
                                                            className={`size-1.5 rounded-full ${cfg.dot}`}
                                                        />
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            type="button"
                                                            title="Stock-in pembelian"
                                                            onClick={() =>
                                                                setStockIn(i)
                                                            }
                                                            className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-[#1C1B18] hover:text-white"
                                                        >
                                                            <ArrowDownToLine className="size-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title="Update harga penawaran"
                                                            onClick={() =>
                                                                setQuote(i)
                                                            }
                                                            className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-[#EC582A] hover:text-white"
                                                        >
                                                            <Tag className="size-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title="Riwayat harga"
                                                            onClick={() =>
                                                                setHistory(i)
                                                            }
                                                            className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-[#EBEBE8] hover:text-foreground"
                                                        >
                                                            <Clock className="size-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <FxSoft className="flex flex-wrap items-center justify-between gap-2 p-4 text-xs text-muted-foreground">
                            <span>
                                Menampilkan {rows.length} dari {items.length}{' '}
                                bahan.
                            </span>
                            <span>
                                WAC = Weighted Average Cost dari pembelian
                                terakhir.
                            </span>
                        </FxSoft>
                    </FxCard>
                </Reveal>
            </div>

            {/* Tambah bahan */}
            <CreateIngredientModal
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSubmit={handleCreate}
            />

            {/* Stock-in */}
            {stockIn ? (
                <StockInModal
                    key={stockIn.id}
                    target={stockIn}
                    onClose={() => setStockIn(null)}
                    onSubmit={handleStockIn}
                />
            ) : null}

            {/* Update penawaran */}
            {quote ? (
                <QuoteModal
                    key={quote.id}
                    target={quote}
                    onClose={() => setQuote(null)}
                    onSubmit={handleQuote}
                />
            ) : null}

            {/* Riwayat harga */}
            {history ? (
                <HistoryModal
                    key={history.id}
                    target={history}
                    onClose={() => setHistory(null)}
                />
            ) : null}
        </>
    );
}

function CreateIngredientModal({
    open,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: {
        name: string;
        unit: BaseUnit;
        minStock: number;
        leadTime: number;
        packSize: number;
        packPrice: number;
        costPerUnit: number;
    }) => void;
}) {
    const [name, setName] = useState('');
    const [unit, setUnit] = useState<BaseUnit>('g');
    const [minStock, setMinStock] = useState('0');
    const [leadTime, setLeadTime] = useState('1');
    const [packSize, setPackSize] = useState('1');
    const [packPrice, setPackPrice] = useState('0');
    const [costPerUnit, setCostPerUnit] = useState('0');

    function submit() {
        if (!name.trim()) {
            toast.error('Nama bahan wajib diisi.');
            return;
        }
        if (Number(costPerUnit) < 0 || Number(minStock) < 0) {
            toast.error('Nilai negatif tidak diperbolehkan.');
            return;
        }
        onSubmit({
            name: name.trim(),
            unit,
            minStock: Number(minStock) || 0,
            leadTime: Number(leadTime) || 0,
            packSize: Number(packSize) || 1,
            packPrice: Number(packPrice) || 0,
            costPerUnit: Number(costPerUnit) || 0,
        });
        onOpenChange(false);
    }

    return (
        <FxModal
            open={open}
            onOpenChange={onOpenChange}
            title="Tambah bahan"
            description="Bahan dibuat dengan stok 0. Catat stok lewat Stock-in."
            footer={
                <>
                    <FxButton
                        variant="soft"
                        onClick={() => onOpenChange(false)}
                    >
                        Batal
                    </FxButton>
                    <FxButton variant="coral" onClick={submit}>
                        Simpan bahan
                    </FxButton>
                </>
            }
        >
            <FxField label="Nama bahan">
                <FxInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Sirup Vanilla"
                />
            </FxField>
            <div className={fieldRow}>
                <FxField label="Satuan dasar">
                    <FxSelect
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as BaseUnit)}
                    >
                        <option value="g">gram</option>
                        <option value="ml">ml</option>
                        <option value="pcs">pcs</option>
                    </FxSelect>
                </FxField>
                <FxField label="Lead time (hari)">
                    <FxInput
                        type="number"
                        min="0"
                        value={leadTime}
                        onChange={(e) => setLeadTime(e.target.value)}
                    />
                </FxField>
            </div>
            <div className={fieldRow}>
                <FxField label="Stok minimum">
                    <FxInput
                        type="number"
                        min="0"
                        value={minStock}
                        onChange={(e) => setMinStock(e.target.value)}
                    />
                </FxField>
                <FxField
                    label={`Harga per ${unitLabel[unit]}`}
                    hint="Biaya awal (WAC)"
                >
                    <FxInput
                        type="number"
                        min="0"
                        value={costPerUnit}
                        onChange={(e) => setCostPerUnit(e.target.value)}
                    />
                </FxField>
            </div>
            <div className={fieldRow}>
                <FxField label={`Ukuran kemasan (${unitLabel[unit]})`}>
                    <FxInput
                        type="number"
                        min="1"
                        value={packSize}
                        onChange={(e) => setPackSize(e.target.value)}
                    />
                </FxField>
                <FxField label="Harga per kemasan">
                    <FxInput
                        type="number"
                        min="0"
                        value={packPrice}
                        onChange={(e) => setPackPrice(e.target.value)}
                    />
                </FxField>
            </div>
        </FxModal>
    );
}

function StockInModal({
    target,
    onClose,
    onSubmit,
}: {
    target: Ingredient;
    onClose: () => void;
    onSubmit: (
        target: Ingredient,
        packages: number,
        pricePerPackage: number,
    ) => void;
}) {
    const [packages, setPackages] = useState('1');
    const [price, setPrice] = useState(String(target.packPrice));

    const addedQty = (Number(packages) || 0) * (target.packSize || 1);
    const unitPrice = (Number(price) || 0) / (target.packSize || 1);
    const newStock = target.stock + addedQty;
    const newWac =
        newStock > 0
            ? (target.stock * target.costPerUnit + addedQty * unitPrice) /
              newStock
            : target.costPerUnit;

    function submit() {
        if (Number(packages) <= 0) {
            toast.error('Jumlah kemasan harus lebih dari 0.');
            return;
        }
        onSubmit(target, Number(packages), Number(price) || 0);
        onClose();
    }

    return (
        <FxModal
            open
            onOpenChange={(o) => !o && onClose()}
            title={`Stock-in ${target.name}`}
            description={`WAC saat ini ${formatRupiah(target.costPerUnit)}/${target.unit}.`}
            footer={
                <>
                    <FxButton variant="soft" onClick={onClose}>
                        Batal
                    </FxButton>
                    <FxButton variant="coral" onClick={submit}>
                        Catat pembelian
                    </FxButton>
                </>
            }
        >
            <div className={fieldRow}>
                <FxField label="Jumlah kemasan">
                    <FxInput
                        type="number"
                        min="1"
                        value={packages}
                        onChange={(e) => setPackages(e.target.value)}
                    />
                </FxField>
                <FxField label="Harga per kemasan">
                    <FxInput
                        type="number"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </FxField>
            </div>
            <FxSoft className="flex flex-col gap-1 p-4 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                        Stok bertambah
                    </span>
                    <span className="font-semibold tabular-nums">
                        {new Intl.NumberFormat('id-ID').format(addedQty)}{' '}
                        {target.unit}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Stok menjadi</span>
                    <span className="font-semibold tabular-nums">
                        {new Intl.NumberFormat('id-ID').format(newStock)}{' '}
                        {target.unit}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">WAC baru</span>
                    <span className="font-bold text-[#EC582A] tabular-nums">
                        {formatRupiah(newWac)}/{target.unit}
                    </span>
                </div>
            </FxSoft>
        </FxModal>
    );
}

function QuoteModal({
    target,
    onClose,
    onSubmit,
}: {
    target: Ingredient;
    onClose: () => void;
    onSubmit: (target: Ingredient, quotePrice: number) => void;
}) {
    const [price, setPrice] = useState(
        String(target.quotePrice ?? target.costPerUnit),
    );
    const change =
        target.costPerUnit > 0
            ? (((Number(price) || 0) - target.costPerUnit) /
                  target.costPerUnit) *
              100
            : 0;

    return (
        <FxModal
            open
            onOpenChange={(o) => !o && onClose()}
            title={`Harga penawaran ${target.name}`}
            description={`WAC tercatat ${formatRupiah(target.costPerUnit)}/${target.unit}.`}
            footer={
                <>
                    <FxButton variant="soft" onClick={onClose}>
                        Batal
                    </FxButton>
                    <FxButton
                        variant="coral"
                        onClick={() => {
                            onSubmit(target, Number(price) || 0);
                            onClose();
                        }}
                    >
                        Simpan penawaran
                    </FxButton>
                </>
            }
        >
            <FxField
                label={`Harga penawaran per ${unitLabel[target.unit]}`}
                hint="Dipakai untuk HPP proyeksi, tanpa mengubah WAC."
            >
                <FxInput
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                />
            </FxField>
            <FxSoft className="flex items-center justify-between p-4 text-sm">
                <span className="text-muted-foreground">Perubahan vs WAC</span>
                <span
                    className={`font-bold tabular-nums ${change > 0 ? 'text-[#D93829]' : change < 0 ? 'text-[#1D9E53]' : ''}`}
                >
                    {change > 0 ? '+' : ''}
                    {formatPercent(change, 1)}
                </span>
            </FxSoft>
            {change > 10 ? (
                <p className="text-xs font-semibold text-[#D93829]">
                    Melewati ambang alert 10%. Sistem akan membuat alert harga
                    bahan ini.
                </p>
            ) : null}
        </FxModal>
    );
}

function HistoryModal({
    target,
    onClose,
}: {
    target: Ingredient;
    onClose: () => void;
}) {
    const rows = [
        {
            label: 'WAC saat ini',
            value: `${formatRupiah(target.costPerUnit)}/${target.unit}`,
        },
        {
            label: 'Harga sebelumnya',
            value: `${formatRupiah(target.prevCostPerUnit)}/${target.unit}`,
        },
        {
            label: 'Harga penawaran terbaru',
            value: target.quotePrice
                ? `${formatRupiah(target.quotePrice)}/${target.unit}`
                : 'Belum ada',
        },
        {
            label: 'Harga kemasan terakhir',
            value: formatRupiah(target.packPrice),
        },
    ];

    return (
        <FxModal
            open
            onOpenChange={(o) => !o && onClose()}
            title={`Riwayat harga ${target.name}`}
            description="Tercatat otomatis setiap stock-in dan input penawaran."
            footer={
                <FxButton variant="soft" onClick={onClose}>
                    Tutup
                </FxButton>
            }
        >
            <div className="flex flex-col divide-y divide-border/60">
                {rows.map((r) => (
                    <div
                        key={r.label}
                        className="flex items-center justify-between py-3 text-sm"
                    >
                        <span className="text-muted-foreground">{r.label}</span>
                        <span className="font-semibold tabular-nums">
                            {r.value}
                        </span>
                    </div>
                ))}
            </div>
        </FxModal>
    );
}
