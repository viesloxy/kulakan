import { Head, router } from '@inertiajs/react';
import { Coffee, CupSoda, Minus, Plus, Sandwich, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';
import PageHeader from '@/components/page-header';
import { formatRupiah } from '@/lib/format';

type Category = 'Kopi' | 'Non-Kopi' | 'Makanan';

type PosMenu = {
    id: number;
    name: string;
    category: Category;
    selling_price: number | string;
    portions_available: number;
};

type Props = { menus: PosMenu[] };

const categoryIcon = { Kopi: Coffee, 'Non-Kopi': CupSoda, Makanan: Sandwich };

export default function Pos({ menus }: Props) {
    const [cart, setCart] = useState<Record<number, number>>({});
    const [payment, setPayment] = useState<'cash' | 'qris'>('cash');
    // Idempotency key (FR-016): dibuat saat submit, dipakai ulang bila retry, dibersihkan saat sukses.
    const idempotencyKey = useRef<string | null>(null);

    const items = useMemo(
        () =>
            Object.entries(cart)
                .map(([id, qty]) => ({
                    menu: menus.find((m) => m.id === Number(id))!,
                    qty,
                }))
                .filter((x) => x.menu && x.qty > 0),
        [cart, menus],
    );

    const total = items.reduce(
        (sum, x) => sum + Number(x.menu.selling_price) * x.qty,
        0,
    );

    function add(menu: PosMenu) {
        setCart((c) => ({ ...c, [menu.id]: (c[menu.id] ?? 0) + 1 }));
    }

    function setQty(id: number, qty: number) {
        setCart((c) => {
            const next = { ...c };
            if (qty <= 0) {
                delete next[id];
            } else {
                next[id] = qty;
            }
            return next;
        });
    }

    function submit() {
        if (items.length === 0) {
            toast.error('Belum ada item di pesanan.');
            return;
        }

        if (idempotencyKey.current === null) {
            idempotencyKey.current = (
                globalThis.crypto?.randomUUID?.() ??
                `ord-${Date.now()}-${Math.random().toString(36).slice(2)}`
            ).slice(0, 64);
        }

        router.post(
            '/pos',
            {
                lines: items.map(({ menu, qty }) => ({
                    menu_id: menu.id,
                    quantity: qty,
                })),
                payment_method: payment,
                idempotency_key: idempotencyKey.current,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    idempotencyKey.current = null;
                    setCart({});
                    toast.success('Pesanan tersimpan', {
                        description: `${items.length} item, total ${formatRupiah(total)}. Stok bahan terpotong otomatis.`,
                    });
                },
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ?? 'Gagal menyimpan pesanan.',
                    ),
            },
        );
    }

    return (
        <>
            <Head title="POS Kasir" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <Reveal>
                    <PageHeader
                        title="POS Kasir"
                        description="Pilih menu, catat pesanan, stok bahan terpotong otomatis sesuai resep."
                    />
                </Reveal>

                <div className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
                    <Reveal delay={0.05}>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {menus.map((m) => {
                                const Icon = categoryIcon[m.category];
                                const low = m.portions_available <= 3;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => add(m)}
                                        className="flex flex-col gap-3 fx-card p-4 text-left transition-colors duration-200 hover:bg-hover-soft"
                                    >
                                        <div className="flex items-center justify-between">
                                            <IconCircle
                                                icon={Icon}
                                                tone="soft"
                                            />
                                            <span
                                                className={`text-[11px] font-semibold ${low ? 'text-danger' : 'text-success'}`}
                                            >
                                                Sisa {m.portions_available}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-semibold">
                                                {m.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {m.category}
                                            </p>
                                        </div>
                                        <p className="mt-auto text-sm font-bold tabular-nums">
                                            {formatRupiah(m.selling_price)}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </Reveal>

                    <Reveal delay={0.1}>
                        <FxCard className="sticky top-4 flex flex-col gap-4 p-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-semibold">
                                    Pesanan
                                </h2>
                                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
                                    {items.reduce((n, x) => n + x.qty, 0)} item
                                </span>
                            </div>

                            {items.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    Belum ada item. Klik menu untuk menambah.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {items.map(({ menu, qty }) => (
                                        <div
                                            key={menu.id}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {menu.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground tabular-nums">
                                                    {formatRupiah(
                                                        menu.selling_price,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 rounded-full bg-secondary p-1">
                                                <button
                                                    onClick={() =>
                                                        setQty(menu.id, qty - 1)
                                                    }
                                                    className="flex size-6 items-center justify-center rounded-full bg-card transition-colors hover:bg-hover-soft"
                                                    aria-label="Kurangi"
                                                >
                                                    <Minus className="size-3.5" />
                                                </button>
                                                <span className="w-5 text-center text-sm font-semibold tabular-nums">
                                                    {qty}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        setQty(menu.id, qty + 1)
                                                    }
                                                    className="flex size-6 items-center justify-center rounded-full bg-card transition-colors hover:bg-hover-soft"
                                                    aria-label="Tambah"
                                                >
                                                    <Plus className="size-3.5" />
                                                </button>
                                            </div>
                                            <span className="w-20 text-right text-sm font-semibold tabular-nums">
                                                {formatRupiah(
                                                    Number(menu.selling_price) *
                                                        qty,
                                                )}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    setQty(menu.id, 0)
                                                }
                                                className="text-muted-foreground transition-colors hover:text-danger"
                                                aria-label="Hapus"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <FxSoft className="flex items-center justify-between p-4">
                                <span className="text-sm text-muted-foreground">
                                    Total
                                </span>
                                <span className="text-xl font-bold tabular-nums">
                                    {formatRupiah(total)}
                                </span>
                            </FxSoft>

                            <div className="grid grid-cols-2 gap-2">
                                {(['cash', 'qris'] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPayment(p)}
                                        className={`h-10 rounded-full text-sm font-semibold transition-all duration-200 ${
                                            payment === p
                                                ? 'fx-coral'
                                                : 'bg-secondary text-foreground hover:bg-hover-soft'
                                        }`}
                                    >
                                        {p === 'cash' ? 'Tunai' : 'QRIS'}
                                    </button>
                                ))}
                            </div>

                            <FxButton
                                variant="coral"
                                size="lg"
                                onClick={submit}
                                className="w-full"
                            >
                                Simpan pesanan
                            </FxButton>
                        </FxCard>
                    </Reveal>
                </div>
            </div>
        </>
    );
}
