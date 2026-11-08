import { router, usePage } from '@inertiajs/react';
import {
    ArrowDownToLine,
    Ban,
    Box,
    Check,
    ClipboardCheck,
    Clock,
    History,
    Info,
    Layers,
    PackageOpen,
    PackageX,
    Pencil,
    PenLine,
    Plus,
    Search,
    ShieldAlert,
    SlidersHorizontal,
    Tag,
    Trash2,
    TrendingUp,
    TriangleAlert,
    User as UserIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import {
    FxField,
    FxInput,
    FxModal,
    FxSelect,
    FxTextarea,
} from '@/components/fx/fx-form';
import { FxIconButton } from '@/components/fx/fx-icon-button';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';
import PageShell from '@/components/page-shell';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatPercent, formatRupiah } from '@/lib/format';
import { isOwner } from '@/lib/permissions';
import { cn } from '@/lib/utils';

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

type StockAdjustmentRow = {
    id: number;
    type: 'waste' | 'adjustment' | 'purchase' | 'sale';
    qty_change: string;
    reason: string | null;
    user_name: string;
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
    adjustment_history?: StockAdjustmentRow[];
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

function ColumnHeaderTip({
    label,
    title,
    description,
    align = 'left',
}: {
    label: string;
    title: string;
    description: string;
    align?: 'left' | 'right';
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    tabIndex={0}
                    className={`inline-flex cursor-help items-center gap-1 underline decoration-muted-foreground/50 decoration-dotted underline-offset-4 transition-colors hover:text-foreground focus:text-foreground focus:outline-none ${
                        align === 'right' ? 'justify-end' : ''
                    }`}
                >
                    {label}
                </span>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className="max-w-[240px] rounded-xl bg-card p-3 text-xs text-foreground shadow-md ring-1 ring-border [&>svg]:fill-card"
            >
                <p className="font-semibold text-foreground">{title}</p>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                    {description}
                </p>
            </TooltipContent>
        </Tooltip>
    );
}

function formatAdjustmentDate(isoString: string | null): string {
    if (!isoString) return '-';
    try {
        const d = new Date(isoString);
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(d);
    } catch {
        return isoString;
    }
}

export default function Ingredients({ ingredients, meta }: Props) {
    const owner = isOwner(usePage().props.auth.user);
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
        <PageShell
            title="Bahan Baku"
            description="Master bahan, stok, biaya rata-rata (WAC), dan riwayat harga."
            actions={
                owner ? (
                    <FxButton
                        variant="coral"
                        onClick={() => setCreateOpen(true)}
                    >
                        <Plus className="size-4" />
                        Tambah bahan
                    </FxButton>
                ) : null
            }
        >
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
                                    onChange={(e) => setQuery(e.target.value)}
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
                                        <ColumnHeaderTip
                                            label="Kelas"
                                            title="Klasifikasi ABC"
                                            description="Prioritas bahan berdasarkan kontribusi nilai inventaris (A = tertinggi, B = menengah, C = pelengkap)."
                                        />
                                    </th>
                                    <th className="px-3 py-2.5 text-right font-medium">
                                        Stok
                                    </th>
                                    <th className="px-3 py-2.5 text-right font-medium">
                                        <ColumnHeaderTip
                                            label="Min"
                                            title="Stok Minimum"
                                            description="Batas minimum stok aman. Sistem memicu alert jika sisa stok berada di bawah batas ini."
                                            align="right"
                                        />
                                    </th>
                                    <th className="px-3 py-2.5 text-right font-medium">
                                        <ColumnHeaderTip
                                            label="WAC"
                                            title="Weighted Average Cost"
                                            description="Biaya rata-rata tertimbang per satuan dasar dari pembelian riil untuk dasar HPP menu aktif."
                                            align="right"
                                        />
                                    </th>
                                    <th className="px-3 py-2.5 text-right font-medium">
                                        <ColumnHeaderTip
                                            label="Kemasan beli"
                                            title="Kemasan Pembelian"
                                            description="Ukuran konversi kemasan ke satuan dasar dan harga beli per kemasan untuk memudahkan stock-in."
                                            align="right"
                                        />
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">
                                        <ColumnHeaderTip
                                            label="Status"
                                            title="Status Ketersediaan"
                                            description="Kondisi ketersediaan fisik bahan saat ini: Aman, Perhatian, atau Menipis."
                                        />
                                    </th>
                                    <th className="rounded-r-xl px-3 py-2.5 text-center font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((i) => {
                                    const cfg = stateConfig[i.stock_status];
                                    const change = Number(i.price_change_pct);
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
                                                            {i.lead_time_days}{' '}
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
                                                    /{unitShort[i.base_unit]}
                                                    {Math.abs(change) >= 0.5 ? (
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
                                                        {unitShort[i.base_unit]}{' '}
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
                                                    {owner ? (
                                                        <FxIconButton
                                                            title="Edit bahan"
                                                            aria-label="Edit bahan"
                                                            onClick={() =>
                                                                setEdit(i)
                                                            }
                                                        >
                                                            <Pencil className="size-4" />
                                                        </FxIconButton>
                                                    ) : null}
                                                    {owner ? (
                                                        <FxIconButton
                                                            title="Stock-in pembelian"
                                                            aria-label="Stock-in pembelian"
                                                            onClick={() =>
                                                                setStockIn(i)
                                                            }
                                                        >
                                                            <ArrowDownToLine className="size-4" />
                                                        </FxIconButton>
                                                    ) : null}
                                                    {owner ? (
                                                        <FxIconButton
                                                            title="Update harga penawaran"
                                                            aria-label="Update harga penawaran"
                                                            onClick={() =>
                                                                setQuote(i)
                                                            }
                                                        >
                                                            <Tag className="size-4" />
                                                        </FxIconButton>
                                                    ) : null}
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
                                                    {owner && i.is_active ? (
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
                            Menampilkan {rows.length} dari {ingredients.length}{' '}
                            bahan.
                        </span>
                        <span>
                            WAC = Weighted Average Cost dari pembelian terakhir.
                        </span>
                    </FxSoft>
                </FxCard>
            </Reveal>

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
                    isOwner={owner}
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
        </PageShell>
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
                    <div className="relative flex items-center">
                        <span className="pointer-events-none absolute left-4 text-sm font-semibold text-muted-foreground select-none">
                            Rp
                        </span>
                        <FxInput
                            type="number"
                            min="0"
                            className="pl-11"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </div>
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
                <div className="relative flex items-center">
                    <span className="pointer-events-none absolute left-4 text-sm font-semibold text-muted-foreground select-none">
                        Rp
                    </span>
                    <FxInput
                        type="number"
                        min="0"
                        className="pl-11"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </div>
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

function formatTwoDecimals(
    val: string | number | null | undefined,
    fallback = '0.00',
): string {
    if (val === null || val === undefined || val === '') {
        return fallback;
    }
    const num = Number(val);
    return Number.isNaN(num) ? fallback : num.toFixed(2);
}

function handleDecimalInput(setter: (val: string) => void, val: string) {
    const parts = val.split('.');
    if (parts.length === 2 && parts[1].length > 2) {
        setter(`${parts[0]}.${parts[1].slice(0, 2)}`);
    } else {
        setter(val);
    }
}

function handleDecimalBlur(setter: (val: string) => void, fallback: string) {
    return (e: React.FocusEvent<HTMLInputElement>) => {
        const raw = e.target.value.trim();
        if (raw === '' || Number.isNaN(Number(raw))) {
            setter(fallback);
        } else {
            setter(Number(raw).toFixed(2));
        }
    };
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
    const [minStock, setMinStock] = useState(() =>
        formatTwoDecimals(target.minimum_stock, '0.00'),
    );
    const [leadTime, setLeadTime] = useState(String(target.lead_time_days));
    const [packSize, setPackSize] = useState(() =>
        formatTwoDecimals(target.package_size, '1.00'),
    );
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
            minimum_stock: formatTwoDecimals(minStock, '0.00'),
            lead_time_days: Number(leadTime) || 0,
            package_size: formatTwoDecimals(packSize, '1.00'),
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
                        step="0.01"
                        value={minStock}
                        onChange={(e) =>
                            handleDecimalInput(setMinStock, e.target.value)
                        }
                        onBlur={handleDecimalBlur(setMinStock, '0.00')}
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
                        min="0"
                        step="0.01"
                        value={packSize}
                        onChange={(e) =>
                            handleDecimalInput(setPackSize, e.target.value)
                        }
                        onBlur={handleDecimalBlur(setPackSize, '1.00')}
                    />
                </FxField>
                <FxField label="Harga per kemasan">
                    <div className="relative flex items-center">
                        <span className="pointer-events-none absolute left-4 text-sm font-semibold text-muted-foreground select-none">
                            Rp
                        </span>
                        <FxInput
                            type="number"
                            min="0"
                            className="pl-11"
                            value={packPrice}
                            onChange={(e) => setPackPrice(e.target.value)}
                        />
                    </div>
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
    isOwner,
    onClose,
    onSubmit,
}: {
    target: IngredientRow;
    isOwner: boolean;
    onClose: () => void;
    onSubmit: (
        target: IngredientRow,
        type: 'waste' | 'adjustment',
        qtyChange: number,
        reason: string,
    ) => void;
}) {
    // Mode: 'adjustment' (Opname Fisik) atau 'waste' (Waste/Kerusakan)
    const [mode, setMode] = useState<'adjustment' | 'waste'>(
        isOwner ? 'adjustment' : 'waste',
    );

    const currentStockNum = Number(target.current_stock) || 0;

    // Di mode opname: user menginput stok fisik yang dihitung di lapangan
    const [physicalInput, setPhysicalInput] = useState<string>(
        String(currentStockNum),
    );

    // Di mode waste: user menginput jumlah bahan yang rusak/terbuang
    const [wasteInput, setWasteInput] = useState<string>('');

    // Pilihan alasan terstruktur terinspirasi referensi Audit Stock
    const opnameReasons = [
        {
            id: 'stocktake',
            label: 'Selisih Opname',
            icon: ClipboardCheck,
            desc: 'Hasil audit fisik berkala',
        },
        {
            id: 'expire',
            label: 'Kadaluarsa',
            icon: Clock,
            desc: 'Bahan lewat masa simpan',
        },
        {
            id: 'damage',
            label: 'Rusak / Tumpah',
            icon: PackageX,
            desc: 'Kemasan rusak / bocor',
        },
        {
            id: 'misplacement',
            label: 'Salah Catat',
            icon: Layers,
            desc: 'Selisih input transaksi',
        },
        {
            id: 'theft',
            label: 'Susut / Hilang',
            icon: ShieldAlert,
            desc: 'Penyusutan tak terduga',
        },
        {
            id: 'custom',
            label: 'Lainnya',
            icon: PenLine,
            desc: 'Keterangan manual khusus',
        },
    ];

    const wasteReasons = [
        {
            id: 'damage',
            label: 'Rusak / Basi',
            icon: PackageX,
            desc: 'Basi, tumpah, kemasan bocor',
        },
        {
            id: 'expire',
            label: 'Kadaluarsa',
            icon: Clock,
            desc: 'Melebihi tanggal kedaluwarsa',
        },
        {
            id: 'spill',
            label: 'Tumpah / Jatuh',
            icon: Layers,
            desc: 'Kecelakaan kerja di dapur',
        },
        {
            id: 'theft',
            label: 'Susut Alami',
            icon: ShieldAlert,
            desc: 'Penyusutan saat penyimpanan',
        },
        {
            id: 'custom',
            label: 'Lainnya',
            icon: PenLine,
            desc: 'Alasan khusus lainnya',
        },
    ];

    const activeReasons = mode === 'adjustment' ? opnameReasons : wasteReasons;
    const [selectedReason, setSelectedReason] = useState<string>(
        mode === 'adjustment' ? 'stocktake' : 'damage',
    );
    const [note, setNote] = useState('');

    // Perhitungan selisih & stok proyeksi
    let delta = 0;
    let finalStock = currentStockNum;

    if (mode === 'adjustment') {
        const physicalNum = Number(physicalInput) || 0;
        delta = Number((physicalNum - currentStockNum).toFixed(3));
        finalStock = physicalNum;
    } else {
        const wasteNum = Math.abs(Number(wasteInput) || 0);
        delta = Number((-wasteNum).toFixed(3));
        finalStock = Number((currentStockNum - wasteNum).toFixed(3));
    }

    function submit() {
        if (!isOwner && mode === 'adjustment') {
            toast.error(
                'Hanya pemilik (owner) yang berhak melakukan penyesuaian opname.',
            );
            return;
        }

        if (mode === 'adjustment') {
            const physicalNum = Number(physicalInput);
            if (isNaN(physicalNum) || physicalInput.trim() === '') {
                toast.error('Masukkan jumlah stok fisik yang valid.');
                return;
            }
            if (physicalNum < 0) {
                toast.error('Stok fisik tidak boleh bernilai negatif.');
                return;
            }
            if (delta === 0) {
                toast.error(
                    'Stok fisik sama dengan stok sistem (selisih 0). Tidak ada perubahan yang perlu disimpan.',
                );
                return;
            }
        } else {
            const wasteNum = Number(wasteInput);
            if (!wasteNum || wasteNum <= 0) {
                toast.error('Kuantitas waste harus lebih besar dari 0.');
                return;
            }
            if (wasteNum > currentStockNum) {
                toast.error(
                    `Pengurangan waste (${wasteNum}) melebihi stok yang tersedia (${currentStockNum}).`,
                );
                return;
            }
        }

        const reasonObj = activeReasons.find((r) => r.id === selectedReason);
        const reasonTag = reasonObj?.label ?? 'Penyesuaian';
        const fullReason = note.trim()
            ? `${reasonTag}: ${note.trim()}`
            : reasonTag;

        onSubmit(target, mode, delta, fullReason.slice(0, 255));
    }

    return (
        <FxModal
            open
            onOpenChange={(o) => !o && onClose()}
            title="Audit Stok Bahan"
            description={`Pencatatan stock opname fisik, selisih persediaan, atau waste untuk ${target.name}.`}
            className="max-h-[92vh] overflow-y-auto sm:max-w-4xl lg:max-w-5xl"
            footer={
                <div className="flex w-full flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Info className="size-3.5 shrink-0 text-primary" />
                        <span>
                            {mode === 'adjustment'
                                ? 'Stok sistem akan disesuaikan menjadi sama persis dengan hasil hitungan fisik.'
                                : 'Stok akan dipotong otomatis dan dicatat sebagai waste/kerusakan.'}
                        </span>
                    </p>
                    <div className="flex items-center justify-end gap-2">
                        <FxButton variant="soft" onClick={onClose}>
                            Batal
                        </FxButton>
                        <FxButton variant="coral" onClick={submit}>
                            Simpan Penyesuaian
                        </FxButton>
                    </div>
                </div>
            }
        >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
                {/* KOLOM KIRI: Form Input & Kalkulasi */}
                <div className="flex flex-col gap-5">
                    {/* Adjustment Type Switcher */}
                    <div>
                        <span className="text-xs font-semibold text-muted-foreground">
                            Jenis Penyesuaian (Adjustment Type)
                        </span>
                        <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1">
                            <button
                                type="button"
                                disabled={!isOwner}
                                onClick={() => {
                                    setMode('adjustment');
                                    setSelectedReason('stocktake');
                                }}
                                className={cn(
                                    'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all',
                                    mode === 'adjustment'
                                        ? 'bg-card text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground',
                                    !isOwner && 'cursor-not-allowed opacity-50',
                                )}
                            >
                                <ClipboardCheck className="size-4 text-primary" />
                                <span>Opname Fisik</span>
                                {!isOwner && (
                                    <span className="text-[10px] text-muted-foreground">
                                        (Owner)
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('waste');
                                    setSelectedReason('damage');
                                }}
                                className={cn(
                                    'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all',
                                    mode === 'waste'
                                        ? 'bg-card text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <Trash2 className="size-4 text-danger" />
                                <span>Waste / Rusak</span>
                            </button>
                        </div>
                    </div>

                    {/* 3 Metric Cards: Physical Count, Available, Discrepancy */}
                    <div className="grid grid-cols-3 gap-2.5">
                        {/* Physical Count */}
                        <div className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-3 shadow-2xs">
                            <span className="text-[11px] font-semibold text-muted-foreground">
                                {mode === 'adjustment'
                                    ? 'Hitungan Fisik'
                                    : 'Stok Akhir'}
                            </span>
                            <div className="mt-2">
                                {mode === 'adjustment' ? (
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            step="any"
                                            value={physicalInput}
                                            onChange={(e) =>
                                                setPhysicalInput(e.target.value)
                                            }
                                            className="w-full bg-transparent text-base font-bold text-foreground tabular-nums outline-none focus:underline"
                                            placeholder="0"
                                        />
                                        <span className="ml-1 shrink-0 text-xs font-medium text-muted-foreground">
                                            {unitShort[target.base_unit]}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-base font-bold text-foreground tabular-nums">
                                        {formatQty(finalStock)}{' '}
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {unitShort[target.base_unit]}
                                        </span>
                                    </p>
                                )}
                            </div>
                            <span className="mt-1 text-[10px] text-muted-foreground">
                                {mode === 'adjustment'
                                    ? 'Ketik hasil hitung'
                                    : 'Proyeksi sisa'}
                            </span>
                        </div>

                        {/* Available */}
                        <div className="flex flex-col justify-between rounded-2xl border border-border/60 bg-secondary/50 p-3">
                            <span className="text-[11px] font-semibold text-muted-foreground">
                                Stok Sistem
                            </span>
                            <p className="mt-2 text-base font-bold text-foreground tabular-nums">
                                {formatQty(target.current_stock)}{' '}
                                <span className="text-xs font-medium text-muted-foreground">
                                    {unitShort[target.base_unit]}
                                </span>
                            </p>
                            <span className="mt-1 text-[10px] text-muted-foreground">
                                Tercatat saat ini
                            </span>
                        </div>

                        {/* Discrepancy */}
                        <div
                            className={cn(
                                'flex flex-col justify-between rounded-2xl border p-3',
                                delta > 0
                                    ? 'border-success/40 bg-success-soft/30'
                                    : delta < 0
                                      ? 'border-danger/40 bg-danger-soft/30'
                                      : 'border-border/60 bg-secondary/50',
                            )}
                        >
                            <span className="text-[11px] font-semibold text-muted-foreground">
                                {mode === 'adjustment'
                                    ? 'Selisih'
                                    : 'Jumlah Waste'}
                            </span>
                            <div className="mt-2">
                                {mode === 'waste' ? (
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            step="any"
                                            value={wasteInput}
                                            onChange={(e) =>
                                                setWasteInput(e.target.value)
                                            }
                                            className="w-full bg-transparent text-base font-bold text-danger tabular-nums outline-none focus:underline"
                                            placeholder="0"
                                        />
                                        <span className="ml-1 shrink-0 text-xs font-medium text-danger">
                                            {unitShort[target.base_unit]}
                                        </span>
                                    </div>
                                ) : (
                                    <p
                                        className={cn(
                                            'text-base font-bold tabular-nums',
                                            delta > 0
                                                ? 'text-success'
                                                : delta < 0
                                                  ? 'text-danger'
                                                  : 'text-muted-foreground',
                                        )}
                                    >
                                        {delta > 0 ? `+${delta}` : delta}{' '}
                                        <span className="text-xs font-medium">
                                            {unitShort[target.base_unit]}
                                        </span>
                                    </p>
                                )}
                            </div>
                            <span
                                className={cn(
                                    'mt-1 text-[10px] font-semibold',
                                    delta > 0
                                        ? 'text-success'
                                        : delta < 0
                                          ? 'text-danger'
                                          : 'text-muted-foreground',
                                )}
                            >
                                {delta > 0
                                    ? 'Surplus (+)'
                                    : delta < 0
                                      ? 'Defisit (-)'
                                      : 'Tepat / Cocok'}
                            </span>
                        </div>
                    </div>

                    {/* Alasan Penyesuaian (Grid of cards) */}
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">
                                Alasan Penyesuaian (Adjustment Reason)
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                                Pilih salah satu
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {activeReasons.map((r) => {
                                const Icon = r.icon;
                                const isSelected = selectedReason === r.id;
                                return (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setSelectedReason(r.id)}
                                        className={cn(
                                            'group relative flex flex-col items-start rounded-2xl border p-2.5 text-left transition-all',
                                            isSelected
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'border-border/60 bg-secondary/30 hover:border-border hover:bg-secondary/70',
                                        )}
                                    >
                                        <div className="flex w-full items-center justify-between">
                                            <div
                                                className={cn(
                                                    'flex size-7 items-center justify-center rounded-lg',
                                                    isSelected
                                                        ? 'bg-primary text-white'
                                                        : 'bg-card text-muted-foreground',
                                                )}
                                            >
                                                <Icon className="size-3.5" />
                                            </div>
                                            <div
                                                className={cn(
                                                    'flex size-4 items-center justify-center rounded-full border',
                                                    isSelected
                                                        ? 'border-primary bg-primary text-white'
                                                        : 'border-border bg-card',
                                                )}
                                            >
                                                {isSelected && (
                                                    <Check className="size-2.5 stroke-[3]" />
                                                )}
                                            </div>
                                        </div>
                                        <p
                                            className={cn(
                                                'mt-2 text-xs font-bold',
                                                isSelected
                                                    ? 'text-primary'
                                                    : 'text-foreground',
                                            )}
                                        >
                                            {r.label}
                                        </p>
                                        <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                                            {r.desc}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Note / Catatan Tambahan */}
                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">
                                Catatan Tambahan (Note)
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                                {note.length}/200
                            </span>
                        </div>
                        <FxTextarea
                            rows={3}
                            maxLength={200}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Tuliskan keterangan detail jika diperlukan (misal: kemasan bocor saat transit, batch 08/11)..."
                        />
                    </div>
                </div>

                {/* KOLOM KANAN: Detail Bahan & Riwayat Penyesuaian */}
                <div className="flex flex-col gap-4 border-t border-border/60 pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
                    {/* Detail Bahan Card */}
                    <FxSoft className="p-4">
                        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Detail Bahan
                        </span>
                        <div className="mt-2.5 flex items-start gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-card shadow-xs">
                                <Box className="size-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="truncate text-sm font-bold text-foreground">
                                    {target.name}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Satuan:{' '}
                                    <span className="font-semibold text-foreground">
                                        {target.base_unit}
                                    </span>{' '}
                                    &bull; Kelas {target.abc_class}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-xl bg-card/70 p-2.5">
                                <p className="text-[10px] text-muted-foreground">
                                    Biaya WAC
                                </p>
                                <p className="mt-0.5 font-bold text-foreground tabular-nums">
                                    {formatRupiah(target.cost_per_unit)}
                                </p>
                            </div>
                            <div className="rounded-xl bg-card/70 p-2.5">
                                <p className="text-[10px] text-muted-foreground">
                                    Stok Minimum
                                </p>
                                <p className="mt-0.5 font-bold text-foreground tabular-nums">
                                    {formatQty(target.minimum_stock)}{' '}
                                    {unitShort[target.base_unit]}
                                </p>
                            </div>
                        </div>
                    </FxSoft>

                    {/* Riwayat Penyesuaian (Stock Adjustment History) */}
                    <div className="flex min-h-0 flex-1 flex-col">
                        <div className="mb-2 flex items-center justify-between">
                            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                <History className="size-3.5" />
                                Riwayat Penyesuaian
                            </h4>
                            <span className="text-[10px] text-muted-foreground">
                                {target.adjustment_history?.length ?? 0} catatan
                            </span>
                        </div>

                        <div className="max-h-64 flex-1 space-y-2.5 overflow-y-auto pr-1">
                            {target.adjustment_history &&
                            target.adjustment_history.length > 0 ? (
                                target.adjustment_history.map((item) => {
                                    const qtyNum = Number(item.qty_change);
                                    return (
                                        <div
                                            key={item.id}
                                            className="flex items-start gap-2.5 rounded-2xl border border-border/50 bg-secondary/30 p-2.5 text-xs transition-colors hover:bg-secondary/60"
                                        >
                                            <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground">
                                                <UserIcon className="size-3.5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="truncate font-semibold text-foreground">
                                                        {item.user_name}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                                                            qtyNum > 0
                                                                ? 'bg-success-soft text-success'
                                                                : 'bg-danger-soft text-danger',
                                                        )}
                                                    >
                                                        {qtyNum > 0
                                                            ? `+${qtyNum}`
                                                            : qtyNum}{' '}
                                                        {
                                                            unitShort[
                                                                target.base_unit
                                                            ]
                                                        }
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                                                    {item.reason ?? item.type}
                                                </p>
                                                <p className="mt-1 text-[10px] text-muted-foreground/75">
                                                    {formatAdjustmentDate(
                                                        item.created_at,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
                                    <History className="mb-1.5 size-6 text-muted-foreground/40" />
                                    <p>
                                        Belum ada riwayat penyesuaian untuk
                                        bahan ini.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </FxModal>
    );
}
