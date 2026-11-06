import type { LucideIcon } from 'lucide-react';
import { FxCard } from '@/components/fx/fx-card';
import { IconCircle } from '@/components/fx/fx-icon';
import Reveal from '@/components/motion/reveal';

type Props = {
    icon: LucideIcon;
    title: string;
    description: string;
    badge?: string;
};

export default function EmptyState({
    icon,
    title,
    description,
    badge = 'Segera hadir',
}: Props) {
    return (
        <Reveal delay={0.05}>
            <FxCard className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <IconCircle icon={icon} tone="coral" size="lg" />
                <h2 className="text-base font-semibold">{title}</h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                    {description}
                </p>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                    {badge}
                </span>
            </FxCard>
        </Reveal>
    );
}
