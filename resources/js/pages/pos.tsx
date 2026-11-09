import { router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Coffee,
    CupSoda,
    Minus,
    Plus,
    ReceiptText,
    Sandwich,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';
import PageShell from '@/components/page-shell';
import { formatRupiah } from '@/lib/format';
import {
    POS_CART_STORAGE_KEY,
    type PosCartItem,
    type PosStoredSession,
} from '@/pages/pos-checkout';

type Category = 'Kopi' | 'Non-Kopi' | 'Makanan';
type OrderType = 'dine-in' | 'takeaway' | 'delivery';

type PosMenu = {
    id: number;
    name: string;
    category: Category;
    image_url: string | null;
    selling_price: number | string;
    portions_available: number;
};

type Props = {
    menus: PosMenu[];
    active_queue_count?: number;
    merchant_qris?: {
        merchant_name: string;
        merchant_city: string;
        nmid?: string;
        static_payload: string;
    };
};

const categoryIcon = { Kopi: Coffee, 'Non-Kopi': CupSoda, Makanan: Sandwich };
const categories: Category[] = ['Kopi', 'Non-Kopi', 'Makanan'];

export default function Pos({ menus, active_queue_count = 0 }: Props) {
    const pageProps = usePage<{
        flash?: {
            created_order?: unknown;
            success?: string;
        };
    }>().props;

    const [cart, setCart] = useState<Record<number, number>>({});
    const [payment, setPayment] = useState<'cash' | 'qris'>('cash');
    const [orderType, setOrderType] = useState<OrderType>('dine-in');
    const [customerName, setCustomerName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'Semua' | Category>(
        'Semua',
    );
    const [inStockOnly, setInStockOnly] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Pulihkan keranjang dari sessionStorage saat komponen dimuat (misal setelah klik Kembali dari Checkout),
    // atau reset keranjang jika baru saja menyelesaikan Konfirmasi Bayar (flash.created_order).
    useEffect(() => {
        try {
            if (pageProps.flash?.created_order) {
                sessionStorage.removeItem(POS_CART_STORAGE_KEY);
                setCart({});
                setCustomerName('');
                setIsLoaded(true);
                return;
            }

            const raw = sessionStorage.getItem(POS_CART_STORAGE_KEY);
            if (raw) {
                const parsed: PosStoredSession = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    if (parsed.cart) setCart(parsed.cart);
                    if (parsed.orderType) setOrderType(parsed.orderType);
                    if (typeof parsed.customerName === 'string') {
                        setCustomerName(parsed.customerName);
                    }
                    if (parsed.paymentMethod) setPayment(parsed.paymentMethod);
                }
            } else {
                setCart({});
                setCustomerName('');
            }
        } catch {
            // Abaikan kesalahan parsing
        } finally {
            setIsLoaded(true);
        }
    }, [pageProps.flash?.created_order]);

    const filteredMenus = useMemo(() => {
        return menus.filter((m) => {
            const matchesCategory =
                categoryFilter === 'Semua' || m.category === categoryFilter;
            const matchesQuery =
                searchQuery.trim() === '' ||
                m.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
            const matchesStock = !inStockOnly || m.portions_available > 0;

            return matchesCategory && matchesQuery && matchesStock;
        });
    }, [menus, categoryFilter, searchQuery, inStockOnly]);

    const ITEMS_PER_PAGE = 9;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, categoryFilter, inStockOnly]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredMenus.length / ITEMS_PER_PAGE),
    );
    const validPage = Math.min(currentPage, totalPages);
    const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
    const paginatedMenus = useMemo(
        () => filteredMenus.slice(startIndex, startIndex + ITEMS_PER_PAGE),
        [filteredMenus, startIndex],
    );

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

    const totalItemsCount = useMemo(
        () => items.reduce((n, x) => n + x.qty, 0),
        [items],
    );

    const total = useMemo(
        () =>
            items.reduce(
                (sum, x) => sum + Number(x.menu.selling_price) * x.qty,
                0,
            ),
        [items],
    );

    // Sinkronisasi perubahan keranjang ke sessionStorage
    useEffect(() => {
        if (!isLoaded) return;
        try {
            if (Object.keys(cart).length === 0) {
                sessionStorage.removeItem(POS_CART_STORAGE_KEY);
            } else {
                const storedItems: PosCartItem[] = items.map(
                    ({ menu, qty }) => ({
                        menu_id: menu.id,
                        name: menu.name,
                        price: Number(menu.selling_price),
                        qty,
                        image_url: menu.image_url,
                        category: menu.category,
                    }),
                );

                const payload: PosStoredSession = {
                    cart,
                    items: storedItems,
                    orderType,
                    customerName,
                    paymentMethod: payment,
                };
                sessionStorage.setItem(
                    POS_CART_STORAGE_KEY,
                    JSON.stringify(payload),
                );
            }
        } catch {
            // Abaikan kesalahan storage
        }
    }, [cart, items, orderType, customerName, payment, isLoaded]);

    function add(menu: PosMenu) {
        if (menu.portions_available <= 0) {
            toast.warning(`Stok bahan untuk ${menu.name} habis.`);
            return;
        }

        const currentQty = cart[menu.id] ?? 0;
        if (currentQty >= menu.portions_available) {
            toast.warning(
                `Hanya tersisa ${menu.portions_available} porsi untuk ${menu.name}.`,
            );
            return;
        }

        setCart((c) => ({ ...c, [menu.id]: currentQty + 1 }));
    }

    function setQty(id: number, qty: number) {
        const menu = menus.find((m) => m.id === id);
        if (menu && qty > menu.portions_available) {
            toast.warning(
                `Maksimal ${menu.portions_available} porsi sesuai ketersediaan bahan.`,
            );
            return;
        }

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

    function clearCart() {
        setCart({});
        setCustomerName('');
        try {
            sessionStorage.removeItem(POS_CART_STORAGE_KEY);
        } catch {
            // Abaikan kesalahan storage
        }
    }

    function handleOpenCheckout() {
        if (items.length === 0) {
            toast.error('Belum ada item di pesanan.');
            return;
        }

        const storedItems: PosCartItem[] = items.map(({ menu, qty }) => ({
            menu_id: menu.id,
            name: menu.name,
            price: Number(menu.selling_price),
            qty,
            image_url: menu.image_url,
            category: menu.category,
        }));

        const payload: PosStoredSession = {
            cart,
            items: storedItems,
            orderType,
            customerName,
            paymentMethod: payment,
        };

        try {
            sessionStorage.setItem(
                POS_CART_STORAGE_KEY,
                JSON.stringify(payload),
            );
        } catch {
            // Abaikan kesalahan storage
        }

        router.visit('/pos/checkout');
    }

    return (
        <PageShell
            title="POS Kasir"
            description="Pilih menu, catat pesanan, stok bahan terpotong otomatis sesuai resep."
            actions={
                <FxButton
                    variant="soft"
                    size="sm"
                    className="gap-2 text-xs font-semibold"
                    onClick={() => router.visit('/pesanan')}
                >
                    <ReceiptText className="size-3.5 text-primary" />
                    <span>Riwayat Pesanan</span>
                    {active_queue_count > 0 ? (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                            <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
                            {active_queue_count} antrean
                        </span>
                    ) : null}
                </FxButton>
            }
        >
            <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
                {/* Kolom Kiri: Katalog Produk & Filter */}
                <div className="flex flex-col gap-4">
                    <Reveal delay={0.05}>
                        {/* Header Toolbar: Kategori Pills + Search & Filter Ketersediaan */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            {/* Kategori Pills */}
                            <div className="flex flex-wrap items-center gap-1.5">
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
                                                className={`h-8 rounded-full px-3.5 text-xs font-semibold transition-all duration-200 ${
                                                    active
                                                        ? 'fx-coral shadow-xs'
                                                        : 'bg-secondary text-foreground hover:bg-hover-soft'
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        );
                                    },
                                )}
                            </div>

                            {/* Search Bar & In-Stock Toggle */}
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-secondary/80 px-3 transition-colors focus-within:bg-secondary focus-within:ring-2 focus-within:ring-primary/20 sm:w-56 sm:flex-none">
                                    <Search className="size-3.5 shrink-0 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        placeholder="Cari menu..."
                                        className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                                    />
                                    {searchQuery ? (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                                            aria-label="Hapus pencarian"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    ) : null}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setInStockOnly((v) => !v)}
                                    className={`h-9 shrink-0 rounded-full px-3 text-xs font-semibold transition-all duration-200 ${
                                        inStockOnly
                                            ? 'bg-success-soft text-success ring-1 ring-success/30'
                                            : 'bg-secondary text-muted-foreground hover:bg-hover-soft hover:text-foreground'
                                    }`}
                                >
                                    Stok ada
                                </button>
                            </div>
                        </div>
                    </Reveal>

                    {/* Grid Kartu Produk */}
                    <Reveal delay={0.1}>
                        {filteredMenus.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 rounded-3xl bg-secondary/30 p-12 text-center text-muted-foreground">
                                <p className="text-sm font-medium">
                                    Menu tidak ditemukan
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Coba ubah kata kunci pencarian atau ganti
                                    kategori filter.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5">
                                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                                    {paginatedMenus.map((m) => {
                                        const inCartQty = cart[m.id] ?? 0;
                                        const isOutOfStock =
                                            m.portions_available <= 0;
                                        const Icon = categoryIcon[m.category];

                                        return (
                                            <FxCard
                                                key={m.id}
                                                className={`group flex h-full flex-col justify-between p-3.5 transition-all duration-200 ${
                                                    isOutOfStock
                                                        ? 'opacity-50'
                                                        : 'hover:shadow-md'
                                                }`}
                                            >
                                                {/* Bagian Atas: Kategori Badge & Ketersediaan Porsi */}
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="rounded-full bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                        {m.category}
                                                    </span>
                                                    <span
                                                        className={`text-[11px] font-semibold ${
                                                            isOutOfStock
                                                                ? 'text-danger'
                                                                : m.portions_available <=
                                                                    3
                                                                  ? 'text-amber-500'
                                                                  : 'text-muted-foreground'
                                                        }`}
                                                    >
                                                        {isOutOfStock
                                                            ? 'Habis'
                                                            : `${m.portions_available} porsi`}
                                                    </span>
                                                </div>

                                                {/* Foto Menu Produk */}
                                                <div
                                                    onClick={() =>
                                                        !isOutOfStock && add(m)
                                                    }
                                                    className="my-3 flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-secondary/35 transition-transform duration-300 group-hover:scale-[1.02]"
                                                >
                                                    {m.image_url ? (
                                                        <img
                                                            src={m.image_url}
                                                            alt={m.name}
                                                            className="size-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <IconCircle
                                                            icon={Icon}
                                                            tone="soft"
                                                            size="lg"
                                                        />
                                                    )}
                                                </div>

                                                {/* Bagian Bawah: Nama, Harga, & Stepper Kontrol Kuantitas */}
                                                <div className="mt-2.5 shrink-0">
                                                    <p
                                                        onClick={() =>
                                                            !isOutOfStock &&
                                                            add(m)
                                                        }
                                                        title={m.name}
                                                        className="cursor-pointer truncate font-semibold text-foreground transition-colors group-hover:text-primary"
                                                    >
                                                        {m.name}
                                                    </p>
                                                    <div className="mt-1 flex items-center justify-between gap-2">
                                                        <p className="min-w-0 truncate text-sm font-bold text-foreground tabular-nums">
                                                            {formatRupiah(
                                                                m.selling_price,
                                                            )}
                                                        </p>

                                                        {/* Stepper Kuantitas */}
                                                        {inCartQty > 0 ? (
                                                            <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-secondary p-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setQty(
                                                                            m.id,
                                                                            inCartQty -
                                                                                1,
                                                                        )
                                                                    }
                                                                    className="flex size-6 items-center justify-center rounded-full bg-card transition-colors hover:bg-hover-soft"
                                                                    aria-label="Kurangi"
                                                                >
                                                                    <Minus className="size-3" />
                                                                </button>
                                                                <span className="w-4 text-center text-xs font-bold tabular-nums">
                                                                    {inCartQty}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setQty(
                                                                            m.id,
                                                                            inCartQty +
                                                                                1,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        inCartQty >=
                                                                        m.portions_available
                                                                    }
                                                                    className="flex size-6 items-center justify-center rounded-full bg-card transition-colors hover:bg-hover-soft disabled:opacity-30"
                                                                    aria-label="Tambah"
                                                                >
                                                                    <Plus className="size-3" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    isOutOfStock
                                                                }
                                                                onClick={() =>
                                                                    add(m)
                                                                }
                                                                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground transition-all duration-200 hover:bg-primary hover:text-primary-foreground active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                                                                aria-label={`Tambah ${m.name}`}
                                                            >
                                                                <Plus className="size-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </FxCard>
                                        );
                                    })}
                                </div>

                                {/* Pagination Kontrol */}
                                {totalPages > 1 ? (
                                    <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                                        <span>
                                            Halaman {validPage} dari{' '}
                                            {totalPages} ({filteredMenus.length}{' '}
                                            menu)
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentPage((p) =>
                                                        Math.max(1, p - 1),
                                                    )
                                                }
                                                disabled={validPage <= 1}
                                                className="flex size-7 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors hover:bg-hover-soft disabled:cursor-not-allowed disabled:opacity-40"
                                                aria-label="Halaman sebelumnya"
                                            >
                                                <ChevronLeft className="size-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentPage((p) =>
                                                        Math.min(
                                                            totalPages,
                                                            p + 1,
                                                        ),
                                                    )
                                                }
                                                disabled={
                                                    validPage >= totalPages
                                                }
                                                className="flex size-7 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors hover:bg-hover-soft disabled:cursor-not-allowed disabled:opacity-40"
                                                aria-label="Halaman berikutnya"
                                            >
                                                <ChevronRight className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </Reveal>
                </div>

                {/* Kolom Kanan: Detail Pesanan / Keranjang */}
                <Reveal delay={0.1}>
                    <FxCard className="sticky top-4 flex flex-col gap-4 p-5 shadow-sm">
                        {/* Header Keranjang */}
                        <div className="flex items-center justify-between border-b border-border/50 pb-3">
                            <div>
                                <h2 className="text-base font-bold tracking-tight">
                                    Detail Pesanan
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    {totalItemsCount} item terpilih
                                </p>
                            </div>
                            {items.length > 0 ? (
                                <button
                                    type="button"
                                    onClick={clearCart}
                                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
                                >
                                    <Trash2 className="size-3" />
                                    Batal
                                </button>
                            ) : null}
                        </div>

                        {/* Segmented Control Tipe Pesanan */}
                        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-secondary/80 p-1 text-xs font-semibold">
                            {[
                                { id: 'dine-in', label: 'Dine In' },
                                { id: 'takeaway', label: 'Takeaway' },
                                { id: 'delivery', label: 'Delivery' },
                            ].map((type) => {
                                const active = orderType === type.id;
                                return (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() =>
                                            setOrderType(type.id as OrderType)
                                        }
                                        className={`rounded-xl py-1.5 transition-all duration-200 ${
                                            active
                                                ? 'bg-card font-bold text-foreground shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {type.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Input Nama Pelanggan / Nomor Meja */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                                Nama Pelanggan / Meja
                            </label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) =>
                                    setCustomerName(e.target.value)
                                }
                                placeholder="Contoh: Meja 4 / Daffa"
                                className="h-9 w-full rounded-xl bg-secondary/60 px-3 text-xs transition-colors outline-none placeholder:text-muted-foreground/60 focus:bg-secondary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        {/* Daftar Item Pesanan di Keranjang */}
                        <div className="flex flex-col">
                            <p className="mb-2 text-xs font-semibold text-muted-foreground">
                                Item Pesanan
                            </p>
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-secondary/30 py-8 text-center text-muted-foreground">
                                    <p className="text-sm font-medium">
                                        Keranjang masih kosong
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Pilih menu di katalog sebelah kiri untuk
                                        menambah pesanan.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex max-h-[280px] flex-col gap-3 overflow-y-auto pr-1">
                                    {items.map(({ menu, qty }) => (
                                        <div
                                            key={menu.id}
                                            className="flex items-center gap-2.5 rounded-2xl bg-secondary/40 p-2.5 transition-colors hover:bg-secondary/60"
                                        >
                                            {/* Thumbnail Foto Menu */}
                                            {menu.image_url ? (
                                                <img
                                                    src={menu.image_url}
                                                    alt={menu.name}
                                                    className="size-11 shrink-0 rounded-xl object-cover"
                                                />
                                            ) : (
                                                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                                                    <IconCircle
                                                        icon={
                                                            categoryIcon[
                                                                menu.category
                                                            ]
                                                        }
                                                        tone="soft"
                                                        size="sm"
                                                    />
                                                </div>
                                            )}

                                            {/* Nama, Harga Satuan & Subtotal */}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-semibold text-foreground">
                                                    {menu.name}
                                                </p>
                                                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                    <span className="tabular-nums">
                                                        {formatRupiah(
                                                            menu.selling_price,
                                                        )}
                                                    </span>
                                                    <span aria-hidden>·</span>
                                                    <span className="font-semibold text-foreground tabular-nums">
                                                        {formatRupiah(
                                                            Number(
                                                                menu.selling_price,
                                                            ) * qty,
                                                        )}
                                                    </span>
                                                </p>
                                            </div>

                                            {/* Stepper Kuantitas + Hapus */}
                                            <div className="flex shrink-0 items-center gap-1.5">
                                                <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setQty(
                                                                menu.id,
                                                                qty - 1,
                                                            )
                                                        }
                                                        className="flex size-5 items-center justify-center rounded-full bg-card transition-colors hover:bg-hover-soft"
                                                        aria-label="Kurangi"
                                                    >
                                                        <Minus className="size-3" />
                                                    </button>
                                                    <span className="w-4 text-center text-xs font-bold tabular-nums">
                                                        {qty}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setQty(
                                                                menu.id,
                                                                qty + 1,
                                                            )
                                                        }
                                                        className="flex size-5 items-center justify-center rounded-full bg-card transition-colors hover:bg-hover-soft"
                                                        aria-label="Tambah"
                                                    >
                                                        <Plus className="size-3" />
                                                    </button>
                                                </div>

                                                {/* Delete Button */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setQty(menu.id, 0)
                                                    }
                                                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
                                                    aria-label="Hapus item"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Rincian Metode Default Pembayaran di Sidebar */}
                        <div className="border-t border-border/50 pt-3">
                            <p className="mb-2 text-xs font-semibold text-muted-foreground">
                                Metode Pembayaran Awal
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {(
                                    [
                                        { id: 'cash', label: 'Tunai (Cash)' },
                                        { id: 'qris', label: 'QRIS' },
                                    ] as const
                                ).map((p) => {
                                    const active = payment === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setPayment(p.id)}
                                            className={`h-9 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                                active
                                                    ? 'fx-coral shadow-xs'
                                                    : 'bg-secondary text-foreground hover:bg-hover-soft'
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Total Belanja */}
                        <FxSoft className="flex items-center justify-between p-3.5">
                            <div>
                                <span className="text-xs text-muted-foreground">
                                    Total Bayar
                                </span>
                                <p className="text-xs font-medium text-muted-foreground">
                                    {totalItemsCount} item
                                </p>
                            </div>
                            <span className="text-xl font-bold text-foreground tabular-nums">
                                {formatRupiah(total)}
                            </span>
                        </FxSoft>

                        {/* Tombol Eksekusi Order -> Navigasi ke Rute /pos/checkout */}
                        <FxButton
                            variant="coral"
                            size="lg"
                            disabled={items.length === 0}
                            onClick={handleOpenCheckout}
                            className="w-full gap-2 text-sm font-semibold shadow-sm"
                        >
                            <span>Lanjut Bayar ({formatRupiah(total)})</span>
                            <ArrowRight className="size-4" />
                        </FxButton>
                    </FxCard>
                </Reveal>
            </div>
        </PageShell>
    );
}
