import { Head } from '@inertiajs/react';

export default function Restock() {
    return (
        <>
            <Head title="Restock Planner" />
            <div className="flex flex-1 flex-col gap-2 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">Restock Planner</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                    Masukkan kas, dapatkan rekomendasi belanja sesuai urgensi & kelas ABC — tanpa melebihi kas.
                </p>
            </div>
        </>
    );
}