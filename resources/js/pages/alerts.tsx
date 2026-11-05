import { Head } from '@inertiajs/react';

export default function Alerts() {
    return (
        <>
            <Head title="Alert" />
            <div className="flex flex-1 flex-col gap-2 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">Alert</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                    Pantau stok menipis, margin turun, dan kenaikan harga bahan.
                </p>
            </div>
        </>
    );
}