import { Head } from '@inertiajs/react';

export default function Profitability() {
    return (
        <>
            <Head title="Profitabilitas" />
            <div className="flex flex-1 flex-col gap-2 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">Profitabilitas</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                    Lihat margin, status (Profitable / Watchlist / Loss), dan ranking menu.
                </p>
            </div>
        </>
    );
}