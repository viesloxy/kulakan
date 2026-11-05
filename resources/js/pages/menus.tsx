import { Head } from '@inertiajs/react';

export default function Menus() {
    return (
        <>
            <Head title="Menu & Resep" />
            <div className="flex flex-1 flex-col gap-2 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">Menu & Resep</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                    Kelola menu jual dan susun BOM (resep) 1 level per menu, lengkap dengan waste factor.
                </p>
            </div>
        </>
    );
}