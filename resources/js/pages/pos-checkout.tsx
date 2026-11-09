import { router } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    Clock,
    Coffee,
    Delete,
    Loader2,
    QrCode,
    ReceiptText,
    RefreshCw,
    ShoppingBag,
    Wallet,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard } from '@/components/fx/fx-card';
import PageShell from '@/components/page-shell';
import { formatRupiah } from '@/lib/format';

type OrderType = 'dine-in' | 'takeaway' | 'delivery';

export type PosCartItem = {
    menu_id: number;
    name: string;
    price: number | string;
    qty: number;
    image_url?: string | null;
    category?: string;
};

export type PosStoredSession = {
    cart: Record<number, number>;
    items: PosCartItem[];
    orderType: OrderType;
    customerName: string;
    paymentMethod: 'cash' | 'qris';
};

export const POS_CART_STORAGE_KEY = 'kulakan_pos_cart';

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
    merchant_qris?: {
        merchant_name: string;
        merchant_city: string;
        nmid?: string;
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

function getFastCashChips(total: number): { label: string; amount: number }[] {
    if (total <= 0) return [];
    const chips: { label: string; amount: number }[] = [];

    // Chip 1: Uang Pas
    chips.push({ label: 'Uang Pas', amount: total });

    // Pecahan 1 lembar berikutnya (10k, 20k, 50k, 100k, 200k, dst)
    let singleNote = 0;
    const baseNotes = [10000, 20000, 50000, 100000];
    for (const b of baseNotes) {
        if (b > total) {
            singleNote = b;
            break;
        }
    }
    if (!singleNote) {
        singleNote = Math.ceil(total / 100000) * 100000;
        if (singleNote === total) singleNote += 100000;
    }
    chips.push({ label: 'Pecahan 1 Lembar', amount: singleNote });

    // Chip 3: Pembulatan berikutnya
    const chip3 = Math.ceil((singleNote + 10000) / 50000) * 50000;
    chips.push({ label: 'Uang Diterima', amount: chip3 });

    // Chip 4: Pembulatan berikutnya
    const chip4 = chip3 + 50000;
    chips.push({ label: 'Uang Diterima', amount: chip4 });

    return chips;
}

function getDenominationBreakdown(change: number): string {
    if (change <= 0) return '-';
    let rem = change;
    const notes = [
        { val: 100000, label: '100rb' },
        { val: 50000, label: '50rb' },
        { val: 20000, label: '20rb' },
        { val: 10000, label: '10rb' },
        { val: 5000, label: '5rb' },
        { val: 2000, label: '2rb' },
        { val: 1000, label: '1rb' },
        { val: 500, label: '500p' },
        { val: 200, label: '200p' },
        { val: 100, label: '100p' },
    ];
    const parts: string[] = [];
    for (const n of notes) {
        if (rem >= n.val) {
            const count = Math.floor(rem / n.val);
            rem %= n.val;
            parts.push(`${count}x ${n.label}`);
        }
        if (parts.length >= 4) break;
    }
    return parts.join(' • ') || '-';
}

function formatIndonesianDateTime(date: Date): string {
    const days = [
        'Minggu',
        'Senin',
        'Selasa',
        'Rabu',
        'Kamis',
        'Jumat',
        'Sabtu',
    ];
    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des',
    ];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${dayName}, ${day} ${month} • ${hours}:${minutes}:${seconds} WIB`;
}

export default function PosCheckout({ merchant_qris }: Props) {
    const [storedSession, setStoredSession] = useState<PosStoredSession | null>(
        null,
    );
    const [isCartLoaded, setIsCartLoaded] = useState(false);

    const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<
        'cash' | 'qris'
    >('cash');
    const [cashReceivedInput, setCashReceivedInput] = useState('');
    const [qrisTimeLeft, setQrisTimeLeft] = useState(300);
    const [qrisPayloadData, setQrisPayloadData] = useState<{
        qris_payload: string;
        merchant_name: string;
        merchant_city: string;
        nmid?: string;
        amount: number;
        invoice_id: string | null;
    } | null>(null);
    const [isLoadingQris, setIsLoadingQris] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Live Clock realtime
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Idempotency key (FR-016)
    const idempotencyKey = useRef<string | null>(null);

    // Muat data keranjang dari sessionStorage saat komponen dimuat
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(POS_CART_STORAGE_KEY);
            if (raw) {
                const parsed: PosStoredSession = JSON.parse(raw);
                if (
                    parsed &&
                    Array.isArray(parsed.items) &&
                    parsed.items.length > 0
                ) {
                    setStoredSession(parsed);
                    const initMethod = parsed.paymentMethod || 'cash';
                    setCheckoutPaymentMethod(initMethod);

                    const sumTotal = parsed.items.reduce(
                        (sum, item) => sum + Number(item.price) * item.qty,
                        0,
                    );
                    if (initMethod === 'cash') {
                        setCashReceivedInput(formatNumberWithDots(sumTotal));
                    }
                }
            }
        } catch {
            // Abaikan kesalahan parsing JSON
        } finally {
            setIsCartLoaded(true);
        }
    }, []);

    const items = useMemo(() => storedSession?.items || [], [storedSession]);
    const orderType = storedSession?.orderType || 'dine-in';
    const customerName = storedSession?.customerName || '';

    const totalItemsCount = useMemo(
        () => items.reduce((n, x) => n + x.qty, 0),
        [items],
    );

    const total = useMemo(
        () => items.reduce((sum, x) => sum + Number(x.price) * x.qty, 0),
        [items],
    );

    const parsedCashReceived = parseDigits(cashReceivedInput);
    const cashChange = parsedCashReceived - total;
    const isCashSufficient = parsedCashReceived >= total;
    const fastCashChips = useMemo(() => getFastCashChips(total), [total]);

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

    // Ambil payload QRIS saat beralih ke QRIS jika belum ada
    useEffect(() => {
        if (checkoutPaymentMethod === 'qris' && total > 0 && !qrisPayloadData) {
            void fetchQrisPayload(total);
        }
    }, [checkoutPaymentMethod, total, qrisPayloadData]);

    function switchPaymentMethod(method: 'cash' | 'qris') {
        setCheckoutPaymentMethod(method);
        if (method === 'cash') {
            if (!cashReceivedInput || parseDigits(cashReceivedInput) === 0) {
                setCashReceivedInput(formatNumberWithDots(total));
            }
        } else if (method === 'qris') {
            setQrisTimeLeft(300);
            if (!qrisPayloadData || qrisPayloadData.amount !== total) {
                void fetchQrisPayload(total);
            }
        }
    }

    function refreshQris() {
        setQrisTimeLeft(300);
        void fetchQrisPayload(total);
        toast.info('QRIS berhasil diperbarui.');
    }

    function handleKeypadInput(val: string) {
        setCashReceivedInput((prev) => {
            const clean = prev.replace(/\D/g, '');
            if (clean === '0' || clean === '') {
                return formatNumberWithDots(val);
            }
            return formatNumberWithDots(clean + val);
        });
    }

    function handleKeypadBackspace() {
        setCashReceivedInput((prev) => {
            const clean = prev.replace(/\D/g, '');
            if (clean.length <= 1) return '';
            return formatNumberWithDots(clean.slice(0, -1));
        });
    }

    function handleKeypadClear() {
        setCashReceivedInput('');
    }

    // Countdown Timer QRIS (5 Menit)
    useEffect(() => {
        if (checkoutPaymentMethod !== 'qris') return;
        const interval = setInterval(() => {
            setQrisTimeLeft((t) => (t > 0 ? t - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [checkoutPaymentMethod]);

    const qrisMinutes = String(Math.floor(qrisTimeLeft / 60)).padStart(2, '0');
    const qrisSeconds = String(qrisTimeLeft % 60).padStart(2, '0');

    function handleCancelPayment() {
        // Kembali ke kasir dengan keranjang tetap utuh di sessionStorage
        router.visit('/pos');
    }

    // Listener Keyboard Kasir
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (
                        checkoutPaymentMethod === 'cash' &&
                        isCashSufficient &&
                        !isSubmitting
                    ) {
                        executeOrder('cash');
                    }
                }
                return;
            }

            if (e.key === 'Escape') {
                e.preventDefault();
                handleCancelPayment();
                return;
            }

            if (e.key === 'F1') {
                e.preventDefault();
                switchPaymentMethod('cash');
                return;
            }

            if (e.key === 'F2') {
                e.preventDefault();
                switchPaymentMethod('qris');
                return;
            }

            if (checkoutPaymentMethod === 'cash') {
                if (e.key >= '0' && e.key <= '9') {
                    e.preventDefault();
                    handleKeypadInput(e.key);
                } else if (e.key === 'Backspace') {
                    e.preventDefault();
                    handleKeypadBackspace();
                } else if (e.key.toLowerCase() === 'c') {
                    e.preventDefault();
                    handleKeypadClear();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (isCashSufficient && !isSubmitting) {
                        executeOrder('cash');
                    }
                }
            } else if (checkoutPaymentMethod === 'qris') {
                if (e.key === 'Enter' && !isSubmitting && !isLoadingQris) {
                    e.preventDefault();
                    executeOrder('qris');
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        checkoutPaymentMethod,
        isCashSufficient,
        isSubmitting,
        isLoadingQris,
        total,
        parsedCashReceived,
    ]);

    function executeOrder(method: 'cash' | 'qris') {
        if (items.length === 0) return;

        const cashReceived = method === 'cash' ? parsedCashReceived : total;
        if (method === 'cash' && cashReceived < total) {
            toast.error(
                'Uang tunai yang diterima kurang dari total pembayaran.',
            );
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
                lines: items.map((item) => ({
                    menu_id: item.menu_id,
                    quantity: item.qty,
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

                    // Bersihkan keranjang di sessionStorage karena transaksi sukses
                    try {
                        sessionStorage.removeItem(POS_CART_STORAGE_KEY);
                    } catch {
                        // Abaikan
                    }

                    const flashOrder = (
                        page.props as {
                            flash?: { created_order?: CompletedOrder };
                        }
                    )?.flash?.created_order;
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

                    toast.success(
                        `Pesanan ${orderData.id} berhasil disimpan!`,
                        {
                            description: `Metode ${method === 'cash' ? 'Tunai' : 'QRIS'}, total ${formatRupiah(total)}. Kembalian: ${formatRupiah(orderData.change)}.`,
                        },
                    );

                    // Langsung kembali ke kasir untuk transaksi baru
                    router.visit('/pos');
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

    // Jika sedang memuat atau keranjang kosong
    if (isCartLoaded && items.length === 0) {
        return (
            <PageShell
                title="Pembayaran Kasir"
                description="Selesaikan transaksi pelanggan dengan metode tunai atau QRIS dinamis."
                // actions={
                //     <FxButton
                //         variant="soft"
                //         size="sm"
                //         className="gap-2 text-xs font-semibold"
                //         onClick={handleCancelPayment}
                //     >
                //         <ArrowLeft className="size-3.5" />
                //         <span>Kembali ke Kasir</span>
                //     </FxButton>
                // }
            >
                <FxCard className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                        <ShoppingBag className="size-7" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-foreground">
                            Belum Ada Item di Keranjang
                        </h3>
                        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                            Silakan kembali ke kasir untuk memilih menu terlebih
                            dahulu sebelum melakukan pembayaran.
                        </p>
                    </div>
                    <FxButton
                        variant="coral"
                        size="md"
                        onClick={handleCancelPayment}
                        className="mt-2 gap-2"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Kembali ke Kasir</span>
                    </FxButton>
                </FxCard>
            </PageShell>
        );
    }

    return (
        <PageShell
            title="Pembayaran Kasir"
            description="Selesaikan transaksi pelanggan dengan metode tunai atau QRIS dinamis."
            // actions={
            //     <FxButton
            //         variant="soft"
            //         size="sm"
            //         className="gap-2 text-xs font-semibold"
            //         onClick={handleCancelPayment}
            //     >
            //         <ArrowLeft className="size-3.5" />
            //         <span>Kembali ke Kasir</span>
            //     </FxButton>
            // }
        >
            <div className="flex flex-col gap-4">
                {/* Top Control Bar Minimalis (Tanpa nama kasir, status koneksi, atau nomor order) */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/50 bg-secondary/80 p-3 sm:px-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground shadow-xs">
                            <Coffee className="size-5" />
                        </div>
                        <div>
                            <span className="text-sm font-extrabold tracking-tight text-foreground">
                                Kulakan POS
                            </span>
                            <p className="text-[11px] font-medium text-muted-foreground">
                                Terminal Kasir
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card px-3.5 py-1.5 shadow-2xs">
                            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                            <span className="text-xs font-semibold text-foreground">
                                {orderType === 'dine-in'
                                    ? 'Dine In'
                                    : orderType === 'takeaway'
                                      ? 'Takeaway'
                                      : 'Delivery'}
                                {customerName.trim()
                                    ? ` • ${customerName.trim()}`
                                    : ''}
                            </span>
                        </div>
                        <div className="hidden items-center gap-1.5 rounded-full border border-border/50 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground tabular-nums shadow-2xs sm:flex">
                            <Clock className="size-3.5 text-primary" />
                            <span>{formatIndonesianDateTime(currentTime)}</span>
                        </div>
                    </div>

                    <FxButton
                        variant="soft"
                        size="sm"
                        className="gap-1.5 text-xs font-semibold"
                        onClick={handleCancelPayment}
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>Kembali ke Kasir</span>
                    </FxButton>
                </div>

                {/* Layout 2 Kolom: Kiri (Rincian Pesanan) & Kanan (Panel Pembayaran) */}
                <div className="grid items-start gap-5 lg:grid-cols-[380px_1fr] xl:grid-cols-[400px_1fr]">
                    {/* Kolom Kiri: Rincian Pesanan Pelanggan (Tanpa teks 'Tambah Menu' duplikat) */}
                    <FxCard className="flex flex-col gap-3.5 p-5 shadow-sm">
                        <div className="flex items-center justify-between border-b border-border/50 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <ReceiptText className="size-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold tracking-tight text-foreground">
                                        Rincian Pesanan
                                    </h2>
                                    <p className="text-[11px] text-muted-foreground">
                                        {totalItemsCount} Menu Item{' '}
                                        {customerName.trim()
                                            ? `• Pelanggan: ${customerName.trim()}`
                                            : ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Daftar Item Pesanan Scrollable */}
                        <div className="flex max-h-[360px] flex-col gap-2.5 overflow-y-auto pr-1">
                            {items.map((item) => (
                                <div
                                    key={item.menu_id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-secondary/30 p-2.5 transition-colors"
                                >
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-card text-xs font-bold text-foreground shadow-2xs">
                                            {item.qty}x
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-bold text-foreground">
                                                {item.name}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground tabular-nums">
                                                @ {formatRupiah(item.price)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-xs font-bold text-foreground tabular-nums">
                                        {formatRupiah(
                                            Number(item.price) * item.qty,
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Kotak Ringkasan & Total Tagihan (Nett) */}
                        <div className="flex flex-col gap-2.5 border-t border-border/50 pt-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Subtotal ({totalItemsCount} Item)</span>
                                <span className="font-semibold text-foreground tabular-nums">
                                    {formatRupiah(total)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/80 p-4">
                                <div>
                                    <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Total Tagihan
                                    </span>
                                    <p className="text-[11px] text-muted-foreground">
                                        Harga sudah nett
                                    </p>
                                </div>
                                <span className="text-2xl font-black text-foreground tabular-nums">
                                    {formatRupiah(total)}
                                </span>
                            </div>
                        </div>
                    </FxCard>

                    {/* Kolom Kanan: Panel Pembayaran (Tunai atau QRIS) */}
                    <div className="flex flex-col gap-4">
                        {/* Segmented Switcher Metode Pembayaran */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Pilih Metode Pembayaran
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => switchPaymentMethod('cash')}
                                    className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-xs font-bold shadow-xs transition-all ${
                                        checkoutPaymentMethod === 'cash'
                                            ? 'bg-foreground text-background ring-2 ring-primary/40 dark:bg-card dark:text-foreground'
                                            : 'bg-secondary text-foreground hover:bg-hover-soft'
                                    }`}
                                >
                                    <Wallet className="size-4 text-primary" />
                                    <span>TUNAI / CASH</span>
                                    <span className="rounded-md bg-white/15 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground dark:bg-black/20">
                                        F1
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => switchPaymentMethod('qris')}
                                    className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-xs font-bold shadow-xs transition-all ${
                                        checkoutPaymentMethod === 'qris'
                                            ? 'bg-foreground text-background ring-2 ring-primary/40 dark:bg-card dark:text-foreground'
                                            : 'bg-secondary text-foreground hover:bg-hover-soft'
                                    }`}
                                >
                                    <QrCode className="size-4 text-primary" />
                                    <span>QRIS INSTAN</span>
                                    <span className="rounded-md bg-white/15 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground dark:bg-black/20">
                                        F2
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Konten Berdasarkan Metode Aktif */}
                        {checkoutPaymentMethod === 'cash' ? (
                            /* ================= ALUR TUNAI / CASH ================= */
                            <div className="flex flex-col gap-4">
                                {/* Dual Card: Uang Diterima & Kembalian Pelanggan */}
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {/* Card 1: Uang Diterima */}
                                    <div className="flex flex-col justify-between rounded-2xl border border-border/60 bg-secondary/50 p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                                Uang Diterima (Cash Tendered)
                                            </span>
                                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                                Input Aktif
                                            </span>
                                        </div>
                                        <div className="my-2.5">
                                            <span className="text-2xl font-black text-foreground tabular-nums sm:text-3xl">
                                                Rp {cashReceivedInput || '0'}
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-muted-foreground">
                                            Total Wajib Bayar:{' '}
                                            <strong className="text-foreground">
                                                {formatRupiah(total)}
                                            </strong>
                                        </span>
                                    </div>

                                    {/* Card 2: Kembalian Pelanggan */}
                                    <div
                                        className={`flex flex-col justify-between rounded-2xl border p-4 transition-colors ${
                                            isCashSufficient
                                                ? 'border-success/30 bg-success-soft/20'
                                                : 'border-danger/30 bg-danger-soft/20'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                                Kembalian Pelanggan
                                            </span>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                    isCashSufficient
                                                        ? 'text-success-foreground bg-success'
                                                        : 'text-danger-foreground bg-danger'
                                                }`}
                                            >
                                                {isCashSufficient
                                                    ? 'Kembalian Cukup'
                                                    : 'Uang Kurang'}
                                            </span>
                                        </div>
                                        <div className="my-2.5">
                                            <span
                                                className={`text-2xl font-black tabular-nums sm:text-3xl ${
                                                    isCashSufficient
                                                        ? 'text-success'
                                                        : 'text-danger'
                                                }`}
                                            >
                                                {isCashSufficient
                                                    ? formatRupiah(cashChange)
                                                    : formatRupiah(
                                                          total -
                                                              parsedCashReceived,
                                                      )}
                                            </span>
                                        </div>
                                        <span className="truncate text-[11px] text-muted-foreground">
                                            {isCashSufficient
                                                ? `Rekomendasi Uang: ${getDenominationBreakdown(cashChange)}`
                                                : `Kurang ${formatRupiah(total - parsedCashReceived)}`}
                                        </span>
                                    </div>
                                </div>

                                {/* Row Pilihan Cepat Nominal Uang (Fast Cash) */}
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Pilihan Cepat Nominal Uang (Fast Cash)
                                    </span>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {fastCashChips.map((chip, idx) => {
                                            const isSelected =
                                                parsedCashReceived ===
                                                chip.amount;
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() =>
                                                        setCashReceivedInput(
                                                            formatNumberWithDots(
                                                                chip.amount,
                                                            ),
                                                        )
                                                    }
                                                    className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition-all ${
                                                        isSelected
                                                            ? 'border-transparent fx-coral shadow-sm'
                                                            : 'border-border/50 bg-secondary/60 text-foreground hover:bg-hover-soft'
                                                    }`}
                                                >
                                                    <span className="text-[10px] font-medium opacity-80">
                                                        {chip.label}
                                                    </span>
                                                    <span className="text-xs font-bold tabular-nums">
                                                        {formatRupiah(
                                                            chip.amount,
                                                        )}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Keypad Sentuh Kasir & Opsi Eksekusi */}
                                <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-[1.2fr_1fr]">
                                    {/* Keypad Sentuh Kasir */}
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Keypad Sentuh Kasir
                                        </span>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {[
                                                '1',
                                                '2',
                                                '3',
                                                '4',
                                                '5',
                                                '6',
                                                '7',
                                                '8',
                                                '9',
                                                '000',
                                                '0',
                                            ].map((digit) => (
                                                <button
                                                    key={digit}
                                                    type="button"
                                                    onClick={() =>
                                                        handleKeypadInput(digit)
                                                    }
                                                    className="flex h-12 items-center justify-center rounded-xl bg-secondary text-base font-bold text-foreground shadow-2xs transition-all hover:bg-hover-soft active:scale-95"
                                                >
                                                    {digit}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={handleKeypadBackspace}
                                                className="flex h-12 items-center justify-center rounded-xl bg-secondary text-base font-bold text-foreground shadow-2xs transition-all hover:bg-danger-soft hover:text-danger active:scale-95"
                                                aria-label="Hapus satu angka"
                                            >
                                                <Delete className="size-5" />
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleKeypadClear}
                                            className="mt-1 py-1 text-center text-xs font-semibold text-muted-foreground transition-colors hover:text-danger"
                                        >
                                            Bersihkan Input (C)
                                        </button>
                                    </div>

                                    {/* Opsi & Tombol Eksekusi Pembayaran Tunai */}
                                    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/50 bg-secondary/30 p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-foreground">
                                                Verifikasi Pembayaran
                                            </span>
                                            <p className="text-[11px] leading-relaxed text-muted-foreground">
                                                Pastikan uang fisik yang
                                                diterima dari pelanggan sesuai
                                                sebelum menekan konfirmasi.
                                            </p>
                                        </div>

                                        <div className="mt-auto flex flex-col gap-1.5">
                                            <FxButton
                                                variant="coral"
                                                size="lg"
                                                disabled={
                                                    !isCashSufficient ||
                                                    isSubmitting
                                                }
                                                onClick={() =>
                                                    executeOrder('cash')
                                                }
                                                className="w-full gap-2 py-6 text-sm font-bold shadow-md"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="size-4 animate-spin" />
                                                        <span>
                                                            Memproses...
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="size-4" />
                                                        <span>
                                                            Konfirmasi Bayar
                                                        </span>
                                                    </>
                                                )}
                                            </FxButton>
                                            <span className="text-center text-[11px] text-muted-foreground">
                                                Tekan{' '}
                                                <kbd className="rounded bg-secondary px-1 py-0.5 font-mono text-[10px]">
                                                    [Enter]
                                                </kbd>{' '}
                                                untuk eksekusi
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* ================= ALUR QRIS INSTAN ================= */
                            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-[340px_1fr]">
                                {/* Kartu Standee QRIS Resmi Khas Indonesia dengan Frame Pinggiran Merah */}
                                <div className="mx-auto flex w-full max-w-[340px] flex-col items-center rounded-3xl border-2 border-red-500/30 bg-white p-5 text-gray-900 shadow-md">
                                    {/* Header Standee: Logo QRIS & Logo GPN Merah */}
                                    <div className="mb-2.5 flex w-full items-center justify-between border-b border-gray-100 pb-2.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-black tracking-wider text-white">
                                                QRIS
                                            </span>
                                            <span className="text-[9px] leading-tight font-semibold text-gray-600">
                                                QR Code Standar
                                                <br />
                                                Pembayaran Nasional
                                            </span>
                                        </div>
                                        <div className="flex size-7 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white shadow-2xs">
                                            GPN
                                        </div>
                                    </div>

                                    {/* Nama Toko & NMID */}
                                    <div className="my-1 text-center">
                                        <p className="text-xs font-black tracking-wider text-gray-900 uppercase">
                                            {qrisPayloadData?.merchant_name ||
                                                merchant_qris?.merchant_name ||
                                                'BAROKAH COMPENY'}
                                        </p>
                                        <p className="font-mono text-[10px] font-semibold text-gray-500">
                                            NMID:{' '}
                                            {qrisPayloadData?.nmid ||
                                                merchant_qris?.nmid ||
                                                'ID1024362479726'}{' '}
                                            •{' '}
                                            {qrisPayloadData?.merchant_city ||
                                                merchant_qris?.merchant_city ||
                                                'SURABAYA'}
                                        </p>
                                    </div>

                                    {/* QR Code SVG Dinamis */}
                                    <div className="my-3 flex size-[200px] items-center justify-center rounded-2xl border border-gray-200/80 bg-white p-2 shadow-2xs">
                                        {isLoadingQris ? (
                                            <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                                                <Loader2 className="size-8 animate-spin text-red-600" />
                                                <p className="text-[11px] font-medium">
                                                    Membuat QRIS...
                                                </p>
                                            </div>
                                        ) : (
                                            <QRCodeSVG
                                                value={
                                                    qrisPayloadData?.qris_payload ||
                                                    merchant_qris?.static_payload ||
                                                    ''
                                                }
                                                size={185}
                                                level="M"
                                            />
                                        )}
                                    </div>

                                    {/* Total Nominal QRIS Terkunci */}
                                    <div className="mb-2.5 w-full rounded-xl border border-gray-200/60 bg-gray-100 p-2 text-center">
                                        <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                                            Total Nominal QRIS
                                        </span>
                                        <p className="text-lg font-black text-gray-900 tabular-nums">
                                            {formatRupiah(total)}
                                        </p>
                                    </div>

                                    {/* Logo Jaringan Pembayaran */}
                                    <div className="text-center text-[9px] font-medium text-gray-400">
                                        BCA • Mandiri • GoPay • OVO • ShopeePay
                                        • Dana
                                    </div>
                                </div>

                                {/* Panel Status Menunggu & Tombol Konfirmasi Diterima (Tanpa acquirer ref) */}
                                <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border/50 bg-secondary/30 p-5">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="size-2 animate-pulse rounded-full bg-amber-500" />
                                            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                                Status Menunggu
                                            </span>
                                            <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                                Verifikasi Kasir
                                            </span>
                                        </div>

                                        <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-card p-3.5">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                <QrCode className="size-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground">
                                                    Menunggu Pembayaran...
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                    Arahkan layar ke pelanggan
                                                    untuk scan menggunakan
                                                    m-Banking atau e-Wallet.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Countdown Timer */}
                                        <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-card p-3.5">
                                            <span className="text-xs font-semibold text-muted-foreground">
                                                Masa Berlaku Kode:
                                            </span>
                                            <span
                                                className={`text-base font-black tabular-nums ${
                                                    qrisTimeLeft < 60
                                                        ? 'animate-pulse text-danger'
                                                        : 'text-primary'
                                                }`}
                                            >
                                                {qrisMinutes}:{qrisSeconds}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons QRIS */}
                                    <div className="mt-auto flex flex-col gap-2">
                                        <FxButton
                                            variant="coral"
                                            size="lg"
                                            disabled={
                                                isSubmitting || isLoadingQris
                                            }
                                            onClick={() => executeOrder('qris')}
                                            className="w-full gap-2 py-6 text-sm font-bold shadow-md"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="size-4 animate-spin" />
                                                    <span>Memproses...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="size-4" />
                                                    <span>
                                                        Konfirmasi Diterima
                                                    </span>
                                                </>
                                            )}
                                        </FxButton>

                                        <div className="grid grid-cols-2 gap-2">
                                            <FxButton
                                                variant="soft"
                                                size="sm"
                                                onClick={refreshQris}
                                                disabled={isLoadingQris}
                                                className="gap-1.5 text-xs font-semibold"
                                            >
                                                <RefreshCw className="size-3.5" />
                                                <span>Refresh QR Baru</span>
                                            </FxButton>
                                            <FxButton
                                                variant="soft"
                                                size="sm"
                                                onClick={() =>
                                                    switchPaymentMethod('cash')
                                                }
                                                className="gap-1.5 text-xs font-semibold"
                                            >
                                                <Wallet className="size-3.5" />
                                                <span>Kembali ke Tunai</span>
                                            </FxButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageShell>
    );
}
