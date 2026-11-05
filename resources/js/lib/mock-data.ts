import type { MenuStatus } from '@/components/status-badge';

export type Abc = 'A' | 'B' | 'C';
export type BaseUnit = 'g' | 'ml' | 'pcs';

export type Ingredient = {
    id: number;
    name: string;
    abc: Abc;
    unit: BaseUnit;
    stock: number;
    minStock: number;
    leadTime: number;
    packSize: number;
    packPrice: number;
    costPerUnit: number;
    quotePrice?: number;
    prevCostPerUnit: number;
};

export type BomItem = {
    ingredientId: number;
    qty: number;
    wastePct: number;
};

export type Menu = {
    id: number;
    name: string;
    category: 'Kopi' | 'Non-Kopi' | 'Makanan';
    price: number;
    overhead: number;
    active: boolean;
    portionsLeft: number;
    bom: BomItem[];
};

// Data ilustratif baku (BL §1.4). WAC Biji Kopi Arabika = Rp 250/g, penawaran terbaru Rp 300/g (+20%).
export const ingredients: Ingredient[] = [
    { id: 1, name: 'Biji Kopi Arabika', abc: 'A', unit: 'g', stock: 1400, minStock: 500, leadTime: 2, packSize: 500, packPrice: 125000, costPerUnit: 250, quotePrice: 300, prevCostPerUnit: 250 },
    { id: 2, name: 'Biji Kopi Robusta', abc: 'C', unit: 'g', stock: 1000, minStock: 300, leadTime: 3, packSize: 500, packPrice: 60000, costPerUnit: 120, prevCostPerUnit: 120 },
    { id: 3, name: 'Susu UHT', abc: 'A', unit: 'ml', stock: 6000, minStock: 2000, leadTime: 1, packSize: 1000, packPrice: 18000, costPerUnit: 18, prevCostPerUnit: 18 },
    { id: 4, name: 'Gula Aren Cair', abc: 'B', unit: 'ml', stock: 2000, minStock: 500, leadTime: 2, packSize: 1000, packPrice: 40000, costPerUnit: 40, prevCostPerUnit: 38 },
    { id: 5, name: 'Cup + Lid', abc: 'A', unit: 'pcs', stock: 95, minStock: 100, leadTime: 3, packSize: 50, packPrice: 25000, costPerUnit: 500, prevCostPerUnit: 500 },
    { id: 6, name: 'Es Batu', abc: 'C', unit: 'g', stock: 10000, minStock: 3000, leadTime: 1, packSize: 5000, packPrice: 10000, costPerUnit: 2, prevCostPerUnit: 2 },
    { id: 7, name: 'Matcha Powder', abc: 'C', unit: 'g', stock: 300, minStock: 150, leadTime: 5, packSize: 100, packPrice: 85000, costPerUnit: 850, prevCostPerUnit: 850 },
    { id: 8, name: 'Sirup Hazelnut', abc: 'C', unit: 'ml', stock: 600, minStock: 200, leadTime: 3, packSize: 750, packPrice: 95000, costPerUnit: 95000 / 750, prevCostPerUnit: 95000 / 750 },
    { id: 9, name: 'Roti Tawar', abc: 'B', unit: 'pcs', stock: 48, minStock: 20, leadTime: 1, packSize: 20, packPrice: 30000, costPerUnit: 1500, prevCostPerUnit: 1500 },
    { id: 10, name: 'Keju Cheddar', abc: 'B', unit: 'g', stock: 1500, minStock: 500, leadTime: 2, packSize: 1000, packPrice: 120000, costPerUnit: 120, prevCostPerUnit: 115 },
];

export const menus: Menu[] = [
    {
        id: 1,
        name: 'Es Kopi Susu Aren',
        category: 'Kopi',
        price: 22000,
        overhead: 1500,
        active: true,
        portionsLeft: 8,
        bom: [
            { ingredientId: 1, qty: 20, wastePct: 5 },
            { ingredientId: 3, qty: 150, wastePct: 2 },
            { ingredientId: 4, qty: 25, wastePct: 4 },
            { ingredientId: 6, qty: 100, wastePct: 0 },
            { ingredientId: 5, qty: 1, wastePct: 0 },
        ],
    },
    {
        id: 2,
        name: 'Kopi Hitam',
        category: 'Kopi',
        price: 15000,
        overhead: 500,
        active: true,
        portionsLeft: 14,
        bom: [
            { ingredientId: 1, qty: 16, wastePct: 5 },
            { ingredientId: 5, qty: 1, wastePct: 0 },
        ],
    },
    {
        id: 3,
        name: 'Hazelnut Latte',
        category: 'Kopi',
        price: 25000,
        overhead: 1500,
        active: true,
        portionsLeft: 3,
        bom: [
            { ingredientId: 1, qty: 20, wastePct: 5 },
            { ingredientId: 3, qty: 250, wastePct: 2 },
            { ingredientId: 8, qty: 30, wastePct: 0 },
            { ingredientId: 6, qty: 100, wastePct: 0 },
            { ingredientId: 5, qty: 1, wastePct: 0 },
        ],
    },
    {
        id: 4,
        name: 'Roti Bakar Keju',
        category: 'Makanan',
        price: 18000,
        overhead: 1500,
        active: true,
        portionsLeft: 9,
        bom: [
            { ingredientId: 9, qty: 2, wastePct: 0 },
            { ingredientId: 10, qty: 30, wastePct: 0 },
            { ingredientId: 3, qty: 50, wastePct: 2 },
        ],
    },
    {
        id: 5,
        name: 'Matcha Latte',
        category: 'Non-Kopi',
        price: 26000,
        overhead: 1500,
        active: true,
        portionsLeft: 6,
        bom: [
            { ingredientId: 7, qty: 20, wastePct: 5 },
            { ingredientId: 3, qty: 200, wastePct: 2 },
            { ingredientId: 5, qty: 1, wastePct: 0 },
        ],
    },
];

export function ingredientById(id: number): Ingredient {
    return ingredients.find((i) => i.id === id)!;
}

export function bomCost(menu: Menu, projected = false): number {
    return menu.bom.reduce((sum, b) => {
        const ing = ingredientById(b.ingredientId);
        const cost = projected ? (ing.quotePrice ?? ing.costPerUnit) : ing.costPerUnit;
        return sum + b.qty * (1 + b.wastePct / 100) * cost;
    }, 0);
}

export function menuHpp(menu: Menu, projected = false): number {
    return bomCost(menu, projected) + menu.overhead;
}

export function marginPct(menu: Menu, projected = false): number {
    return ((menu.price - menuHpp(menu, projected)) / menu.price) * 100;
}

export function menuStatus(menu: Menu, projected = false): MenuStatus {
    const m = marginPct(menu, projected);

    if (m > 45) {
        return 'profitable';
    }
    if (m >= 25) {
        return 'watchlist';
    }

    return 'loss';
}

export function inventoryValue(): number {
    return ingredients.reduce((sum, i) => sum + i.stock * i.costPerUnit, 0);
}

export function purchasePrice(ing: Ingredient): number {
    return (ing.quotePrice ?? ing.costPerUnit) * ing.packSize;
}

export type AlertType = 'stock' | 'margin' | 'price';

export type Alert = {
    id: string;
    type: AlertType;
    title: string;
    description: string;
    time: string;
};

export const alerts: Alert[] = [
    {
        id: 'AL-20261105-01',
        type: 'price',
        title: 'Harga Biji Kopi Arabika naik 20%',
        description: 'Penawaran supplier terbaru Rp 250 menjadi Rp 300 per gram. Ambang alert 10%.',
        time: '08.15',
    },
    {
        id: 'AL-20261105-02',
        type: 'margin',
        title: 'Margin Es Kopi Susu Aren turun ke Watchlist',
        description: 'Margin 48,89% menjadi 44,12% setelah kenaikan harga biji kopi. HPP proyeksi Rp 12.294.',
        time: '08.15',
    },
    {
        id: 'AL-20261105-03',
        type: 'stock',
        title: 'Cup + Lid di bawah stok minimum',
        description: 'Stok 95 pcs, minimum 100 pcs (kurang 5 pcs). Lead time 3 hari.',
        time: '07.40',
    },
];