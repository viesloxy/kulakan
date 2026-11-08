import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    Box,
    FolderGit2,
    LayoutGrid,
    Receipt,
    ReceiptText,
    ShoppingBasket,
    TrendingUp,
    Users,
    Utensils,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem, UserRole } from '@/types';

/**
 * Menu navigasi per modul beserta role yang boleh mengaksesnya.
 * Mengikuti matriks akses system-architecture.md §9.
 */
type RoleNavItem = NavItem & { roles: UserRole[] };

const allNavItems: RoleNavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        roles: ['owner'],
    },
    {
        title: 'Bahan Baku',
        href: '/bahan-baku',
        icon: Box,
        roles: ['owner', 'staff'],
    },
    {
        title: 'Menu & Resep',
        href: '/menu',
        icon: Utensils,
        roles: ['owner', 'staff'],
    },
    {
        title: 'POS Kasir',
        href: '/pos',
        icon: Receipt,
        roles: ['owner', 'staff'],
    },
    {
        title: 'Pesanan',
        href: '/pesanan',
        icon: ReceiptText,
        roles: ['owner', 'staff'],
    },
    {
        title: 'Profitabilitas',
        href: '/profitabilitas',
        icon: TrendingUp,
        roles: ['owner'],
    },
    {
        title: 'Restock Planner',
        href: '/restock',
        icon: ShoppingBasket,
        roles: ['owner'],
    },
    {
        title: 'Alert',
        href: '/alert',
        icon: Bell,
        roles: ['owner'],
    },
    {
        title: 'Pengguna',
        href: '/pengguna',
        icon: Users,
        roles: ['owner'],
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/viesloxy/kulakan',
        icon: FolderGit2,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const role: UserRole = auth.user?.role ?? 'staff';

    const mainNavItems = allNavItems.filter((item) =>
        item.roles.includes(role),
    );
    const homeHref = role === 'owner' ? dashboard() : '/pos';

    return (
        <Sidebar collapsible="icon" variant="floating">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={homeHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
