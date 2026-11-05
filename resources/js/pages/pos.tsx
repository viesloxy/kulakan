import { Head } from '@inertiajs/react';
import { Receipt } from 'lucide-react';
import EmptyState from '@/components/empty-state';
import PageHeader from '@/components/page-header';

export default function Pos() {
    return (
        <>
            <Head title="POS Kasir" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="POS Kasir"
                    description="Catat pesanan multi-item, stok bahan terpotong otomatis sesuai resep."
                />
                <EmptyState
                    icon={Receipt}
                    title="POS belum aktif"
                    description="Simulator kasir akan muncul di sini setelah menu dan resep siap."
                />
            </div>
        </>
    );
}