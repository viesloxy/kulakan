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
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { IconCircle } from '@/components/fx/fx-icon';
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

                    // Bersihkan keranjang di sessionStorage karena transaksi sukses
                    try {
                        sessionStorage.removeItem(POS_CART_STORAGE_KEY);
                    } catch {
                        // Abaikan
                    }

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
            >
                <FxCard className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                    <IconCircle icon={ShoppingBag} tone="soft" size="lg" />
                    <div>
                        <h3 className="text-base font-semibold">
                            Belum ada item di keranjang
                        </h3>
                        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                            Kembali ke kasir untuk memilih menu sebelum
                            melakukan pembayaran.
                        </p>
                    </div>
                    <FxButton
                        variant="coral"
                        onClick={handleCancelPayment}
                        className="mt-2"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke Kasir
                    </FxButton>
                </FxCard>
            </PageShell>
        );
    }

    return (
        <PageShell
            title="Pembayaran Kasir"
            description="Selesaikan transaksi pelanggan dengan metode tunai atau QRIS dinamis."
        >
            <div className="flex flex-col gap-5">
                {/* Top control bar */}
                <FxCard className="flex flex-wrap items-center justify-between gap-3 p-3.5">
                    <div className="flex items-center gap-2.5">
                        <IconCircle icon={Coffee} tone="coralSolid" size="md" />
                        <div>
                            <p className="text-sm font-semibold">Kulakan POS</p>
                            <p className="text-[11px] text-muted-foreground">
                                Terminal Kasir
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 fx-soft rounded-full px-3.5 py-1.5 text-xs font-semibold">
                            <span className="size-1.5 rounded-full bg-success" />
                            {orderType === 'dine-in'
                                ? 'Dine In'
                                : orderType === 'takeaway'
                                  ? 'Takeaway'
                                  : 'Delivery'}
                            {customerName.trim()
                                ? ` • ${customerName.trim()}`
                                : ''}
                        </span>
                        <span className="hidden items-center gap-1.5 fx-soft rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground tabular-nums sm:inline-flex">
                            <Clock className="size-3.5 text-primary" />
                            {formatIndonesianDateTime(currentTime)}
                        </span>
                        <FxButton
                            variant="soft"
                            size="sm"
                            onClick={handleCancelPayment}
                        >
                            <ArrowLeft className="size-3.5" />
                            Kembali ke Kasir
                        </FxButton>
                    </div>
                </FxCard>

                {/* Layout 2 Kolom: Kiri (Rincian Pesanan) & Kanan (Panel Pembayaran) */}
                <div className="grid items-start gap-5 lg:grid-cols-[380px_1fr] xl:grid-cols-[400px_1fr]">
                    {/* Kolom Kiri: Rincian Pesanan */}
                    <FxCard className="flex flex-col gap-3.5 p-5">
                        <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
                            <IconCircle
                                icon={ReceiptText}
                                tone="coral"
                                size="md"
                            />
                            <div>
                                <h2 className="text-sm font-semibold">
                                    Rincian pesanan
                                </h2>
                                <p className="text-[11px] text-muted-foreground">
                                    {totalItemsCount} item
                                    {customerName.trim()
                                        ? ` • ${customerName.trim()}`
                                        : ''}
                                </p>
                            </div>
                        </div>

                        {/* Daftar Item Pesanan Scrollable */}
                        <div className="flex max-h-[360px] flex-col gap-2.5 overflow-y-auto pr-1">
                            {items.map((item) => (
                                <div
                                    key={item.menu_id}
                                    className="flex items-center justify-between gap-3 fx-soft p-2.5"
                                >
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-card text-xs font-bold tabular-nums">
                                            {item.qty}x
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-semibold">
                                                {item.name}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground tabular-nums">
                                                @ {formatRupiah(item.price)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-xs font-bold tabular-nums">
                                        {formatRupiah(
                                            Number(item.price) * item.qty,
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Ringkasan & Total Tagihan */}
                        <div className="flex flex-col gap-2.5 border-t border-border/50 pt-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Subtotal ({totalItemsCount} item)</span>
                                <span className="font-semibold text-foreground tabular-nums">
                                    {formatRupiah(total)}
                                </span>
                            </div>

                            <FxSoft className="flex items-center justify-between p-4">
                                <div>
                                    <span className="text-[11px] font-semibold text-muted-foreground">
                                        Total tagihan
                                    </span>
                                    <p className="text-[11px] text-muted-foreground">
                                        Harga sudah nett
                                    </p>
                                </div>
                                <span className="text-2xl font-bold tabular-nums">
                                    {formatRupiah(total)}
                                </span>
                            </FxSoft>
                        </div>
                    </FxCard>

                    {/* Kolom Kanan: Panel Pembayaran (Tunai atau QRIS) */}
                    <FxCard className="flex flex-col gap-4 p-4 sm:p-5">
                        {/* Segmented Switcher Metode Pembayaran */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">
                                Pilih metode pembayaran
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => switchPaymentMethod('cash')}
                                    className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all ${
                                        checkoutPaymentMethod === 'cash'
                                            ? 'fx-coral shadow-xs'
                                            : 'bg-secondary text-foreground hover:bg-hover-soft'
                                    }`}
                                >
                                    <Wallet className="size-4" />
                                    Tunai
                                    <kbd className="rounded-md bg-black/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                                        F1
                                    </kbd>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => switchPaymentMethod('qris')}
                                    className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all ${
                                        checkoutPaymentMethod === 'qris'
                                            ? 'fx-coral shadow-xs'
                                            : 'bg-secondary text-foreground hover:bg-hover-soft'
                                    }`}
                                >
                                    <QrCode className="size-4" />
                                    QRIS
                                    <kbd className="rounded-md bg-black/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                                        F2
                                    </kbd>
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
                                    <FxSoft className="flex flex-col justify-between p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-muted-foreground">
                                                Uang diterima
                                            </span>
                                            <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold text-primary">
                                                Input aktif
                                            </span>
                                        </div>
                                        <div className="my-2.5">
                                            <span className="text-2xl font-bold tabular-nums sm:text-3xl">
                                                Rp {cashReceivedInput || '0'}
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-muted-foreground">
                                            Total wajib bayar{' '}
                                            <span className="font-semibold text-foreground">
                                                {formatRupiah(total)}
                                            </span>
                                        </span>
                                    </FxSoft>

                                    {/* Card 2: Kembalian Pelanggan */}
                                    <div
                                        className={`flex flex-col justify-between rounded-[1.125rem] p-4 transition-colors ${
                                            isCashSufficient
                                                ? 'bg-success-soft'
                                                : 'bg-danger-soft'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-muted-foreground">
                                                Kembalian pelanggan
                                            </span>
                                            <span
                                                className={`rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold ${
                                                    isCashSufficient
                                                        ? 'text-success'
                                                        : 'text-danger'
                                                }`}
                                            >
                                                {isCashSufficient
                                                    ? 'Cukup'
                                                    : 'Uang kurang'}
                                            </span>
                                        </div>
                                        <div className="my-2.5">
                                            <span
                                                className={`text-2xl font-bold tabular-nums sm:text-3xl ${
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
                                                ? `Rekomendasi uang: ${getDenominationBreakdown(cashChange)}`
                                                : `Kurang ${formatRupiah(total - parsedCashReceived)}`}
                                        </span>
                                    </div>
                                </div>

                                {/* Row Pilihan Cepat Nominal Uang (Fast Cash) */}
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        Pilihan cepat nominal
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
                                                    className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl p-2.5 text-center transition-all ${
                                                        isSelected
                                                            ? 'fx-coral shadow-xs'
                                                            : 'fx-soft text-foreground hover:bg-hover-soft'
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
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            Keypad sentuh
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
                                                    className="flex h-12 items-center justify-center rounded-xl bg-secondary text-base font-semibold text-foreground tabular-nums transition-all hover:bg-hover-soft active:scale-95"
                                                >
                                                    {digit}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={handleKeypadBackspace}
                                                className="flex h-12 items-center justify-center rounded-xl bg-secondary text-foreground transition-all hover:bg-danger-soft hover:text-danger active:scale-95"
                                                aria-label="Hapus satu angka"
                                            >
                                                <Delete className="size-5" />
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleKeypadClear}
                                            className="mt-1 rounded-full py-1.5 text-center text-xs font-semibold text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
                                        >
                                            Bersihkan input (C)
                                        </button>
                                    </div>

                                    {/* Opsi & Tombol Eksekusi Pembayaran Tunai */}
                                    <FxSoft className="flex flex-col justify-between gap-4 p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-semibold">
                                                Verifikasi pembayaran
                                            </span>
                                            <p className="text-[11px] leading-relaxed text-muted-foreground">
                                                Pastikan uang fisik yang
                                                diterima dari pelanggan sesuai
                                                sebelum menekan konfirmasi.
                                            </p>
                                        </div>

                                        <div className="mt-auto flex flex-col gap-2">
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
                                                className="w-full"
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
                                                            Konfirmasi bayar
                                                        </span>
                                                    </>
                                                )}
                                            </FxButton>
                                            <span className="text-center text-[11px] text-muted-foreground">
                                                Tekan{' '}
                                                <kbd className="rounded bg-secondary px-1 py-0.5 font-mono text-[10px]">
                                                    Enter
                                                </kbd>{' '}
                                                untuk eksekusi
                                            </span>
                                        </div>
                                    </FxSoft>
                                </div>
                            </div>
                        ) : (
                            /* ================= ALUR QRIS ================= */
                            <div className="grid grid-cols-1 items-stretch gap-4">
                                {/* Kartu Standee QRIS */}
                                <div className="mx-auto flex w-full max-w-[340px] flex-col items-center rounded-3xl bg-secondary p-5">
                                    {/* Header Standee: Label QRIS & GPN */}
                                    <div className="mb-2.5 flex w-full items-center justify-between border-b border-border/50 pb-2.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="rounded-md fx-coral px-2 py-0.5 text-[11px] font-bold tracking-wide">
                                                QRIS
                                            </span>
                                            <span className="text-[9px] leading-tight font-semibold text-muted-foreground">
                                                QR Code Standar
                                                <br />
                                                Pembayaran Nasional
                                            </span>
                                        </div>
                                        <span className="flex size-7 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                                            GPN
                                        </span>
                                    </div>

                                    {/* Nama Toko & NMID */}
                                    <div className="my-1 text-center">
                                        <p className="text-xs font-bold tracking-wide text-foreground uppercase">
                                            {qrisPayloadData?.merchant_name ||
                                                merchant_qris?.merchant_name ||
                                                'Barokah Compeny'}
                                        </p>
                                        <p className="font-mono text-[10px] font-semibold text-muted-foreground">
                                            NMID:{' '}
                                            {qrisPayloadData?.nmid ||
                                                merchant_qris?.nmid ||
                                                'ID1024362479726'}{' '}
                                            •{' '}
                                            {qrisPayloadData?.merchant_city ||
                                                merchant_qris?.merchant_city ||
                                                'Surabaya'}
                                        </p>
                                    </div>

                                    {/* QR Code SVG Dinamis */}
                                    <div className="my-3 flex size-[200px] items-center justify-center rounded-2xl bg-card p-2">
                                        {isLoadingQris ? (
                                            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                <Loader2 className="size-8 animate-spin text-primary" />
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
                                                size={178}
                                                level="M"
                                            />
                                        )}
                                    </div>

                                    {/* Total Nominal QRIS Terkunci */}
                                    <div className="mb-2.5 w-full rounded-2xl bg-card p-2.5 text-center">
                                        <span className="text-[10px] font-semibold text-muted-foreground">
                                            Total nominal QRIS
                                        </span>
                                        <p className="text-lg font-bold text-primary tabular-nums">
                                            {formatRupiah(total)}
                                        </p>
                                    </div>

                                    {/* Logo Jaringan Pembayaran */}
                                    <div className="text-center text-[9px] font-medium text-muted-foreground">
                                        BCA • Mandiri • GoPay • OVO • ShopeePay
                                        • Dana
                                    </div>
                                </div>

                                {/* Panel Status & Konfirmasi QRIS */}
                                <FxSoft className="flex flex-col justify-between gap-4 p-5">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="size-2 animate-pulse rounded-full bg-warning" />
                                            <span className="text-xs font-semibold text-muted-foreground">
                                                Status menunggu
                                            </span>
                                            <span className="ml-auto rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-semibold text-warning-ink">
                                                Verifikasi kasir
                                            </span>
                                        </div>

                                        <div className="flex items-start gap-3 rounded-2xl bg-card p-3.5">
                                            <IconCircle
                                                icon={QrCode}
                                                tone="coral"
                                                size="md"
                                            />
                                            <div>
                                                <p className="text-xs font-semibold">
                                                    Menunggu pembayaran
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                    Arahkan layar ke pelanggan
                                                    untuk discan lewat m-Banking
                                                    atau e-Wallet.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Countdown Timer */}
                                        <div className="flex items-center justify-between rounded-2xl bg-card p-3.5">
                                            <span className="text-xs font-semibold text-muted-foreground">
                                                Masa berlaku kode
                                            </span>
                                            <span
                                                className={`text-base font-bold tabular-nums ${
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
                                            className="w-full"
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
                                                        Konfirmasi diterima
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
                                            >
                                                <RefreshCw className="size-3.5" />
                                                Refresh QR
                                            </FxButton>
                                            <FxButton
                                                variant="soft"
                                                size="sm"
                                                onClick={() =>
                                                    switchPaymentMethod('cash')
                                                }
                                            >
                                                <Wallet className="size-3.5" />
                                                Kembali ke tunai
                                            </FxButton>
                                        </div>
                                    </div>
                                </FxSoft>
                            </div>
                        )}
                    </FxCard>
                </div>
            </div>
        </PageShell>
    );
}
