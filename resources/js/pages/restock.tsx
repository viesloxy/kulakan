import { Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    Check,
    CheckCircle2,
    Copy,
    CreditCard,
    Eye,
    History,
    Lightbulb,
    Mail,
    MessageCircle,
    Minus,
    PackageCheck,
    Plus,
    Printer,
    RotateCcw,
    Save,
    Search,
    Send,
    SlidersHorizontal,
    Trash2,
    Truck,
    User as UserIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { FxTableWrap } from '@/components/fx/fx-table-wrap';
import {
    FxField,
    FxInput,
    FxModal,
    FxSelect,
    FxTextarea,
} from '@/components/fx/fx-form';
import Reveal from '@/components/motion/reveal';
import PageShell from '@/components/page-shell';
import { formatRupiah } from '@/lib/format';

type Abc = 'A' | 'B' | 'C';
type BaseUnit = 'gram' | 'ml' | 'pcs';
type Label =
    | 'beli_sekarang'
    | 'beli_sekarang_parsial'
    | 'beli_opsional'
    | 'tahan_dulu'
    | 'kas_tidak_cukup';

type RestockItem = {
    ingredient_id: number;
    name: string;
    base_unit: BaseUnit;
    abc_class: Abc;
    is_urgent: boolean;
    urgency: string;
    priority_score: string;
    qmin_packages: number;
    qtarget_packages: number;
    recommended_packages: number;
    package_size: string;
    package_price: number;
    estimated_cost: number;
    label: Label;
};

type Plan = {
    cash_amount: number;
    total_cost: number;
    remaining_cash: number;
    items: RestockItem[];
};

type PlanStatus = 'draft' | 'approved' | 'ordered' | 'purchased' | 'cancelled';

type LastPlan = {
    id: number;
    status: PlanStatus;
    cash_amount: number;
    total_cost: number;
    actual_cost?: number | null;
    remaining_cash: number;
    created_at: string | null;
    purchased_at: string | null;
    creator_name?: string | null;
    items: {
        ingredient_id: number;
        recommended_packages: number;
        estimated_cost: number;
        label: string | null;
        purchased_packages: number | null;
    }[];
};

type RecentPlan = {
    id: number;
    status: PlanStatus;
    cash_amount: number;
    total_cost: number;
    actual_cost?: number | null;
    remaining_cash: number;
    created_at: string | null;
    creator_name: string | null;
    items_count: number;
};

type AppUser = {
    id: number;
    name: string;
    role: string;
};

type MasterIngredient = {
    id: number;
    name: string;
    base_unit: BaseUnit;
    package_size: string;
    package_price: number;
    current_stock: number;
};

type WizardItem = {
    ingredient_id: number;
    name: string;
    abc_class: Abc;
    package_size: string;
    base_unit: BaseUnit;
    package_price: number;
    packages: number;
};

type Props = {
    default_cash_amount: number;
    max_days_lead_time: number;
    presets: number[];
    plan: Plan;
    last_plan: LastPlan | null;
    recent_plans?: RecentPlan[];
    users?: AppUser[];
    ingredients?: MasterIngredient[];
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
    purchased: 'Dibeli',
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

export default function Restock({
    default_cash_amount,
    max_days_lead_time,
    presets,
    plan,
    last_plan,
    recent_plans = [],
    users = [],
    ingredients = [],
}: Props) {
    const [cash, setCash] = useState(default_cash_amount);
    const [cashInput, setCashInput] = useState(() =>
        new Intl.NumberFormat('id-ID').format(default_cash_amount),
    );
    const [showHistory, setShowHistory] = useState(false);
    const firstRun = useRef(true);

    const sliderMax = useMemo(() => {
        const highestPreset =
            presets.length > 0 ? Math.max(...presets) : 1500000;
        return Math.max(
            1500000,
            highestPreset,
            Math.ceil(cash / 500000) * 500000,
        );
    }, [cash, presets]);

    function handleCashInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const raw = e.target.value.replace(/\D/g, '');
        if (raw === '') {
            setCashInput('');
            setCash(0);
            return;
        }
        const num = Math.min(100_000_000, parseInt(raw, 10) || 0);
        setCash(num);
        setCashInput(new Intl.NumberFormat('id-ID').format(num));
    }

    function handleSliderChange(val: number) {
        setCash(val);
        setCashInput(new Intl.NumberFormat('id-ID').format(val));
    }

    function handlePresetClick(presetVal: number) {
        setCash(presetVal);
        setCashInput(new Intl.NumberFormat('id-ID').format(presetVal));
    }

    // WIZARD STATE
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

    // Step 1: Shipment & Operational details
    const tomorrowDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    }, []);

    const [deliveryDate, setDeliveryDate] = useState(tomorrowDate);
    const [assignedUserId, setAssignedUserId] = useState<number>(
        users[0]?.id ?? 1,
    );
    const [paymentTerms, setPaymentTerms] = useState('Cash');
    const [operationalNotes, setOperationalNotes] = useState('');
    const [destinationAddress, setDestinationAddress] = useState(
        'Outlet Utama - Jl. Melati No. 12, Jakarta',
    );
    const [shipmentCarrier, setShipmentCarrier] = useState(
        'Beli Sendiri ke Pasar / Agen',
    );

    // Step 2: Selected items & item adder
    const [wizardItems, setWizardItems] = useState<WizardItem[]>([]);
    const [ingredientSearch, setIngredientSearch] = useState('');

    // Step 3: Dispatch PO details
    const [dispatchTab, setDispatchTab] = useState<'wa' | 'email'>('wa');
    const [supplierWa, setSupplierWa] = useState('');
    const [supplierEmail, setSupplierEmail] = useState('');
    const [supplierName, setSupplierName] = useState('Mitra Supplier');
    const [customPoText, setCustomPoText] = useState('');
    const [isPoCustomized, setIsPoCustomized] = useState(false);
    const [isSubmittingWizard, setIsSubmittingWizard] = useState(false);

    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }

        const timer = window.setTimeout(() => {
            router.get(
                '/restock',
                { cash },
                {
                    only: ['plan'],
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 250);

        return () => window.clearTimeout(timer);
    }, [cash]);

    const total = plan.total_cost;
    const remaining = plan.remaining_cash;
    const usedPct = cash > 0 ? Math.min(100, (total / cash) * 100) : 0;
    const boughtCount = plan.items.filter(
        (it) => it.recommended_packages > 0,
    ).length;

    // Open wizard and prefill with recommended items
    function handleOpenWizard() {
        const prefilled: WizardItem[] = plan.items
            .filter((it) => it.recommended_packages > 0)
            .map((it) => ({
                ingredient_id: it.ingredient_id,
                name: it.name,
                abc_class: it.abc_class,
                package_size: it.package_size,
                base_unit: it.base_unit,
                package_price: it.package_price,
                packages: it.recommended_packages,
            }));

        setWizardItems(prefilled);
        setWizardStep(1);
        setIsPoCustomized(false);
        setCustomPoText('');
        setWizardOpen(true);
    }

    // Step 2 Item management
    function handleUpdateItemPackages(ingId: number, delta: number) {
        setWizardItems((prev) =>
            prev
                .map((it) =>
                    it.ingredient_id === ingId
                        ? { ...it, packages: Math.max(0, it.packages + delta) }
                        : it,
                )
                .filter((it) => it.packages > 0),
        );
    }

    function handleRemoveItem(ingId: number) {
        setWizardItems((prev) =>
            prev.filter((it) => it.ingredient_id !== ingId),
        );
    }

    function handleAddIngredient(master: MasterIngredient) {
        const exists = wizardItems.find((it) => it.ingredient_id === master.id);
        if (exists) {
            handleUpdateItemPackages(master.id, 1);
        } else {
            setWizardItems((prev) => [
                ...prev,
                {
                    ingredient_id: master.id,
                    name: master.name,
                    abc_class: 'B',
                    package_size: master.package_size,
                    base_unit: master.base_unit,
                    package_price: master.package_price,
                    packages: 1,
                },
            ]);
        }
        setIngredientSearch('');
    }

    // Filter available ingredients to add
    const availableIngredients = useMemo(() => {
        const query = ingredientSearch.toLowerCase().trim();
        return ingredients
            .filter((ing) => !query || ing.name.toLowerCase().includes(query))
            .slice(0, 6);
    }, [ingredients, ingredientSearch]);

    // Wizard calculation totals
    const wizardSubtotal = useMemo(() => {
        return wizardItems.reduce(
            (acc, it) => acc + it.packages * it.package_price,
            0,
        );
    }, [wizardItems]);

    const totalWizardPackages = useMemo(() => {
        return wizardItems.reduce((acc, it) => acc + it.packages, 0);
    }, [wizardItems]);

    // Format PO text for Step 3
    const defaultPoText = useMemo(() => {
        const selectedUser = users.find((u) => u.id === assignedUserId);
        const lines = [
            `📦 *PURCHASE ORDER (PO)*`,
            `Kepada: ${supplierName}`,
            `Outlet/Toko: Kulakan Coffee & Resto`,
            `Target Pengiriman: ${deliveryDate}`,
            `Pemesan: ${selectedUser?.name ?? 'Owner'}`,
            `Metode Bayar: ${paymentTerms}`,
            `----------------------------------------`,
            `*RINCIAN PESANAN BAHAN:*`,
        ];

        if (wizardItems.length === 0) {
            lines.push(`(Tidak ada bahan baku yang dipilih)`);
        } else {
            wizardItems.forEach((it, idx) => {
                lines.push(
                    `${idx + 1}. *${it.name}* : ${it.packages} pack (${it.package_size} ${it.base_unit}) ~ ${formatRupiah(it.packages * it.package_price)}`,
                );
            });
        }

        lines.push(`----------------------------------------`);
        lines.push(`Total Estimasi: *${formatRupiah(wizardSubtotal)}*`);
        if (operationalNotes) {
            lines.push(`Catatan: ${operationalNotes}`);
        }
        lines.push(
            `\nMohon konfirmasi ketersediaan stok & jadwal pengiriman. Terima kasih! 🙏`,
        );

        return lines.join('\n');
    }, [
        users,
        assignedUserId,
        supplierName,
        deliveryDate,
        paymentTerms,
        wizardItems,
        wizardSubtotal,
        operationalNotes,
    ]);

    const activePoText = isPoCustomized ? customPoText : defaultPoText;

    function handleCopyWizardText() {
        void navigator.clipboard.writeText(activePoText).then(() => {
            toast.success('Format pesanan disalin ke clipboard!');
        });
    }

    function handlePrintWizardPo() {
        if (wizardItems.length === 0) {
            toast.error('Tidak ada bahan baku untuk dicetak.');
            return;
        }

        const selectedUser = users.find((u) => u.id === assignedUserId);
        const currentDateStr = new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date());

        const rowsHtml = wizardItems
            .map(
                (it, idx) => `
            <tr>
                <td style="text-align: center; padding: 6px 8px; border: 1px solid #cbd5e1;">${idx + 1}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: 600;">
                    ${it.name} <span style="font-size: 10px; color: #64748b; font-weight: normal;">(Kelas ${it.abc_class})</span>
                </td>
                <td style="text-align: center; padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: 600;">
                    ${it.packages} pack
                </td>
                <td style="text-align: center; padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 11px; color: #475569;">
                    ${it.package_size} ${it.base_unit}
                </td>
                <td style="text-align: right; padding: 6px 8px; border: 1px solid #cbd5e1;">
                    ${formatRupiah(it.package_price)}
                </td>
                <td style="text-align: right; padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: 700;">
                    ${formatRupiah(it.packages * it.package_price)}
                </td>
            </tr>
        `,
            )
            .join('');

        const html = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Purchase Order - ${supplierName || 'Kulakan'}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            background: #fff;
            padding: 24px 32px;
            font-size: 12px;
            line-height: 1.4;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .title { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
        .subtitle { font-size: 11px; color: #64748b; margin-top: 2px; }
        .po-badge {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: 800;
            font-size: 13px;
            letter-spacing: 0.05em;
            text-align: center;
        }
        .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
        }
        .meta-col { display: flex; flex-direction: column; gap: 4px; }
        .meta-col-title { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 2px; }
        .meta-row { display: flex; justify-content: space-between; font-size: 11px; }
        .meta-label { color: #64748b; }
        .meta-val { font-weight: 600; color: #0f172a; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        table.items th {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 8px;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            color: #334155;
        }
        .summary-box { display: flex; justify-content: flex-end; margin-bottom: 16px; }
        .summary-table { width: 280px; border-collapse: collapse; font-size: 11px; }
        .summary-table td { padding: 4px 6px; }
        .summary-total { font-weight: 800; font-size: 13px; border-top: 1.5px solid #0f172a; }
        .notes-box {
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            border-radius: 8px;
            padding: 10px 12px;
            margin-bottom: 24px;
            font-size: 11px;
        }
        .notes-title { font-weight: 700; color: #334155; margin-bottom: 4px; }
        .notes-content { white-space: pre-wrap; font-family: monospace; font-size: 10.5px; color: #334155; line-height: 1.35; }
        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 16px;
            text-align: center;
            margin-top: 24px;
            page-break-inside: avoid;
        }
        .sig-box { display: flex; flex-direction: column; justify-content: space-between; height: 90px; }
        .sig-line { border-top: 1px solid #334155; margin-top: auto; padding-top: 4px; font-size: 11px; font-weight: 600; }
        .sig-role { font-size: 10px; color: #64748b; }
        @page { size: A4; margin: 12mm 14mm; }
        @media print {
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 class="title">KULAKAN COFFEE & RESTO</h1>
            <p class="subtitle">Sistem Pengadaan & Manajemen Bahan Baku Resto</p>
            <p class="subtitle">${destinationAddress}</p>
        </div>
        <div style="text-align: right;">
            <div class="po-badge">PURCHASE ORDER</div>
            <p class="subtitle" style="margin-top: 4px;">Tanggal Dibuat: <strong>${currentDateStr}</strong></p>
        </div>
    </div>

    <div class="meta-grid">
        <div class="meta-col">
            <div class="meta-col-title">Tujuan Supplier</div>
            <div class="meta-row"><span class="meta-label">Nama Supplier:</span><span class="meta-val">${supplierName || '-'}</span></div>
            ${supplierWa ? `<div class="meta-row"><span class="meta-label">No. WhatsApp:</span><span class="meta-val">${supplierWa}</span></div>` : ''}
            ${supplierEmail ? `<div class="meta-row"><span class="meta-label">Email:</span><span class="meta-val">${supplierEmail}</span></div>` : ''}
            <div class="meta-row"><span class="meta-label">Metode Pengadaan:</span><span class="meta-val">${shipmentCarrier}</span></div>
        </div>
        <div class="meta-col">
            <div class="meta-col-title">Informasi Pengiriman</div>
            <div class="meta-row"><span class="meta-label">Target Tiba:</span><span class="meta-val">${deliveryDate}</span></div>
            <div class="meta-row"><span class="meta-label">PIC Pemesan:</span><span class="meta-val">${selectedUser?.name ?? 'Owner'}</span></div>
            <div class="meta-row"><span class="meta-label">Metode Pembayaran:</span><span class="meta-val">${paymentTerms}</span></div>
            <div class="meta-row"><span class="meta-label">Alamat Penerima:</span><span class="meta-val">${destinationAddress}</span></div>
        </div>
    </div>

    <table class="items">
        <thead>
            <tr>
                <th style="width: 32px; text-align: center;">No</th>
                <th>Nama Bahan Baku</th>
                <th style="width: 90px; text-align: center;">Pesanan</th>
                <th style="width: 110px; text-align: center;">Ukuran Pack</th>
                <th style="width: 110px; text-align: right;">Estimasi Harga</th>
                <th style="width: 120px; text-align: right;">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            ${rowsHtml}
        </tbody>
    </table>

    <div class="summary-box">
        <table class="summary-table">
            <tr>
                <td style="color: #64748b;">Total Kuantitas:</td>
                <td style="text-align: right; font-weight: 600;">${totalWizardPackages} pack</td>
            </tr>
            <tr>
                <td style="color: #64748b;">Total Estimasi Belanja:</td>
                <td style="text-align: right; font-weight: 600;">${formatRupiah(wizardSubtotal)}</td>
            </tr>
            <tr>
                <td style="color: #64748b;">Alokasi Kas Tersedia:</td>
                <td style="text-align: right; font-weight: 600;">${formatRupiah(cash)}</td>
            </tr>
            <tr class="summary-total">
                <td>TOTAL ESTIMASI:</td>
                <td style="text-align: right;">${formatRupiah(wizardSubtotal)}</td>
            </tr>
        </table>
    </div>

    <div class="notes-box">
        <div class="notes-title">Catatan & Pesan Pengadaan:</div>
        <div class="notes-content">${activePoText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>

    <div class="signatures">
        <div class="sig-box">
            <span class="sig-role">Disiapkan Oleh:</span>
            <div class="sig-line">${selectedUser?.name ?? 'Pemesan'}</div>
            <span class="sig-role">PIC Pengadaan</span>
        </div>
        <div class="sig-box">
            <span class="sig-role">Disetujui Oleh:</span>
            <div class="sig-line">Manajemen / Owner</div>
            <span class="sig-role">Kulakan Resto</span>
        </div>
        <div class="sig-box">
            <span class="sig-role">Diterima / Dikonfirmasi:</span>
            <div class="sig-line">${supplierName || 'Pihak Supplier'}</div>
            <span class="sig-role">Supplier / Driver</span>
        </div>
    </div>
</body>
</html>`;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) {
            toast.error('Gagal menyiapkan dokumen cetak.');
            return;
        }

        doc.open();
        doc.write(html);
        doc.close();

        iframe.contentWindow?.focus();
        setTimeout(() => {
            iframe.contentWindow?.print();
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 1500);
        }, 300);
    }

    // Submit wizard to backend
    function handleFinishWizard(targetStatus: 'draft' | 'ordered') {
        if (wizardItems.length === 0) {
            toast.error(
                'Pilih minimal 1 bahan baku untuk membuat Purchase Order.',
            );
            return;
        }

        setIsSubmittingWizard(true);

        const payload = {
            cash_amount: cash,
            max_days_lead_time,
            delivery_date: deliveryDate,
            assigned_user_id: assignedUserId,
            payment_terms: paymentTerms,
            notes: operationalNotes,
            status: targetStatus,
            items: wizardItems.map((it) => ({
                ingredient_id: it.ingredient_id,
                recommended_packages: it.packages,
                estimated_cost: it.packages * it.package_price,
            })),
        };

        router.post('/restock/plans', payload, {
            preserveScroll: true,
            onSuccess: () => {
                setWizardOpen(false);
                toast.success(
                    targetStatus === 'ordered'
                        ? 'Purchase Order berhasil dibuat dan ditandai dipesan!'
                        : 'Rencana belanja berhasil disimpan sebagai Draft.',
                );

                if (targetStatus === 'ordered' && dispatchTab === 'wa') {
                    const cleanPhone = supplierWa.replace(/[^0-9]/g, '');
                    const waUrl = cleanPhone
                        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(activePoText)}`
                        : `https://wa.me/?text=${encodeURIComponent(activePoText)}`;
                    window.open(waUrl, '_blank');
                } else if (
                    targetStatus === 'ordered' &&
                    dispatchTab === 'email'
                ) {
                    const mailSubject = encodeURIComponent(
                        `Purchase Order - Kulakan Coffee & Resto`,
                    );
                    const mailBody = encodeURIComponent(activePoText);
                    const mailUrl = supplierEmail.trim()
                        ? `mailto:${supplierEmail.trim()}?subject=${mailSubject}&body=${mailBody}`
                        : `mailto:?subject=${mailSubject}&body=${mailBody}`;
                    window.open(mailUrl, '_blank');
                }
            },
            onError: (errors) => {
                toast.error(
                    Object.values(errors)[0] ?? 'Gagal membuat purchase order.',
                );
            },
            onFinish: () => setIsSubmittingWizard(false),
        });
    }

    // Quick save plan (direct)
    function quickSavePlan() {
        router.post(
            '/restock/plans',
            { cash_amount: cash, max_days_lead_time },
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Rencana belanja tersimpan (draft)'),
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ?? 'Gagal menyimpan rencana.',
                    ),
            },
        );
    }

    function purchase(planId: number) {
        router.post(
            `/restock/plans/${planId}/purchase`,
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Rencana ditandai dibeli', {
                        description: 'Stok bahan bertambah sesuai rekomendasi.',
                    }),
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ?? 'Gagal menandai dibeli.',
                    ),
            },
        );
    }

    const assignedUser = users.find((u) => u.id === assignedUserId);

    return (
        <PageShell
            title="Restock Planner"
            description="Masukkan kas, sistem menyusun rencana belanja sesuai urgensi dan kelas ABC."
        >
            <Reveal delay={0.05}>
                <div className="grid gap-5 pb-36 lg:grid-cols-[1fr_1.4fr] lg:items-start">
                    <FxCard className="min-w-0 p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <SlidersHorizontal className="size-4" />
                                <span>Kas Tersedia</span>
                            </div>
                            <span className="text-xs font-semibold text-primary tabular-nums">
                                {formatRupiah(cash)}
                            </span>
                        </div>

                        {/* Input Manual dengan Prefix Rp */}
                        <div className="mt-3">
                            <label className="text-[11px] font-semibold text-muted-foreground">
                                Ketik Nominal Kas:
                            </label>
                            <div className="mt-1">
                                <FxInput
                                    type="text"
                                    inputMode="numeric"
                                    prefix="Rp"
                                    value={cashInput}
                                    placeholder="0"
                                    onChange={handleCashInputChange}
                                    onFocus={(e) => {
                                        if (cash === 0) {
                                            e.target.select();
                                        }
                                    }}
                                    onBlur={() => {
                                        if (cashInput === '' || cash === 0) {
                                            setCash(0);
                                            setCashInput('0');
                                        }
                                    }}
                                    className="h-11 text-base font-bold tabular-nums"
                                />
                            </div>
                        </div>

                        {/* Slider Range */}
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>Geser Cepat (Slider):</span>
                                <span className="font-semibold text-foreground tabular-nums">
                                    {formatRupiah(cash)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={sliderMax}
                                step={10000}
                                value={cash}
                                onChange={(e) =>
                                    handleSliderChange(Number(e.target.value))
                                }
                                className="mt-1.5 w-full accent-primary"
                            />
                            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground/70">
                                <span>Rp 0</span>
                                <span>{formatRupiah(sliderMax)}</span>
                            </div>
                        </div>

                        {/* Pilihan Nominal Cepat (Presets) */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {presets.map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => handlePresetClick(p)}
                                    className={`h-7 rounded-full px-2.5 text-xs font-semibold transition-all duration-200 ${
                                        cash === p
                                            ? 'fx-coral shadow-xs'
                                            : 'bg-secondary text-foreground hover:bg-hover-soft'
                                    }`}
                                >
                                    {p / 1000 + 'rb'}
                                </button>
                            ))}
                        </div>

                        <FxSoft className="mt-4 p-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Terpakai
                                </span>
                                <span className="font-bold tabular-nums">
                                    {formatRupiah(total)}
                                </span>
                            </div>
                            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-hover-soft fx-hatch">
                                <div
                                    className="h-full rounded-full bg-primary"
                                    style={{
                                        width: `${usedPct}%`,
                                        backgroundImage:
                                            'repeating-linear-gradient(-45deg, rgba(255,255,255,0.18) 0 3px, transparent 3px 6px)',
                                    }}
                                />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                    Sisa kas
                                </span>
                                <span className="font-semibold text-success tabular-nums">
                                    {formatRupiah(remaining)}
                                </span>
                            </div>
                        </FxSoft>

                        {last_plan ? (
                            <FxSoft className="mt-4 flex flex-col gap-3 p-4 transition-all hover:border-primary/40">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-semibold">
                                            Rencana #{last_plan.id}
                                        </span>
                                        {last_plan.creator_name ? (
                                            <span className="text-xs text-muted-foreground">
                                                • {last_plan.creator_name}
                                            </span>
                                        ) : null}
                                    </div>
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadgeCls[last_plan.status]}`}
                                    >
                                        {statusLabel[last_plan.status]}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                        Total{' '}
                                        <strong className="font-semibold text-foreground">
                                            {formatRupiah(
                                                last_plan.actual_cost ??
                                                    last_plan.total_cost,
                                            )}
                                        </strong>
                                    </span>
                                    <span>
                                        Sisa{' '}
                                        <strong className="font-semibold text-success">
                                            {formatRupiah(
                                                last_plan.actual_cost
                                                    ? Math.max(
                                                          0,
                                                          last_plan.cash_amount -
                                                              last_plan.actual_cost,
                                                      )
                                                    : last_plan.remaining_cash,
                                            )}
                                        </strong>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                    <FxButton
                                        variant="soft"
                                        className="h-9 flex-1 text-xs"
                                        onClick={() =>
                                            router.visit(
                                                `/restock/plans/${last_plan.id}`,
                                            )
                                        }
                                    >
                                        <Eye className="size-3.5" />
                                        Lihat detail
                                    </FxButton>
                                    {last_plan.status !== 'purchased' &&
                                    last_plan.status !== 'cancelled' ? (
                                        <FxButton
                                            variant="soft"
                                            className="h-9 flex-1 text-xs"
                                            onClick={() =>
                                                purchase(last_plan.id)
                                            }
                                        >
                                            <CheckCircle2 className="size-3.5" />
                                            Tandai dibeli
                                        </FxButton>
                                    ) : null}
                                </div>
                                {last_plan.status === 'purchased' ? (
                                    <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-success">
                                        <CheckCircle2 className="size-3.5" />
                                        Sudah dibeli, stok bahan bertambah.
                                    </p>
                                ) : last_plan.status === 'cancelled' ? (
                                    <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-danger">
                                        Rencana belanja ini telah dibatalkan.
                                    </p>
                                ) : null}

                                {recent_plans.length > 1 ? (
                                    <div className="mt-1 border-t border-border/50 pt-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowHistory(!showHistory)
                                            }
                                            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                                        >
                                            <History className="size-3" />
                                            {showHistory
                                                ? 'Sembunyikan riwayat rencana'
                                                : `Lihat riwayat lain (${recent_plans.length})`}
                                        </button>
                                        {showHistory ? (
                                            <div className="mt-2 flex flex-col gap-1.5">
                                                {recent_plans
                                                    .filter(
                                                        (p) =>
                                                            p.id !==
                                                            last_plan.id,
                                                    )
                                                    .map((p) => (
                                                        <Link
                                                            key={p.id}
                                                            href={`/restock/plans/${p.id}`}
                                                            className="flex items-center justify-between rounded-lg bg-card/60 p-2 text-xs transition-colors hover:bg-hover-soft"
                                                        >
                                                            <span>
                                                                Rencana #{p.id}
                                                            </span>
                                                            <span className="text-muted-foreground tabular-nums">
                                                                {formatRupiah(
                                                                    p.total_cost,
                                                                )}
                                                            </span>
                                                        </Link>
                                                    ))}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                            </FxSoft>
                        ) : null}
                    </FxCard>

                    <FxCard className="flex min-w-0 flex-col p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-base font-semibold">
                                Rekomendasi belanja
                            </h2>
                            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                                {plan.items.length} bahan
                            </span>
                        </div>
                        <FxTableWrap
                            className="rounded-xl border border-border/60"
                            viewportClassName="max-h-[460px] overflow-y-auto"
                        >
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-muted-foreground">
                                        <th className="sticky top-0 z-10 bg-secondary px-3 py-2.5 font-medium shadow-xs">
                                            Bahan
                                        </th>
                                        <th className="sticky top-0 z-10 bg-secondary px-3 py-2.5 font-medium shadow-xs">
                                            Kelas
                                        </th>
                                        <th className="sticky top-0 z-10 bg-secondary px-3 py-2.5 text-right font-medium shadow-xs">
                                            Beli
                                        </th>
                                        <th className="sticky top-0 z-10 bg-secondary px-3 py-2.5 text-right font-medium shadow-xs">
                                            Estimasi
                                        </th>
                                        <th className="sticky top-0 z-10 bg-secondary px-3 py-2.5 font-medium shadow-xs">
                                            Label
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plan.items.map((it) => {
                                        const tone = abcTone[it.abc_class];
                                        const lb = labelConfig[it.label];
                                        return (
                                            <tr
                                                key={it.ingredient_id}
                                                className="border-b border-border/60 last:border-0"
                                            >
                                                <td className="px-3 py-3">
                                                    <p className="font-medium">
                                                        {it.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        target{' '}
                                                        {it.qtarget_packages}{' '}
                                                        pack · prioritas{' '}
                                                        {Number(
                                                            it.priority_score,
                                                        ).toFixed(2)}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${tone.bg} ${tone.text}`}
                                                    >
                                                        {it.abc_class}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-right font-semibold tabular-nums">
                                                    {it.recommended_packages}{' '}
                                                    pack
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    {formatRupiah(
                                                        it.estimated_cost,
                                                    )}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${lb.cls}`}
                                                    >
                                                        {lb.text}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </FxTableWrap>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                <Lightbulb className="size-4 text-muted-foreground" />
                                Total tidak pernah melebihi kas. {boughtCount}{' '}
                                bahan direkomendasikan dibeli.
                            </span>
                            <div className="flex items-center gap-2">
                                <FxButton
                                    variant="soft"
                                    onClick={quickSavePlan}
                                    title="Simpan otomatis sebagai draft tanpa membuka wizard"
                                >
                                    <Save className="size-4" />
                                    Draft Cepat
                                </FxButton>
                                <FxButton
                                    variant="coral"
                                    onClick={handleOpenWizard}
                                >
                                    <PackageCheck className="size-4" />
                                    Buat Purchase Order
                                </FxButton>
                            </div>
                        </div>
                    </FxCard>
                </div>
            </Reveal>

            {/* MODAL WIZARD 3-LANGKAH (CREATE PURCHASE ORDER) */}
            <FxModal
                open={wizardOpen}
                onOpenChange={setWizardOpen}
                title="Buat Purchase Order (PO)"
                description="Kelola jadwal pengiriman, sesuaikan kuantitas bahan baku, dan buat dokumen pesanan resmi."
                wide={true}
                className="sm:max-w-4xl lg:max-w-5xl"
                footer={
                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        {wizardStep > 1 ? (
                            <FxButton
                                variant="soft"
                                onClick={() =>
                                    setWizardStep(
                                        (prev) => (prev - 1) as 1 | 2 | 3,
                                    )
                                }
                                disabled={isSubmittingWizard}
                            >
                                <ArrowLeft className="size-4" />
                                Kembali
                            </FxButton>
                        ) : (
                            <FxButton
                                variant="soft"
                                onClick={() => setWizardOpen(false)}
                                disabled={isSubmittingWizard}
                            >
                                Batal
                            </FxButton>
                        )}

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                            {wizardStep === 1 ? (
                                <FxButton
                                    variant="coral"
                                    onClick={() => setWizardStep(2)}
                                >
                                    <span>Lanjut ke Rincian Bahan</span>
                                    <ArrowRight className="size-4" />
                                </FxButton>
                            ) : wizardStep === 2 ? (
                                <FxButton
                                    variant="coral"
                                    onClick={() => setWizardStep(3)}
                                    disabled={wizardItems.length === 0}
                                >
                                    <span>Lanjut ke Dokumen PO</span>
                                    <ArrowRight className="size-4" />
                                </FxButton>
                            ) : (
                                <>
                                    <FxButton
                                        type="button"
                                        variant="soft"
                                        disabled={
                                            isSubmittingWizard ||
                                            wizardItems.length === 0
                                        }
                                        onClick={handlePrintWizardPo}
                                        title="Cetak lembar PO atau simpan sebagai PDF"
                                    >
                                        <Printer className="size-4" />
                                        <span className="hidden sm:inline">
                                            Cetak PO
                                        </span>
                                    </FxButton>
                                    <FxButton
                                        variant="soft"
                                        disabled={isSubmittingWizard}
                                        onClick={() =>
                                            handleFinishWizard('draft')
                                        }
                                    >
                                        <Save className="size-4" />
                                        Simpan Draft Saja
                                    </FxButton>
                                    <FxButton
                                        variant="coral"
                                        disabled={isSubmittingWizard}
                                        onClick={() =>
                                            handleFinishWizard('ordered')
                                        }
                                    >
                                        <Send className="size-4" />
                                        {isSubmittingWizard
                                            ? 'Memproses...'
                                            : 'Kirim PO & Buat Rencana'}
                                    </FxButton>
                                </>
                            )}
                        </div>
                    </div>
                }
            >
                <div className="flex flex-col gap-4">
                    {/* Stepper Header (1. Details Shipment -> 2. Product Details -> 3. Recipient Email) */}
                    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-secondary/70 p-1.5 text-xs">
                        <button
                            type="button"
                            onClick={() => setWizardStep(1)}
                            className={`flex items-center justify-center gap-2 rounded-xl py-2 font-semibold transition-all ${
                                wizardStep === 1
                                    ? 'bg-card text-foreground shadow-sm'
                                    : wizardStep > 1
                                      ? 'text-success hover:bg-hover-soft'
                                      : 'text-muted-foreground'
                            }`}
                        >
                            <span
                                className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                    wizardStep === 1
                                        ? 'bg-primary text-primary-foreground'
                                        : wizardStep > 1
                                          ? 'bg-success text-white'
                                          : 'bg-muted-foreground/30 text-muted-foreground'
                                }`}
                            >
                                {wizardStep > 1 ? (
                                    <Check className="size-3 text-white" />
                                ) : (
                                    '1'
                                )}
                            </span>
                            <span className="hidden sm:inline">
                                1. Detail Pengiriman
                            </span>
                            <span className="sm:hidden">1. Detail</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setWizardStep(2)}
                            className={`flex items-center justify-center gap-2 rounded-xl py-2 font-semibold transition-all ${
                                wizardStep === 2
                                    ? 'bg-card text-foreground shadow-sm'
                                    : wizardStep > 2
                                      ? 'text-success hover:bg-hover-soft'
                                      : 'text-muted-foreground'
                            }`}
                        >
                            <span
                                className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                    wizardStep === 2
                                        ? 'bg-primary text-primary-foreground'
                                        : wizardStep > 2
                                          ? 'bg-success text-white'
                                          : 'bg-muted-foreground/30 text-muted-foreground'
                                }`}
                            >
                                {wizardStep > 2 ? (
                                    <Check className="size-3 text-white" />
                                ) : (
                                    '2'
                                )}
                            </span>
                            <span className="hidden sm:inline">
                                2. Rincian Bahan
                            </span>
                            <span className="sm:hidden">2. Bahan</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setWizardStep(3)}
                            className={`flex items-center justify-center gap-2 rounded-xl py-2 font-semibold transition-all ${
                                wizardStep === 3
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            <span
                                className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                    wizardStep === 3
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted-foreground/30 text-muted-foreground'
                                }`}
                            >
                                3
                            </span>
                            <span className="hidden sm:inline">
                                3. Dokumen & Kirim PO
                            </span>
                            <span className="sm:hidden">3. Kirim PO</span>
                        </button>
                    </div>

                    {/* 2-Column Body (Left: Form per step, Right: Live Summary) */}
                    <div className="grid items-start gap-5 lg:grid-cols-[1.3fr_1fr]">
                        {/* LEFT COLUMN: Steps Form */}
                        <div className="min-w-0">
                            {/* STEP 1: Details Shipment */}
                            {wizardStep === 1 ? (
                                <div className="flex flex-col gap-3.5">
                                    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                        <Truck className="size-4 text-primary" />
                                        Informasi Pengiriman & Operasional
                                    </h3>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <FxField label="Target Tanggal Kedatangan">
                                            <FxInput
                                                type="date"
                                                value={deliveryDate}
                                                onChange={(e) =>
                                                    setDeliveryDate(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </FxField>

                                        <FxField label="Ditugaskan Ke (PIC)">
                                            <FxSelect
                                                value={assignedUserId}
                                                onChange={(e) =>
                                                    setAssignedUserId(
                                                        Number(e.target.value),
                                                    )
                                                }
                                            >
                                                {users.map((u) => (
                                                    <option
                                                        key={u.id}
                                                        value={u.id}
                                                    >
                                                        {u.name} ({u.role})
                                                    </option>
                                                ))}
                                            </FxSelect>
                                        </FxField>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <FxField label="Termin Pembayaran">
                                            <FxSelect
                                                value={paymentTerms}
                                                onChange={(e) =>
                                                    setPaymentTerms(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="Cash">
                                                    Cash (Tunai Toko)
                                                </option>
                                                <option value="Transfer Bank">
                                                    Transfer Bank
                                                </option>
                                                <option value="COD (Cash on Delivery)">
                                                    COD (Bayar di Tempat)
                                                </option>
                                                <option value="Tempo 14 Hari">
                                                    Tempo 14 Hari
                                                </option>
                                                <option value="Tempo 30 Hari">
                                                    Tempo 30 Hari
                                                </option>
                                            </FxSelect>
                                        </FxField>

                                        <FxField label="Metode Pengadaan">
                                            <FxSelect
                                                value={shipmentCarrier}
                                                onChange={(e) =>
                                                    setShipmentCarrier(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="Beli Sendiri ke Pasar / Agen">
                                                    Beli Sendiri (Self-pickup)
                                                </option>
                                                <option value="Diantar Supplier Langsung">
                                                    Diantar Supplier
                                                </option>
                                                <option value="Kurir Instan (GoSend / Grab)">
                                                    Kurir Instan (GoSend / Grab)
                                                </option>
                                            </FxSelect>
                                        </FxField>
                                    </div>

                                    <FxField label="Alamat / Outlet Penerimaan">
                                        <FxInput
                                            value={destinationAddress}
                                            onChange={(e) =>
                                                setDestinationAddress(
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </FxField>

                                    <FxField label="Catatan Tambahan untuk Pembelian (Opsional)">
                                        <FxTextarea
                                            rows={2}
                                            placeholder="Contoh: Periksa tanggal kedaluwarsa susu minimal 6 bulan ke depan..."
                                            value={operationalNotes}
                                            onChange={(e) =>
                                                setOperationalNotes(
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </FxField>
                                </div>
                            ) : null}

                            {/* STEP 2: Product Details (Daftar & Penyesuaian Bahan) */}
                            {wizardStep === 2 ? (
                                <div className="flex flex-col gap-3.5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-foreground">
                                                Daftar Bahan (
                                                {wizardItems.length} bahan)
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Sesuaikan kuantitas atau
                                                tambahkan bahan lain ke rencana.
                                            </p>
                                        </div>
                                        {wizardItems.length > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setWizardItems([])
                                                }
                                                className="text-xs font-semibold text-danger hover:underline"
                                            >
                                                Kosongkan semua
                                            </button>
                                        ) : null}
                                    </div>

                                    {/* Items List */}
                                    <div className="flex max-h-[280px] flex-col gap-2 overflow-y-auto pr-1">
                                        {wizardItems.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                                                Daftar bahan masih kosong. Pilih
                                                bahan di bawah untuk
                                                menambahkannya.
                                            </div>
                                        ) : (
                                            wizardItems.map((item) => {
                                                const subtotal =
                                                    item.packages *
                                                    item.package_price;
                                                return (
                                                    <div
                                                        key={item.ingredient_id}
                                                        className="flex items-center justify-between rounded-xl border border-border/80 bg-secondary/50 p-2.5 text-xs transition-colors hover:bg-hover-soft"
                                                    >
                                                        <div className="min-w-0 flex-1 pr-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="truncate font-semibold text-foreground">
                                                                    {item.name}
                                                                </p>
                                                                <span
                                                                    className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${abcTone[item.abc_class].bg} ${abcTone[item.abc_class].text}`}
                                                                >
                                                                    {
                                                                        item.abc_class
                                                                    }
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                {
                                                                    item.package_size
                                                                }{' '}
                                                                {item.base_unit}{' '}
                                                                · @{' '}
                                                                {formatRupiah(
                                                                    item.package_price,
                                                                )}
                                                            </p>
                                                        </div>

                                                        {/* Stepper */}
                                                        <div className="flex shrink-0 items-center gap-2">
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleUpdateItemPackages(
                                                                            item.ingredient_id,
                                                                            -1,
                                                                        )
                                                                    }
                                                                    className="flex size-6 items-center justify-center rounded-lg bg-secondary text-foreground hover:bg-card"
                                                                >
                                                                    <Minus className="size-3" />
                                                                </button>
                                                                <span className="w-8 text-center font-bold tabular-nums">
                                                                    {
                                                                        item.packages
                                                                    }
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleUpdateItemPackages(
                                                                            item.ingredient_id,
                                                                            1,
                                                                        )
                                                                    }
                                                                    className="flex size-6 items-center justify-center rounded-lg bg-secondary text-foreground hover:bg-card"
                                                                >
                                                                    <Plus className="size-3" />
                                                                </button>
                                                            </div>

                                                            <span className="w-20 text-right font-semibold text-foreground tabular-nums">
                                                                {formatRupiah(
                                                                    subtotal,
                                                                )}
                                                            </span>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveItem(
                                                                        item.ingredient_id,
                                                                    )
                                                                }
                                                                className="p-1 text-muted-foreground hover:text-danger"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Add Product Search Dropdown */}
                                    <div className="rounded-xl border border-border/80 bg-secondary/30 p-3">
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                            <input
                                                type="text"
                                                placeholder="Cari & tambahkan bahan baku lain..."
                                                value={ingredientSearch}
                                                onChange={(e) =>
                                                    setIngredientSearch(
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-9 w-full rounded-lg border border-border bg-card pr-3 pl-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                                            />
                                        </div>

                                        {ingredientSearch.trim() ? (
                                            <div className="mt-2 flex max-h-[140px] flex-col gap-1 overflow-y-auto">
                                                {availableIngredients.length ===
                                                0 ? (
                                                    <p className="p-2 text-center text-xs text-muted-foreground">
                                                        Tidak ada bahan baku
                                                        ditemukan.
                                                    </p>
                                                ) : (
                                                    availableIngredients.map(
                                                        (master) => (
                                                            <button
                                                                key={master.id}
                                                                type="button"
                                                                onClick={() =>
                                                                    handleAddIngredient(
                                                                        master,
                                                                    )
                                                                }
                                                                className="flex items-center justify-between rounded-lg p-2 text-left text-xs transition-colors hover:bg-card"
                                                            >
                                                                <div>
                                                                    <p className="font-semibold text-foreground">
                                                                        {
                                                                            master.name
                                                                        }
                                                                    </p>
                                                                    <p className="text-[11px] text-muted-foreground">
                                                                        {
                                                                            master.package_size
                                                                        }{' '}
                                                                        {
                                                                            master.base_unit
                                                                        }{' '}
                                                                        · Stok
                                                                        saat
                                                                        ini:{' '}
                                                                        {Number(
                                                                            master.current_stock,
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 font-semibold text-primary">
                                                                    <span>
                                                                        {formatRupiah(
                                                                            master.package_price,
                                                                        )}
                                                                    </span>
                                                                    <Plus className="size-3.5" />
                                                                </div>
                                                            </button>
                                                        ),
                                                    )
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}

                            {/* STEP 3: Recipient & Dokumen PO */}
                            {wizardStep === 3 ? (
                                <div className="flex flex-col gap-3.5">
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
                                            onClick={() =>
                                                setDispatchTab('email')
                                            }
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

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <FxField label="Nama Supplier / Toko">
                                            <FxInput
                                                placeholder="Contoh: Toko Berkah Jaya"
                                                value={supplierName}
                                                onChange={(e) =>
                                                    setSupplierName(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </FxField>

                                        {dispatchTab === 'wa' ? (
                                            <FxField
                                                label="Nomor WhatsApp (Opsional)"
                                                hint="Kosongkan untuk pilih kontak langsung di WA"
                                            >
                                                <FxInput
                                                    type="tel"
                                                    placeholder="Contoh: 081234567890"
                                                    value={supplierWa}
                                                    onChange={(e) =>
                                                        setSupplierWa(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </FxField>
                                        ) : (
                                            <FxField
                                                label="Email Supplier (Opsional)"
                                                hint="Kosongkan jika pilih penerima di app email"
                                            >
                                                <FxInput
                                                    type="email"
                                                    placeholder="sales@supplier.com"
                                                    value={supplierEmail}
                                                    onChange={(e) =>
                                                        setSupplierEmail(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </FxField>
                                        )}
                                    </div>

                                    {/* Preview Box - Editable */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-semibold text-muted-foreground">
                                                    Pesan Dokumen Pesanan (Dapat
                                                    Diedit)
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
                                                            setIsPoCustomized(
                                                                false,
                                                            );
                                                            setCustomPoText(
                                                                defaultPoText,
                                                            );
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
                                                    onClick={
                                                        handlePrintWizardPo
                                                    }
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline"
                                                    title="Cetak lembar Purchase Order resmi atau simpan sebagai PDF"
                                                >
                                                    <Printer className="size-3" />
                                                    Cetak PO
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={
                                                        handleCopyWizardText
                                                    }
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                                                >
                                                    <Copy className="size-3" />
                                                    Salin Format
                                                </button>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <textarea
                                                value={activePoText}
                                                onChange={(e) => {
                                                    setCustomPoText(
                                                        e.target.value,
                                                    );
                                                    setIsPoCustomized(true);
                                                }}
                                                rows={9}
                                                className="w-full resize-y rounded-xl border border-border/80 bg-secondary/80 p-3 font-mono text-[11px] leading-relaxed text-foreground transition-all outline-none focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
                                                placeholder="Tulis pesan dokumen pesanan..."
                                            />
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Pesan di atas otomatis di-generate
                                            dan dapat Anda edit bebas sebelum
                                            disalin atau dikirimkan ke supplier.
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* RIGHT COLUMN: Other Information & Sticky Live Summary */}
                        <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 text-xs">
                            <h4 className="border-b border-border/60 pb-2 text-sm font-semibold text-foreground">
                                Informasi Pesanan
                            </h4>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <Calendar className="size-3" /> Tanggal
                                        Tiba:
                                    </span>
                                    <strong className="text-foreground">
                                        {deliveryDate}
                                    </strong>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <UserIcon className="size-3" />{' '}
                                        Ditugaskan:
                                    </span>
                                    <strong className="text-foreground">
                                        {assignedUser?.name ?? 'Owner'}
                                    </strong>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <CreditCard className="size-3" />{' '}
                                        Pembayaran:
                                    </span>
                                    <strong className="text-foreground">
                                        {paymentTerms}
                                    </strong>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <Truck className="size-3" /> Pengadaan:
                                    </span>
                                    <span className="max-w-[150px] truncate text-right font-medium text-foreground">
                                        {shipmentCarrier}
                                    </span>
                                </div>
                                {operationalNotes ? (
                                    <div className="mt-1 rounded-lg bg-secondary/70 p-2 text-[11px] text-muted-foreground">
                                        <span className="font-semibold text-foreground">
                                            Catatan:
                                        </span>{' '}
                                        {operationalNotes}
                                    </div>
                                ) : null}
                            </div>

                            {/* Products Snapshot */}
                            <div className="flex flex-col gap-1.5 border-t border-border/60 pt-2">
                                <span className="font-semibold text-foreground">
                                    Produk ({wizardItems.length} bahan terpilih)
                                </span>
                                <div className="flex max-h-[120px] flex-col gap-1 overflow-y-auto">
                                    {wizardItems.length === 0 ? (
                                        <p className="text-[11px] text-muted-foreground italic">
                                            Daftar produk masih kosong.
                                        </p>
                                    ) : (
                                        wizardItems.map((it) => (
                                            <div
                                                key={it.ingredient_id}
                                                className="flex items-center justify-between text-[11px]"
                                            >
                                                <span className="max-w-[140px] truncate text-foreground">
                                                    {it.name}
                                                </span>
                                                <span className="text-muted-foreground tabular-nums">
                                                    {it.packages} pack ·{' '}
                                                    {formatRupiah(
                                                        it.packages *
                                                            it.package_price,
                                                    )}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Sticky Bottom Summary */}
                            <div className="mt-auto flex flex-col gap-1.5 rounded-xl border-t border-border/80 bg-secondary/40 p-3 pt-2.5">
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Subtotal Estimasi:</span>
                                    <strong className="text-foreground tabular-nums">
                                        {formatRupiah(wizardSubtotal)}
                                    </strong>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Total Kuantitas:</span>
                                    <span className="font-medium text-foreground">
                                        {totalWizardPackages} pack
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Anggaran Kas:</span>
                                    <span className="font-medium text-foreground tabular-nums">
                                        {formatRupiah(cash)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                                    <span className="font-bold text-foreground">
                                        Sisa Kas:
                                    </span>
                                    <strong
                                        className={`text-sm tabular-nums ${
                                            cash - wizardSubtotal >= 0
                                                ? 'text-success'
                                                : 'text-danger'
                                        }`}
                                    >
                                        {formatRupiah(cash - wizardSubtotal)}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </FxModal>
        </PageShell>
    );
}
