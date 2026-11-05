import { Head } from '@inertiajs/react';
import { Utensils } from 'lucide-react';
import EmptyState from '@/components/empty-state';
import PageHeader from '@/components/page-header';

export default function Menus() {
    return (
        <>
            <Head title="Menu & Resep" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Menu & Resep"
                    description="Kelola menu jual dan susun BOM (resep) 1 level dengan waste factor."
                />
                <EmptyState
                    icon={Utensils}
                    title="Belum ada menu"
                    description="Buat menu pertama, lalu susun resepnya agar stok dan HPP terhitung otomatis."
                />
            </div>
        </>
    );
}