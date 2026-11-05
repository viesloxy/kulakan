import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';

const stats = [
    { label: 'Kas untuk belanja', value: 'Rp 0' },
    { label: 'Nilai persediaan', value: 'Rp 0' },
    { label: 'Menu profitable', value: '0' },
    { label: 'Alert aktif', value: '0' },
];

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Selamat datang di Kulakan</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Resep, stok, biaya, profit, dan kas dalam satu alur untuk dapur UMKM-mu.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((s) => (
                        <div key={s.label} className="rounded-2xl border border-sidebar-border/70 bg-card p-4">
                            <p className="text-sm text-muted-foreground">{s.label}</p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};