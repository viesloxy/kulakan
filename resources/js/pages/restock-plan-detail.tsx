import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Ban,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    Mail,
    MessageCircle,
    Minus,
    Package,
    PackageCheck,
    Plus,
    Printer,
    RotateCcw,
    Search,
    Send,
    Truck,
    User as UserIcon,
    Wallet,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { FxField, FxInput, FxModal, FxTextarea } from '@/components/fx/fx-form';
import Reveal from '@/components/motion/reveal';
import PageShell from '@/components/page-shell';
import { formatPercent, formatRupiah } from '@/lib/format';

type Abc = 'A' | 'B' | 'C';
type BaseUnit = 'gram' | 'ml' | 'pcs';
type Label =
    | 'beli_sekarang'
    | 'beli_sekarang_parsial'
    | 'beli_opsional'
    | 'tahan_dulu'
    | 'kas_tidak_cukup';

type PlanStatus = 'draft' | 'approved' | 'ordered' | 'purchased' | 'cancelled';

type DetailedItem = {
    id: number;
    ingredient_id: number;
    ingredient_name: string;
    base_unit: BaseUnit;
    package_size: string;
    package_price: number;
    current_stock: number;
    minimum_stock: number;
    abc_class: Abc;
    is_urgent: boolean;
    urgency: string | null;
    priority_score: string | null;
    qmin_packages: number;
    qtarget_packages: number;
    recommended_packages: number;
    estimated_cost: number;
    actual_cost: number | null;
    label: Label;
    purchased_packages: number | null;
    notes: string | null;
};

type DetailedPlan = {
    id: number;
    status: PlanStatus;
    cash_amount: number;
    total_cost: number;
    actual_cost: number | null;
    remaining_cash: number;
    created_at: string | null;
    approved_at: string | null;
    ordered_at: string | null;
    purchased_at: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    notes: string | null;
    creator: {
        id: number;
        name: string;
        role: string;
    } | null;
    items: DetailedItem[];
};

type RecentPlanItem = {
    id: number;
    status: PlanStatus;
    cash_amount: number;
    total_cost: number;
    remaining_cash: number;
    created_at: string | null;
    creator_name: string | null;
    items_count: number;
};

type Props = {
    plan: DetailedPlan;
    recent_plans: RecentPlanItem[];
};

const abcTone: Record<Abc, { bg: string; text: string }> = {
    A: { bg: 'bg-coral-soft', text: 'text-primary' },
    B: { bg: 'bg-info-soft', text: 'text-info' },
    C: { bg: 'bg-secondary', text: 'text-muted-foreground' },
};

const labelConfig: Record<Label, { text: string; cls: string }> = {
    beli_sekarang: {
        text: 'Beli sekarang',
        cls: 'bg-success-soft text-success',
    },
    beli_sekarang_parsial: {
        text: 'Beli sebagian',
        cls: 'bg-warning-soft text-warning-ink',
    },
    beli_opsional: {
        text: 'Beli opsional',
        cls: 'bg-info-soft text-info',
    },
    tahan_dulu: {
        text: 'Tahan dulu',
        cls: 'bg-secondary text-muted-foreground',
    },
    kas_tidak_cukup: {
        text: 'Kas tidak cukup',
        cls: 'bg-danger-soft text-danger',
    },
};

const statusLabel: Record<PlanStatus, string> = {
    draft: 'Draft',
    approved: 'Disetujui',
    ordered: 'Dipesan',
    purchased: 'Selesai',
    cancelled: 'Dibatalkan',
};

const statusBadgeCls: Record<PlanStatus, string> = {
    draft: 'bg-warning-soft text-warning-ink border border-warning/30',
    approved: 'bg-info-soft text-info border border-info/30',
    ordered:
        'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30',
    purchased: 'bg-success-soft text-success border border-success/30',
    cancelled: 'bg-danger-soft text-danger border border-danger/30',
};

function formatDateTime(isoString: string | null): string {
    if (!isoString) return '-';
    try {
        const d = new Date(isoString);
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(d);
    } catch {
        return isoString;
    }
}

export default function RestockPlanDetail({ plan, recent_plans }: Props) {
    const [filterTab, setFilterTab] = useState<
        'all' | 'recommended' | 'urgent'
    >('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [copied, setCopied] = useState(false);

    // Modal states
    const [receivingOpen, setReceivingOpen] = useState(false);
    const [dispatchOpen, setDispatchOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);

    // Cancel modal state
    const [cancelReason, setCancelReason] = useState('Salah estimasi kas');
    const [customReason, setCustomReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    // Dispatch PO modal state
    const [dispatchTab, setDispatchTab] = useState<'wa' | 'email'>('wa');
    const [supplierWa, setSupplierWa] = useState('');
    const [supplierEmail, setSupplierEmail] = useState('');
    const [orderNotes, setOrderNotes] = useState(plan.notes ?? '');
    const [customPoText, setCustomPoText] = useState('');
    const [isPoCustomized, setIsPoCustomized] = useState(false);
    const [isOrdering, setIsOrdering] = useState(false);

    // Receiving modal state (items realization input)
    type RealizationRow = {
        ingredient_id: number;
        ingredient_name: string;
        package_size: string;
        base_unit: string;
        purchased_packages: number;
        actual_package_price: number;
        notes: string;
    };

    const [receivingItems, setReceivingItems] = useState<RealizationRow[]>([]);
    const [receivingNotes, setReceivingNotes] = useState('');
    const [isReceiving, setIsReceiving] = useState(false);

    const usedPct =
        plan.cash_amount > 0
            ? Math.min(100, (plan.total_cost / plan.cash_amount) * 100)
            : 0;

    const recommendedItems = useMemo(
        () => plan.items.filter((it) => it.recommended_packages > 0),
        [plan.items],
    );

    const urgentItems = useMemo(
        () => plan.items.filter((it) => it.is_urgent),
        [plan.items],
    );

    const filteredItems = useMemo(() => {
        let items = plan.items;
        if (filterTab === 'recommended') {
            items = recommendedItems;
        } else if (filterTab === 'urgent') {
            items = urgentItems;
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            items = items.filter(
                (it) =>
                    it.ingredient_name.toLowerCase().includes(q) ||
                    it.abc_class.toLowerCase().includes(q) ||
                    (it.label && it.label.toLowerCase().includes(q)),
            );
        }

        return items;
    }, [plan.items, filterTab, recommendedItems, urgentItems, searchQuery]);

    // Stepper logic
    const steps = [
        { key: 'draft', label: '1. Draft', timestamp: plan.created_at },
        { key: 'approved', label: '2. Disetujui', timestamp: plan.approved_at },
        { key: 'ordered', label: '3. Dipesan', timestamp: plan.ordered_at },
        {
            key: 'purchased',
            label: '4. Diterima',
            timestamp: plan.purchased_at,
        },
    ];

    const currentStepIndex = useMemo(() => {
        if (plan.status === 'purchased') return 3;
        if (plan.status === 'ordered') return 2;
        if (plan.status === 'approved') return 1;
        if (plan.status === 'draft') return 0;
        return -1; // cancelled
    }, [plan.status]);

    // Action Handlers
    function handleApprove() {
        router.post(
            `/restock/plans/${plan.id}/approve`,
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Rencana belanja berhasil disetujui!'),
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ?? 'Gagal menyetujui rencana.',
                    ),
            },
        );
    }

    function handleOpenDispatchModal() {
        setOrderNotes(plan.notes ?? '');
        setIsPoCustomized(false);
        setCustomPoText('');
        setDispatchOpen(true);
    }

    function handleConfirmOrder(via: 'wa' | 'email' | 'direct') {
        setIsOrdering(true);
        router.post(
            `/restock/plans/${plan.id}/order`,
            { notes: orderNotes },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDispatchOpen(false);
                    toast.success('Rencana berhasil ditandai dipesan!', {
                        description:
                            'Menunggu konfirmasi kedatangan barang dari supplier.',
                    });

                    if (via === 'wa') {
                        const cleanPhone = supplierWa.replace(/[^0-9]/g, '');
                        const waUrl = cleanPhone
                            ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(activePoText)}`
                            : `https://wa.me/?text=${encodeURIComponent(activePoText)}`;
                        window.open(waUrl, '_blank');
                    } else if (via === 'email') {
                        const mailSubject = encodeURIComponent(
                            `Purchase Order #${plan.id} - Kulakan Coffee & Resto`,
                        );
                        const mailBody = encodeURIComponent(activePoText);
                        const mailToUrl = supplierEmail.trim()
                            ? `mailto:${supplierEmail.trim()}?subject=${mailSubject}&body=${mailBody}`
                            : `mailto:?subject=${mailSubject}&body=${mailBody}`;
                        window.open(mailToUrl, '_blank');
                    }
                },
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ??
                            'Gagal mengubah status rencana.',
                    ),
                onFinish: () => setIsOrdering(false),
            },
        );
    }

    function handleOpenReceivingModal() {
        // Initialize rows with recommended items (or all items if recommended is empty)
        const itemsToInitialize =
            recommendedItems.length > 0 ? recommendedItems : plan.items;

        setReceivingItems(
            itemsToInitialize.map((it) => ({
                ingredient_id: it.ingredient_id,
                ingredient_name: it.ingredient_name,
                package_size: it.package_size,
                base_unit: it.base_unit,
                purchased_packages: it.recommended_packages,
                actual_package_price: it.package_price,
                notes: '',
            })),
        );
        setReceivingNotes('');
        setReceivingOpen(true);
    }

    function handleUpdateReceivingRow(
        ingredientId: number,
        field: keyof RealizationRow,
        value: string | number,
    ) {
        setReceivingItems((prev) =>
            prev.map((row) =>
                row.ingredient_id === ingredientId
                    ? { ...row, [field]: value }
                    : row,
            ),
        );
    }

    const calculatedActualTotal = useMemo(() => {
        return receivingItems.reduce(
            (sum, row) =>
                sum + row.purchased_packages * row.actual_package_price,
            0,
        );
    }, [receivingItems]);

    function handleSubmitReceiving() {
        setIsReceiving(true);
        router.post(
            `/restock/plans/${plan.id}/purchase`,
            {
                items: receivingItems.map((r) => ({
                    ingredient_id: r.ingredient_id,
                    purchased_packages: r.purchased_packages,
                    actual_package_price: r.actual_package_price,
                    notes: r.notes || null,
                })),
                notes: receivingNotes || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReceivingOpen(false);
                    toast.success('Penerimaan barang berhasil disahkan!', {
                        description:
                            'Stok inventori telah disesuaikan dengan kuantitas faktual.',
                    });
                },
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ??
                            'Gagal menyelesaikan penerimaan barang.',
                    ),
                onFinish: () => setIsReceiving(false),
            },
        );
    }

    function handleConfirmCancel() {
        const finalReason =
            cancelReason === 'Lainnya' ? customReason : cancelReason;
        if (!finalReason.trim()) {
            toast.error('Harap isi alasan pembatalan.');
            return;
        }

        setIsCancelling(true);
        router.post(
            `/restock/plans/${plan.id}/cancel`,
            { reason: finalReason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCancelOpen(false);
                    toast.success('Rencana berhasil dibatalkan.');
                },
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ??
                            'Gagal membatalkan rencana.',
                    ),
                onFinish: () => setIsCancelling(false),
            },
        );
    }

    function handlePrint() {
        window.print();
    }

    const defaultPoText = useMemo(() => {
        const lines = [
            `📦 *PURCHASE ORDER (PO) #${plan.id}*`,
            `Outlet/Toko: Kulakan Coffee & Resto`,
            `Tanggal: ${formatDateTime(plan.ordered_at ?? plan.created_at)}`,
            `Pemesan: ${plan.creator?.name ?? 'Owner'}`,
            `----------------------------------------`,
            `*RINCIAN BAHAN BAKU:*`,
        ];

        recommendedItems.forEach((it, idx) => {
            lines.push(
                `${idx + 1}. *${it.ingredient_name}* : ${it.recommended_packages} pack (${it.package_size} ${it.base_unit}/pack) ~ ${formatRupiah(it.estimated_cost)}`,
            );
        });

        lines.push(`----------------------------------------`);
        lines.push(`Estimasi Total: *${formatRupiah(plan.total_cost)}*`);
        if (orderNotes) {
            lines.push(`Catatan: ${orderNotes}`);
        }
        lines.push(
            `\nMohon konfirmasi ketersediaan stok & estimasi jadwal pengiriman. Terima kasih! 🙏`,
        );

        return lines.join('\n');
    }, [
        plan.id,
        plan.ordered_at,
        plan.created_at,
        plan.creator?.name,
        plan.total_cost,
        recommendedItems,
        orderNotes,
    ]);

    const activePoText = isPoCustomized ? customPoText : defaultPoText;

    function handleCopyText() {
        void navigator.clipboard.writeText(activePoText).then(() => {
            setCopied(true);
            toast.success('Format pesanan disalin ke clipboard!', {
                description:
                    'Siap dikirimkan ke WhatsApp sales atau catatan supplier.',
            });
            setTimeout(() => setCopied(false), 2500);
        });
    }

    return (
        <PageShell
            title={
                <div className="flex flex-col gap-1.5">
                    <Link
                        href="/restock"
                        className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground print:hidden"
                    >
                        <ArrowLeft className="size-3.5" />
                        Kembali ke Restock Planner
                    </Link>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-xl font-bold tracking-tight sm:text-2xl">
                            Rencana Belanja #{plan.id}
                        </span>
                        <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeCls[plan.status]}`}
                        >
                            {statusLabel[plan.status]}
                        </span>
                    </div>
                </div>
            }
            headTitle={`Rencana Belanja #${plan.id} | Kulakan`}
            description={`Alokasi anggaran kas, rekomendasi kuantitas bahan, dan status realisasi pembelian.`}
            actions={
                <div className="flex flex-wrap items-center gap-2 print:hidden">
                    <FxButton
                        variant="soft"
                        className="h-9 px-3 text-xs"
                        onClick={handleCopyText}
                    >
                        {copied ? (
                            <Check className="size-3.5 text-success" />
                        ) : (
                            <Copy className="size-3.5" />
                        )}
                        <span>{copied ? 'Tersalin' : 'Salin Pesanan'}</span>
                    </FxButton>
                    <FxButton
                        variant="soft"
                        className="h-9 px-3 text-xs"
                        onClick={handlePrint}
                    >
                        <Printer className="size-3.5" />
                        <span>Cetak PO</span>
                    </FxButton>

                    {/* Contextual Actions based on status */}
                    {plan.status === 'draft' ? (
                        <>
                            <FxButton
                                variant="soft"
                                className="h-9 px-3 text-xs text-danger hover:bg-danger-soft"
                                onClick={() => setCancelOpen(true)}
                            >
                                <Ban className="size-3.5" />
                                <span>Batalkan</span>
                            </FxButton>
                            <FxButton
                                variant="soft"
                                className="h-9 px-3 text-xs text-info hover:bg-info-soft"
                                onClick={handleApprove}
                            >
                                <CheckCircle2 className="size-3.5" />
                                <span>Setujui</span>
                            </FxButton>
                            <FxButton
                                variant="coral"
                                className="h-9 px-3.5 text-xs"
                                onClick={handleOpenDispatchModal}
                            >
                                <Send className="size-3.5" />
                                <span>Pesan (Kirim PO)</span>
                            </FxButton>
                        </>
                    ) : null}

                    {plan.status === 'approved' ? (
                        <>
                            <FxButton
                                variant="soft"
                                className="h-9 px-3 text-xs text-danger hover:bg-danger-soft"
                                onClick={() => setCancelOpen(true)}
                            >
                                <Ban className="size-3.5" />
                                <span>Batalkan</span>
                            </FxButton>
                            <FxButton
                                variant="coral"
                                className="h-9 px-3.5 text-xs"
                                onClick={handleOpenDispatchModal}
                            >
                                <Send className="size-3.5" />
                                <span>Pesan (Kirim PO)</span>
                            </FxButton>
                        </>
                    ) : null}

                    {plan.status === 'ordered' ? (
                        <>
                            <FxButton
                                variant="soft"
                                className="h-9 px-3 text-xs text-danger hover:bg-danger-soft"
                                onClick={() => setCancelOpen(true)}
                            >
                                <Ban className="size-3.5" />
                                <span>Batalkan</span>
                            </FxButton>
                            <FxButton
                                variant="coral"
                                className="h-9 px-3.5 text-xs"
                                onClick={handleOpenReceivingModal}
                            >
                                <PackageCheck className="size-3.5" />
                                <span>Konfirmasi Terima Barang</span>
                            </FxButton>
                        </>
                    ) : null}
                </div>
            }
        >
            <Head>
                <style type="text/css">
                    {`
                        @media print {
                            nav, aside, header, .print\\:hidden { display: none !important; }
                            body { background: white !important; color: black !important; font-size: 11pt; }
                            .fx-card, .fx-soft { border: 1px solid #ccc !important; box-shadow: none !important; }
                        }
                    `}
                </style>
            </Head>

            {/* Visual Stepper Lifecycle */}
            <Reveal delay={0.02}>
                <FxCard className="p-3.5 sm:p-5">
                    {plan.status === 'cancelled' ? (
                        <div className="flex flex-col gap-1 rounded-xl bg-danger-soft/60 p-3 text-danger sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <Ban className="size-4 shrink-0" />
                                <span className="text-xs font-semibold sm:text-sm">
                                    Rencana Belanja Ini Telah Dibatalkan
                                </span>
                            </div>
                            <span className="text-xs">
                                Alasan: &quot;
                                {plan.cancellation_reason ?? 'Dibatalkan'}&quot;
                                • {formatDateTime(plan.cancelled_at)}
                            </span>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
                                {steps.map((st, idx) => {
                                    const isCompleted = idx <= currentStepIndex;
                                    const isCurrent = idx === currentStepIndex;

                                    return (
                                        <div
                                            key={st.key}
                                            className={`flex flex-col rounded-xl p-2.5 transition-all sm:p-3 ${
                                                isCurrent
                                                    ? 'border border-primary/40 bg-primary/10 font-semibold'
                                                    : isCompleted
                                                      ? 'bg-secondary/70 opacity-90'
                                                      : 'bg-secondary/40 opacity-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                                        isCurrent
                                                            ? 'bg-primary text-primary-foreground'
                                                            : isCompleted
                                                              ? 'text-success-foreground bg-success'
                                                              : 'bg-muted-foreground/30 text-muted-foreground'
                                                    }`}
                                                >
                                                    {isCompleted &&
                                                    !isCurrent ? (
                                                        <Check className="size-3" />
                                                    ) : (
                                                        idx + 1
                                                    )}
                                                </div>
                                                <span className="text-xs font-semibold">
                                                    {st.label}
                                                </span>
                                            </div>
                                            <span className="mt-1.5 truncate text-[11px] text-muted-foreground">
                                                {st.timestamp
                                                    ? formatDateTime(
                                                          st.timestamp,
                                                      )
                                                    : isCurrent
                                                      ? 'Tahap aktif saat ini'
                                                      : 'Menunggu'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </FxCard>
            </Reveal>

            {/* Status Information Banner */}
            {plan.status === 'purchased' ? (
                <Reveal delay={0.04}>
                    <FxSoft className="flex items-center gap-3 border-success/30 bg-success-soft/50 p-3.5 text-xs text-foreground sm:p-4 sm:text-sm">
                        <CheckCircle2 className="size-5 shrink-0 text-success" />
                        <div className="flex-1">
                            <p className="font-semibold text-success">
                                Rencana restock ini telah selesai dan barang
                                telah diterima.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Diverifikasi pada{' '}
                                {formatDateTime(plan.purchased_at)}. Seluruh
                                stok bahan baku telah otomatis masuk ke
                                inventori.
                            </p>
                        </div>
                    </FxSoft>
                </Reveal>
            ) : plan.status === 'ordered' ? (
                <Reveal delay={0.04}>
                    <FxSoft className="flex items-center gap-3 border-purple-500/30 bg-purple-500/10 p-3.5 text-xs text-foreground sm:p-4 sm:text-sm">
                        <Truck className="size-5 shrink-0 text-purple-600 dark:text-purple-400" />
                        <div className="flex-1">
                            <p className="font-semibold text-purple-600 dark:text-purple-400">
                                Pesanan telah dikirimkan ke supplier (Status:
                                Dipesan).
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Dipesan pada {formatDateTime(plan.ordered_at)}.
                                Saat barang tiba di toko, klik tombol
                                &apos;Konfirmasi Terima Barang&apos; untuk
                                memeriksa dan memasukkan stok fisik.
                            </p>
                        </div>
                        <FxButton
                            variant="coral"
                            className="h-8 px-3 text-xs"
                            onClick={handleOpenReceivingModal}
                        >
                            <PackageCheck className="size-3.5" />
                            Terima Barang
                        </FxButton>
                    </FxSoft>
                </Reveal>
            ) : plan.status === 'approved' ? (
                <Reveal delay={0.04}>
                    <FxSoft className="flex items-center gap-3 border-info/30 bg-info-soft/40 p-3.5 text-xs text-foreground sm:p-4 sm:text-sm">
                        <CheckCircle2 className="size-5 shrink-0 text-info" />
                        <div className="flex-1">
                            <p className="font-semibold text-info">
                                Anggaran rencana belanja telah disetujui.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Disetujui pada{' '}
                                {formatDateTime(plan.approved_at)}. Silakan
                                kirimkan dokumen PO ke supplier via WhatsApp
                                atau email.
                            </p>
                        </div>
                        <FxButton
                            variant="coral"
                            className="h-8 px-3 text-xs"
                            onClick={handleOpenDispatchModal}
                        >
                            <Send className="size-3.5" />
                            Kirim PO
                        </FxButton>
                    </FxSoft>
                </Reveal>
            ) : plan.status === 'draft' ? (
                <Reveal delay={0.04}>
                    <FxSoft className="flex items-center gap-3 border-warning/30 bg-warning-soft/40 p-3.5 text-xs text-foreground sm:p-4 sm:text-sm">
                        <Clock className="size-5 shrink-0 text-warning-ink" />
                        <div className="flex-1">
                            <p className="font-semibold text-warning-ink">
                                Rencana ini masih berstatus Draft.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Anda dapat memeriksa rincian kebutuhan bahan di
                                bawah, menyetujui anggaran, atau langsung
                                mengirimkan PO pesanan ke supplier.
                            </p>
                        </div>
                    </FxSoft>
                </Reveal>
            ) : null}

            {/* 4 KPI Cards */}
            <Reveal delay={0.06}>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <FxCard className="p-3.5 sm:p-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Wallet className="size-3.5" />
                            <span>Kas Dialokasikan</span>
                        </div>
                        <p className="mt-1.5 text-lg font-bold tracking-tight tabular-nums sm:text-2xl">
                            {formatRupiah(plan.cash_amount)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Budget belanja awal
                        </p>
                    </FxCard>

                    <FxCard className="p-3.5 sm:p-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Package className="size-3.5" />
                            <span>
                                {plan.actual_cost
                                    ? 'Total Realisasi Biaya'
                                    : 'Estimasi Total Biaya'}
                            </span>
                        </div>
                        <p className="mt-1.5 text-lg font-bold tracking-tight text-primary tabular-nums sm:text-2xl">
                            {formatRupiah(plan.actual_cost ?? plan.total_cost)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {plan.actual_cost
                                ? `${formatPercent((plan.actual_cost / plan.cash_amount) * 100, 1)} dari kas`
                                : `${formatPercent(usedPct, 1)} dari kas`}
                        </p>
                    </FxCard>

                    <FxCard className="p-3.5 sm:p-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Wallet className="size-3.5" />
                            <span>Sisa Kas Anggaran</span>
                        </div>
                        <p className="mt-1.5 text-lg font-bold tracking-tight text-success tabular-nums sm:text-2xl">
                            {formatRupiah(
                                plan.actual_cost
                                    ? Math.max(
                                          0,
                                          plan.cash_amount - plan.actual_cost,
                                      )
                                    : plan.remaining_cash,
                            )}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Efisiensi dana belanja
                        </p>
                    </FxCard>

                    <FxCard className="p-3.5 sm:p-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Package className="size-3.5" />
                            <span>Bahan Direkomendasikan</span>
                        </div>
                        <p className="mt-1.5 text-lg font-bold tracking-tight tabular-nums sm:text-2xl">
                            {recommendedItems.length}
                            <span className="text-xs font-normal text-muted-foreground sm:text-sm">
                                {' '}
                                / {plan.items.length} bahan
                            </span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {urgentItems.length} bahan berstatus urgent
                        </p>
                    </FxCard>
                </div>
            </Reveal>

            {/* Main Content: Items Table + Sidebar History */}
            <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[1fr_300px]">
                {/* Left: Items Table */}
                <Reveal delay={0.08} className="w-full min-w-0">
                    <FxCard className="flex min-w-0 flex-col gap-4 p-3.5 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base font-semibold">
                                    Rincian Bahan Baku
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Daftar bahan baku yang dievaluasi algoritma
                                    restock berdasarkan kelas ABC dan kas
                                    tersedia.
                                </p>
                            </div>

                            {/* Search input */}
                            <div className="relative w-full sm:w-64 print:hidden">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Cari nama bahan..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="h-8 w-full rounded-lg border border-border bg-card pr-3 pl-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs print:hidden">
                            <button
                                type="button"
                                onClick={() => setFilterTab('all')}
                                className={`rounded-full px-3 py-1 font-semibold transition-all ${
                                    filterTab === 'all'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary text-muted-foreground hover:bg-hover-soft'
                                }`}
                            >
                                Semua ({plan.items.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterTab('recommended')}
                                className={`rounded-full px-3 py-1 font-semibold transition-all ${
                                    filterTab === 'recommended'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary text-muted-foreground hover:bg-hover-soft'
                                }`}
                            >
                                Rekomendasi Beli ({recommendedItems.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterTab('urgent')}
                                className={`rounded-full px-3 py-1 font-semibold transition-all ${
                                    filterTab === 'urgent'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary text-muted-foreground hover:bg-hover-soft'
                                }`}
                            >
                                Urgent ({urgentItems.length})
                            </button>
                        </div>

                        {/* Table */}
                        <div className="w-full max-w-full overflow-x-auto rounded-xl">
                            <table className="w-full min-w-[620px] text-sm">
                                <thead>
                                    <tr className="bg-secondary text-left text-xs text-muted-foreground">
                                        <th className="rounded-l-xl px-3 py-2.5 font-medium">
                                            Bahan Baku
                                        </th>
                                        <th className="px-3 py-2.5 text-center font-medium">
                                            Kelas
                                        </th>
                                        <th className="px-3 py-2.5 text-right font-medium">
                                            Target
                                        </th>
                                        <th className="px-3 py-2.5 text-right font-medium">
                                            Rekomendasi
                                        </th>
                                        <th className="px-3 py-2.5 text-right font-medium">
                                            {plan.status === 'purchased'
                                                ? 'Realisasi Biaya'
                                                : 'Estimasi'}
                                        </th>
                                        {plan.status === 'purchased' ? (
                                            <th className="px-3 py-2.5 text-right font-medium">
                                                Realisasi Masuk
                                            </th>
                                        ) : null}
                                        <th className="rounded-r-xl px-3 py-2.5 font-medium">
                                            Keputusan
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={
                                                    plan.status === 'purchased'
                                                        ? 7
                                                        : 6
                                                }
                                                className="py-8 text-center text-xs text-muted-foreground"
                                            >
                                                Tidak ada bahan yang sesuai
                                                filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((it) => {
                                            const tone = abcTone[it.abc_class];
                                            const lb = labelConfig[it.label];
                                            const isBought =
                                                it.recommended_packages > 0;

                                            return (
                                                <tr
                                                    key={it.id}
                                                    className={`border-b border-border/60 transition-colors last:border-0 hover:bg-hover-soft/40 ${
                                                        !isBought
                                                            ? 'opacity-70'
                                                            : ''
                                                    }`}
                                                >
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="font-medium text-foreground">
                                                                {
                                                                    it.ingredient_name
                                                                }
                                                            </p>
                                                            {it.is_urgent ? (
                                                                <span className="inline-flex items-center gap-1 rounded bg-danger-soft px-1.5 py-0.5 text-[10px] font-bold text-danger">
                                                                    <AlertTriangle className="size-2.5" />
                                                                    Urgent
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {it.package_size}{' '}
                                                            {it.base_unit} /
                                                            pack · @{' '}
                                                            {formatRupiah(
                                                                it.package_price,
                                                            )}
                                                        </p>
                                                        {it.notes ? (
                                                            <p className="mt-0.5 text-[11px] text-muted-foreground italic">
                                                                Catatan:{' '}
                                                                {it.notes}
                                                            </p>
                                                        ) : null}
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span
                                                            className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${tone.bg} ${tone.text}`}
                                                        >
                                                            {it.abc_class}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-right text-xs text-muted-foreground tabular-nums">
                                                        {it.qtarget_packages}{' '}
                                                        pack
                                                    </td>
                                                    <td className="px-3 py-3 text-right font-semibold tabular-nums">
                                                        {it.recommended_packages >
                                                        0 ? (
                                                            <span className="text-foreground">
                                                                {
                                                                    it.recommended_packages
                                                                }{' '}
                                                                pack
                                                            </span>
                                                        ) : (
                                                            <span className="font-normal text-muted-foreground">
                                                                0 pack
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-right tabular-nums">
                                                        {plan.status ===
                                                            'purchased' &&
                                                        it.actual_cost !==
                                                            null ? (
                                                            <span className="font-medium text-foreground">
                                                                {formatRupiah(
                                                                    it.actual_cost,
                                                                )}
                                                            </span>
                                                        ) : it.estimated_cost >
                                                          0 ? (
                                                            <span className="font-medium text-foreground">
                                                                {formatRupiah(
                                                                    it.estimated_cost,
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                -
                                                            </span>
                                                        )}
                                                    </td>
                                                    {plan.status ===
                                                    'purchased' ? (
                                                        <td className="px-3 py-3 text-right font-semibold text-success tabular-nums">
                                                            {it.purchased_packages ??
                                                                0}{' '}
                                                            pack
                                                        </td>
                                                    ) : null}
                                                    <td className="px-3 py-3">
                                                        <span
                                                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${lb?.cls ?? 'bg-secondary text-muted-foreground'}`}
                                                        >
                                                            {lb?.text ??
                                                                it.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </FxCard>
                </Reveal>

                {/* Right: Metadata Card & Recent Plans */}
                <Reveal delay={0.1} className="w-full min-w-0">
                    <div className="flex flex-col gap-4">
                        {/* Audit Details */}
                        <FxCard className="p-4 sm:p-5">
                            <h3 className="text-sm font-semibold">
                                Informasi Audit Rencana
                            </h3>
                            <div className="mt-3 flex flex-col gap-2.5 text-xs">
                                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                        <UserIcon className="size-3.5" /> Dibuat
                                        Oleh
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {plan.creator?.name ?? 'Owner'} (
                                        {plan.creator?.role ?? 'owner'})
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                        <Clock className="size-3.5" /> Waktu
                                        Dibuat
                                    </span>
                                    <span className="text-right font-medium text-foreground">
                                        {formatDateTime(plan.created_at)}
                                    </span>
                                </div>
                                {plan.approved_at ? (
                                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            <CheckCircle2 className="size-3.5 text-info" />{' '}
                                            Disetujui
                                        </span>
                                        <span className="text-right font-medium text-foreground">
                                            {formatDateTime(plan.approved_at)}
                                        </span>
                                    </div>
                                ) : null}
                                {plan.ordered_at ? (
                                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            <Truck className="size-3.5 text-purple-600" />{' '}
                                            Dipesan
                                        </span>
                                        <span className="text-right font-medium text-foreground">
                                            {formatDateTime(plan.ordered_at)}
                                        </span>
                                    </div>
                                ) : null}
                                {plan.purchased_at ? (
                                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            <PackageCheck className="size-3.5 text-success" />{' '}
                                            Diterima
                                        </span>
                                        <span className="text-right font-medium text-success">
                                            {formatDateTime(plan.purchased_at)}
                                        </span>
                                    </div>
                                ) : null}
                                {plan.cancelled_at ? (
                                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            <Ban className="size-3.5 text-danger" />{' '}
                                            Dibatalkan
                                        </span>
                                        <span className="text-right font-medium text-danger">
                                            {formatDateTime(plan.cancelled_at)}
                                        </span>
                                    </div>
                                ) : null}
                                {plan.notes ? (
                                    <div className="flex flex-col gap-1 pt-1">
                                        <span className="text-muted-foreground">
                                            Catatan Pesanan:
                                        </span>
                                        <p className="rounded-lg bg-secondary/80 p-2 text-[11px] text-foreground">
                                            {plan.notes}
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        </FxCard>

                        {/* Recent Plans Switcher */}
                        {recent_plans && recent_plans.length > 0 ? (
                            <FxCard className="p-4 sm:p-5 print:hidden">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold">
                                        Riwayat Rencana Lain
                                    </h3>
                                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                        {recent_plans.length} tersimpan
                                    </span>
                                </div>
                                <div className="mt-3 flex flex-col gap-2">
                                    {recent_plans.map((p) => {
                                        const isCurrent = p.id === plan.id;
                                        return (
                                            <Link
                                                key={p.id}
                                                href={`/restock/plans/${p.id}`}
                                                className={`group flex items-center justify-between rounded-xl p-2.5 text-xs transition-all ${
                                                    isCurrent
                                                        ? 'border border-primary/40 bg-primary/10 font-semibold'
                                                        : 'bg-secondary/60 hover:bg-hover-soft'
                                                }`}
                                            >
                                                <div>
                                                    <p className="flex items-center gap-1.5 font-medium text-foreground">
                                                        <span>
                                                            Rencana #{p.id}
                                                        </span>
                                                        {isCurrent ? (
                                                            <span className="rounded bg-primary/20 px-1 text-[10px] text-primary">
                                                                Aktif
                                                            </span>
                                                        ) : null}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {formatRupiah(
                                                            p.total_cost,
                                                        )}{' '}
                                                        ·{' '}
                                                        {formatDateTime(
                                                            p.created_at,
                                                        )}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeCls[p.status]}`}
                                                >
                                                    {statusLabel[p.status]}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </FxCard>
                        ) : null}
                    </div>
                </Reveal>
            </div>

            {/* MODAL 1: Konfirmasi Penerimaan Barang (Partial Fulfillment) */}
            <FxModal
                open={receivingOpen}
                onOpenChange={setReceivingOpen}
                title="Konfirmasi Penerimaan Barang"
                description="Periksa dan sesuaikan kuantitas faktual bahan baku yang diterima dari supplier sebelum stok resmi dimasukkan ke inventori."
                wide={true}
                className="sm:max-w-3xl lg:max-w-4xl"
                footer={
                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs text-muted-foreground">
                            Estimasi:{' '}
                            <strong className="text-foreground">
                                {formatRupiah(plan.total_cost)}
                            </strong>{' '}
                            • Realisasi:{' '}
                            <strong className="text-primary">
                                {formatRupiah(calculatedActualTotal)}
                            </strong>
                        </div>
                        <div className="flex items-center gap-2">
                            <FxButton
                                variant="soft"
                                onClick={() => setReceivingOpen(false)}
                                disabled={isReceiving}
                            >
                                Batal
                            </FxButton>
                            <FxButton
                                variant="coral"
                                onClick={handleSubmitReceiving}
                                disabled={isReceiving}
                            >
                                <PackageCheck className="size-4" />
                                {isReceiving
                                    ? 'Menyimpan...'
                                    : 'Konfirmasi & Masukkan Stok'}
                            </FxButton>
                        </div>
                    </div>
                }
            >
                <div className="flex flex-col gap-3">
                    <div className="max-h-[360px] overflow-y-auto rounded-xl border border-border">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-secondary text-left text-muted-foreground">
                                <tr>
                                    <th className="p-2.5">Bahan Baku</th>
                                    <th className="p-2.5 text-center">
                                        Kuantitas Masuk
                                    </th>
                                    <th className="p-2.5 text-right">
                                        Harga Kemasan
                                    </th>
                                    <th className="p-2.5 text-right">
                                        Subtotal
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {receivingItems.map((row) => {
                                    const subtotal =
                                        row.purchased_packages *
                                        row.actual_package_price;
                                    return (
                                        <tr
                                            key={row.ingredient_id}
                                            className="border-b border-border/60 last:border-0"
                                        >
                                            <td className="p-2.5">
                                                <p className="font-semibold text-foreground">
                                                    {row.ingredient_name}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {row.package_size}{' '}
                                                    {row.base_unit} / pack
                                                </p>
                                            </td>
                                            <td className="p-2.5">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleUpdateReceivingRow(
                                                                row.ingredient_id,
                                                                'purchased_packages',
                                                                Math.max(
                                                                    0,
                                                                    row.purchased_packages -
                                                                        1,
                                                                ),
                                                            )
                                                        }
                                                        className="flex size-7 items-center justify-center rounded-lg bg-secondary text-foreground hover:bg-hover-soft"
                                                    >
                                                        <Minus className="size-3" />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={
                                                            row.purchased_packages
                                                        }
                                                        onChange={(e) =>
                                                            handleUpdateReceivingRow(
                                                                row.ingredient_id,
                                                                'purchased_packages',
                                                                Math.max(
                                                                    0,
                                                                    parseInt(
                                                                        e.target
                                                                            .value,
                                                                    ) || 0,
                                                                ),
                                                            )
                                                        }
                                                        className="h-7 w-14 rounded-lg border border-border bg-card text-center text-xs font-bold tabular-nums"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleUpdateReceivingRow(
                                                                row.ingredient_id,
                                                                'purchased_packages',
                                                                row.purchased_packages +
                                                                    1,
                                                            )
                                                        }
                                                        className="flex size-7 items-center justify-center rounded-lg bg-secondary text-foreground hover:bg-hover-soft"
                                                    >
                                                        <Plus className="size-3" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleUpdateReceivingRow(
                                                                row.ingredient_id,
                                                                'purchased_packages',
                                                                0,
                                                            )
                                                        }
                                                        title="Kosongkan"
                                                        className="ml-1 text-[11px] text-muted-foreground hover:text-danger"
                                                    >
                                                        Kosong
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-2.5 text-right">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="500"
                                                    value={
                                                        row.actual_package_price
                                                    }
                                                    onChange={(e) =>
                                                        handleUpdateReceivingRow(
                                                            row.ingredient_id,
                                                            'actual_package_price',
                                                            Math.max(
                                                                0,
                                                                parseInt(
                                                                    e.target
                                                                        .value,
                                                                ) || 0,
                                                            ),
                                                        )
                                                    }
                                                    className="h-7 w-24 rounded-lg border border-border bg-card px-2 text-right text-xs tabular-nums"
                                                />
                                            </td>
                                            <td className="p-2.5 text-right font-semibold text-foreground tabular-nums">
                                                {formatRupiah(subtotal)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <FxField label="Catatan Penerimaan / Supplier">
                        <FxInput
                            placeholder="Contoh: Belanja di Toko Surya Makmur, susu hanya sisa 3 pack..."
                            value={receivingNotes}
                            onChange={(e) => setReceivingNotes(e.target.value)}
                        />
                    </FxField>
                </div>
            </FxModal>

            {/* MODAL 2: Kirim PO ke Supplier (WhatsApp & Email) */}
            <FxModal
                open={dispatchOpen}
                onOpenChange={setDispatchOpen}
                title="Kirim Purchase Order (PO)"
                description="Kirimkan rincian pesanan bahan baku ke supplier via WhatsApp atau Email resmi."
                wide={true}
                className="sm:max-w-3xl lg:max-w-4xl"
                footer={
                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <FxButton
                            variant="soft"
                            className="text-xs"
                            disabled={isOrdering}
                            onClick={() => handleConfirmOrder('direct')}
                        >
                            Tandai Dipesan Saja
                        </FxButton>
                        <div className="flex items-center gap-2">
                            <FxButton
                                variant="soft"
                                onClick={() => setDispatchOpen(false)}
                                disabled={isOrdering}
                            >
                                Batal
                            </FxButton>
                            {dispatchTab === 'wa' ? (
                                <FxButton
                                    variant="coral"
                                    disabled={isOrdering}
                                    onClick={() => handleConfirmOrder('wa')}
                                >
                                    <MessageCircle className="size-4" />
                                    Buka WhatsApp & Tandai Dipesan
                                </FxButton>
                            ) : (
                                <FxButton
                                    variant="coral"
                                    disabled={isOrdering}
                                    onClick={() => handleConfirmOrder('email')}
                                >
                                    <Mail className="size-4" />
                                    Buka Email & Tandai Dipesan
                                </FxButton>
                            )}
                        </div>
                    </div>
                }
            >
                <div className="grid items-start gap-4 lg:grid-cols-[1.05fr_1.25fr] lg:gap-6">
                    {/* Left Column: Dispatch Controls */}
                    <div className="flex flex-col gap-3">
                        {/* Tabs */}
                        <div className="flex rounded-xl bg-secondary p-1 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setDispatchTab('wa')}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
                                    dispatchTab === 'wa'
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <MessageCircle className="size-3.5 text-success" />
                                WhatsApp
                            </button>
                            <button
                                type="button"
                                onClick={() => setDispatchTab('email')}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
                                    dispatchTab === 'email'
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Mail className="size-3.5 text-info" />
                                Email Resmi
                            </button>
                        </div>

                        {dispatchTab === 'wa' ? (
                            <FxField
                                label="Nomor WhatsApp Supplier (Opsional)"
                                hint="Format: 08123456789 atau 628123456789. Kosongkan untuk pilih kontak langsung di WhatsApp."
                            >
                                <FxInput
                                    type="tel"
                                    placeholder="Contoh: 081234567890"
                                    value={supplierWa}
                                    onChange={(e) =>
                                        setSupplierWa(e.target.value)
                                    }
                                />
                            </FxField>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <FxField
                                    label="Email Supplier / Mitra (Opsional)"
                                    hint="Kosongkan jika ingin memilih penerima di aplikasi email."
                                >
                                    <FxInput
                                        type="email"
                                        placeholder="Contoh: sales@supplierkopi.com"
                                        value={supplierEmail}
                                        onChange={(e) =>
                                            setSupplierEmail(e.target.value)
                                        }
                                    />
                                </FxField>
                                <FxField label="Subjek Email">
                                    <FxInput
                                        readOnly
                                        value={`Purchase Order #${plan.id} - Kulakan Coffee & Resto`}
                                    />
                                </FxField>
                            </div>
                        )}

                        <FxField label="Catatan Tambahan untuk Supplier (Opsional)">
                            <FxTextarea
                                rows={2}
                                placeholder="Contoh: Pengiriman harap sebelum jam 10 pagi, mohon konfirmasi ketersediaan..."
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                            />
                        </FxField>

                        {/* Order Snapshot Card */}
                        <div className="rounded-xl border border-border/70 bg-secondary/40 p-3 text-xs">
                            <p className="mb-1 font-semibold text-foreground">
                                Ringkasan Order #{plan.id}
                            </p>
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span>Bahan direkomendasikan:</span>
                                <strong className="font-medium text-foreground">
                                    {recommendedItems.length} bahan
                                </strong>
                            </div>
                            <div className="mt-0.5 flex items-center justify-between text-muted-foreground">
                                <span>Estimasi total belanja:</span>
                                <strong className="font-medium text-primary">
                                    {formatRupiah(plan.total_cost)}
                                </strong>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Live Document Preview - Editable */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-muted-foreground">
                                    Format Pesanan (
                                    {dispatchTab === 'wa'
                                        ? 'WhatsApp'
                                        : 'Email'}
                                    )
                                </span>
                                {isPoCustomized ? (
                                    <span className="rounded-full bg-info-soft px-1.5 py-0.5 text-[10px] font-medium text-info">
                                        Kustom
                                    </span>
                                ) : null}
                            </div>
                            <div className="flex items-center gap-2">
                                {isPoCustomized ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsPoCustomized(false);
                                            setCustomPoText(defaultPoText);
                                            toast.info(
                                                'Format pesanan dikembalikan ke format otomatis.',
                                            );
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                                        title="Kembalikan ke format otomatis"
                                    >
                                        <RotateCcw className="size-3" />
                                        Reset
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={handleCopyText}
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                                >
                                    <Copy className="size-3" />
                                    Salin Teks
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <textarea
                                value={activePoText}
                                onChange={(e) => {
                                    setCustomPoText(e.target.value);
                                    setIsPoCustomized(true);
                                }}
                                rows={11}
                                className="h-[260px] w-full resize-y rounded-2xl border border-border/80 bg-secondary/80 p-3.5 font-mono text-[11px] leading-relaxed text-foreground transition-all outline-none focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 sm:h-[300px]"
                                placeholder="Tulis format pesan PO..."
                            />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Pesan di atas dapat Anda edit atau tambahkan catatan
                            khusus secara bebas sebelum dikirimkan ke supplier.
                        </p>
                    </div>
                </div>
            </FxModal>

            {/* MODAL 3: Batalkan Rencana */}
            <FxModal
                open={cancelOpen}
                onOpenChange={setCancelOpen}
                title="Batalkan Rencana Restock"
                description="Rencana yang dibatalkan akan ditandai nonaktif dan tidak dapat dieksekusi untuk penambahan stok."
                footer={
                    <div className="flex w-full items-center justify-end gap-2">
                        <FxButton
                            variant="soft"
                            onClick={() => setCancelOpen(false)}
                            disabled={isCancelling}
                        >
                            Kembali
                        </FxButton>
                        <FxButton
                            variant="dark"
                            className="bg-danger text-white hover:bg-danger/90"
                            onClick={handleConfirmCancel}
                            disabled={isCancelling}
                        >
                            <X className="size-4" />
                            {isCancelling
                                ? 'Membatalkan...'
                                : 'Ya, Batalkan Rencana'}
                        </FxButton>
                    </div>
                }
            >
                <div className="flex flex-col gap-3">
                    <FxField label="Alasan Pembatalan">
                        <div className="flex flex-col gap-2">
                            {[
                                'Salah estimasi kas',
                                'Supplier kehabisan stok',
                                'Perubahan kebutuhan menu',
                                'Lainnya',
                            ].map((preset) => (
                                <label
                                    key={preset}
                                    className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-secondary/60 p-2.5 text-xs font-medium hover:bg-hover-soft"
                                >
                                    <input
                                        type="radio"
                                        name="cancelReason"
                                        value={preset}
                                        checked={cancelReason === preset}
                                        onChange={() => setCancelReason(preset)}
                                        className="accent-primary"
                                    />
                                    <span>{preset}</span>
                                </label>
                            ))}
                        </div>
                    </FxField>

                    {cancelReason === 'Lainnya' ? (
                        <FxField label="Tuliskan Alasan">
                            <FxInput
                                placeholder="Masukkan alasan pembatalan..."
                                value={customReason}
                                onChange={(e) =>
                                    setCustomReason(e.target.value)
                                }
                            />
                        </FxField>
                    ) : null}
                </div>
            </FxModal>
        </PageShell>
    );
}
