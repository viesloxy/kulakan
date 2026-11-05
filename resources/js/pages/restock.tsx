import { Head } from '@inertiajs/react';
import { ShoppingBasket } from 'lucide-react';
import EmptyState from '@/components/empty-state';
import PageHeader from '@/components/page-header';

export default function Restock() {
    return (
        <>
            <Head title="Restock Planner" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Restock Planner"
                    description="Masukkan kas, dapatkan rekomendasi belanja sesuai urgensi dan kelas ABC."
                />
                <EmptyState
                    icon={ShoppingBasket}
                    title="Belum ada rekomendasi"
                    description="Isi kas tersedia untuk menghitung rencana belanja yang tidak melebihi modal."
                />
            </div>
        </>
    );
}