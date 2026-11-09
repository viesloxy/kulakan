import type { LucideIcon } from 'lucide-react';
import { PackageMinus, TrendingDown, TrendingUp } from 'lucide-react';

export type AlertType = 'low_stock' | 'margin_drop' | 'price_hike';

export type AlertTone = 'soft' | 'danger' | 'warning' | 'coral';

type AlertTypeConfig = {
    icon: LucideIcon;
    tone: AlertTone;
    label: string;
    severity: string;
    severityClass: string;
    action: string;
    href: string;
};

/**
 * Pemetaan tampilan per tipe alert (ikon, warna, label, tindakan).
 * Dipakai bersama oleh Alert Center dan lonceng notifikasi di header agar
 * keduanya menampilkan konteks yang konsisten (FR-021).
 */
export const alertTypeConfig: Record<AlertType, AlertTypeConfig> = {
    low_stock: {
        icon: PackageMinus,
        tone: 'danger',
        label: 'Stok rendah',
        severity: 'Kritis',
        severityClass: 'bg-danger-soft text-danger',
        action: 'Susun restock',
        href: '/restock',
    },
    margin_drop: {
        icon: TrendingDown,
        tone: 'warning',
        label: 'Margin turun',
        severity: 'Peringatan',
        severityClass: 'bg-warning-soft text-warning-ink',
        action: 'Lihat menu',
        href: '/menu',
    },
    price_hike: {
        icon: TrendingUp,
        tone: 'soft',
        label: 'Harga naik',
        severity: 'Info',
        severityClass: 'bg-foreground/5 text-muted-foreground',
        action: 'Lihat bahan',
        href: '/bahan-baku',
    },
};
