import { Head } from '@inertiajs/react';

export default function Ingredients() {
    return (
        <>
            <Head title="Bahan Baku" />
            <div className="flex flex-1 flex-col gap-2 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">Bahan Baku</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                    Master bahan, stok, riwayat harga (WAC), dan konversi satuan beli (kg/liter/pack → gram/ml/pcs).
                </p>
            </div>
        </>
    );
}