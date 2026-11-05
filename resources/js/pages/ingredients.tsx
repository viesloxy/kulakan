import { Head } from '@inertiajs/react';
import { Box } from 'lucide-react';
import EmptyState from '@/components/empty-state';
import PageHeader from '@/components/page-header';

export default function Ingredients() {
    return (
        <>
            <Head title="Bahan Baku" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Bahan Baku"
                    description="Master bahan, stok, riwayat harga (WAC), dan konversi satuan beli."
                />
                <EmptyState
                    icon={Box}
                    title="Belum ada bahan"
                    description="Tambahkan bahan pertama untuk mulai mencatat stok, harga, dan lead time."
                />
            </div>
        </>
    );
}