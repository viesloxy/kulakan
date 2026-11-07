export type MenuStatus = 'profitable' | 'watchlist' | 'loss';

const config: Record<
    MenuStatus,
    { label: string; className: string; dot: string }
> = {
    profitable: {
        label: 'Profitable',
        className: 'bg-success-soft text-success',
        dot: 'bg-success',
    },
    watchlist: {
        label: 'Watchlist',
        className: 'bg-warning-soft text-warning-ink',
        dot: 'bg-warning',
    },
    loss: {
        label: 'Loss',
        className: 'bg-danger-soft text-danger',
        dot: 'bg-danger',
    },
};

export default function StatusBadge({ status }: { status: MenuStatus }) {
    const c = config[status];

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${c.className}`}
        >
            <span className={`size-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}
