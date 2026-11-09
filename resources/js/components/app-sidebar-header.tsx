import { Breadcrumbs } from '@/components/breadcrumbs';
import { NotificationMenu } from '@/components/notification-menu';
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
                <NotificationMenu />
            </div>
        </header>
    );
}
