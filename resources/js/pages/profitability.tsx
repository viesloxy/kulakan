import { Link, router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowRight,
    ArrowUp,
    ArrowUpDown,
    ChevronRight,
    Coins,
    Flame,
    Info,
    Search,
    TrendingUp,
    TriangleAlert,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    Cell,
    Tooltip as ChartTooltip,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';
import { FxButton } from '@/components/fx/fx-button';
import { FxCard, FxSoft } from '@/components/fx/fx-card';
import { FxField, FxInput, FxModal, FxSelect } from '@/components/fx/fx-form';
import { IconCircle } from '@/components/fx/fx-icon';
import { FxTableWrap } from '@/components/fx/fx-table-wrap';
import Reveal from '@/components/motion/reveal';
import PageShell from '@/components/page-shell';
import StatusBadge, { type MenuStatus } from '@/components/status-badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatPercent, formatRupiah } from '@/lib/format';

type Category = 'Kopi' | 'Non-Kopi' | 'Makanan';
type BaseUnit = 'gram' | 'ml' | 'pcs';

type RecipeItem = {
    ingredient_id: number;
    ingredient_name: string;
    quantity_needed: string;
    base_unit: BaseUnit;
    waste_factor: string;
    cost_per_unit: string;
    item_cost: string;
    cost_pct: string;
};

type ProfitRow = {
    id: number;
    name: string;
    category: Category;
    selling_price: number | string;
    overhead: string;
    current_hpp: string;
    margin_rupiah: string;
    margin_pct: string;
    status: MenuStatus;
    projected_hpp: string | null;
    projected_margin_pct: string | null;
    projected_status: MenuStatus | null;
    recipe_items?: RecipeItem[];
};

type SimRow = {
    menu_id: number;
    name: string;
    old_hpp: string;
    old_margin: string;
    old_status: MenuStatus;
    new_hpp: string;
    new_margin: string;
    new_status: MenuStatus;
};

type IngredientOption = {
    id: number;
    name: string;
    base_unit: BaseUnit;
    cost_per_unit: string;
};

type Counts = { profitable: number; watchlist: number; loss: number };

type RankingRow = {
    menu_id: number;
    name: string;
    selling_price: number;
    quantity_sold: number;
    revenue: number;
    cogs: number;
    gross_profit: number;
    gross_margin_pct: string | null;
    contribution_pct: string | null;
};

type Totals = {
    revenue: number;
    cogs: number;
    gross_profit: number;
    quantity_sold: number;
};

type PeriodOption = { key: string; label: string };

type Props = {
    menus: ProfitRow[];
    summary: { total: number; avg_margin: string; counts: Counts };
    period: string;
    periods: PeriodOption[];
    ranking: RankingRow[];
    totals: Totals;
    ingredients: IngredientOption[];
    filters: { sim_ingredient: number | null; sim_price: string };
    simulation: SimRow[] | null;
};

// Warna batang mengikuti token tone status agar ikut menyesuaikan dark mode.
const statusColor: Record<MenuStatus, string> = {
    profitable: 'var(--success)',
    watchlist: 'var(--warning)',
    loss: 'var(--danger)',
};

type MarginSortField =
    | 'name'
    | 'selling_price'
    | 'current_hpp'
    | 'margin_rupiah'
    | 'margin_pct'
    | 'status';
type RankingSortField =
    | 'rank'
    | 'name'
    | 'quantity_sold'
    | 'revenue'
    | 'cogs'
    | 'gross_profit'
    | 'gross_margin_pct'
    | 'contribution_pct';
type SortDirection = 'asc' | 'desc';

function ColumnHeaderTip({
    label,
    title,
    description,
    align = 'left',
}: {
    label: React.ReactNode;
    title: string;
    description: string;
    align?: 'left' | 'right';
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    tabIndex={0}
                    className={`inline-flex cursor-help items-center gap-1 underline decoration-muted-foreground/50 decoration-dotted underline-offset-4 transition-colors hover:text-foreground focus:text-foreground focus:outline-none ${
                        align === 'right' ? 'justify-end' : ''
                    }`}
                >
                    {label}
                </span>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className="z-50 max-w-[260px] rounded-xl bg-card p-3 text-xs text-foreground shadow-md ring-1 ring-border [&>svg]:fill-card"
            >
                <p className="font-semibold text-foreground">{title}</p>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                    {description}
                </p>
            </TooltipContent>
        </Tooltip>
    );
}

export default function Profitability({
    menus,
    summary,
    period,
    periods,
    ranking,
    totals,
    ingredients,
    filters,
    simulation,
}: Props) {
    const [simOpen, setSimOpen] = useState(false);
    const [selectedMenuForCost, setSelectedMenuForCost] =
        useState<ProfitRow | null>(null);

    // Aspek 1 & 3: Filter & Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | Category>(
        'all',
    );
    const [statusFilter, setStatusFilter] = useState<'all' | MenuStatus>('all');
    const [showLimit, setShowLimit] = useState<number>(10);

    // Aspek 1: Segmentasi Chart
    const [chartSegment, setChartSegment] = useState<
        'all' | 'top' | 'watchlist'
    >('all');

    // Aspek 3: Sorting states
    const [sortField, setSortField] = useState<MarginSortField>('margin_pct');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const [rankSortField, setRankSortField] =
        useState<RankingSortField>('gross_profit');
    const [rankSortDirection, setRankSortDirection] =
        useState<SortDirection>('desc');

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    function changePeriod(key: string) {
        router.get(
            '/profitabilitas',
            { period: key },
            {
                only: ['period', 'ranking', 'totals'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function handleSort(field: MarginSortField) {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection(field === 'name' ? 'asc' : 'desc');
        }
    }

    function handleRankSort(field: RankingSortField) {
        if (rankSortField === field) {
            setRankSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setRankSortField(field);
            setRankSortDirection(
                field === 'name' || field === 'rank' ? 'asc' : 'desc',
            );
        }
    }

    // Category counts for filter chips
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {
            all: menus.length,
            Kopi: 0,
            'Non-Kopi': 0,
            Makanan: 0,
        };
        menus.forEach((m) => {
            if (counts[m.category] !== undefined) {
                counts[m.category]++;
            }
        });
        return counts;
    }, [menus]);

    // Filter & Sort menus
    const filteredMenus = useMemo(() => {
        return menus.filter((m) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                if (!m.name.toLowerCase().includes(q)) return false;
            }
            if (categoryFilter !== 'all' && m.category !== categoryFilter) {
                return false;
            }
            if (statusFilter !== 'all' && m.status !== statusFilter) {
                return false;
            }
            return true;
        });
    }, [menus, searchQuery, categoryFilter, statusFilter]);

    const sortedMenus = useMemo(() => {
        return [...filteredMenus].sort((a, b) => {
            let valA: unknown = a[sortField];
            let valB: unknown = b[sortField];

            if (sortField === 'name') {
                return sortDirection === 'asc'
                    ? (valA as string).localeCompare(valB as string)
                    : (valB as string).localeCompare(valA as string);
            }

            if (sortField === 'status') {
                const order: Record<MenuStatus, number> = {
                    loss: 1,
                    watchlist: 2,
                    profitable: 3,
                };
                const diff = order[a.status] - order[b.status];
                return sortDirection === 'asc' ? diff : -diff;
            }

            const numA = Number(valA);
            const numB = Number(valB);
            return sortDirection === 'asc' ? numA - numB : numB - numA;
        });
    }, [filteredMenus, sortField, sortDirection]);

    const displayedMenus = useMemo(() => {
        if (showLimit === 0) return sortedMenus;
        return sortedMenus.slice(0, showLimit);
    }, [sortedMenus, showLimit]);

    // Segmented & Dynamic Chart Data
    const chartData = useMemo(() => {
        let source = [...menus];
        if (chartSegment === 'top') {
            source.sort((a, b) => Number(b.margin_pct) - Number(a.margin_pct));
            source = source.slice(0, 10);
        } else if (chartSegment === 'watchlist') {
            source.sort((a, b) => Number(a.margin_pct) - Number(b.margin_pct));
            source = source.slice(0, 10);
        } else {
            source.sort((a, b) => Number(b.margin_pct) - Number(a.margin_pct));
        }

        return source.map((m) => ({
            name: m.name,
            margin: Number(m.margin_pct),
            status: m.status,
        }));
    }, [menus, chartSegment]);

    const dynamicChartHeight = useMemo(() => {
        const itemHeight = isMobile ? 30 : 34;
        return Math.max(
            isMobile ? 220 : 260,
            Math.min(600, chartData.length * itemHeight),
        );
    }, [chartData.length, isMobile]);

    // Sorted Ranking
    const sortedRanking = useMemo(() => {
        return [...ranking].sort((a, b) => {
            if (rankSortField === 'name') {
                return rankSortDirection === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            }
            if (rankSortField === 'rank') {
                const idxA = ranking.indexOf(a);
                const idxB = ranking.indexOf(b);
                return rankSortDirection === 'asc' ? idxA - idxB : idxB - idxA;
            }

            const valA = Number(a[rankSortField as keyof RankingRow] ?? 0);
            const valB = Number(b[rankSortField as keyof RankingRow] ?? 0);
            return rankSortDirection === 'asc' ? valA - valB : valB - valA;
        });
    }, [ranking, rankSortField, rankSortDirection]);

    const statusCards = [
        {
            label: 'Profitable',
            value: summary.counts.profitable,
            icon: TrendingUp,
            tone: 'success' as const,
            tip: 'Menu dengan margin kotor > 45%. Sangat sehat dan menjadi penopang keuntungan utama.',
        },
        {
            label: 'Watchlist',
            value: summary.counts.watchlist,
            icon: TriangleAlert,
            tone: 'warning' as const,
            tip: 'Menu dengan margin kotor 25% – 45%. Perlu dipantau ketat jika harga bahan baku naik.',
        },
        {
            label: 'Loss',
            value: summary.counts.loss,
            icon: XCircle,
            tone: 'danger' as const,
            tip: 'Menu dengan margin kotor < 25%. Kritis atau merugi; pertimbangkan penyesuaian resep atau harga jual.',
        },
    ];

    return (
        <TooltipProvider delayDuration={150}>
            <PageShell
                title="Profitabilitas"
                description="Margin dan status tiap menu, dihitung dari HPP terkini."
                actions={
                    <FxButton variant="coral" onClick={() => setSimOpen(true)}>
                        <Coins className="size-4" />
                        Simulasi harga
                    </FxButton>
                }
            >
                {/* TOP CARDS: Margin Average & Status Counts */}
                <Reveal delay={0.05}>
                    <div className="grid gap-4 md:grid-cols-4">
                        <FxCard className="flex flex-col justify-between fx-coral p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-white">
                                    Margin rata-rata
                                </span>
                                <IconCircle
                                    icon={Coins}
                                    tone="white"
                                    size="sm"
                                />
                            </div>
                            <p className="mt-3 text-2xl font-bold tracking-tight text-white tabular-nums">
                                {formatPercent(summary.avg_margin, 1)}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-white/85">
                                dari {summary.total} menu aktif
                            </p>
                        </FxCard>

                        {statusCards.map((s) => (
                            <FxCard
                                key={s.label}
                                className="flex flex-col justify-between p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="inline-flex cursor-help items-center gap-1 text-sm text-muted-foreground underline decoration-muted-foreground/40 decoration-dotted underline-offset-4 hover:text-foreground">
                                                {s.label}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="top"
                                            className="max-w-[220px] rounded-xl bg-card p-2.5 text-xs text-foreground shadow-md ring-1 ring-border"
                                        >
                                            <p className="font-semibold">
                                                {s.label}
                                            </p>
                                            <p className="mt-1 text-muted-foreground">
                                                {s.tip}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <IconCircle
                                        icon={s.icon}
                                        tone={s.tone}
                                        size="sm"
                                    />
                                </div>
                                <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums">
                                    {s.value}
                                </p>
                                <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                                    menu
                                </p>
                            </FxCard>
                        ))}
                    </div>
                </Reveal>

                {/* ASPEK 2: Kriteria Ambang Batas Status Legend */}
                <Reveal delay={0.08}>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-secondary/40 px-4 py-3 text-xs">
                        <div className="flex items-center gap-2">
                            <Info className="size-4 shrink-0 text-primary" />
                            <span className="font-semibold text-foreground">
                                Kriteria Ambang Batas Status:
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                            <div className="flex items-center gap-2">
                                <span className="size-2.5 rounded-full bg-success" />
                                <span className="font-medium text-foreground">
                                    Profitable:
                                </span>
                                <span className="text-muted-foreground">
                                    &gt; 45% (Margin Sehat)
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="size-2.5 rounded-full bg-warning" />
                                <span className="font-medium text-foreground">
                                    Watchlist:
                                </span>
                                <span className="text-muted-foreground">
                                    25% – 45% (Perlu Pantauan)
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="size-2.5 rounded-full bg-danger" />
                                <span className="font-medium text-foreground">
                                    Loss:
                                </span>
                                <span className="text-muted-foreground">
                                    &lt; 25% (Kritis / Tinjau Ulang)
                                </span>
                            </div>
                        </div>
                    </div>
                </Reveal>

                {/* ASPEK 1: Dynamic & Segmented Margin per Menu Chart */}
                <Reveal delay={0.1}>
                    <FxCard className="p-4 md:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                            <div>
                                <h2 className="text-base font-semibold">
                                    Margin per menu
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Persentase margin kotor terhadap harga jual
                                    terkini.
                                </p>
                            </div>

                            {/* Chart Segment Controls */}
                            <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/50 p-1 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setChartSegment('all')}
                                    className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                                        chartSegment === 'all'
                                            ? 'bg-card text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Semua ({menus.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setChartSegment('top')}
                                    className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                                        chartSegment === 'top'
                                            ? 'bg-card text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Top 10 Margin
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setChartSegment('watchlist')}
                                    className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                                        chartSegment === 'watchlist'
                                            ? 'bg-card text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Perlu Perhatian (10)
                                </button>
                            </div>
                        </div>

                        <FxSoft className="mt-2 max-h-[460px] w-full overflow-y-auto p-2 sm:p-4">
                            <div style={{ height: `${dynamicChartHeight}px` }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={chartData}
                                        layout="vertical"
                                        margin={
                                            isMobile
                                                ? {
                                                      top: 2,
                                                      right: 12,
                                                      bottom: 2,
                                                      left: -6,
                                                  }
                                                : {
                                                      top: 4,
                                                      right: 28,
                                                      bottom: 4,
                                                      left: 8,
                                                  }
                                        }
                                    >
                                        <XAxis
                                            type="number"
                                            domain={[0, 100]}
                                            tickFormatter={(v: number) =>
                                                `${v}%`
                                            }
                                            tick={{
                                                fontSize: isMobile ? 10 : 12,
                                                fill: 'var(--muted-foreground)',
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={isMobile ? 108 : 148}
                                            tickFormatter={(val: string) => {
                                                if (
                                                    isMobile &&
                                                    val.length > 16
                                                ) {
                                                    return `${val.slice(0, 15)}…`;
                                                }
                                                return val;
                                            }}
                                            tick={{
                                                fontSize: isMobile ? 10 : 12,
                                                fill: 'var(--foreground)',
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <ChartTooltip
                                            cursor={{
                                                fill: 'var(--hover-soft)',
                                            }}
                                            formatter={(value) => [
                                                `${Number(value).toFixed(2)}%`,
                                                'Margin',
                                            ]}
                                            contentStyle={{
                                                borderRadius: 12,
                                                border: 'none',
                                                fontSize: isMobile ? 11 : 12,
                                                backgroundColor: 'var(--card)',
                                                color: 'var(--foreground)',
                                                boxShadow:
                                                    '0 4px 12px rgba(0,0,0,0.15)',
                                            }}
                                        />
                                        <Bar
                                            dataKey="margin"
                                            radius={[0, 6, 6, 0]}
                                            barSize={isMobile ? 14 : 18}
                                        >
                                            {chartData.map((r, index) => (
                                                <Cell
                                                    key={`${r.name}-${index}`}
                                                    fill={statusColor[r.status]}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </FxSoft>
                    </FxCard>
                </Reveal>

                {/* ASPEK 1 & 3: Table with Search, Filters, Sorting, and Click-to-Breakdown */}
                <Reveal delay={0.15}>
                    <FxCard className="flex flex-col gap-4 p-4 md:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base font-semibold">
                                    Daftar Margin & HPP Menu
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Klik baris menu untuk melihat rincian bahan
                                    resep (<i>Cost Driver Breakdown</i>).
                                </p>
                            </div>

                            {/* Show Limit Selector */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Tampilkan:</span>
                                <select
                                    value={showLimit}
                                    onChange={(e) =>
                                        setShowLimit(Number(e.target.value))
                                    }
                                    className="h-8 rounded-lg border border-border/80 bg-secondary/60 px-2 text-xs font-semibold text-foreground focus:outline-none"
                                >
                                    <option value={10}>10 Menu</option>
                                    <option value={25}>25 Menu</option>
                                    <option value={0}>
                                        Semua ({menus.length})
                                    </option>
                                </select>
                            </div>
                        </div>

                        {/* Search and Filter Chips */}
                        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
                            <div className="relative w-full sm:max-w-xs">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Cari nama menu..."
                                    className="h-9 w-full rounded-xl border border-border/80 bg-background/80 pr-8 pl-9 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                                />
                                {searchQuery ? (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                ) : null}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2.5">
                                {/* Category Filter */}
                                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                    <span className="mr-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                        Kategori:
                                    </span>
                                    {(
                                        [
                                            'all',
                                            'Kopi',
                                            'Non-Kopi',
                                            'Makanan',
                                        ] as const
                                    ).map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() =>
                                                setCategoryFilter(cat)
                                            }
                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
                                                categoryFilter === cat
                                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                                    : 'bg-secondary/70 text-muted-foreground hover:bg-hover-soft hover:text-foreground'
                                            }`}
                                        >
                                            {cat === 'all' ? 'Semua' : cat}
                                            <span className="ml-1 text-[10px] opacity-80">
                                                ({categoryCounts[cat] ?? 0})
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Status Filter */}
                                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                    <span className="mr-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                        Status:
                                    </span>
                                    {(
                                        [
                                            'all',
                                            'profitable',
                                            'watchlist',
                                            'loss',
                                        ] as const
                                    ).map((st) => (
                                        <button
                                            key={st}
                                            type="button"
                                            onClick={() => setStatusFilter(st)}
                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
                                                statusFilter === st
                                                    ? 'bg-foreground text-background shadow-xs'
                                                    : 'bg-secondary/70 text-muted-foreground hover:bg-hover-soft hover:text-foreground'
                                            }`}
                                        >
                                            {st === 'all'
                                                ? 'Semua'
                                                : st === 'profitable'
                                                  ? 'Profitable'
                                                  : st === 'watchlist'
                                                    ? 'Watchlist'
                                                    : 'Loss'}
                                            <span className="ml-1 text-[10px] opacity-80">
                                                (
                                                {st === 'all'
                                                    ? menus.length
                                                    : summary.counts[st]}
                                                )
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Interactive Table with Sticky Header & Sorting */}
                        <FxTableWrap
                            className="rounded-xl border border-border/70"
                            viewportClassName="max-h-[500px] overflow-y-auto"
                        >
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="sticky top-0 z-10 bg-secondary/95 text-left text-xs text-muted-foreground shadow-xs backdrop-blur">
                                        <th className="px-4 py-3 font-medium">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSort('name')
                                                }
                                                className="group inline-flex items-center gap-1 transition-colors hover:text-foreground"
                                            >
                                                <span>Menu</span>
                                                <span className="text-muted-foreground/60 group-hover:text-foreground">
                                                    {sortField === 'name' ? (
                                                        sortDirection ===
                                                        'asc' ? (
                                                            <ArrowUp className="size-3 text-primary" />
                                                        ) : (
                                                            <ArrowDown className="size-3 text-primary" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSort('selling_price')
                                                }
                                                className="group inline-flex items-center gap-1 transition-colors hover:text-foreground"
                                            >
                                                <ColumnHeaderTip
                                                    label="Harga jual"
                                                    title="Harga Jual Menu"
                                                    description="Harga satuan menu yang ditagihkan kepada pelanggan di kasir POS."
                                                    align="right"
                                                />
                                                <span className="text-muted-foreground/60 group-hover:text-foreground">
                                                    {sortField ===
                                                    'selling_price' ? (
                                                        sortDirection ===
                                                        'asc' ? (
                                                            <ArrowUp className="size-3 text-primary" />
                                                        ) : (
                                                            <ArrowDown className="size-3 text-primary" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSort('current_hpp')
                                                }
                                                className="group inline-flex items-center gap-1 transition-colors hover:text-foreground"
                                            >
                                                <ColumnHeaderTip
                                                    label="HPP"
                                                    title="Harga Pokok Penjualan (HPP)"
                                                    description="Total modal bahan baku per porsi (WAC) ditambah biaya overhead menu."
                                                    align="right"
                                                />
                                                <span className="text-muted-foreground/60 group-hover:text-foreground">
                                                    {sortField ===
                                                    'current_hpp' ? (
                                                        sortDirection ===
                                                        'asc' ? (
                                                            <ArrowUp className="size-3 text-primary" />
                                                        ) : (
                                                            <ArrowDown className="size-3 text-primary" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSort('margin_rupiah')
                                                }
                                                className="group inline-flex items-center gap-1 transition-colors hover:text-foreground"
                                            >
                                                <ColumnHeaderTip
                                                    label="Margin Rp"
                                                    title="Margin Nominal (Rp)"
                                                    description="Laba kotor per porsi dalam rupiah: Harga Jual dikurangi HPP."
                                                    align="right"
                                                />
                                                <span className="text-muted-foreground/60 group-hover:text-foreground">
                                                    {sortField ===
                                                    'margin_rupiah' ? (
                                                        sortDirection ===
                                                        'asc' ? (
                                                            <ArrowUp className="size-3 text-primary" />
                                                        ) : (
                                                            <ArrowDown className="size-3 text-primary" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSort('margin_pct')
                                                }
                                                className="group inline-flex items-center gap-1 transition-colors hover:text-foreground"
                                            >
                                                <ColumnHeaderTip
                                                    label="Margin"
                                                    title="Persentase Margin Kotor"
                                                    description="Persentase laba kotor terhadap harga jual: (Margin Rp / Harga Jual) × 100%."
                                                    align="right"
                                                />
                                                <span className="text-muted-foreground/60 group-hover:text-foreground">
                                                    {sortField ===
                                                    'margin_pct' ? (
                                                        sortDirection ===
                                                        'asc' ? (
                                                            <ArrowUp className="size-3 text-primary" />
                                                        ) : (
                                                            <ArrowDown className="size-3 text-primary" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSort('status')
                                                }
                                                className="group inline-flex items-center gap-1 transition-colors hover:text-foreground"
                                            >
                                                <ColumnHeaderTip
                                                    label="Status"
                                                    title="Status Profitabilitas"
                                                    description="Klasifikasi kesehatan margin: Profitable (>45%), Watchlist (25–45%), Loss (<25%)."
                                                />
                                                <span className="text-muted-foreground/60 group-hover:text-foreground">
                                                    {sortField === 'status' ? (
                                                        sortDirection ===
                                                        'asc' ? (
                                                            <ArrowUp className="size-3 text-primary" />
                                                        ) : (
                                                            <ArrowDown className="size-3 text-primary" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedMenus.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-8 text-center text-muted-foreground"
                                            >
                                                Tidak ada menu yang sesuai
                                                dengan filter atau kata kunci
                                                pencarian.
                                            </td>
                                        </tr>
                                    ) : (
                                        displayedMenus.map((r) => (
                                            <tr
                                                key={r.id}
                                                onClick={() =>
                                                    setSelectedMenuForCost(r)
                                                }
                                                className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-hover-soft"
                                            >
                                                <td className="px-4 py-3 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <span>{r.name}</span>
                                                        <span className="rounded-md bg-secondary/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                            {r.category}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {formatRupiah(
                                                        r.selling_price,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {formatRupiah(
                                                        r.current_hpp,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {formatRupiah(
                                                        r.margin_rupiah,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                                    {formatPercent(
                                                        r.margin_pct,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge
                                                        status={r.status}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedMenuForCost(
                                                                r,
                                                            );
                                                        }}
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                                    >
                                                        <span>Rincian</span>
                                                        <ChevronRight className="size-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </FxTableWrap>

                        {sortedMenus.length > displayedMenus.length ? (
                            <p className="text-center text-xs text-muted-foreground">
                                Menampilkan {displayedMenus.length} dari{' '}
                                {sortedMenus.length} menu.{' '}
                                <button
                                    type="button"
                                    onClick={() => setShowLimit(0)}
                                    className="font-semibold text-primary hover:underline"
                                >
                                    Tampilkan Semua
                                </button>
                            </p>
                        ) : null}
                    </FxCard>
                </Reveal>

                {/* RANKING MENU: Sales Aggregates & Ranking Table */}
                <Reveal delay={0.2}>
                    <FxCard className="flex flex-col gap-4 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base font-semibold">
                                    Ranking menu
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Agregat periode dari pesanan selesai,
                                    diurutkan menurut laba kotor riil.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {periods.map((p) => (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => changePeriod(p.key)}
                                        className={`h-8 rounded-full px-3 text-xs font-semibold transition-all duration-200 ${
                                            period === p.key
                                                ? 'fx-coral'
                                                : 'bg-secondary text-foreground hover:bg-hover-soft'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <FxSoft className="flex flex-col gap-2 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        Total Revenue
                                    </span>
                                    <ColumnHeaderTip
                                        label={<Info className="size-3.5" />}
                                        title="Total Omzet Penjualan"
                                        description="Akumulasi omzet penjualan dari seluruh pesanan yang telah selesai pada periode ini."
                                        align="right"
                                    />
                                </div>
                                <p className="text-lg font-bold tabular-nums">
                                    {formatRupiah(totals.revenue)}
                                </p>
                            </FxSoft>
                            <FxSoft className="flex flex-col gap-2 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        HPP Terjual (COGS)
                                    </span>
                                    <ColumnHeaderTip
                                        label={<Info className="size-3.5" />}
                                        title="Cost of Goods Sold (COGS)"
                                        description="Total modal bahan baku yang keluar untuk memproduksi menu-menu yang terjual."
                                        align="right"
                                    />
                                </div>
                                <p className="text-lg font-bold tabular-nums">
                                    {formatRupiah(totals.cogs)}
                                </p>
                            </FxSoft>
                            <FxSoft className="flex flex-col gap-2 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        Gross Profit
                                    </span>
                                    <ColumnHeaderTip
                                        label={<Info className="size-3.5" />}
                                        title="Laba Kotor Penjualan"
                                        description="Total pendapatan kotor dikurangi biaya modal bahan baku: Revenue - COGS."
                                        align="right"
                                    />
                                </div>
                                <p className="text-lg font-bold tabular-nums">
                                    {formatRupiah(totals.gross_profit)}
                                </p>
                            </FxSoft>
                        </div>

                        <FxTableWrap
                            className="rounded-xl border border-border/70"
                            viewportClassName="max-h-[500px] overflow-y-auto"
                        >
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="sticky top-0 z-10 bg-secondary/95 text-left text-xs text-muted-foreground shadow-xs backdrop-blur">
                                        <th className="rounded-l-xl px-3 py-2.5 font-medium">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRankSort('rank')
                                                }
                                                className="group inline-flex items-center gap-1 transition-colors hover:text-foreground"
                                            >
                                                <span>#</span>
                                                <span className="text-muted-foreground/60 group-hover:text-foreground">
                                                    {rankSortField ===
                                                    'rank' ? (
                                                        rankSortDirection ===
                                                        'asc' ? (
                                                            <ArrowUp className="size-3 text-primary" />
                                                        ) : (
                                                            <ArrowDown className="size-3 text-primary" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-3 py-2.5 font-medium">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRankSort('name')
                                                }
                                                className="group inline-flex items-center gap-1 transition-colors hover:text-foreground"
                                            >
                                                <span>Menu</span>
                                                <span className="text-muted-foreground/60 group-hover:text-foreground">
                                                    {rankSortField ===
                                                    'name' ? (
                                                        rankSortDirection ===
                                                        'asc' ? (
                                                            <ArrowUp className="size-3 text-primary" />
                                                        ) : (
                                                            <ArrowDown className="size-3 text-primary" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-3 py-2.5 text-right font-medium">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRankSort(
                                                        'quantity_sold',
                                                    )
                                                }
                                                className="group inline-flex items-center gap-1 transition-colors hover:text-foreground"
                                            >
                                                <ColumnHeaderTip
                                                    label="Terjual"
                                                    title="Kuantitas Terjual"
                                                    description="Total porsi menu yang terjual dan selesai di kasir pada rentang waktu ini."
                                                    align="right"
                                                />
                                                <span className="text-muted-foreground/60 group-hover:text-foreground">
                                                    {rankSortField ===
                                                    'quantity_sold' ? (
                                                        rankSortDirection ===
                                                        'asc' ? (
                                                            <ArrowUp className="size-3 text-primary" />
                                                        ) : (
                                                            <ArrowDown className="size-3 text-primary" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-3 py-2.5 text-right font-medium">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRankSort('revenue')
                                                }
                                                className="group inline-flex items-center gap-1 transition-colors hover:text-foreground"
                                            >
                                                <ColumnHeaderTip
                                                    label="Revenue"
                                                    title="Omzet Menu"
                                                    description="Total nilai uang masuk dari penjualan menu ini."
                                                    align="right"
                                                />
                                                <span className="text-muted-foreground/60 group-hover:text-foreground">
                                                    {rankSortField ===
                                                    'revenue' ? (
                                                        rankSortDirection ===
                                                        'asc' ? (
                                                            <ArrowUp className="size-3 text-primary" />
                                                        ) : (
                                                            <ArrowDown className="size-3 text-primary" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-3 py-2.5 text-right font-medium">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRankSort('cogs')
                                                }
                                                className="group inline-flex items-center gap-1 transition-colors hover:text-foreground"
                                            >
                                                <ColumnHeaderTip
                                                    label="HPP terjual"
                                                    title="Modal Bahan Terjual (COGS)"
                                                    description="Akumulasi modal bahan baku yang keluar untuk memproduksi porsi terjual."
                                                    align="right"
                                                />
                                                <span className="text-muted-foreground/60 group-hover:text-foreground">
                                                    {rankSortField ===
                                                    'cogs' ? (
                                                        rankSortDirection ===
                                                        'asc' ? (
                                                            <ArrowUp className="size-3 text-primary" />
                                                        ) : (
                                                            <ArrowDown className="size-3 text-primary" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-3 py-2.5 text-right font-medium">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRankSort(
                                                        'gross_profit',
                                                    )
                                                }
                                                className="group inline-flex items-center gap-1 transition-colors hover:text-foreground"
                                            >
                                                <ColumnHeaderTip
                                                    label="Gross profit"
                                                    title="Laba Kotor Riil"
                                                    description="Omzet menu dikurangi HPP bahan terjual (Revenue - COGS)."
                                                    align="right"
                                                />
                                                <span className="text-muted-foreground/60 group-hover:text-foreground">
                                                    {rankSortField ===
                                                    'gross_profit' ? (
                                                        rankSortDirection ===
                                                        'asc' ? (
                                                            <ArrowUp className="size-3 text-primary" />
                                                        ) : (
                                                            <ArrowDown className="size-3 text-primary" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-3 py-2.5 text-right font-medium">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRankSort(
                                                        'gross_margin_pct',
                                                    )
                                                }
                                                className="group inline-flex items-center gap-1 transition-colors hover:text-foreground"
                                            >
                                                <ColumnHeaderTip
                                                    label="GM"
                                                    title="Gross Margin %"
                                                    description="Persentase laba kotor terhadap omzet penjualan: (Gross Profit / Revenue) × 100%."
                                                    align="right"
                                                />
                                                <span className="text-muted-foreground/60 group-hover:text-foreground">
                                                    {rankSortField ===
                                                    'gross_margin_pct' ? (
                                                        rankSortDirection ===
                                                        'asc' ? (
                                                            <ArrowUp className="size-3 text-primary" />
                                                        ) : (
                                                            <ArrowDown className="size-3 text-primary" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="rounded-r-xl px-3 py-2.5 text-right font-medium">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRankSort(
                                                        'contribution_pct',
                                                    )
                                                }
                                                className="group inline-flex items-center gap-1 transition-colors hover:text-foreground"
                                            >
                                                <ColumnHeaderTip
                                                    label="Kontribusi"
                                                    title="Kontribusi Laba Kotor Toko"
                                                    description="Seberapa besar laba kotor menu ini menyumbang total seluruh laba kotor resto."
                                                    align="right"
                                                />
                                                <span className="text-muted-foreground/60 group-hover:text-foreground">
                                                    {rankSortField ===
                                                    'contribution_pct' ? (
                                                        rankSortDirection ===
                                                        'asc' ? (
                                                            <ArrowUp className="size-3 text-primary" />
                                                        ) : (
                                                            <ArrowDown className="size-3 text-primary" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedRanking.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="px-3 py-6 text-center text-muted-foreground"
                                            >
                                                Belum ada penjualan pada periode
                                                ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        sortedRanking.map((r, index) => (
                                            <tr
                                                key={r.menu_id}
                                                className="border-b border-border/60 last:border-0"
                                            >
                                                <td className="px-3 py-3 font-semibold text-muted-foreground tabular-nums">
                                                    {index + 1}
                                                </td>
                                                <td className="px-3 py-3 font-medium">
                                                    {r.name}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    {r.quantity_sold}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    {formatRupiah(r.revenue)}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    {formatRupiah(r.cogs)}
                                                </td>
                                                <td className="px-3 py-3 text-right font-semibold tabular-nums">
                                                    {formatRupiah(
                                                        r.gross_profit,
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    {r.gross_margin_pct !== null
                                                        ? formatPercent(
                                                              r.gross_margin_pct,
                                                          )
                                                        : '-'}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums">
                                                    {r.contribution_pct !== null
                                                        ? formatPercent(
                                                              r.contribution_pct,
                                                          )
                                                        : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </FxTableWrap>
                    </FxCard>
                </Reveal>

                {/* ASPEK 3: Modal Cost Driver Breakdown */}
                {selectedMenuForCost ? (
                    <CostDriverModal
                        menu={selectedMenuForCost}
                        onClose={() => setSelectedMenuForCost(null)}
                    />
                ) : null}

                {/* Modal Simulasi Harga Bahan (What-If) */}
                {simOpen ? (
                    <SimulateModal
                        ingredients={ingredients}
                        initialIngredientId={filters.sim_ingredient}
                        initialPrice={filters.sim_price}
                        simulation={simulation}
                        period={period}
                        onClose={() => {
                            setSimOpen(false);
                            router.get(
                                '/profitabilitas',
                                { period },
                                {
                                    only: ['simulation'],
                                    preserveState: true,
                                    preserveScroll: true,
                                    replace: true,
                                },
                            );
                        }}
                    />
                ) : null}
            </PageShell>
        </TooltipProvider>
    );
}

// ASPEK 3: Modal Cost Driver Breakdown
function CostDriverModal({
    menu,
    onClose,
}: {
    menu: ProfitRow;
    onClose: () => void;
}) {
    const items = menu.recipe_items ?? [];
    const overheadNum = Number(menu.overhead || 0);
    const hppNum = Number(menu.current_hpp || 0);
    const overheadPct =
        hppNum > 0 ? ((overheadNum / hppNum) * 100).toFixed(1) : '0';

    return (
        <FxModal
            open
            onOpenChange={(o) => !o && onClose()}
            wide
            className="sm:max-w-2xl"
            title={`Rincian HPP: ${menu.name}`}
            description="Komposisi bahan baku resep dan analisis kontributor biaya utama (Cost Driver)."
            footer={
                <div className="flex w-full items-center justify-between">
                    <FxButton variant="soft" onClick={onClose}>
                        Tutup
                    </FxButton>
                    <Link
                        href="/menu"
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90"
                    >
                        <span>Kelola Resep di Menu</span>
                        <ArrowRight className="size-3.5" />
                    </Link>
                </div>
            }
        >
            <div className="flex flex-col gap-4 text-xs">
                {/* Financial Summary Strip */}
                <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-border/80 bg-secondary/40 p-3 sm:grid-cols-4">
                    <div>
                        <span className="text-[11px] text-muted-foreground">
                            Harga Jual:
                        </span>
                        <p className="font-bold text-foreground tabular-nums">
                            {formatRupiah(menu.selling_price)}
                        </p>
                    </div>
                    <div>
                        <span className="text-[11px] text-muted-foreground">
                            Total HPP:
                        </span>
                        <p className="font-bold text-primary tabular-nums">
                            {formatRupiah(menu.current_hpp)}
                        </p>
                    </div>
                    <div>
                        <span className="text-[11px] text-muted-foreground">
                            Margin Kotor:
                        </span>
                        <p className="font-bold text-foreground tabular-nums">
                            {formatRupiah(menu.margin_rupiah)} (
                            {formatPercent(menu.margin_pct)})
                        </p>
                    </div>
                    <div>
                        <span className="text-[11px] text-muted-foreground">
                            Status Menu:
                        </span>
                        <div className="mt-0.5">
                            <StatusBadge status={menu.status} />
                        </div>
                    </div>
                </div>

                {/* Cost Driver Recommendation Insight */}
                {menu.status === 'loss' ? (
                    <div className="flex items-start gap-2.5 rounded-xl border border-danger/40 bg-danger-soft/60 p-3 text-danger">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                        <div className="leading-relaxed">
                            <p className="font-bold">
                                Margin Kritis di Bawah 25%
                            </p>
                            <p className="text-[11px] opacity-90">
                                Menu ini memiliki margin sangat tipis. Periksa
                                bahan bertanda{' '}
                                <strong className="underline">
                                    Top Cost Driver
                                </strong>{' '}
                                di bawah untuk evaluasi gramasi resep atau
                                pertimbangkan penyesuaian harga jual.
                            </p>
                        </div>
                    </div>
                ) : menu.status === 'watchlist' ? (
                    <div className="flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning-soft/60 p-3 text-warning-ink">
                        <Info className="mt-0.5 size-4 shrink-0" />
                        <div className="leading-relaxed">
                            <p className="font-bold">
                                Margin Moderat (25% – 45%)
                            </p>
                            <p className="text-[11px] opacity-90">
                                Margin cukup aman, namun rentan tergerus jika
                                harga pasar bahan baku utama naik.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start gap-2.5 rounded-xl border border-success/40 bg-success-soft/60 p-3 text-success">
                        <TrendingUp className="mt-0.5 size-4 shrink-0" />
                        <div className="leading-relaxed">
                            <p className="font-bold">Margin Sehat (&gt; 45%)</p>
                            <p className="text-[11px] opacity-90">
                                Struktur biaya bahan baku sangat efisien dan
                                memberikan laba optimal.
                            </p>
                        </div>
                    </div>
                )}

                {/* Visual Proportion Bar */}
                {items.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Visual Komposisi HPP:</span>
                            <span>{items.length} bahan baku + overhead</span>
                        </div>
                        <div className="flex h-3 w-full overflow-hidden rounded-full border border-border/80 bg-secondary">
                            {items.map((it, idx) => {
                                const colors = [
                                    'bg-primary',
                                    'bg-amber-500',
                                    'bg-blue-500',
                                    'bg-emerald-500',
                                    'bg-purple-500',
                                    'bg-rose-500',
                                ];
                                return (
                                    <div
                                        key={it.ingredient_id}
                                        style={{ width: `${it.cost_pct}%` }}
                                        className={`${colors[idx % colors.length]} transition-all`}
                                        title={`${it.ingredient_name}: ${it.cost_pct}% (${formatRupiah(it.item_cost)})`}
                                    />
                                );
                            })}
                            {overheadNum > 0 ? (
                                <div
                                    style={{ width: `${overheadPct}%` }}
                                    className="bg-muted-foreground/40 transition-all"
                                    title={`Overhead: ${overheadPct}% (${formatRupiah(overheadNum)})`}
                                />
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {/* Items Table */}
                <FxTableWrap className="rounded-xl border border-border/80">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-secondary/70 text-left text-muted-foreground">
                                <th className="px-3 py-2.5 font-medium">
                                    Bahan Baku
                                </th>
                                <th className="px-3 py-2.5 text-right font-medium">
                                    Takaran Resep
                                </th>
                                <th className="px-3 py-2.5 text-right font-medium">
                                    Harga WAC
                                </th>
                                <th className="px-3 py-2.5 text-right font-medium">
                                    Biaya di Menu
                                </th>
                                <th className="px-3 py-2.5 text-right font-medium">
                                    Kontribusi ke HPP
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-3 py-6 text-center text-muted-foreground"
                                    >
                                        Belum ada bahan baku yang terdaftar pada
                                        resep ini.
                                    </td>
                                </tr>
                            ) : (
                                items.map((it) => {
                                    const isTopDriver =
                                        Number(it.cost_pct) >= 30;
                                    return (
                                        <tr
                                            key={it.ingredient_id}
                                            className="border-b border-border/60 last:border-0"
                                        >
                                            <td className="px-3 py-2.5 font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <span>
                                                        {it.ingredient_name}
                                                    </span>
                                                    {isTopDriver ? (
                                                        <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                                                            <Flame className="size-2.5" />
                                                            Top Driver
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-right tabular-nums">
                                                {it.quantity_needed}{' '}
                                                {it.base_unit}
                                                {Number(it.waste_factor) > 0 ? (
                                                    <span className="ml-1 text-[10px] text-muted-foreground">
                                                        (+
                                                        {Number(
                                                            it.waste_factor,
                                                        ) * 100}
                                                        % susut)
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-muted-foreground tabular-nums">
                                                {formatRupiah(it.cost_per_unit)}
                                                /{it.base_unit}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-semibold text-foreground tabular-nums">
                                                {formatRupiah(it.item_cost)}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-bold tabular-nums">
                                                <span
                                                    className={
                                                        isTopDriver
                                                            ? 'text-amber-600 dark:text-amber-400'
                                                            : 'text-foreground'
                                                    }
                                                >
                                                    {formatPercent(it.cost_pct)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            {overheadNum > 0 ? (
                                <tr className="border-t border-border/80 bg-secondary/30">
                                    <td className="px-3 py-2 font-medium text-muted-foreground">
                                        Biaya Overhead (Kemasan & Operasional)
                                    </td>
                                    <td
                                        colSpan={2}
                                        className="px-3 py-2 text-right text-muted-foreground"
                                    >
                                        Per porsi
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold text-foreground tabular-nums">
                                        {formatRupiah(overheadNum)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-bold text-muted-foreground tabular-nums">
                                        {formatPercent(overheadPct)}
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </FxTableWrap>
            </div>
        </FxModal>
    );
}

// Existing What-If Simulation Modal
function SimulateModal({
    ingredients,
    initialIngredientId,
    initialPrice,
    simulation,
    period,
    onClose,
}: {
    ingredients: IngredientOption[];
    initialIngredientId: number | null;
    initialPrice: string;
    simulation: SimRow[] | null;
    period: string;
    onClose: () => void;
}) {
    const first = ingredients[0];
    const startId = initialIngredientId ?? first?.id ?? 0;
    const startIngredient = ingredients.find((i) => i.id === startId) ?? first;

    const [ingredientId, setIngredientId] = useState(startId);
    const [price, setPrice] = useState(
        initialPrice !== ''
            ? initialPrice
            : (startIngredient?.cost_per_unit ?? '0'),
    );

    const target = ingredients.find((i) => i.id === ingredientId) ?? first;
    const rows = simulation ?? [];

    useEffect(() => {
        const timer = window.setTimeout(() => {
            router.get(
                '/profitabilitas',
                { sim_ingredient: ingredientId, sim_price: price, period },
                {
                    only: ['simulation'],
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);

        return () => window.clearTimeout(timer);
    }, [ingredientId, price, period]);

    if (!first || !target) {
        return (
            <FxModal
                open
                onOpenChange={(o) => !o && onClose()}
                title="Simulasi harga bahan"
                footer={
                    <FxButton variant="soft" onClick={onClose}>
                        Tutup
                    </FxButton>
                }
            >
                <p className="py-4 text-center text-sm text-muted-foreground">
                    Belum ada bahan aktif untuk disimulasikan.
                </p>
            </FxModal>
        );
    }

    return (
        <FxModal
            open
            onOpenChange={(o) => !o && onClose()}
            wide
            title="Simulasi harga bahan"
            description="What-if tanpa menyimpan. Ubah harga satu bahan untuk melihat dampaknya ke HPP dan margin."
            footer={
                <FxButton variant="soft" onClick={onClose}>
                    Tutup
                </FxButton>
            }
        >
            <div className="grid gap-3 sm:grid-cols-2">
                <FxField label="Bahan">
                    <FxSelect
                        value={ingredientId}
                        onChange={(e) => {
                            const id = Number(e.target.value);
                            setIngredientId(id);
                            const next = ingredients.find((i) => i.id === id);
                            setPrice(next?.cost_per_unit ?? '0');
                        }}
                    >
                        {ingredients.map((i) => (
                            <option key={i.id} value={i.id}>
                                {i.name} (WAC {formatRupiah(i.cost_per_unit)}/
                                {i.base_unit})
                            </option>
                        ))}
                    </FxSelect>
                </FxField>
                <FxField
                    label={`Harga simulasi (per ${target.base_unit})`}
                    hint={`WAC saat ini ${formatRupiah(target.cost_per_unit)}`}
                >
                    <div className="relative flex items-center">
                        <span className="pointer-events-none absolute left-4 text-sm font-semibold text-muted-foreground select-none">
                            Rp
                        </span>
                        <FxInput
                            type="number"
                            min="0"
                            value={price}
                            className="pl-11"
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </div>
                </FxField>
            </div>

            {rows.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                    Bahan ini belum dipakai di menu mana pun.
                </p>
            ) : (
                <FxTableWrap>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-secondary text-left text-xs text-muted-foreground">
                                <th className="rounded-l-xl px-3 py-2.5 font-medium">
                                    Menu
                                </th>
                                <th className="px-3 py-2.5 text-right font-medium">
                                    HPP lama
                                </th>
                                <th className="px-3 py-2.5 text-right font-medium">
                                    HPP baru
                                </th>
                                <th className="px-3 py-2.5 text-right font-medium">
                                    Margin baru
                                </th>
                                <th className="rounded-r-xl px-3 py-2.5 font-medium">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((a) => (
                                <tr
                                    key={a.menu_id}
                                    className="border-b border-border/60 last:border-0"
                                >
                                    <td className="px-3 py-3 font-medium">
                                        {a.name}
                                    </td>
                                    <td className="px-3 py-3 text-right text-muted-foreground tabular-nums">
                                        {formatRupiah(a.old_hpp)}
                                    </td>
                                    <td className="px-3 py-3 text-right tabular-nums">
                                        {formatRupiah(a.new_hpp)}
                                    </td>
                                    <td className="px-3 py-3 text-right tabular-nums">
                                        {formatPercent(a.new_margin)}
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className="inline-flex items-center gap-2">
                                            <StatusBadge
                                                status={a.old_status}
                                            />
                                            {a.old_status !== a.new_status ? (
                                                <>
                                                    <span className="text-muted-foreground">
                                                        →
                                                    </span>
                                                    <StatusBadge
                                                        status={a.new_status}
                                                    />
                                                </>
                                            ) : null}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </FxTableWrap>
            )}

            <FxSoft className="p-4 text-xs text-muted-foreground">
                Simulasi tidak mengubah data apa pun. Menutup dialog
                mengembalikan nilai asli.
            </FxSoft>
        </FxModal>
    );
}
