export type MenuStatus = 'profitable' | 'watchlist' | 'loss';

const config: Record<MenuStatus, { label: string; className: string; dot: string }> = {
    profitable: {
        label: 'Profitable',
        className: 'bg-[#E6F5EC] text-[#1D9E53]',
        dot: 'bg-[#1D9E53]',
    },
    watchlist: {
        label: 'Watchlist',
        className: 'bg-[#FEF3D6] text-[#9A6B00]',
        dot: 'bg-[#F2B824]',
    },
    loss: {
        label: 'Loss',
        className: 'bg-[#FCEAE8] text-[#D93829]',
        dot: 'bg-[#D93829]',
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