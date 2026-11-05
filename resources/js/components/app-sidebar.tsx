import { Link } from '@inertiajs/react';
import { Bell, Box, FolderGit2, LayoutGrid, Receipt, ShoppingBasket, TrendingUp, Utensils } from 'lucide-react';
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
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Bahan Baku',
        href: '/bahan-baku',
        icon: Box,
    },
    {
        title: 'Menu & Resep',
        href: '/menu',
        icon: Utensils,
    },
    {
        title: 'POS Kasir',
        href: '/pos',
        icon: Receipt,
    },
    {
        title: 'Profitabilitas',
        href: '/profitabilitas',
        icon: TrendingUp,
    },
    {
        title: 'Restock Planner',
        href: '/restock',
        icon: ShoppingBasket,
    },
    {
        title: 'Alert',
        href: '/alert',
        icon: Bell,
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
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
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