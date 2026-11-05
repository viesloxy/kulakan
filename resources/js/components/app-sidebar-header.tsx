import { Bell } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-3 px-4 md:px-6">
            <div className="fx-pill flex h-11 items-center gap-2 px-4">
                <SidebarTrigger className="-ml-2" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <button
                type="button"
                aria-label="Notifikasi"
                className="fx-pill ml-auto flex size-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            >
                <Bell className="size-[18px]" />
            </button>
        </header>
    );
}