import { Head, router } from '@inertiajs/react';
import {
    Coffee,
    CupSoda,
    Pencil,
    Plus,
    Sandwich,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { FxField, FxInput, FxModal, FxSelect } from '@/components/fx/fx-form';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';
import PageHeader from '@/components/page-header';
import StatusBadge, { type MenuStatus } from '@/components/status-badge';
import { formatPercent, formatRupiah } from '@/lib/format';

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
    const [selectedId, setSelectedId] = useState<number | null>(
        menus[0]?.id ?? null,
    );
    const [createOpen, setCreateOpen] = useState(false);
    const [bomOpen, setBomOpen] = useState(false);

    const selected = menus.find((m) => m.id === selectedId) ?? menus[0] ?? null;

    function handleCreate(data: {
        name: string;
        category: Category;
        price: number;
        overhead: number;
    }) {
        router.post(
            '/menu',
            {
                name: data.name,
                category: data.category,
                selling_price: data.price,
                overhead: data.overhead,
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
        <>
            <Head title="Menu & Resep" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <Reveal>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <PageHeader
                            title="Menu & Resep"
                            description="Kelola menu jual dan susun BOM (resep) agar stok dan HPP terhitung otomatis."
                        />
                        <FxButton
                            variant="coral"
                            onClick={() => setCreateOpen(true)}
                        >
                            <Plus className="size-4" />
                            Tambah menu
                        </FxButton>
                    </div>
                </Reveal>

                {selected === null ? (
                    <FxSoft className="flex flex-col items-center gap-3 p-10 text-center">
                        <p className="text-sm text-muted-foreground">
                            Belum ada menu. Tambahkan menu pertama.
                        </p>
                        <FxButton
                            variant="coral"
                            onClick={() => setCreateOpen(true)}
                        >
                            <Plus className="size-4" />
                            Tambah menu
                        </FxButton>
                    </FxSoft>
                ) : (
                    <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.35fr]">
                        <Reveal delay={0.05}>
                            <FxCard className="flex flex-col gap-3 p-5">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base font-semibold">
                                        Daftar menu
                                    </h2>
                                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                                        {menus.length} menu
                                    </span>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {menus.map((m) => {
                                        const Icon = categoryIcon[m.category];
                                        const active = m.id === selected.id;
                                        return (
                                            <button
                                                key={m.id}
                                                onClick={() =>
                                                    setSelectedId(m.id)
                                                }
                                                className={`flex items-center gap-3 rounded-2xl p-3 text-left transition-all duration-200 ${
                                                    active
                                                        ? 'fx-coral shadow-[0_10px_24px_rgba(236,88,42,0.22)]'
                                                        : 'fx-soft hover:bg-hover-soft'
                                                }`}
                                            >
                                                <IconCircle
                                                    icon={Icon}
                                                    tone={
                                                        active
                                                            ? 'white'
                                                            : 'coral'
                                                    }
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-semibold">
                                                        {m.name}
                                                    </p>
                                                    <p
                                                        className={`text-xs ${active ? 'text-white/70' : 'text-muted-foreground'}`}
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
                                                <div className="text-right">
                                                    <p className="text-sm font-bold tabular-nums">
                                                        {formatPercent(
                                                            m.margin_pct,
                                                            1,
                                                        )}
                                                    </p>
                                                    <p
                                                        className={`text-[11px] ${active ? 'text-white/70' : 'text-muted-foreground'}`}
                                                    >
                                                        margin
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </FxCard>
                        </Reveal>

                        <Reveal delay={0.1}>
                            <FxCard className="flex flex-col gap-4 p-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <IconCircle
                                            icon={
                                                categoryIcon[selected.category]
                                            }
                                            tone="coral"
                                            size="lg"
                                        />
                                        <div>
                                            <h2 className="text-base font-semibold">
                                                {selected.name}
                                            </h2>
                                            <p className="text-xs text-muted-foreground">
                                                {selected.category} · harga jual{' '}
                                                {formatRupiah(
                                                    selected.selling_price,
                                                )}{' '}
                                                · yield{' '}
                                                {selected.yield_portions} porsi
                                                · sisa{' '}
                                                {selected.portions_available}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={selected.status} />
                                        <FxButton
                                            variant="soft"
                                            onClick={() => setBomOpen(true)}
                                        >
                                            <Pencil className="size-4" />
                                            Susun BOM
                                        </FxButton>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3">
                                    <FxSoft className="flex flex-col gap-3 p-4">
                                        <p className="text-xs text-muted-foreground">
                                            HPP aktual
                                        </p>
                                        <p className="text-lg font-bold tabular-nums">
                                            {formatRupiah(selected.current_hpp)}
                                        </p>
                                    </FxSoft>
                                    <FxSoft className="flex flex-col gap-3 p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Margin aktual
                                        </p>
                                        <p className="text-lg font-bold tabular-nums">
                                            {formatPercent(selected.margin_pct)}
                                        </p>
                                    </FxSoft>
                                    <FxSoft className="flex flex-col gap-3 p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Kontribusi bahan
                                        </p>
                                        <p className="text-lg font-bold tabular-nums">
                                            {formatRupiah(selected.subtotal)}
                                        </p>
                                    </FxSoft>
                                </div>

                                {selected.bom.length === 0 ? (
                                    <FxSoft className="flex flex-col items-center gap-2 p-8 text-center">
                                        <p className="text-sm text-muted-foreground">
                                            Menu ini belum punya resep. Susun
                                            BOM agar bisa dijual di POS.
                                        </p>
                                        <FxButton
                                            variant="coral"
                                            onClick={() => setBomOpen(true)}
                                        >
                                            <Plus className="size-4" />
                                            Susun BOM sekarang
                                        </FxButton>
                                    </FxSoft>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
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
                                                                {
                                                                    r.ingredient_name
                                                                }
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatRupiah(
                                                                    r.cost_per_unit,
                                                                )}
                                                                /
                                                                {
                                                                    unitShort[
                                                                        r
                                                                            .base_unit
                                                                    ]
                                                                }
                                                            </p>
                                                        </td>
                                                        <td className="px-3 py-3 text-right tabular-nums">
                                                            {fmtQty(
                                                                r.quantity_needed,
                                                            )}{' '}
                                                            {
                                                                unitShort[
                                                                    r.base_unit
                                                                ]
                                                            }
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
                                                            {
                                                                unitShort[
                                                                    r.base_unit
                                                                ]
                                                            }
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
                                                        Overhead standar per
                                                        porsi
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
                                    <FxSoft className="flex flex-wrap items-center justify-between gap-3 p-4">
                                        <span className="inline-flex items-center gap-2 text-sm">
                                            <IconCircle
                                                icon={Sparkles}
                                                tone="warning"
                                                size="sm"
                                            />
                                            <span>
                                                HPP proyeksi{' '}
                                                <span className="font-bold tabular-nums">
                                                    {formatRupiah(
                                                        selected.projected_hpp!,
                                                    )}
                                                </span>{' '}
                                                dari harga penawaran terbaru
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
            </div>

            <CreateMenuModal
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSubmit={handleCreate}
            />

            {bomOpen && selected ? (
                <BomModal
                    key={selected.id}
                    menu={selected}
                    ingredients={ingredients}
                    onClose={() => setBomOpen(false)}
                    onSave={(items) => handleSaveBom(selected.id, items)}
                />
            ) : null}
        </>
    );
}

function CreateMenuModal({
    open,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: {
        name: string;
        category: Category;
        price: number;
        overhead: number;
    }) => void;
}) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState<Category>('Kopi');
    const [price, setPrice] = useState('15000');
    const [overhead, setOverhead] = useState('1500');

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
                    <FxInput
                        type="number"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
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
