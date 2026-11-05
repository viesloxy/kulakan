import { Head } from '@inertiajs/react';
import { Coffee, CupSoda, Plus, Sandwich, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';
import PageHeader from '@/components/page-header';
import StatusBadge from '@/components/status-badge';
import { formatPercent, formatRupiah } from '@/lib/format';
import {
    bomCost,
    ingredientById,
    marginPct,
    menuHpp,
    menuStatus,
    menus,
    type Menu,
} from '@/lib/mock-data';

const categoryIcon = { Kopi: Coffee, 'Non-Kopi': CupSoda, Makanan: Sandwich };

export default function Menus() {
    const [selectedId, setSelectedId] = useState(menus[0].id);
    const selected: Menu = menus.find((m) => m.id === selectedId)!;

    const bomRows = selected.bom.map((b) => {
        const ing = ingredientById(b.ingredientId);
        const effective = b.qty * (1 + b.wastePct / 100);
        return { ...b, ing, effective, cost: effective * ing.costPerUnit };
    });
    const subtotal = bomCost(selected);
    const hpp = menuHpp(selected);
    const projectedHpp = menuHpp(selected, true);
    const hasProjection = Math.round(projectedHpp) !== Math.round(hpp);

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
                        <FxButton variant="coral">
                            <Plus className="size-4" />
                            Tambah menu
                        </FxButton>
                    </div>
                </Reveal>

                <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.35fr]">
                    <Reveal delay={0.05}>
                        <FxCard className="flex flex-col gap-3 p-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-semibold">Daftar menu</h2>
                                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                                    {menus.length} menu
                                </span>
                            </div>

                            <div className="flex flex-col gap-2">
                                {menus.map((m) => {
                                    const Icon = categoryIcon[m.category];
                                    const hppM = menuHpp(m);
                                    const margin = marginPct(m);
                                    const active = m.id === selectedId;
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => setSelectedId(m.id)}
                                            className={`flex items-center gap-3 rounded-2xl p-3 text-left transition-colors ${
                                                active ? 'bg-[#1C1B18] text-white' : 'fx-soft hover:bg-[#EBEBE8]'
                                            }`}
                                        >
                                            <IconCircle icon={Icon} tone={active ? 'white' : 'coral'} />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold">{m.name}</p>
                                                <p className={`text-xs ${active ? 'text-white/70' : 'text-muted-foreground'}`}>
                                                    HPP {formatRupiah(hppM)} · {formatRupiah(m.price)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold tabular-nums">{formatPercent(margin, 1)}</p>
                                                <p className={`text-[11px] ${active ? 'text-white/70' : 'text-muted-foreground'}`}>
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
                                    <IconCircle icon={categoryIcon[selected.category]} tone="coral" size="lg" />
                                    <div>
                                        <h2 className="text-base font-semibold">{selected.name}</h2>
                                        <p className="text-xs text-muted-foreground">
                                            {selected.category} · harga jual {formatRupiah(selected.price)} · yield 1 porsi
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge status={menuStatus(selected)} />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <FxSoft className="p-4">
                                    <p className="text-xs text-muted-foreground">HPP aktual</p>
                                    <p className="mt-1 text-lg font-bold tabular-nums">{formatRupiah(hpp)}</p>
                                </FxSoft>
                                <FxSoft className="p-4">
                                    <p className="text-xs text-muted-foreground">Margin aktual</p>
                                    <p className="mt-1 text-lg font-bold tabular-nums">{formatPercent(marginPct(selected))}</p>
                                </FxSoft>
                                <FxSoft className="p-4">
                                    <p className="text-xs text-muted-foreground">Kontribusi bahan</p>
                                    <p className="mt-1 text-lg font-bold tabular-nums">{formatRupiah(subtotal)}</p>
                                </FxSoft>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-secondary text-left text-xs text-muted-foreground">
                                            <th className="rounded-l-xl px-3 py-2.5 font-medium">Bahan</th>
                                            <th className="px-3 py-2.5 text-right font-medium">Qty/porsi</th>
                                            <th className="px-3 py-2.5 text-right font-medium">Waste</th>
                                            <th className="px-3 py-2.5 text-right font-medium">Qty efektif</th>
                                            <th className="rounded-r-xl px-3 py-2.5 text-right font-medium">Biaya</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bomRows.map((r) => (
                                            <tr key={r.ingredientId} className="border-b border-border/60 last:border-0">
                                                <td className="px-3 py-3">
                                                    <p className="font-medium">{r.ing.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatRupiah(r.ing.costPerUnit)}/{r.ing.unit}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    {r.qty} {r.ing.unit}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">{formatPercent(r.wastePct, 0)}</td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(r.effective)}{' '}
                                                    {r.ing.unit}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">{formatRupiah(r.cost)}</td>
                                            </tr>
                                        ))}
                                        <tr className="border-b border-border/60">
                                            <td className="px-3 py-3 text-muted-foreground" colSpan={4}>
                                                Subtotal bahan
                                            </td>
                                            <td className="px-3 py-3 text-right tabular-nums">{formatRupiah(subtotal)}</td>
                                        </tr>
                                        <tr className="border-b border-border/60">
                                            <td className="px-3 py-3 text-muted-foreground" colSpan={4}>
                                                Overhead standar per porsi
                                            </td>
                                            <td className="px-3 py-3 text-right tabular-nums">{formatRupiah(selected.overhead)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-3 font-semibold" colSpan={4}>
                                                HPP
                                            </td>
                                            <td className="px-3 py-3 text-right font-bold tabular-nums">{formatRupiah(hpp)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {hasProjection ? (
                                <FxSoft className="flex flex-wrap items-center justify-between gap-3 p-4">
                                    <span className="inline-flex items-center gap-2 text-sm">
                                        <IconCircle icon={Sparkles} tone="warning" size="sm" />
                                        <span>
                                            HPP proyeksi <span className="font-bold tabular-nums">{formatRupiah(projectedHpp)}</span> dari
                                            harga penawaran terbaru
                                        </span>
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <span className="rounded-full bg-[#FEF3D6] px-2.5 py-1 text-xs font-semibold text-[#9A6B00]">
                                            {formatPercent(marginPct(selected, true))}
                                        </span>
                                        <StatusBadge status={menuStatus(selected, true)} />
                                    </span>
                                </FxSoft>
                            ) : null}
                        </FxCard>
                    </Reveal>
                </div>
            </div>
        </>
    );
}