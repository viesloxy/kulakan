import { router, usePage } from '@inertiajs/react';
import {
    Coffee,
    CupSoda,
    ImagePlus,
    Info,
    Pencil,
    Plus,
    Sandwich,
    Search,
    Sparkles,
    Trash2,
    UtensilsCrossed,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { FxField, FxInput, FxModal, FxSelect } from '@/components/fx/fx-form';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';
import PageShell from '@/components/page-shell';
import StatusBadge, { type MenuStatus } from '@/components/status-badge';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatPercent, formatRupiah } from '@/lib/format';
import { isOwner } from '@/lib/permissions';

type Category = 'Kopi' | 'Non-Kopi' | 'Makanan';
type BaseUnit = 'gram' | 'ml' | 'pcs';

type BomRow = {
    ingredient_id: number;
    ingredient_name: string;
    base_unit: BaseUnit;
    quantity_needed: string;
    waste_factor: string; // pecahan 0-0.5
    cost_per_unit: string;
    effective_qty: string;
    line_cost: string;
};

type MenuRow = {
    id: number;
    name: string;
    category: Category;
    image_url: string | null;
    selling_price: number | string;
    overhead: number | string;
    yield_portions: number;
    is_active: boolean;
    current_hpp: string;
    margin_pct: string;
    status: MenuStatus;
    projected_hpp: string | null;
    projected_margin_pct: string | null;
    projected_status: MenuStatus | null;
    subtotal: string;
    portions_available: number;
    bom: BomRow[];
};

type IngredientOption = { id: number; name: string; base_unit: BaseUnit };

type Props = { menus: MenuRow[]; ingredients: IngredientOption[] };

const categoryIcon = { Kopi: Coffee, 'Non-Kopi': CupSoda, Makanan: Sandwich };
const categories = ['Kopi', 'Non-Kopi', 'Makanan'] as const;
const unitShort: Record<BaseUnit, string> = { gram: 'g', ml: 'ml', pcs: 'pcs' };

const fmtQty = (value: string | number): string =>
    new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(
        Number(value),
    );

export default function Menus({ menus, ingredients }: Props) {
    const owner = isOwner(usePage().props.auth.user);
    const [selectedId, setSelectedId] = useState<number | null>(
        menus[0]?.id ?? null,
    );
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [bomOpen, setBomOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'Semua' | Category>(
        'Semua',
    );

    const filteredMenus = useMemo(() => {
        return menus.filter((m) => {
            const matchesCategory =
                categoryFilter === 'Semua' || m.category === categoryFilter;
            const matchesQuery =
                searchQuery.trim() === '' ||
                m.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
            return matchesCategory && matchesQuery;
        });
    }, [menus, categoryFilter, searchQuery]);

    const selected = useMemo(
        () =>
            filteredMenus.find((m) => m.id === selectedId) ??
            menus.find((m) => m.id === selectedId) ??
            filteredMenus[0] ??
            menus[0] ??
            null,
        [menus, selectedId, filteredMenus],
    );

    function handleCreate(data: CreateMenuData) {
        router.post(
            '/menu',
            {
                name: data.name,
                category: data.category,
                selling_price: data.price,
                overhead: data.overhead,
                ...(data.image ? { image: data.image } : {}),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCreateOpen(false);
                    toast.success('Menu ditambahkan', {
                        description: `${data.name} dibuat. Susun BOM agar bisa dijual di POS.`,
                    });
                },
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ?? 'Gagal menyimpan menu.',
                    ),
            },
        );
    }

    function handleEdit(data: EditMenuData) {
        router.post(
            `/menu/${data.id}`,
            {
                _method: 'put',
                name: data.name,
                category: data.category,
                selling_price: data.price,
                overhead: data.overhead,
                is_active: data.is_active,
                ...(data.image ? { image: data.image } : {}),
                ...(data.removeImage ? { remove_image: true } : {}),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditOpen(false);
                    toast.success('Menu diperbarui', {
                        description: `${data.name} disimpan.`,
                    });
                },
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ?? 'Gagal memperbarui menu.',
                    ),
            },
        );
    }

    function handleSaveBom(
        menuId: number,
        items: {
            ingredient_id: number;
            quantity_needed: number;
            waste_factor: number;
        }[],
    ) {
        router.post(
            `/menu/${menuId}/recipe`,
            { yield_portions: 1, items },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setBomOpen(false);
                    toast.success('Resep disimpan', {
                        description: `BOM diperbarui (${items.length} bahan). HPP dihitung ulang otomatis.`,
                    });
                },
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ?? 'Gagal menyimpan resep.',
                    ),
            },
        );
    }

    const hasProjection = selected?.projected_hpp !== null;

    return (
        <PageShell
            title="Menu & Resep"
            description="Kelola menu jual dan susun BOM (resep) agar stok dan HPP terhitung otomatis."
            actions={
                owner ? (
                    <FxButton
                        variant="coral"
                        className="w-full sm:w-auto"
                        onClick={() => setCreateOpen(true)}
                    >
                        <Plus className="size-4" />
                        Tambah menu
                    </FxButton>
                ) : null
            }
        >
            {selected === null ? (
                <FxSoft className="flex flex-col items-center gap-3 p-10 text-center">
                    <p className="text-sm text-muted-foreground">
                        Belum ada menu. Tambahkan menu pertama.
                    </p>
                    {owner ? (
                        <FxButton
                            variant="coral"
                            onClick={() => setCreateOpen(true)}
                        >
                            <Plus className="size-4" />
                            Tambah menu
                        </FxButton>
                    ) : null}
                </FxSoft>
            ) : (
                <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[1fr_1.35fr]">
                    <Reveal delay={0.05} className="w-full min-w-0">
                        <FxCard className="flex min-w-0 flex-col gap-3 p-3.5 sm:p-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-semibold">
                                    Daftar menu
                                </h2>
                                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold sm:px-3 sm:py-1">
                                    {filteredMenus.length === menus.length
                                        ? `${menus.length} menu`
                                        : `${filteredMenus.length} dari ${menus.length} menu`}
                                </span>
                            </div>

                            <div className="flex h-10 items-center gap-2 rounded-2xl bg-secondary/60 px-3.5 transition-colors focus-within:bg-secondary focus-within:ring-2 focus-within:ring-primary/20">
                                <Search className="size-4 shrink-0 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Cari menu..."
                                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                />
                                {searchQuery ? (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-hover-soft hover:text-foreground"
                                        aria-label="Hapus pencarian"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                ) : null}
                            </div>

                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap">
                                {(['Semua', ...categories] as const).map(
                                    (cat) => {
                                        const active = categoryFilter === cat;
                                        return (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() =>
                                                    setCategoryFilter(cat)
                                                }
                                                className={`h-7 shrink-0 rounded-full px-3 text-xs font-semibold transition-all duration-200 ${
                                                    active
                                                        ? 'fx-coral'
                                                        : 'bg-secondary text-foreground hover:bg-hover-soft'
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        );
                                    },
                                )}
                            </div>

                            <div className="flex max-h-[260px] min-h-[200px] flex-col gap-2 overflow-y-auto pr-1 sm:max-h-[340px] sm:min-h-[280px] lg:max-h-[calc(100vh-340px)]">
                                {filteredMenus.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
                                        <Search className="size-8 text-muted-foreground/40" />
                                        <p className="text-sm font-medium">
                                            Menu tidak ditemukan
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Coba kata kunci atau kategori lain.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setCategoryFilter('Semua');
                                            }}
                                            className="mt-1 text-xs font-semibold text-primary hover:underline"
                                        >
                                            Reset filter
                                        </button>
                                    </div>
                                ) : (
                                    filteredMenus.map((m) => {
                                        const Icon = categoryIcon[m.category];
                                        const active = m.id === selected?.id;
                                        return (
                                            <button
                                                key={m.id}
                                                onClick={() =>
                                                    setSelectedId(m.id)
                                                }
                                                className={`flex w-full min-w-0 items-center gap-2.5 rounded-2xl p-2.5 text-left transition-all duration-200 sm:gap-3 sm:p-3 ${
                                                    active
                                                        ? 'fx-coral'
                                                        : 'fx-soft hover:bg-hover-soft'
                                                }`}
                                            >
                                                {m.image_url ? (
                                                    <img
                                                        src={m.image_url}
                                                        alt={m.name}
                                                        className="size-9 shrink-0 rounded-xl object-cover sm:size-10"
                                                    />
                                                ) : (
                                                    <IconCircle
                                                        icon={Icon}
                                                        size="sm"
                                                        className="shrink-0"
                                                        tone={
                                                            active
                                                                ? 'white'
                                                                : 'soft'
                                                        }
                                                    />
                                                )}
                                                <div className="min-w-0 flex-1 overflow-hidden">
                                                    <p className="truncate text-sm font-semibold sm:text-base">
                                                        {m.name}
                                                    </p>
                                                    <p
                                                        className={`truncate text-[11px] sm:text-xs ${active ? 'text-white/70' : 'text-muted-foreground'}`}
                                                    >
                                                        HPP{' '}
                                                        {formatRupiah(
                                                            m.current_hpp,
                                                        )}{' '}
                                                        ·{' '}
                                                        {formatRupiah(
                                                            m.selling_price,
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 pl-1 text-right">
                                                    <p className="text-xs font-bold tabular-nums sm:text-sm">
                                                        {formatPercent(
                                                            m.margin_pct,
                                                            1,
                                                        )}
                                                    </p>
                                                    <p
                                                        className={`text-[10px] sm:text-[11px] ${active ? 'text-white/70' : 'text-muted-foreground'}`}
                                                    >
                                                        margin
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </FxCard>
                    </Reveal>

                    <Reveal delay={0.1} className="w-full min-w-0">
                        <FxCard className="flex min-w-0 flex-col gap-4 p-3.5 sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex min-w-0 items-start gap-3">
                                    {selected.image_url ? (
                                        <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-border/60 sm:size-20">
                                            <img
                                                src={selected.image_url}
                                                alt={selected.name}
                                                className="size-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <IconCircle
                                            icon={
                                                categoryIcon[selected.category]
                                            }
                                            tone="soft"
                                            size="lg"
                                            className="shrink-0"
                                        />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold">
                                            <span>{selected.name}</span>
                                            {!selected.is_active ? (
                                                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                                    Nonaktif
                                                </span>
                                            ) : null}
                                        </h2>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {selected.category} · harga jual{' '}
                                            {formatRupiah(
                                                selected.selling_price,
                                            )}{' '}
                                            · yield {selected.yield_portions}{' '}
                                            porsi · sisa{' '}
                                            {selected.portions_available}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <StatusBadge status={selected.status} />
                                    {owner ? (
                                        <>
                                            <FxButton
                                                variant="soft"
                                                className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
                                                onClick={() =>
                                                    setEditOpen(true)
                                                }
                                            >
                                                <Pencil className="size-3.5 sm:size-4" />
                                                Edit menu
                                            </FxButton>
                                            <FxButton
                                                variant="soft"
                                                className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
                                                onClick={() => setBomOpen(true)}
                                            >
                                                <UtensilsCrossed className="size-3.5 sm:size-4" />
                                                Susun BOM
                                            </FxButton>
                                        </>
                                    ) : null}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                                <FxSoft className="flex flex-col justify-between gap-1 p-2 text-center sm:gap-3 sm:p-4 sm:text-left">
                                    <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
                                        HPP aktual
                                    </p>
                                    <p className="truncate text-xs font-bold tabular-nums sm:text-lg">
                                        {formatRupiah(selected.current_hpp)}
                                    </p>
                                </FxSoft>
                                <FxSoft className="flex flex-col justify-between gap-1 p-2 text-center sm:gap-3 sm:p-4 sm:text-left">
                                    <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
                                        Margin aktual
                                    </p>
                                    <p className="text-xs font-bold tabular-nums sm:text-lg">
                                        {formatPercent(selected.margin_pct)}
                                    </p>
                                </FxSoft>
                                <FxSoft className="flex flex-col justify-between gap-1 p-2 text-center sm:gap-3 sm:p-4 sm:text-left">
                                    <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
                                        Bahan
                                    </p>
                                    <p className="truncate text-xs font-bold tabular-nums sm:text-lg">
                                        {formatRupiah(selected.subtotal)}
                                    </p>
                                </FxSoft>
                            </div>

                            {selected.bom.length === 0 ? (
                                <FxSoft className="flex flex-col items-center gap-2 p-8 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        Menu ini belum punya resep. Susun BOM
                                        agar bisa dijual di POS.
                                    </p>
                                    {owner ? (
                                        <FxButton
                                            variant="coral"
                                            onClick={() => setBomOpen(true)}
                                        >
                                            <Plus className="size-4" />
                                            Susun BOM sekarang
                                        </FxButton>
                                    ) : null}
                                </FxSoft>
                            ) : (
                                <div className="w-full max-w-full overflow-x-auto rounded-xl">
                                    <table className="w-full min-w-[420px] text-sm">
                                        <thead>
                                            <tr className="bg-secondary text-left text-xs text-muted-foreground">
                                                <th className="rounded-l-xl px-3 py-2.5 font-medium">
                                                    Bahan
                                                </th>
                                                <th className="px-3 py-2.5 text-right font-medium">
                                                    Qty/porsi
                                                </th>
                                                <th className="px-3 py-2.5 text-right font-medium">
                                                    Waste
                                                </th>
                                                <th className="px-3 py-2.5 text-right font-medium">
                                                    Qty efektif
                                                </th>
                                                <th className="rounded-r-xl px-3 py-2.5 text-right font-medium">
                                                    Biaya
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selected.bom.map((r) => (
                                                <tr
                                                    key={r.ingredient_id}
                                                    className="border-b border-border/60 last:border-0"
                                                >
                                                    <td className="px-3 py-3">
                                                        <p className="font-medium">
                                                            {r.ingredient_name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatRupiah(
                                                                r.cost_per_unit,
                                                            )}
                                                            /
                                                            {
                                                                unitShort[
                                                                    r.base_unit
                                                                ]
                                                            }
                                                        </p>
                                                    </td>
                                                    <td className="px-3 py-3 text-right tabular-nums">
                                                        {fmtQty(
                                                            r.quantity_needed,
                                                        )}{' '}
                                                        {unitShort[r.base_unit]}
                                                    </td>
                                                    <td className="px-3 py-3 text-right tabular-nums">
                                                        {formatPercent(
                                                            Number(
                                                                r.waste_factor,
                                                            ) * 100,
                                                            0,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-right tabular-nums">
                                                        {fmtQty(
                                                            r.effective_qty,
                                                        )}{' '}
                                                        {unitShort[r.base_unit]}
                                                    </td>
                                                    <td className="px-3 py-3 text-right tabular-nums">
                                                        {formatRupiah(
                                                            r.line_cost,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="border-b border-border/60">
                                                <td
                                                    className="px-3 py-3 text-muted-foreground"
                                                    colSpan={4}
                                                >
                                                    Subtotal bahan
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    {formatRupiah(
                                                        selected.subtotal,
                                                    )}
                                                </td>
                                            </tr>
                                            <tr className="border-b border-border/60">
                                                <td
                                                    className="px-3 py-3 text-muted-foreground"
                                                    colSpan={4}
                                                >
                                                    Overhead standar per porsi
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    {formatRupiah(
                                                        selected.overhead,
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td
                                                    className="px-3 py-3 font-semibold"
                                                    colSpan={4}
                                                >
                                                    HPP
                                                </td>
                                                <td className="px-3 py-3 text-right font-bold tabular-nums">
                                                    {formatRupiah(
                                                        selected.current_hpp,
                                                    )}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {hasProjection ? (
                                <FxSoft className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                                    <span className="inline-flex items-center gap-2 text-xs sm:text-sm">
                                        <IconCircle
                                            icon={Sparkles}
                                            tone="soft"
                                            size="sm"
                                        />
                                        <span>
                                            HPP proyeksi{' '}
                                            <span className="font-bold tabular-nums">
                                                {formatRupiah(
                                                    selected.projected_hpp!,
                                                )}
                                            </span>{' '}
                                            dari{' '}
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span
                                                        tabIndex={0}
                                                        className="inline-flex cursor-help items-center gap-1 font-medium text-foreground underline decoration-muted-foreground/60 decoration-dotted underline-offset-4 transition-colors hover:text-primary focus:text-primary focus:outline-none"
                                                    >
                                                        harga penawaran terbaru
                                                        <Info className="size-3.5 text-muted-foreground" />
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent
                                                    side="top"
                                                    className="max-w-[280px] rounded-xl bg-card p-3 text-xs text-foreground shadow-md ring-1 ring-border [&>svg]:fill-card"
                                                >
                                                    <p className="font-semibold text-foreground">
                                                        Asal Harga Penawaran
                                                        Terbaru
                                                    </p>
                                                    <p className="mt-1 leading-relaxed text-muted-foreground">
                                                        Dihitung dari harga
                                                        penawaran/kuotasi
                                                        supplier terbaru atau
                                                        harga beli aktual
                                                        terakhir pada bahan baku
                                                        penyusun resep ini
                                                        (bukan dari rata-rata
                                                        modal stok lama / WAC),
                                                        sehingga membantu
                                                        mengantisipasi penurunan
                                                        margin sebelum belanja
                                                        stok berikutnya.
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </span>
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning-ink">
                                            {formatPercent(
                                                selected.projected_margin_pct ??
                                                    0,
                                            )}
                                        </span>
                                        {selected.projected_status ? (
                                            <StatusBadge
                                                status={
                                                    selected.projected_status
                                                }
                                            />
                                        ) : null}
                                    </span>
                                </FxSoft>
                            ) : null}
                        </FxCard>
                    </Reveal>
                </div>
            )}

            <CreateMenuModal
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSubmit={handleCreate}
            />

            {editOpen && selected ? (
                <EditMenuModal
                    key={selected.id}
                    menu={selected}
                    onClose={() => setEditOpen(false)}
                    onSubmit={handleEdit}
                />
            ) : null}

            {bomOpen && selected ? (
                <BomModal
                    key={selected.id}
                    menu={selected}
                    ingredients={ingredients}
                    onClose={() => setBomOpen(false)}
                    onSave={(items) => handleSaveBom(selected.id, items)}
                />
            ) : null}
        </PageShell>
    );
}

type CreateMenuData = {
    name: string;
    category: Category;
    price: number;
    overhead: number;
    image: File | null;
};

type EditMenuData = {
    id: number;
    name: string;
    category: Category;
    price: number;
    overhead: number;
    is_active: boolean;
    image: File | null;
    removeImage: boolean;
};

function MenuImageField({
    preview,
    onPick,
    onRemove,
}: {
    preview: string | null;
    onPick: (file: File | null) => void;
    onRemove?: () => void;
}) {
    return (
        <FxField
            label="Foto menu"
            hint="JPG, PNG, atau WebP maksimal 2 MB. Opsional; tampil di katalog dan POS."
        >
            <div className="flex flex-col gap-3">
                {preview ? (
                    <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-border/60 bg-secondary shadow-inner">
                        <img
                            src={preview}
                            alt="Pratinjau foto menu"
                            className="size-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                    </div>
                ) : (
                    <div className="flex h-64 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-secondary/40 text-muted-foreground">
                        <ImagePlus className="size-8 stroke-[1.5]" />
                        <span className="text-xs">Belum ada foto menu</span>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-secondary px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-hover-soft">
                        <ImagePlus className="size-3.5" />
                        {preview ? 'Ganti foto' : 'Pilih foto'}
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                                onPick(e.target.files?.[0] ?? null);
                                e.target.value = '';
                            }}
                        />
                    </label>
                    {preview && onRemove ? (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="rounded-full px-3 py-2 text-xs font-medium text-danger transition-colors hover:bg-danger-soft"
                        >
                            Hapus foto
                        </button>
                    ) : null}
                </div>
            </div>
        </FxField>
    );
}

function CreateMenuModal({
    open,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateMenuData) => void;
}) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState<Category>('Kopi');
    const [price, setPrice] = useState('15000');
    const [overhead, setOverhead] = useState('1500');
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    function pick(file: File | null) {
        setImage(file);
        setPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return file ? URL.createObjectURL(file) : null;
        });
    }

    function submit() {
        if (!name.trim()) {
            toast.error('Nama menu wajib diisi.');
            return;
        }
        if (Number(price) <= 0) {
            toast.error('Harga jual harus lebih dari 0.');
            return;
        }
        onSubmit({
            name: name.trim(),
            category,
            price: Number(price),
            overhead: Number(overhead) || 0,
            image,
        });
    }

    return (
        <FxModal
            open={open}
            onOpenChange={onOpenChange}
            title="Tambah menu"
            description="Setelah dibuat, susun BOM agar menu muncul di POS."
            footer={
                <>
                    <FxButton
                        variant="soft"
                        onClick={() => onOpenChange(false)}
                    >
                        Batal
                    </FxButton>
                    <FxButton variant="coral" onClick={submit}>
                        Simpan menu
                    </FxButton>
                </>
            }
        >
            <FxField label="Nama menu">
                <FxInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Cokelat Panas"
                />
            </FxField>
            <div className="grid gap-3 sm:grid-cols-2">
                <FxField label="Kategori">
                    <FxSelect
                        value={category}
                        onChange={(e) =>
                            setCategory(e.target.value as Category)
                        }
                    >
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </FxSelect>
                </FxField>
                <FxField label="Harga jual">
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
            <FxField
                label="Overhead standar per porsi"
                hint="Listrik, tenaga kerja; kemasan dimodelkan sebagai bahan."
            >
                <FxInput
                    type="number"
                    min="0"
                    value={overhead}
                    onChange={(e) => setOverhead(e.target.value)}
                />
            </FxField>
            <MenuImageField preview={preview} onPick={pick} />
        </FxModal>
    );
}

function EditMenuModal({
    menu,
    onClose,
    onSubmit,
}: {
    menu: MenuRow;
    onClose: () => void;
    onSubmit: (data: EditMenuData) => void;
}) {
    const [name, setName] = useState(menu.name);
    const [category, setCategory] = useState<Category>(menu.category);
    const [price, setPrice] = useState(String(menu.selling_price));
    const [overhead, setOverhead] = useState(String(menu.overhead));
    const [isActive, setIsActive] = useState(menu.is_active);
    const [image, setImage] = useState<File | null>(null);
    const [removeImage, setRemoveImage] = useState(false);
    const [preview, setPreview] = useState<string | null>(menu.image_url);

    function pick(file: File | null) {
        setImage(file);
        setRemoveImage(false);
        setPreview((prev) => {
            if (prev && prev !== menu.image_url) URL.revokeObjectURL(prev);
            return file ? URL.createObjectURL(file) : menu.image_url;
        });
    }

    function removePhoto() {
        if (image) {
            setImage(null);
            setPreview(menu.image_url);
        } else {
            setRemoveImage(true);
            setPreview(null);
        }
    }

    function submit() {
        if (!name.trim()) {
            toast.error('Nama menu wajib diisi.');
            return;
        }
        if (Number(price) <= 0) {
            toast.error('Harga jual harus lebih dari 0.');
            return;
        }
        onSubmit({
            id: menu.id,
            name: name.trim(),
            category,
            price: Number(price),
            overhead: Number(overhead) || 0,
            is_active: isActive,
            image,
            removeImage,
        });
    }

    return (
        <FxModal
            open
            onOpenChange={(o) => !o && onClose()}
            title={`Edit ${menu.name}`}
            description="Ubah detail menu, foto, atau status ketersediaan."
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
            <FxField label="Nama menu">
                <FxInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </FxField>
            <div className="grid gap-3 sm:grid-cols-2">
                <FxField label="Kategori">
                    <FxSelect
                        value={category}
                        onChange={(e) =>
                            setCategory(e.target.value as Category)
                        }
                    >
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </FxSelect>
                </FxField>
                <FxField label="Harga jual">
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
            <FxField
                label="Overhead standar per porsi"
                hint="Listrik, tenaga kerja; kemasan dimodelkan sebagai bahan."
            >
                <FxInput
                    type="number"
                    min="0"
                    value={overhead}
                    onChange={(e) => setOverhead(e.target.value)}
                />
            </FxField>
            <MenuImageField
                preview={preview}
                onPick={pick}
                onRemove={preview || image ? removePhoto : undefined}
            />
            <FxField
                label="Status menu"
                hint="Menu nonaktif tidak muncul di POS dan tidak bisa dijual."
            >
                <FxSelect
                    value={isActive ? '1' : '0'}
                    onChange={(e) => setIsActive(e.target.value === '1')}
                >
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                </FxSelect>
            </FxField>
        </FxModal>
    );
}

type DraftRow = { ingredient_id: number; qty: string; waste: string };

function BomModal({
    menu,
    ingredients,
    onClose,
    onSave,
}: {
    menu: MenuRow;
    ingredients: IngredientOption[];
    onClose: () => void;
    onSave: (
        items: {
            ingredient_id: number;
            quantity_needed: number;
            waste_factor: number;
        }[],
    ) => void;
}) {
    const [rows, setRows] = useState<DraftRow[]>(
        menu.bom.length > 0
            ? menu.bom.map((b) => ({
                  ingredient_id: b.ingredient_id,
                  qty: String(b.quantity_needed),
                  waste: String(Number(b.waste_factor) * 100),
              }))
            : [
                  {
                      ingredient_id: ingredients[0]?.id ?? 0,
                      qty: '1',
                      waste: '0',
                  },
              ],
    );

    const used = rows.map((r) => r.ingredient_id);
    const previewCost = rows.reduce((sum, r) => {
        const ing = ingredients.find((i) => i.id === r.ingredient_id);
        if (!ing) return sum;
        const cost =
            menu.bom.find((b) => b.ingredient_id === r.ingredient_id)
                ?.cost_per_unit ?? '0';
        return (
            sum +
            Number(r.qty || 0) * (1 + Number(r.waste || 0) / 100) * Number(cost)
        );
    }, 0);

    function addRow() {
        const free =
            ingredients.find((i) => !used.includes(i.id)) ?? ingredients[0];
        setRows((r) => [
            ...r,
            { ingredient_id: free?.id ?? 0, qty: '1', waste: '0' },
        ]);
    }

    function updateRow(index: number, patch: Partial<DraftRow>) {
        setRows((r) =>
            r.map((row, i) => (i === index ? { ...row, ...patch } : row)),
        );
    }

    function removeRow(index: number) {
        setRows((r) => r.filter((_, i) => i !== index));
    }

    function submit() {
        const ids = rows.map((r) => r.ingredient_id);
        if (new Set(ids).size !== ids.length) {
            toast.error(
                'Bahan yang sama tidak boleh muncul dua kali dalam satu BOM.',
            );
            return;
        }
        if (rows.some((r) => Number(r.qty) <= 0)) {
            toast.error('Kuantitas bahan harus lebih dari 0.');
            return;
        }
        if (
            rows.some(
                (r) => Number(r.waste || 0) < 0 || Number(r.waste || 0) > 50,
            )
        ) {
            toast.error('Waste harus antara 0% dan 50%.');
            return;
        }
        onSave(
            rows.map((r) => ({
                ingredient_id: r.ingredient_id,
                quantity_needed: Number(r.qty),
                waste_factor: Number(r.waste || 0) / 100,
            })),
        );
    }

    return (
        <FxModal
            open
            onOpenChange={(o) => !o && onClose()}
            wide
            title={`Susun BOM ${menu.name}`}
            description="BOM 1 level. Kuantitas per porsi, waste 0-50%."
            footer={
                <>
                    <FxButton variant="soft" onClick={onClose}>
                        Batal
                    </FxButton>
                    <FxButton variant="coral" onClick={submit}>
                        Simpan resep
                    </FxButton>
                </>
            }
        >
            <div className="flex flex-col gap-3">
                {rows.map((row, index) => {
                    const ing = ingredients.find(
                        (i) => i.id === row.ingredient_id,
                    );
                    const unit = ing?.base_unit ?? 'gram';
                    return (
                        <div
                            key={index}
                            className="grid grid-cols-12 items-end gap-2"
                        >
                            <div className="col-span-6">
                                <FxField label="Bahan">
                                    <FxSelect
                                        value={row.ingredient_id}
                                        onChange={(e) =>
                                            updateRow(index, {
                                                ingredient_id: Number(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                    >
                                        {ingredients.map((opt) => (
                                            <option key={opt.id} value={opt.id}>
                                                {opt.name} (
                                                {unitShort[opt.base_unit]})
                                            </option>
                                        ))}
                                    </FxSelect>
                                </FxField>
                            </div>
                            <div className="col-span-3">
                                <FxField label={`Qty (${unitShort[unit]})`}>
                                    <FxInput
                                        type="number"
                                        min="0"
                                        value={row.qty}
                                        onChange={(e) =>
                                            updateRow(index, {
                                                qty: e.target.value,
                                            })
                                        }
                                    />
                                </FxField>
                            </div>
                            <div className="col-span-2">
                                <FxField label="Waste %">
                                    <FxInput
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={row.waste}
                                        onChange={(e) =>
                                            updateRow(index, {
                                                waste: e.target.value,
                                            })
                                        }
                                    />
                                </FxField>
                            </div>
                            <div className="col-span-1 flex justify-center pb-1">
                                <button
                                    type="button"
                                    onClick={() => removeRow(index)}
                                    disabled={rows.length === 1}
                                    className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-muted-foreground transition-colors hover:text-danger disabled:opacity-40"
                                    title="Hapus bahan"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}

                <button
                    type="button"
                    onClick={addRow}
                    className="flex items-center gap-2 self-start rounded-full bg-secondary px-4 py-2 text-sm font-semibold transition-colors hover:bg-hover-soft"
                >
                    <Plus className="size-4" />
                    Tambah bahan
                </button>
            </div>

            <FxSoft className="flex items-center justify-between p-4 text-sm">
                <span className="text-muted-foreground">
                    Subtotal bahan (live)
                </span>
                <span className="font-bold tabular-nums">
                    {formatRupiah(previewCost)} + overhead{' '}
                    {formatRupiah(menu.overhead)}
                </span>
            </FxSoft>
        </FxModal>
    );
}
