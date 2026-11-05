import { Head } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import EmptyState from '@/components/empty-state';
import PageHeader from '@/components/page-header';

export default function Alerts() {
    return (
        <>
            <Head title="Alert" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Alert"
                    description="Pantau stok menipis, margin turun, dan kenaikan harga bahan."
                />
                <EmptyState
                    icon={Bell}
                    title="Tidak ada alert"
                    description="Peringatan akan muncul saat stok di bawah minimum atau margin menu memburuk."
                />
            </div>
        </>
    );
}