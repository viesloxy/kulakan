import { Bell } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ThemeToggle } from '@/components/theme-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-3 px-4 md:px-6">
            <div className="flex h-11 items-center gap-2 fx-pill px-4">
                <SidebarTrigger className="-ml-2" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
                <button
                    type="button"
                    aria-label="Notifikasi"
                    className="flex size-11 items-center justify-center fx-pill text-muted-foreground transition-colors hover:text-primary"
                >
                    <Bell className="size-[18px]" />
                </button>
            </div>
        </header>
    );
}
