import { Head, router } from '@inertiajs/react';
import {
    ArrowDownToLine,
    Ban,
    Box,
    Clock,
    PackageOpen,
    Pencil,
    Plus,
    Search,
    SlidersHorizontal,
    Tag,
    TrendingUp,
    TriangleAlert,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { FxField, FxInput, FxModal, FxSelect } from '@/components/fx/fx-form';
import { FxIconButton } from '@/components/fx/fx-icon-button';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';
import PageHeader from '@/components/page-header';
import { formatPercent, formatRupiah } from '@/lib/format';

type BaseUnit = 'gram' | 'ml' | 'pcs';
type Abc = 'A' | 'B' | 'C';
type StockStatus = 'low' | 'near' | 'safe';

type PriceHistoryRow = {
    id: number;
    type: 'purchase' | 'quote';
    old_value: string | null;
    new_value: string;
    reason: string | null;
    change_pct: string | null;
    created_at: string | null;
};

type IngredientRow = {
    id: number;
    name: string;
    base_unit: BaseUnit;
    current_stock: string;
    minimum_stock: string;
    cost_per_unit: string;
    last_quote_price: string | null;
    package_size: string | null;
    package_price: number | null;
    lead_time_days: number;
    moq_packages: number;
    is_active: boolean;
    abc_class: Abc;
    stock_status: StockStatus;
    price_change_pct: string;
    quote_change_pct: string;
    price_history: PriceHistoryRow[];
};

type Props = {
    ingredients: IngredientRow[];
    meta: {
        count: number;
        inventory_value: number;
        low_stock_count: number;
        quote_pending_count: number;
    };
};

const abcTone: Record<Abc, string> = {
    A: 'bg-coral-soft text-primary',
    B: 'bg-info-soft text-info',
    C: 'bg-secondary text-muted-foreground',
};

const stateConfig: Record<
    StockStatus,
    { label: string; cls: string; dot: string }
> = {
    low: {
        label: 'Menipis',
        cls: 'bg-danger-soft text-danger',
        dot: 'bg-danger',
    },
    near: {
        label: 'Perhatian',
        cls: 'bg-warning-soft text-warning-ink',
        dot: 'bg-warning',
    },
    safe: {
        label: 'Aman',
        cls: 'bg-success-soft text-success',
        dot: 'bg-success',
    },
};

const unitLabel: Record<BaseUnit, string> = {
    gram: 'gram',
    ml: 'ml',
    pcs: 'pcs',
};
const unitShort: Record<BaseUnit, string> = { gram: 'g', ml: 'ml', pcs: 'pcs' };

const formatQty = (value: string | number): string =>
    new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(
        Number(value),
    );

export default function Ingredients({ ingredients, meta }: Props) {
    const [query, setQuery] = useState('');
    const [lowOnly, setLowOnly] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [stockIn, setStockIn] = useState<IngredientRow | null>(null);
    const [quote, setQuote] = useState<IngredientRow | null>(null);
    const [history, setHistory] = useState<IngredientRow | null>(null);
    const [adjust, setAdjust] = useState<IngredientRow | null>(null);
    const [edit, setEdit] = useState<IngredientRow | null>(null);

    const rows = useMemo(
        () =>
            ingredients.filter((i) => {
                const matches = i.name
                    .toLowerCase()
                    .includes(query.toLowerCase());
                const low = i.stock_status !== 'safe';
                return matches && (!lowOnly || low);
            }),
        [ingredients, query, lowOnly],
    );

    function handleCreate(data: Record<string, string | number | boolean>) {
        router.post('/bahan-baku', data, {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                toast.success('Bahan ditambahkan');
            },
            onError: (errors) =>
                toast.error(
                    Object.values(errors)[0] ?? 'Gagal menyimpan bahan.',
                ),
        });
    }

    function handleStockIn(
        target: IngredientRow,
        packages: number,
        pricePerPackage: number,
    ) {
        router.post(
            `/bahan-baku/${target.id}/stock-in`,
            { packages, price_per_package: pricePerPackage },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setStockIn(null);
                    toast.success('Stock-in tersimpan', {
                        description: `${target.name}: stok & WAC diperbarui.`,
                    });
                },
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ?? 'Gagal menyimpan stock-in.',
                    ),
            },
        );
    }

    function handleQuote(target: IngredientRow, quotePrice: number) {
        router.post(
            `/bahan-baku/${target.id}/quote`,
            { quote_price: quotePrice },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setQuote(null);
                    toast.success('Harga penawaran diperbarui', {
                        description:
                            'HPP proyeksi menu terkait dihitung ulang.',
                    });
                },
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ??
                            'Gagal menyimpan penawaran.',
                    ),
            },
        );
    }

    function handleAdjust(
        target: IngredientRow,
        type: 'waste' | 'adjustment',
        qtyChange: number,
        reason: string,
    ) {
        router.post(
            `/bahan-baku/${target.id}/adjustments`,
            { type, qty_change: qtyChange, reason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAdjust(null);
                    toast.success('Penyesuaian stok tercatat', {
                        description: `${target.name}: ${qtyChange > 0 ? '+' : ''}${qtyChange} ${unitShort[target.base_unit]}.`,
                    });
                },
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ??
                            'Gagal menyimpan penyesuaian.',
                    ),
            },
        );
    }

    function handleUpdate(
        target: IngredientRow,
        data: Record<string, string | number | boolean>,
    ) {
        router.put(`/bahan-baku/${target.id}`, data, {
            preserveScroll: true,
            onSuccess: () => {
                setEdit(null);
                toast.success('Bahan diperbarui');
            },
            onError: (errors) =>
                toast.error(
                    Object.values(errors)[0] ?? 'Gagal memperbarui bahan.',
                ),
        });
    }

    function handleDeactivate(target: IngredientRow) {
        router.delete(`/bahan-baku/${target.id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Bahan dinonaktifkan'),
            onError: (errors) =>
                toast.error(
                    Object.values(errors)[0] ?? 'Gagal menonaktifkan bahan.',
                ),
        });
    }

    const kpis = [
        {
            label: 'Total bahan',
            value: String(meta.count),
            icon: PackageOpen,
            tone: 'soft' as const,
        },
        {
            label: 'Nilai persediaan',
            value: formatRupiah(meta.inventory_value),
            icon: TrendingUp,
            tone: 'coral' as const,
            highlight: true,
        },
        {
            label: 'Stok menipis',
            value: String(meta.low_stock_count),
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
                                    className={`mt-3 text-2xl font-bold tracking-tight tabular-nums ${k.highlight ? 'text-white' : ''}`}
                                >
                                    {k.value}
                                </p>
                                <p
                                    className={`mt-1 text-[11px] font-semibold ${k.highlight ? 'text-white/85' : 'text-muted-foreground'}`}
                                >
                                    {k.label === 'Nilai persediaan'
                                        ? `dari ${meta.count} bahan aktif`
                                        : k.label === 'Stok menipis'
                                          ? 'di bawah stok minimum'
                                          : `${meta.quote_pending_count} bahan dengan harga penawaran baru`}
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
                                    className={`h-10 rounded-full px-4 text-sm font-semibold transition-all duration-200 ${
                                        lowOnly
                                            ? 'fx-coral'
                                            : 'bg-secondary text-foreground hover:bg-hover-soft'
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
                                        const cfg = stateConfig[i.stock_status];
                                        const change = Number(
                                            i.price_change_pct,
                                        );
                                        const quoteChange = Number(
                                            i.quote_change_pct,
                                        );
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
                                                                {
                                                                    i.lead_time_days
                                                                }{' '}
                                                                hari
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${abcTone[i.abc_class]}`}
                                                    >
                                                        {i.abc_class}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    {formatQty(i.current_stock)}{' '}
                                                    {unitShort[i.base_unit]}
                                                </td>
                                                <td className="px-3 py-3 text-right text-muted-foreground tabular-nums">
                                                    {formatQty(i.minimum_stock)}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    <span className="whitespace-nowrap">
                                                        {formatRupiah(
                                                            i.cost_per_unit,
                                                        )}
                                                        /
                                                        {unitShort[i.base_unit]}
                                                        {Math.abs(change) >=
                                                        0.5 ? (
                                                            <span
                                                                className={`ml-2 text-[11px] font-semibold ${change > 0 ? 'text-danger' : 'text-success'}`}
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
                                                    {quoteChange >= 1 &&
                                                    i.last_quote_price ? (
                                                        <span className="mt-1 block text-[11px] font-semibold text-primary">
                                                            penawaran{' '}
                                                            {formatRupiah(
                                                                i.last_quote_price,
                                                            )}
                                                            /
                                                            {
                                                                unitShort[
                                                                    i.base_unit
                                                                ]
                                                            }{' '}
                                                            (+
                                                            {formatPercent(
                                                                quoteChange,
                                                                0,
                                                            )}
                                                            )
                                                        </span>
                                                    ) : null}
                                                </td>
                                                <td className="px-3 py-3 text-right text-muted-foreground">
                                                    {i.package_size
                                                        ? `${formatQty(i.package_size)} ${unitShort[i.base_unit]}`
                                                        : '-'}
                                                    {i.package_price
                                                        ? ` · ${formatRupiah(i.package_price)}`
                                                        : ''}
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
                                                        <FxIconButton
                                                            title="Edit bahan"
                                                            aria-label="Edit bahan"
                                                            onClick={() =>
                                                                setEdit(i)
                                                            }
                                                        >
                                                            <Pencil className="size-4" />
                                                        </FxIconButton>
                                                        <FxIconButton
                                                            title="Stock-in pembelian"
                                                            aria-label="Stock-in pembelian"
                                                            onClick={() =>
                                                                setStockIn(i)
                                                            }
                                                        >
                                                            <ArrowDownToLine className="size-4" />
                                                        </FxIconButton>
                                                        <FxIconButton
                                                            title="Update harga penawaran"
                                                            aria-label="Update harga penawaran"
                                                            onClick={() =>
                                                                setQuote(i)
                                                            }
                                                        >
                                                            <Tag className="size-4" />
                                                        </FxIconButton>
                                                        <FxIconButton
                                                            title="Sesuaikan stok (waste/opname)"
                                                            aria-label="Sesuaikan stok (waste/opname)"
                                                            onClick={() =>
                                                                setAdjust(i)
                                                            }
                                                        >
                                                            <SlidersHorizontal className="size-4" />
                                                        </FxIconButton>
                                                        <FxIconButton
                                                            title="Riwayat harga"
                                                            aria-label="Riwayat harga"
                                                            onClick={() =>
                                                                setHistory(i)
                                                            }
                                                        >
                                                            <Clock className="size-4" />
                                                        </FxIconButton>
                                                        {i.is_active ? (
                                                            <FxIconButton
                                                                tone="danger"
                                                                title="Nonaktifkan bahan"
                                                                aria-label="Nonaktifkan bahan"
                                                                onClick={() =>
                                                                    handleDeactivate(
                                                                        i,
                                                                    )
                                                                }
                                                            >
                                                                <Ban className="size-4" />
                                                            </FxIconButton>
                                                        ) : null}
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
                                Menampilkan {rows.length} dari{' '}
                                {ingredients.length} bahan.
                            </span>
                            <span>
                                WAC = Weighted Average Cost dari pembelian
                                terakhir.
                            </span>
                        </FxSoft>
                    </FxCard>
                </Reveal>
            </div>

            <CreateIngredientModal
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSubmit={handleCreate}
            />

            {stockIn ? (
                <StockInModal
                    key={stockIn.id}
                    target={stockIn}
                    onClose={() => setStockIn(null)}
                    onSubmit={handleStockIn}
                />
            ) : null}

            {quote ? (
                <QuoteModal
                    key={quote.id}
                    target={quote}
                    onClose={() => setQuote(null)}
                    onSubmit={handleQuote}
                />
            ) : null}

            {history ? (
                <HistoryModal
                    key={history.id}
                    target={history}
                    onClose={() => setHistory(null)}
                />
            ) : null}

            {adjust ? (
                <AdjustModal
                    key={adjust.id}
                    target={adjust}
                    onClose={() => setAdjust(null)}
                    onSubmit={handleAdjust}
                />
            ) : null}

            {edit ? (
                <EditIngredientModal
                    key={edit.id}
                    target={edit}
                    onClose={() => setEdit(null)}
                    onSubmit={handleUpdate}
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
    onSubmit: (data: Record<string, string | number | boolean>) => void;
}) {
    const [name, setName] = useState('');
    const [unit, setUnit] = useState<BaseUnit>('gram');
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
        onSubmit({
            name: name.trim(),
            base_unit: unit,
            minimum_stock: minStock || '0',
            lead_time_days: Number(leadTime) || 0,
            review_period_days: 2,
            package_size: packSize || '1',
            package_price: Number(packPrice) || 0,
            moq_packages: 1,
            cost_per_unit: costPerUnit || '0',
            is_active: true,
        });
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
            <div className="grid gap-3 sm:grid-cols-2">
                <FxField label="Satuan dasar">
                    <FxSelect
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as BaseUnit)}
                    >
                        <option value="gram">gram</option>
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
            <div className="grid gap-3 sm:grid-cols-2">
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
            <div className="grid gap-3 sm:grid-cols-2">
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
    target: IngredientRow;
    onClose: () => void;
    onSubmit: (
        target: IngredientRow,
        packages: number,
        pricePerPackage: number,
    ) => void;
}) {
    const [packages, setPackages] = useState('1');
    const [price, setPrice] = useState(String(target.package_price ?? 0));

    const packSize = target.package_size ? Number(target.package_size) : 1;
    const addedQty = (Number(packages) || 0) * packSize;
    const unitPrice = (Number(price) || 0) / packSize;
    const newStock = Number(target.current_stock) + addedQty;
    const newWac =
        newStock > 0
            ? (Number(target.current_stock) * Number(target.cost_per_unit) +
                  addedQty * unitPrice) /
              newStock
            : Number(target.cost_per_unit);

    function submit() {
        if (Number(packages) <= 0) {
            toast.error('Jumlah kemasan harus lebih dari 0.');
            return;
        }
        onSubmit(target, Number(packages), Number(price) || 0);
    }

    return (
        <FxModal
            open
            onOpenChange={(o) => !o && onClose()}
            title={`Stock-in ${target.name}`}
            description={`WAC saat ini ${formatRupiah(target.cost_per_unit)}/${unitShort[target.base_unit]}.`}
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
            <div className="grid gap-3 sm:grid-cols-2">
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
                        {formatQty(addedQty)} {unitShort[target.base_unit]}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Stok menjadi</span>
                    <span className="font-semibold tabular-nums">
                        {formatQty(newStock)} {unitShort[target.base_unit]}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">WAC baru</span>
                    <span className="font-bold text-primary tabular-nums">
                        {formatRupiah(newWac)}/{unitShort[target.base_unit]}
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
    target: IngredientRow;
    onClose: () => void;
    onSubmit: (target: IngredientRow, quotePrice: number) => void;
}) {
    const [price, setPrice] = useState(
        String(target.last_quote_price ?? target.cost_per_unit),
    );
    const wac = Number(target.cost_per_unit);
    const change = wac > 0 ? (((Number(price) || 0) - wac) / wac) * 100 : 0;

    return (
        <FxModal
            open
            onOpenChange={(o) => !o && onClose()}
            title={`Harga penawaran ${target.name}`}
            description={`WAC tercatat ${formatRupiah(target.cost_per_unit)}/${unitShort[target.base_unit]}.`}
            footer={
                <>
                    <FxButton variant="soft" onClick={onClose}>
                        Batal
                    </FxButton>
                    <FxButton
                        variant="coral"
                        onClick={() => onSubmit(target, Number(price) || 0)}
                    >
                        Simpan penawaran
                    </FxButton>
                </>
            }
        >
            <FxField
                label={`Harga penawaran per ${unitLabel[target.base_unit]}`}
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
                    className={`font-bold tabular-nums ${change > 0 ? 'text-danger' : change < 0 ? 'text-success' : ''}`}
                >
                    {change > 0 ? '+' : ''}
                    {formatPercent(change, 1)}
                </span>
            </FxSoft>
            {change > 10 ? (
                <p className="text-xs font-semibold text-danger">
                    Melewati ambang alert 10%. Sistem akan membuat alert harga
                    bahan ini.
                </p>
            ) : null}
        </FxModal>
    );
}

function EditIngredientModal({
    target,
    onClose,
    onSubmit,
}: {
    target: IngredientRow;
    onClose: () => void;
    onSubmit: (
        target: IngredientRow,
        data: Record<string, string | number | boolean>,
    ) => void;
}) {
    const [name, setName] = useState(target.name);
    const [minStock, setMinStock] = useState(target.minimum_stock);
    const [leadTime, setLeadTime] = useState(String(target.lead_time_days));
    const [packSize, setPackSize] = useState(target.package_size ?? '1');
    const [packPrice, setPackPrice] = useState(
        String(target.package_price ?? 0),
    );
    const [active, setActive] = useState(target.is_active);

    function submit() {
        if (!name.trim()) {
            toast.error('Nama bahan wajib diisi.');
            return;
        }
        onSubmit(target, {
            name: name.trim(),
            minimum_stock: minStock || '0',
            lead_time_days: Number(leadTime) || 0,
            package_size: packSize || '1',
            package_price: Number(packPrice) || 0,
            is_active: active,
        });
    }

    return (
        <FxModal
            open
            onOpenChange={(o) => !o && onClose()}
            title={`Edit ${target.name}`}
            description={`Satuan dasar ${unitLabel[target.base_unit]}. WAC diperbarui lewat Stock-in, bukan di sini.`}
            footer={
                <>
                    <FxButton variant="soft" onClick={onClose}>
                        Batal
                    </FxButton>
                    <FxButton variant="coral" onClick={submit}>
                        Simpan perubahan
                    </FxButton>
                </>
            }
        >
            <FxField label="Nama bahan">
                <FxInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </FxField>
            <div className="grid gap-3 sm:grid-cols-2">
                <FxField label="Stok minimum">
                    <FxInput
                        type="number"
                        min="0"
                        value={minStock}
                        onChange={(e) => setMinStock(e.target.value)}
                    />
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
            <div className="grid gap-3 sm:grid-cols-2">
                <FxField
                    label={`Ukuran kemasan (${unitLabel[target.base_unit]})`}
                >
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
            <FxField label="Status">
                <FxSelect
                    value={active ? '1' : '0'}
                    onChange={(e) => setActive(e.target.value === '1')}
                >
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                </FxSelect>
            </FxField>
        </FxModal>
    );
}

function timeLabel(iso: string | null): string {
    if (!iso) {
        return '-';
    }

    const date = new Date(iso);
    const day = date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
    });

    return `${day} ${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}`;
}

function HistoryModal({
    target,
    onClose,
}: {
    target: IngredientRow;
    onClose: () => void;
}) {
    const history = target.price_history;

    return (
        <FxModal
            open
            onOpenChange={(o) => !o && onClose()}
            wide
            title={`Riwayat harga ${target.name}`}
            description={`WAC saat ini ${formatRupiah(target.cost_per_unit)}/${unitShort[target.base_unit]}. Tercatat otomatis setiap stock-in dan input penawaran.`}
            footer={
                <FxButton variant="soft" onClick={onClose}>
                    Tutup
                </FxButton>
            }
        >
            {history.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                    Belum ada riwayat harga.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-secondary text-left text-xs text-muted-foreground">
                                <th className="rounded-l-xl px-3 py-2.5 font-medium">
                                    Waktu
                                </th>
                                <th className="px-3 py-2.5 font-medium">
                                    Jenis
                                </th>
                                <th className="px-3 py-2.5 text-right font-medium">
                                    Harga lama
                                </th>
                                <th className="px-3 py-2.5 text-right font-medium">
                                    Harga baru
                                </th>
                                <th className="px-3 py-2.5 text-right font-medium">
                                    Perubahan
                                </th>
                                <th className="rounded-r-xl px-3 py-2.5 font-medium">
                                    Alasan
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((h) => {
                                const change =
                                    h.change_pct !== null
                                        ? Number(h.change_pct)
                                        : 0;
                                return (
                                    <tr
                                        key={h.id}
                                        className="border-b border-border/60 last:border-0"
                                    >
                                        <td className="px-3 py-3 text-muted-foreground tabular-nums">
                                            {timeLabel(h.created_at)}
                                        </td>
                                        <td className="px-3 py-3">
                                            {h.type === 'purchase'
                                                ? 'Pembelian'
                                                : 'Penawaran'}
                                        </td>
                                        <td className="px-3 py-3 text-right tabular-nums">
                                            {h.old_value !== null
                                                ? formatRupiah(h.old_value)
                                                : '-'}
                                        </td>
                                        <td className="px-3 py-3 text-right tabular-nums">
                                            {formatRupiah(h.new_value)}
                                        </td>
                                        <td
                                            className={`px-3 py-3 text-right font-semibold tabular-nums ${
                                                change > 0
                                                    ? 'text-danger'
                                                    : change < 0
                                                      ? 'text-success'
                                                      : ''
                                            }`}
                                        >
                                            {h.change_pct !== null
                                                ? `${change > 0 ? '+' : ''}${formatPercent(change, 1)}`
                                                : '-'}
                                        </td>
                                        <td className="px-3 py-3 text-muted-foreground">
                                            {h.reason ?? '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </FxModal>
    );
}

function AdjustModal({
    target,
    onClose,
    onSubmit,
}: {
    target: IngredientRow;
    onClose: () => void;
    onSubmit: (
        target: IngredientRow,
        type: 'waste' | 'adjustment',
        qtyChange: number,
        reason: string,
    ) => void;
}) {
    const [type, setType] = useState<'waste' | 'adjustment'>('waste');
    const [qty, setQty] = useState('0');
    const [reason, setReason] = useState('');

    const delta = Number(qty) || 0;
    const preview = Number(target.current_stock) + delta;

    function submit() {
        if (delta === 0) {
            toast.error('Kuantitas penyesuaian tidak boleh 0.');
            return;
        }
        if (!reason.trim()) {
            toast.error('Alasan wajib diisi.');
            return;
        }
        onSubmit(target, type, delta, reason.trim());
    }

    return (
        <FxModal
            open
            onOpenChange={(o) => !o && onClose()}
            title={`Sesuaikan stok ${target.name}`}
            description={`Waste, rusak, atau hasil stock opname. Stok saat ini ${formatQty(target.current_stock)} ${unitShort[target.base_unit]}.`}
            footer={
                <>
                    <FxButton variant="soft" onClick={onClose}>
                        Batal
                    </FxButton>
                    <FxButton variant="coral" onClick={submit}>
                        Catat penyesuaian
                    </FxButton>
                </>
            }
        >
            <div className="grid gap-3 sm:grid-cols-2">
                <FxField label="Jenis">
                    <FxSelect
                        value={type}
                        onChange={(e) =>
                            setType(e.target.value as 'waste' | 'adjustment')
                        }
                    >
                        <option value="waste">Waste / rusak</option>
                        <option value="adjustment">Koreksi opname</option>
                    </FxSelect>
                </FxField>
                <FxField
                    label={`Perubahan (${unitShort[target.base_unit]})`}
                    hint="Negatif mengurangi stok."
                >
                    <FxInput
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                    />
                </FxField>
            </div>
            <FxField label="Alasan" hint="Wajib diisi (BR-011).">
                <FxInput
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Contoh: tumpah / hasil opname"
                />
            </FxField>
            <FxSoft className="flex items-center justify-between p-4 text-sm">
                <span className="text-muted-foreground">
                    Stok setelah penyesuaian
                </span>
                <span
                    className={`font-bold tabular-nums ${
                        preview < Number(target.minimum_stock)
                            ? 'text-danger'
                            : ''
                    }`}
                >
                    {formatQty(preview)} {unitShort[target.base_unit]}
                </span>
            </FxSoft>
        </FxModal>
    );
}
