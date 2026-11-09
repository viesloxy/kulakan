import { Link, usePage } from '@inertiajs/react';
import { Bell, Check } from 'lucide-react';
import { IconCircle } from '@/components/fx/fx-icon';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { alertTypeConfig } from '@/lib/alert-display';
import { isOwner } from '@/lib/permissions';

/** Dropdown hanya menampilkan sekilas; sisanya lewat "Lihat Semua Alert". */
const MAX_VISIBLE = 4;

function timeLabel(iso: string | null): string {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);
    const minutes = Math.round((Date.now() - date.getTime()) / 60000);

    if (minutes < 1) {
        return 'baru saja';
    }

    if (minutes < 60) {
        return `${minutes} mnt lalu`;
    }

    if (minutes < 24 * 60) {
        return `${Math.round(minutes / 60)} jam lalu`;
    }

    return `${String(date.getDate()).padStart(2, '0')}/${String(
        date.getMonth() + 1,
    ).padStart(2, '0')}`;
}

/**
 * Lonceng notifikasi di header: ringkasan cepat alert aktif untuk owner.
 * Staff tidak memiliki akses Alert Center (matriks SAD §9) sehingga tombol
 * tidak dirender agar tidak ada aksi yang berakhir 403 (NFR-008).
 */
export function NotificationMenu() {
    const { auth, notifications } = usePage().props;

    if (!isOwner(auth.user)) {
        return null;
    }

    const count = notifications?.count ?? 0;
    const items = (notifications?.items ?? []).slice(0, MAX_VISIBLE);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label={
                        count > 0
                            ? `Notifikasi, ${count} alert aktif`
                            : 'Notifikasi'
                    }
                    className="relative flex size-11 items-center justify-center fx-pill text-muted-foreground transition-colors hover:text-primary data-[state=open]:text-primary"
                >
                    <Bell className="size-[18px]" />
                    {count > 0 ? (
                        <span className="absolute top-1 right-1 flex min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-[18px] font-bold text-white">
                            {count > 99 ? '99+' : count}
                        </span>
                    ) : null}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden p-0"
            >
                <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold">Notifikasi</p>
                        <p className="text-xs text-muted-foreground">
                            {count > 0
                                ? `${count} alert butuh perhatian`
                                : 'Semua kondisi aman'}
                        </p>
                    </div>
                    <IconCircle
                        icon={count > 0 ? Bell : Check}
                        tone={count > 0 ? 'coral' : 'success'}
                        size="sm"
                    />
                </div>

                {items.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                        <IconCircle icon={Check} tone="success" />
                        <p className="text-sm text-muted-foreground">
                            Tidak ada alert aktif. Semua aman.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col py-1">
                        {items.map((item) => {
                            const cfg = alertTypeConfig[item.type];

                            return (
                                <DropdownMenuItem
                                    key={item.id}
                                    asChild
                                    className="items-start gap-3 rounded-none px-4 py-3"
                                >
                                    <Link href={cfg.href}>
                                        <IconCircle
                                            icon={cfg.icon}
                                            tone={cfg.tone}
                                            size="sm"
                                            className="mt-0.5"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate text-sm font-semibold">
                                                    {item.title}
                                                </p>
                                                <span
                                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.severityClass}`}
                                                >
                                                    {cfg.severity}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                                {item.description}
                                            </p>
                                            {timeLabel(item.created_at) ? (
                                                <p className="mt-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                                    {timeLabel(item.created_at)}
                                                </p>
                                            ) : null}
                                        </div>
                                    </Link>
                                </DropdownMenuItem>
                            );
                        })}
                    </div>
                )}

                <DropdownMenuSeparator className="my-0" />
                <DropdownMenuItem
                    asChild
                    className="justify-center rounded-none px-4 py-3"
                >
                    <Link
                        href="/alert"
                        className="text-sm font-semibold text-primary"
                    >
                        Lihat Semua Alert
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
