import { router } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    ChevronLeft,
    ChevronRight,
    Coffee,
    CupSoda,
    Loader2,
    Minus,
    Plus,
    Printer,
    QrCode,
    ReceiptText,
    Sandwich,
    Search,
    Trash2,
    Wallet,
    X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { FxInput, FxModal } from '@/components/fx/fx-form';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';
import PageShell from '@/components/page-shell';
import { formatRupiah } from '@/lib/format';

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

type CompletedOrder = {
    id: string;
    db_id: number;
    total_amount: number;
    payment_method: 'cash' | 'qris';
    cash_received: number;
    change: number;
    items_count: number;
    created_at: string;
    customer_name: string;
};

type Props = {
    menus: PosMenu[];
    active_queue_count?: number;
    merchant_qris?: {
        merchant_name: string;
        merchant_city: string;
        static_payload: string;
    };
};

function formatNumberWithDots(val: number | string): string {
    const digits = String(val).replace(/\D/g, '');
    if (!digits) return '';
    return Number(digits).toLocaleString('id-ID');
}

function parseDigits(str: string): number {
    const digits = str.replace(/\D/g, '');
    return digits ? parseInt(digits, 10) : 0;
}

function getQuickCashOptions(total: number): number[] {
    if (total <= 0) return [];
    const options = new Set<number>();
    options.add(total);

    const next10k = Math.ceil(total / 10000) * 10000;
    if (next10k > total) {
        options.add(next10k);
    }

    const commonBills = [10000, 20000, 50000, 100000, 200000, 300000, 500000];
    for (const bill of commonBills) {
        if (bill > total) {
            options.add(bill);
        }
        if (options.size >= 5) break;
    }

    return Array.from(options).sort((a, b) => a - b).slice(0, 5);
}

const categoryIcon = { Kopi: Coffee, 'Non-Kopi': CupSoda, Makanan: Sandwich };
const categories: Category[] = ['Kopi', 'Non-Kopi', 'Makanan'];

export default function Pos({
    menus,
    active_queue_count = 0,
    merchant_qris,
}: Props) {
    const [cart, setCart] = useState<Record<number, number>>({});
    const [payment, setPayment] = useState<'cash' | 'qris'>('cash');
    const [orderType, setOrderType] = useState<OrderType>('dine-in');
    const [customerName, setCustomerName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'Semua' | Category>(
        'Semua',
    );
    const [inStockOnly, setInStockOnly] = useState(false);

    // Modal Konfirmasi Pembayaran & QRIS Dinamis
    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'cash' | 'qris'>('cash');
    const [cashReceivedInput, setCashReceivedInput] = useState('');
    const [qrisPayloadData, setQrisPayloadData] = useState<{
        qris_payload: string;
        merchant_name: string;
        merchant_city: string;
        amount: number;
        invoice_id: string | null;
    } | null>(null);
    const [isLoadingQris, setIsLoadingQris] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal Sukses Setelah Transaksi
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null);

    // Idempotency key (FR-016): dibuat saat submit, dipakai ulang bila retry, dibersihkan saat sukses.
    const idempotencyKey = useRef<string | null>(null);

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
    }

    const parsedCashReceived = parseDigits(cashReceivedInput);
    const cashChange = parsedCashReceived - total;
    const isCashSufficient = parsedCashReceived >= total;
    const quickCashOptions = useMemo(() => getQuickCashOptions(total), [total]);

    async function fetchQrisPayload(amountToPay: number) {
        setIsLoadingQris(true);
        try {
            const res = await fetch(`/pos/qris-payload?amount=${amountToPay}`, {
                headers: {
                    Accept: 'application/json',
                },
            });
            if (!res.ok) {
                throw new Error('Gagal membuat payload QRIS dinamis.');
            }
            const data = await res.json();
            setQrisPayloadData(data);
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : 'Gagal memuat QRIS.';
            toast.error(msg);
        } finally {
            setIsLoadingQris(false);
        }
    }

    function openCheckoutModal() {
        if (items.length === 0) {
            toast.error('Belum ada item di pesanan.');
            return;
        }

        setCheckoutPaymentMethod(payment);

        if (payment === 'cash') {
            setCashReceivedInput(formatNumberWithDots(total));
        } else {
            fetchQrisPayload(total);
        }

        setCheckoutModalOpen(true);
    }

    function switchPaymentMethod(method: 'cash' | 'qris') {
        setCheckoutPaymentMethod(method);
        setPayment(method);
        if (method === 'cash') {
            if (!cashReceivedInput || parseDigits(cashReceivedInput) === 0) {
                setCashReceivedInput(formatNumberWithDots(total));
            }
        } else if (method === 'qris') {
            if (!qrisPayloadData || qrisPayloadData.amount !== total) {
                fetchQrisPayload(total);
            }
        }
    }

    function executeOrder(method: 'cash' | 'qris') {
        if (items.length === 0) return;

        const cashReceived = method === 'cash' ? parsedCashReceived : total;
        if (method === 'cash' && cashReceived < total) {
            toast.error('Uang tunai yang diterima kurang dari total pembayaran.');
            return;
        }

        if (idempotencyKey.current === null) {
            idempotencyKey.current = (
                globalThis.crypto?.randomUUID?.() ??
                `ord-${Date.now()}-${Math.random().toString(36).slice(2)}`
            ).slice(0, 64);
        }

        setIsSubmitting(true);

        router.post(
            '/pos',
            {
                lines: items.map(({ menu, qty }) => ({
                    menu_id: menu.id,
                    quantity: qty,
                })),
                payment_method: method,
                cash_received: method === 'cash' ? cashReceived : null,
                customer_name: customerName.trim() || null,
                idempotency_key: idempotencyKey.current,
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setIsSubmitting(false);
                    idempotencyKey.current = null;

                    const flashOrder = (page.props as { flash?: { created_order?: CompletedOrder } })?.flash?.created_order;
                    const orderData: CompletedOrder = flashOrder ?? {
                        id: 'ORD-' + Date.now(),
                        db_id: 0,
                        total_amount: total,
                        payment_method: method,
                        cash_received: cashReceived,
                        change: Math.max(0, cashReceived - total),
                        items_count: totalItemsCount,
                        created_at: new Date().toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                        customer_name: customerName.trim(),
                    };

                    setCompletedOrder(orderData);
                    setCheckoutModalOpen(false);
                    setSuccessModalOpen(true);
                    setCart({});
                    setCustomerName('');
                    toast.success(`Pesanan ${orderData.id} berhasil disimpan!`);
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    toast.error(
                        Object.values(errors)[0] ?? 'Gagal menyimpan pesanan.',
                    );
                },
            },
        );
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
            <div className="grid items-start gap-5 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_400px]">
                {/* Kolom Kiri: Katalog Produk & Filter (Referensi Tave POS Opsi A) */}
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
                                <div className="flex h-9 w-full items-center gap-2 rounded-full bg-secondary/80 px-3 transition-colors focus-within:bg-secondary focus-within:ring-2 focus-within:ring-primary/20 sm:w-56">
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
                            <FxSoft className="flex flex-col items-center justify-center gap-2 rounded-3xl p-12 text-center text-muted-foreground">
                                <Search className="size-8 text-muted-foreground/40" />
                                <p className="text-sm font-semibold text-foreground">
                                    Tidak ada menu yang sesuai
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Coba ubah kata kunci pencarian atau ganti
                                    kategori filter.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setCategoryFilter('Semua');
                                        setInStockOnly(false);
                                    }}
                                    className="mt-2 text-xs font-semibold text-primary hover:underline"
                                >
                                    Reset semua filter
                                </button>
                            </FxSoft>
                        ) : (
                            <div>
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {paginatedMenus.map((m) => {
                                        const Icon = categoryIcon[m.category];
                                        const isOutOfStock =
                                            m.portions_available <= 0;
                                        const isLowStock =
                                            m.portions_available > 0 &&
                                            m.portions_available <= 3;
                                        const inCartQty = cart[m.id] ?? 0;

                                        return (
                                            <FxCard
                                                key={m.id}
                                                className={`group relative flex flex-col justify-between overflow-hidden p-4 transition-all duration-200 ${
                                                    inCartQty > 0
                                                        ? 'shadow-xs ring-2 ring-primary/25'
                                                        : ''
                                                } ${
                                                    isOutOfStock
                                                        ? 'opacity-60 grayscale-[30%]'
                                                        : 'hover:-translate-y-0.5 hover:shadow-md'
                                                }`}
                                            >
                                                {/* Top Bar Kartu: Kategori & Ketersediaan Stok */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                                        {m.category}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                            isOutOfStock
                                                                ? 'bg-danger-soft text-danger'
                                                                : isLowStock
                                                                  ? 'bg-warning-soft text-warning-ink'
                                                                  : 'bg-success-soft text-success'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`size-1.5 rounded-full ${
                                                                isOutOfStock
                                                                    ? 'bg-danger'
                                                                    : isLowStock
                                                                      ? 'bg-warning'
                                                                      : 'bg-success'
                                                            }`}
                                                        />
                                                        {isOutOfStock
                                                            ? 'Habis'
                                                            : `Sisa ${m.portions_available}`}
                                                    </span>
                                                </div>

                                                {/* Foto Produk Besar (Gaya Opsi A) */}
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
                                                <div className="flex items-end justify-between gap-2 pt-1">
                                                    <div
                                                        onClick={() =>
                                                            !isOutOfStock &&
                                                            add(m)
                                                        }
                                                        className="min-w-0 flex-1 cursor-pointer"
                                                    >
                                                        <p className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
                                                            {m.name}
                                                        </p>
                                                        <p className="mt-0.5 text-sm font-bold text-foreground tabular-nums">
                                                            {formatRupiah(
                                                                m.selling_price,
                                                            )}
                                                        </p>
                                                    </div>

                                                    {/* Kontrol Kuantitas: Stepper (- / qty / +) jika sudah dipilih, atau tombol (+) jika belum */}
                                                    {inCartQty > 0 ? (
                                                        <div
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                            className="flex items-center gap-1 rounded-xl bg-primary/10 p-1 text-primary ring-1 ring-primary/25"
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setQty(
                                                                        m.id,
                                                                        inCartQty -
                                                                            1,
                                                                    )
                                                                }
                                                                className="flex size-7 items-center justify-center rounded-lg bg-card text-foreground transition-all duration-150 hover:bg-danger-soft hover:text-danger active:scale-90"
                                                                aria-label={`Kurangi ${m.name}`}
                                                            >
                                                                <Minus className="size-3.5" />
                                                            </button>
                                                            <span className="w-5 text-center text-xs font-bold text-primary tabular-nums">
                                                                {inCartQty}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    isOutOfStock ||
                                                                    inCartQty >=
                                                                        m.portions_available
                                                                }
                                                                onClick={() =>
                                                                    add(m)
                                                                }
                                                                className={`flex size-7 items-center justify-center rounded-lg bg-card text-foreground transition-all duration-150 hover:bg-hover-soft active:scale-90 ${
                                                                    inCartQty >=
                                                                    m.portions_available
                                                                        ? 'cursor-not-allowed opacity-40'
                                                                        : ''
                                                                }`}
                                                                aria-label={`Tambah ${m.name}`}
                                                            >
                                                                <Plus className="size-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                isOutOfStock
                                                            }
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                add(m);
                                                            }}
                                                            aria-label={`Tambah ${m.name}`}
                                                            className={`flex size-9 shrink-0 items-center justify-center rounded-2xl bg-secondary text-foreground transition-all duration-200 hover:bg-hover-soft active:scale-95 ${
                                                                isOutOfStock
                                                                    ? 'cursor-not-allowed opacity-40'
                                                                    : ''
                                                            }`}
                                                        >
                                                            <Plus className="size-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </FxCard>
                                        );
                                    })}
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 ? (
                                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
                                        <p className="text-xs text-muted-foreground">
                                            Menampilkan{' '}
                                            <span className="font-semibold text-foreground">
                                                {startIndex + 1} -{' '}
                                                {Math.min(
                                                    startIndex + ITEMS_PER_PAGE,
                                                    filteredMenus.length,
                                                )}
                                            </span>{' '}
                                            dari{' '}
                                            <span className="font-semibold text-foreground">
                                                {filteredMenus.length}
                                            </span>{' '}
                                            menu
                                        </p>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                disabled={validPage <= 1}
                                                onClick={() =>
                                                    setCurrentPage((p) =>
                                                        Math.max(1, p - 1),
                                                    )
                                                }
                                                className="flex size-8 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors hover:bg-hover-soft disabled:cursor-not-allowed disabled:opacity-40"
                                                aria-label="Halaman sebelumnya"
                                            >
                                                <ChevronLeft className="size-4" />
                                            </button>

                                            <div className="flex items-center gap-1">
                                                {Array.from(
                                                    { length: totalPages },
                                                    (_, i) => i + 1,
                                                ).map((pageNum) => {
                                                    const isActive =
                                                        pageNum === validPage;
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            type="button"
                                                            onClick={() =>
                                                                setCurrentPage(
                                                                    pageNum,
                                                                )
                                                            }
                                                            className={`flex size-8 items-center justify-center rounded-xl text-xs font-semibold transition-all duration-200 ${
                                                                isActive
                                                                    ? 'fx-coral font-bold shadow-xs'
                                                                    : 'bg-secondary text-foreground hover:bg-hover-soft'
                                                            }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <button
                                                type="button"
                                                disabled={
                                                    validPage >= totalPages
                                                }
                                                onClick={() =>
                                                    setCurrentPage((p) =>
                                                        Math.min(
                                                            totalPages,
                                                            p + 1,
                                                        ),
                                                    )
                                                }
                                                className="flex size-8 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors hover:bg-hover-soft disabled:cursor-not-allowed disabled:opacity-40"
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

                {/* Kolom Kanan: Detail Pesanan / Keranjang (Referensi Order Detail Opsi A) */}
                <Reveal delay={0.1}>
                    <FxCard className="sticky top-4 flex flex-col gap-4 p-5 shadow-sm">
                        {/* Header Keranjang: Judul, Counter & Reset Button */}
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

                        {/* Segmented Control Tipe Pesanan (Dine-in / Takeaway / Delivery) */}
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

                        {/* Daftar Item Pesanan */}
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
                                            className="flex items-center gap-3 rounded-2xl border border-border/40 bg-secondary/20 p-2.5 transition-colors hover:bg-secondary/40"
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

                                            {/* Deskripsi & Harga Satuan */}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-semibold text-foreground">
                                                    {menu.name}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground tabular-nums">
                                                    {formatRupiah(
                                                        menu.selling_price,
                                                    )}
                                                </p>
                                            </div>

                                            {/* Stepper Kuantitas */}
                                            <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setQty(menu.id, qty - 1)
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
                                                        setQty(menu.id, qty + 1)
                                                    }
                                                    className="flex size-5 items-center justify-center rounded-full bg-card transition-colors hover:bg-hover-soft"
                                                    aria-label="Tambah"
                                                >
                                                    <Plus className="size-3" />
                                                </button>
                                            </div>

                                            {/* Subtotal Item */}
                                            <span className="w-16 text-right text-xs font-bold text-foreground tabular-nums">
                                                {formatRupiah(
                                                    Number(menu.selling_price) *
                                                        qty,
                                                )}
                                            </span>

                                            {/* Delete Button */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setQty(menu.id, 0)
                                                }
                                                className="text-muted-foreground transition-colors hover:text-danger"
                                                aria-label="Hapus item"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Rincian Pembayaran (Payment Details) */}
                        <div className="border-t border-border/50 pt-3">
                            <p className="mb-2 text-xs font-semibold text-muted-foreground">
                                Metode Pembayaran
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

                        {/* Tombol Eksekusi Order -> Buka Modal Konfirmasi */}
                        <FxButton
                            variant="coral"
                            size="lg"
                            disabled={items.length === 0}
                            onClick={openCheckoutModal}
                            className="w-full gap-2 text-sm font-semibold shadow-sm"
                        >
                            <span>Lanjut Bayar ({formatRupiah(total)})</span>
                            <ArrowRight className="size-4" />
                        </FxButton>
                    </FxCard>
                </Reveal>
            </div>

            {/* Modal Konfirmasi Pembayaran Kasir */}
            <FxModal
                open={checkoutModalOpen}
                onOpenChange={setCheckoutModalOpen}
                title="Konfirmasi Pembayaran"
                description="Pastikan nominal dan metode pembayaran sesuai sebelum memotong stok."
                wide
                footer={
                    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <FxButton
                            variant="soft"
                            size="md"
                            disabled={isSubmitting}
                            onClick={() => setCheckoutModalOpen(false)}
                        >
                            Batal
                        </FxButton>
                        {checkoutPaymentMethod === 'cash' ? (
                            <FxButton
                                variant="coral"
                                size="md"
                                disabled={isSubmitting || !isCashSufficient}
                                onClick={() => executeOrder('cash')}
                                className="gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Menyimpan Pesanan...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Selesaikan Pembayaran Tunai</span>
                                        {isCashSufficient && cashChange > 0 ? (
                                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold">
                                                Kembalian {formatRupiah(cashChange)}
                                            </span>
                                        ) : null}
                                        <ArrowRight className="size-4" />
                                    </>
                                )}
                            </FxButton>
                        ) : (
                            <FxButton
                                variant="coral"
                                size="md"
                                disabled={isSubmitting || isLoadingQris}
                                onClick={() => executeOrder('qris')}
                                className="gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Menyimpan Pesanan...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Konfirmasi Pembayaran Diterima</span>
                                        <ArrowRight className="size-4" />
                                    </>
                                )}
                            </FxButton>
                        )}
                    </div>
                }
            >
                <div className="flex flex-col gap-4">
                    {/* Ringkasan Singkat Pesanan */}
                    <div className="flex items-center justify-between rounded-2xl bg-secondary/50 p-3.5 border border-border/40">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-muted-foreground">
                                Total Tagihan ({totalItemsCount} item)
                            </span>
                            <span className="text-xl font-bold text-foreground tabular-nums">
                                {formatRupiah(total)}
                            </span>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">
                                {customerName.trim() || 'Pelanggan Umum'}
                            </span>
                            <p className="capitalize">
                                {orderType === 'dine-in'
                                    ? 'Dine In'
                                    : orderType === 'takeaway'
                                      ? 'Takeaway'
                                      : 'Delivery'}
                            </p>
                        </div>
                    </div>

                    {/* Segmented Switcher Tunai vs QRIS */}
                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary/70 p-1">
                        <button
                            type="button"
                            onClick={() => switchPaymentMethod('cash')}
                            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all ${
                                checkoutPaymentMethod === 'cash'
                                    ? 'bg-card text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Wallet className="size-4 text-primary" />
                            <span>Tunai (Cash)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => switchPaymentMethod('qris')}
                            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all ${
                                checkoutPaymentMethod === 'qris'
                                    ? 'bg-card text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <QrCode className="size-4 text-primary" />
                            <span>QRIS Dinamis</span>
                        </button>
                    </div>

                    {/* Tab Tunai */}
                    {checkoutPaymentMethod === 'cash' ? (
                        <div className="flex flex-col gap-3.5">
                            {/* Input Uang Diterima */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Nominal Uang Diterima
                                </label>
                                <FxInput
                                    prefix="Rp"
                                    type="text"
                                    inputMode="numeric"
                                    value={cashReceivedInput}
                                    onChange={(e) =>
                                        setCashReceivedInput(
                                            formatNumberWithDots(e.target.value),
                                        )
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && isCashSufficient && !isSubmitting) {
                                            executeOrder('cash');
                                        }
                                    }}
                                    placeholder="0"
                                    className="text-base font-bold tabular-nums"
                                    autoFocus
                                />
                            </div>

                            {/* Tombol Cepat Nominal Uang */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-medium text-muted-foreground">
                                    Pilihan Nominal Cepat:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {quickCashOptions.map((opt) => {
                                        const isExact = opt === total;
                                        const isSelected = parsedCashReceived === opt;
                                        return (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() =>
                                                    setCashReceivedInput(
                                                        formatNumberWithDots(opt),
                                                    )
                                                }
                                                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                                                    isSelected
                                                        ? 'fx-coral shadow-xs'
                                                        : 'bg-secondary text-foreground hover:bg-hover-soft'
                                                }`}
                                            >
                                                {formatRupiah(opt)}
                                                {isExact ? ' (Pas)' : ''}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Box Status Kembalian */}
                            {parsedCashReceived > 0 ? (
                                isCashSufficient ? (
                                    <div className="flex items-center justify-between rounded-2xl bg-success-soft/30 p-3.5 border border-success/30">
                                        <div className="flex items-center gap-2 text-success">
                                            <Check className="size-4" />
                                            <span className="text-xs font-semibold">
                                                Kembalian Pelanggan
                                            </span>
                                        </div>
                                        <span className="text-lg font-bold text-success tabular-nums">
                                            {formatRupiah(cashChange)}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between rounded-2xl bg-danger-soft/30 p-3.5 border border-danger/30 text-danger">
                                        <span className="text-xs font-semibold">
                                            Uang Masih Kurang
                                        </span>
                                        <span className="text-sm font-bold tabular-nums">
                                            {formatRupiah(total - parsedCashReceived)}
                                        </span>
                                    </div>
                                )
                            ) : (
                                <div className="rounded-xl bg-secondary/40 p-3 text-center text-xs text-muted-foreground">
                                    Pilih opsi uang pas di atas atau ketik jumlah uang yang diserahkan pembeli.
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Tab QRIS Dinamis */
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex w-full flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-sm border border-border/20 text-gray-900">
                                {isLoadingQris ? (
                                    <div className="flex h-[200px] w-[200px] flex-col items-center justify-center gap-2 text-gray-500">
                                        <Loader2 className="size-8 animate-spin text-primary" />
                                        <p className="text-xs font-medium">
                                            Membuat QRIS Dinamis...
                                        </p>
                                    </div>
                                ) : (
                                    <QRCodeSVG
                                        value={
                                            qrisPayloadData?.qris_payload ||
                                            merchant_qris?.static_payload ||
                                            ''
                                        }
                                        size={200}
                                        level="M"
                                        className="rounded-lg"
                                    />
                                )}
                                <div className="mt-2.5 text-center">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-900">
                                        {qrisPayloadData?.merchant_name ||
                                            merchant_qris?.merchant_name ||
                                            'BAROKAH COMPENY'}
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                        NMID: ID1024362479726 •{' '}
                                        {qrisPayloadData?.merchant_city ||
                                            merchant_qris?.merchant_city ||
                                            'SURABAYA'}
                                    </p>
                                </div>
                            </div>

                            {/* Badge Nominal Terkunci */}
                            <div className="flex w-full items-center justify-between rounded-xl bg-primary/10 px-3.5 py-2 text-xs font-medium text-primary border border-primary/20">
                                <span>Nominal Terkunci Otomatis:</span>
                                <span className="text-sm font-bold tabular-nums">
                                    {formatRupiah(total)}
                                </span>
                            </div>

                            {/* Checklist Verifikasi Kasir */}
                            <div className="flex w-full flex-col gap-1.5 rounded-2xl bg-secondary/50 p-3 border border-border/40 text-[11px] text-muted-foreground">
                                <p className="font-semibold text-foreground flex items-center gap-1.5">
                                    <Check className="size-3.5 text-primary" />
                                    Panduan Verifikasi Kasir:
                                </p>
                                <ol className="list-decimal pl-4 space-y-0.5">
                                    <li>Minta pelanggan scan QRIS dengan mobile banking / e-wallet.</li>
                                    <li>Pastikan nama toko di HP pelanggan tertera <strong>Barokah Compeny</strong>.</li>
                                    <li>Pastikan status transaksi di layar HP pelanggan bernilai <strong>BERHASIL / SUKSES</strong> sebelum menekan konfirmasi di bawah.</li>
                                </ol>
                            </div>
                        </div>
                    )}
                </div>
            </FxModal>

            {/* Modal Sukses Pembayaran */}
            <FxModal
                open={successModalOpen}
                onOpenChange={(open) => {
                    setSuccessModalOpen(open);
                    if (!open) setCompletedOrder(null);
                }}
                title="Pembayaran Berhasil! 🎉"
                description="Pesanan telah disimpan & stok bahan baku otomatis terpotong."
                footer={
                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            onClick={() => router.visit('/pesanan')}
                            className="text-xs text-muted-foreground hover:text-foreground underline text-left"
                        >
                            Lihat Semua Riwayat Pesanan →
                        </button>
                        <div className="flex items-center gap-2">
                            <FxButton
                                variant="soft"
                                size="md"
                                onClick={() => {
                                    setSuccessModalOpen(false);
                                    setCompletedOrder(null);
                                }}
                            >
                                Transaksi Baru
                            </FxButton>
                            {completedOrder?.db_id ? (
                                <FxButton
                                    variant="coral"
                                    size="md"
                                    className="gap-2"
                                    onClick={() =>
                                        window.open(
                                            `/pesanan/${completedOrder.db_id}/cetak?auto=1`,
                                            '_blank',
                                        )
                                    }
                                >
                                    <Printer className="size-4" />
                                    <span>Cetak Struk</span>
                                </FxButton>
                            ) : null}
                        </div>
                    </div>
                }
            >
                {completedOrder ? (
                    <div className="flex flex-col gap-3.5">
                        <div className="flex items-center justify-between rounded-2xl bg-secondary/50 p-4 border border-border/40">
                            <div>
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Nomor Pesanan
                                </span>
                                <p className="text-base font-bold text-foreground">
                                    {completedOrder.id}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Total Bayar
                                </span>
                                <p className="text-base font-bold text-primary tabular-nums">
                                    {formatRupiah(completedOrder.total_amount)}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col divide-y divide-border/40 rounded-2xl bg-card border border-border/50 text-xs">
                            <div className="flex items-center justify-between p-3">
                                <span className="text-muted-foreground">Metode Pembayaran</span>
                                <span className="font-semibold text-foreground">
                                    {completedOrder.payment_method === 'cash'
                                        ? 'Tunai (Cash)'
                                        : 'QRIS Dinamis'}
                                </span>
                            </div>
                            {completedOrder.payment_method === 'cash' ? (
                                <>
                                    <div className="flex items-center justify-between p-3">
                                        <span className="text-muted-foreground">Uang Diterima</span>
                                        <span className="font-semibold text-foreground tabular-nums">
                                            {formatRupiah(completedOrder.cash_received)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-success-soft/30 font-semibold text-success">
                                        <span>Kembalian</span>
                                        <span className="text-sm font-bold tabular-nums">
                                            {formatRupiah(completedOrder.change)}
                                        </span>
                                    </div>
                                </>
                            ) : null}
                            <div className="flex items-center justify-between p-3">
                                <span className="text-muted-foreground">Jumlah Item</span>
                                <span className="font-semibold text-foreground">
                                    {completedOrder.items_count} porsi
                                </span>
                            </div>
                            {completedOrder.customer_name ? (
                                <div className="flex items-center justify-between p-3">
                                    <span className="text-muted-foreground">Pelanggan / Meja</span>
                                    <span className="font-semibold text-foreground">
                                        {completedOrder.customer_name}
                                    </span>
                                </div>
                            ) : null}
                            <div className="flex items-center justify-between p-3">
                                <span className="text-muted-foreground">Waktu Transaksi</span>
                                <span className="font-semibold text-foreground tabular-nums">
                                    {completedOrder.created_at}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : null}
            </FxModal>
        </PageShell>
    );
}
