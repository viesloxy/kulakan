import { Head } from '@inertiajs/react';
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
import StatusBadge from '@/components/status-badge';
import { formatPercent, formatRupiah } from '@/lib/format';
import {
    bomCost,
    ingredientById,
    ingredients,
    marginPct,
    menuHpp,
    menuStatus,
    menus as seedMenus,
    type BomItem,
    type Menu,
} from '@/lib/mock-data';

const categoryIcon = { Kopi: Coffee, 'Non-Kopi': CupSoda, Makanan: Sandwich };
const categories = ['Kopi', 'Non-Kopi', 'Makanan'] as const;

export default function Menus() {
    const [list, setList] = useState<Menu[]>(seedMenus);
    const [selectedId, setSelectedId] = useState(seedMenus[0].id);

    const [createOpen, setCreateOpen] = useState(false);
    const [bomOpen, setBomOpen] = useState(false);

    const selected: Menu = list.find((m) => m.id === selectedId) ?? list[0];

    const bomRows = selected.bom.map((b) => {
        const ing = ingredientById(b.ingredientId);
        const effective = b.qty * (1 + b.wastePct / 100);
        return { ...b, ing, effective, cost: effective * ing.costPerUnit };
    });
    const subtotal = bomCost(selected);
    const hpp = menuHpp(selected);
    const projectedHpp = menuHpp(selected, true);
    const hasProjection = Math.round(projectedHpp) !== Math.round(hpp);

    function handleCreate(data: {
        name: string;
        category: Menu['category'];
        price: number;
        overhead: number;
    }) {
        const id = Math.max(0, ...list.map((m) => m.id)) + 1;
        const next: Menu = {
            id,
            name: data.name,
            category: data.category,
            price: data.price,
            overhead: data.overhead,
            active: true,
            portionsLeft: 0,
            bom: [],
        };
        setList((l) => [...l, next]);
        setSelectedId(id);
        toast.success('Menu ditambahkan', {
            description: `${data.name} dibuat. Susun BOM agar bisa dijual di POS.`,
        });
    }

    function handleSaveBom(
        menuId: number,
        bom: BomItem[],
        yieldPortions: number,
    ) {
        setList((l) => l.map((m) => (m.id === menuId ? { ...m, bom } : m)));
        toast.success('Resep disimpan', {
            description: `BOM diperbarui (${bom.length} bahan, yield ${yieldPortions} porsi). HPP dihitung ulang otomatis.`,
        });
    }

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

                <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.35fr]">
                    <Reveal delay={0.05}>
                        <FxCard className="flex flex-col gap-3 p-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-semibold">
                                    Daftar menu
                                </h2>
                                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                                    {list.length} menu
                                </span>
                            </div>

                            <div className="flex flex-col gap-2">
                                {list.map((m) => {
                                    const Icon = categoryIcon[m.category];
                                    const hppM = menuHpp(m);
                                    const margin = marginPct(m);
                                    const active = m.id === selectedId;
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => setSelectedId(m.id)}
                                            className={`flex items-center gap-3 rounded-2xl p-3 text-left transition-colors ${
                                                active
                                                    ? 'bg-[#1C1B18] text-white'
                                                    : 'fx-soft hover:bg-[#EBEBE8]'
                                            }`}
                                        >
                                            <IconCircle
                                                icon={Icon}
                                                tone={
                                                    active ? 'white' : 'coral'
                                                }
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold">
                                                    {m.name}
                                                </p>
                                                <p
                                                    className={`text-xs ${active ? 'text-white/70' : 'text-muted-foreground'}`}
                                                >
                                                    HPP {formatRupiah(hppM)} ·{' '}
                                                    {formatRupiah(m.price)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold tabular-nums">
                                                    {formatPercent(margin, 1)}
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
                                        icon={categoryIcon[selected.category]}
                                        tone="coral"
                                        size="lg"
                                    />
                                    <div>
                                        <h2 className="text-base font-semibold">
                                            {selected.name}
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            {selected.category} · harga jual{' '}
                                            {formatRupiah(selected.price)} ·
                                            yield 1 porsi
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge
                                        status={menuStatus(selected)}
                                    />
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
                                <FxSoft className="p-4">
                                    <p className="text-xs text-muted-foreground">
                                        HPP aktual
                                    </p>
                                    <p className="mt-1 text-lg font-bold tabular-nums">
                                        {formatRupiah(hpp)}
                                    </p>
                                </FxSoft>
                                <FxSoft className="p-4">
                                    <p className="text-xs text-muted-foreground">
                                        Margin aktual
                                    </p>
                                    <p className="mt-1 text-lg font-bold tabular-nums">
                                        {formatPercent(marginPct(selected))}
                                    </p>
                                </FxSoft>
                                <FxSoft className="p-4">
                                    <p className="text-xs text-muted-foreground">
                                        Kontribusi bahan
                                    </p>
                                    <p className="mt-1 text-lg font-bold tabular-nums">
                                        {formatRupiah(subtotal)}
                                    </p>
                                </FxSoft>
                            </div>

                            {bomRows.length === 0 ? (
                                <FxSoft className="flex flex-col items-center gap-2 p-8 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        Menu ini belum punya resep. Susun BOM
                                        agar bisa dijual di POS.
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
                                            {bomRows.map((r) => (
                                                <tr
                                                    key={r.ingredientId}
                                                    className="border-b border-border/60 last:border-0"
                                                >
                                                    <td className="px-3 py-3">
                                                        <p className="font-medium">
                                                            {r.ing.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatRupiah(
                                                                r.ing
                                                                    .costPerUnit,
                                                            )}
                                                            /{r.ing.unit}
                                                        </p>
                                                    </td>
                                                    <td className="px-3 py-3 text-right tabular-nums">
                                                        {r.qty} {r.ing.unit}
                                                    </td>
                                                    <td className="px-3 py-3 text-right tabular-nums">
                                                        {formatPercent(
                                                            r.wastePct,
                                                            0,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-right tabular-nums">
                                                        {new Intl.NumberFormat(
                                                            'id-ID',
                                                            {
                                                                maximumFractionDigits: 1,
                                                            },
                                                        ).format(
                                                            r.effective,
                                                        )}{' '}
                                                        {r.ing.unit}
                                                    </td>
                                                    <td className="px-3 py-3 text-right tabular-nums">
                                                        {formatRupiah(r.cost)}
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
                                                    {formatRupiah(subtotal)}
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
                                                    {formatRupiah(hpp)}
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
                                                {formatRupiah(projectedHpp)}
                                            </span>{' '}
                                            dari harga penawaran terbaru
                                        </span>
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <span className="rounded-full bg-[#FEF3D6] px-2.5 py-1 text-xs font-semibold text-[#9A6B00]">
                                            {formatPercent(
                                                marginPct(selected, true),
                                            )}
                                        </span>
                                        <StatusBadge
                                            status={menuStatus(selected, true)}
                                        />
                                    </span>
                                </FxSoft>
                            ) : null}
                        </FxCard>
                    </Reveal>
                </div>
            </div>

            <CreateMenuModal
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSubmit={handleCreate}
            />

            {bomOpen ? (
                <BomModal
                    key={selected.id}
                    menu={selected}
                    onClose={() => setBomOpen(false)}
                    onSave={(bom, yieldPortions) => {
                        handleSaveBom(selected.id, bom, yieldPortions);
                        setBomOpen(false);
                    }}
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
        category: Menu['category'];
        price: number;
        overhead: number;
    }) => void;
}) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState<Menu['category']>('Kopi');
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
        onOpenChange(false);
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
                            setCategory(e.target.value as Menu['category'])
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

type DraftRow = { ingredientId: number; qty: string; waste: string };

function BomModal({
    menu,
    onClose,
    onSave,
}: {
    menu: Menu;
    onClose: () => void;
    onSave: (bom: BomItem[], yieldPortions: number) => void;
}) {
    const [rows, setRows] = useState<DraftRow[]>(
        menu.bom.length > 0
            ? menu.bom.map((b) => ({
                  ingredientId: b.ingredientId,
                  qty: String(b.qty),
                  waste: String(b.wastePct),
              }))
            : [{ ingredientId: ingredients[0].id, qty: '1', waste: '0' }],
    );

    const used = rows.map((r) => r.ingredientId);
    const previewCost = rows.reduce((sum, r) => {
        const ing = ingredientById(r.ingredientId);
        return (
            sum +
            Number(r.qty || 0) *
                (1 + Number(r.waste || 0) / 100) *
                ing.costPerUnit
        );
    }, 0);

    function addRow() {
        const free =
            ingredients.find((i) => !used.includes(i.id)) ?? ingredients[0];
        setRows((r) => [...r, { ingredientId: free.id, qty: '1', waste: '0' }]);
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
        const ids = rows.map((r) => r.ingredientId);
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
        if (rows.some((r) => Number(r.waste) < 0 || Number(r.waste) > 50)) {
            toast.error('Waste factor harus antara 0% dan 50%.');
            return;
        }
        onSave(
            rows.map((r) => ({
                ingredientId: r.ingredientId,
                qty: Number(r.qty),
                wastePct: Number(r.waste),
            })),
            1,
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
                    const ing = ingredientById(row.ingredientId);
                    return (
                        <div
                            key={index}
                            className="grid grid-cols-12 items-end gap-2"
                        >
                            <div className="col-span-6">
                                <FxField label="Bahan">
                                    <FxSelect
                                        value={row.ingredientId}
                                        onChange={(e) =>
                                            updateRow(index, {
                                                ingredientId: Number(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                    >
                                        {ingredients.map((opt) => (
                                            <option key={opt.id} value={opt.id}>
                                                {opt.name} ({opt.unit})
                                            </option>
                                        ))}
                                    </FxSelect>
                                </FxField>
                            </div>
                            <div className="col-span-3">
                                <FxField label={`Qty (${ing.unit})`}>
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
                            <div className="col-span-1 pb-1">
                                <button
                                    type="button"
                                    onClick={() => removeRow(index)}
                                    disabled={rows.length === 1}
                                    className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-muted-foreground transition-colors hover:text-[#D93829] disabled:opacity-40"
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
                    className="flex items-center gap-2 self-start rounded-full bg-secondary px-4 py-2 text-sm font-semibold transition-colors hover:bg-[#EBEBE8]"
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
