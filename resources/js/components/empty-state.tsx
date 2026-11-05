import type { LucideIcon } from 'lucide-react';
import Reveal from '@/components/motion/reveal';

type Props = {
    icon: LucideIcon;
    title: string;
    description: string;
    badge?: string;
};

export default function EmptyState({ icon: Icon, title, description, badge = 'Segera hadir' }: Props) {
    return (
        <Reveal delay={0.05}>
            <div className="fx-card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <div className="fx-soft flex size-14 items-center justify-center rounded-2xl">
                    <Icon className="size-6 text-[#EC582A]" />
                </div>
                <h2 className="text-base font-semibold">{title}</h2>
                <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">{badge}</span>
            </div>
        </Reveal>
    );
}