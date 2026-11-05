import { Head } from '@inertiajs/react';

export default function Pos() {
    return (
        <>
            <Head title="POS Kasir" />
            <div className="flex flex-1 flex-col gap-2 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">POS Kasir</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                    Catat pesanan multi-item; stok bahan otomatis terpotong sesuai resep (atomik).
                </p>
            </div>
        </>
    );
}