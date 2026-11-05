import { Head } from '@inertiajs/react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import Reveal from '@/components/motion/reveal';
import PageHeader from '@/components/page-header';
import { formatRupiah } from '@/lib/format';

type Menu = {
    id: number;
    name: string;
    category: string;
    price: number;
    stockLeft: number;
};

// Mock data: stockLeft = perkiraan porsi tersedia dari stok bahan / BOM.
const menus: Menu[] = [
    { id: 1, name: 'Es Kopi Susu Aren', category: 'Kopi', price: 22000, stockLeft: 8 },
    { id: 2, name: 'Kopi Hitam', category: 'Kopi', price: 15000, stockLeft: 14 },
    { id: 3, name: 'Hazelnut Latte', category: 'Kopi', price: 25000, stockLeft: 3 },
    { id: 4, name: 'Matcha Latte', category: 'Non-Kopi', price: 26000, stockLeft: 6 },
    { id: 5, name: 'Cokelat Panas', category: 'Non-Kopi', price: 20000, stockLeft: 5 },
    { id: 6, name: 'Roti Bakar Keju', category: 'Makanan', price: 18000, stockLeft: 9 },
];

export default function Pos() {
    const [cart, setCart] = useState<Record<number, number>>({});
    const [payment, setPayment] = useState<'cash' | 'qris'>('cash');

    const items = useMemo(
        () =>
            Object.entries(cart)
                .map(([id, qty]) => ({ menu: menus.find((m) => m.id === Number(id))!, qty }))
                .filter((x) => x.qty > 0),
        [cart],
    );

    const total = items.reduce((sum, x) => sum + x.menu.price * x.qty, 0);

    function add(menu: Menu) {
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
        const insufficient = items.find((x) => x.qty > x.menu.stockLeft);
        if (insufficient) {
            toast.error(`${insufficient.menu.name} kurang ${insufficient.qty - insufficient.menu.stockLeft} porsi`, {
                description: 'Stok bahan tidak mencukupi. Pesanan tidak disimpan.',
            });
            return;
        }
        toast.success('Pesanan tersimpan', {
            description: `${items.length} item, total ${formatRupiah(total)}. Stok bahan terpotong otomatis.`,
        });
        setCart({});
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
                                const low = m.stockLeft <= 3;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => add(m)}
                                        className="fx-card flex flex-col gap-2 p-4 text-left transition-transform duration-200 hover:-translate-y-1"
                                    >
                                        <div className="flex w-full items-center justify-between">
                                            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                                {m.category}
                                            </span>
                                            <span
                                                className={`text-[11px] font-semibold ${
                                                    low ? 'text-[#D93829]' : 'text-[#1D9E53]'
                                                }`}
                                            >
                                                Sisa {m.stockLeft}
                                            </span>
                                        </div>
                                        <span className="mt-1 font-semibold">{m.name}</span>
                                        <span className="mt-1 text-sm font-bold tabular-nums">{formatRupiah(m.price)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </Reveal>

                    <Reveal delay={0.1}>
                        <aside className="fx-card sticky top-4 flex flex-col gap-4 p-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-semibold">Pesanan</h2>
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
                                        <div key={menu.id} className="flex items-center gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{menu.name}</p>
                                                <p className="text-xs text-muted-foreground tabular-nums">
                                                    {formatRupiah(menu.price)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 rounded-full bg-secondary p-1">
                                                <button
                                                    onClick={() => setQty(menu.id, qty - 1)}
                                                    className="flex size-6 items-center justify-center rounded-full bg-card transition-colors hover:bg-[#EBEBE8]"
                                                    aria-label="Kurangi"
                                                >
                                                    <Minus className="size-3.5" />
                                                </button>
                                                <span className="w-5 text-center text-sm font-semibold tabular-nums">{qty}</span>
                                                <button
                                                    onClick={() => setQty(menu.id, qty + 1)}
                                                    className="flex size-6 items-center justify-center rounded-full bg-card transition-colors hover:bg-[#EBEBE8]"
                                                    aria-label="Tambah"
                                                >
                                                    <Plus className="size-3.5" />
                                                </button>
                                            </div>
                                            <span className="w-20 text-right text-sm font-semibold tabular-nums">
                                                {formatRupiah(menu.price * qty)}
                                            </span>
                                            <button
                                                onClick={() => setQty(menu.id, 0)}
                                                className="text-muted-foreground transition-colors hover:text-[#D93829]"
                                                aria-label="Hapus"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="fx-soft flex items-center justify-between p-4">
                                <span className="text-sm text-muted-foreground">Total</span>
                                <span className="text-xl font-bold tabular-nums">{formatRupiah(total)}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {(['cash', 'qris'] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPayment(p)}
                                        className={`h-10 rounded-full text-sm font-semibold transition-colors ${
                                            payment === p
                                                ? 'bg-[#1C1B18] text-white'
                                                : 'bg-secondary text-foreground hover:bg-[#EBEBE8]'
                                        }`}
                                    >
                                        {p === 'cash' ? 'Tunai' : 'QRIS'}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={submit}
                                className="inline-flex h-12 items-center justify-center rounded-full bg-[#EC582A] text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                            >
                                Simpan pesanan
                            </button>
                        </aside>
                    </Reveal>
                </div>
            </div>
        </>
    );
}