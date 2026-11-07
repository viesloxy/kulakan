import type { LucideIcon } from 'lucide-react';

type Tone =
    | 'soft'
    | 'coral'
    | 'coralSolid'
    | 'white'
    | 'success'
    | 'warning'
    | 'danger';
type Size = 'sm' | 'md' | 'lg';

const tones: Record<Tone, string> = {
    soft: 'bg-foreground/5 text-foreground',
    coral: 'bg-coral-soft text-primary',
    coralSolid: 'bg-primary text-primary-foreground',
    white: 'bg-white/20 text-white',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning-ink',
    danger: 'bg-danger-soft text-danger',
};

const sizes: Record<Size, string> = {
    sm: 'size-8',
    md: 'size-9',
    lg: 'size-14',
};

const iconSizes: Record<Size, string> = {
    sm: 'size-4',
    md: 'size-[18px]',
    lg: 'size-6',
};

export function IconCircle({
    icon: Icon,
    tone = 'soft',
    size = 'md',
    className = '',
}: {
    icon: LucideIcon;
    tone?: Tone;
    size?: Size;
    className?: string;
}) {
    return (
        <span
            className={`flex shrink-0 items-center justify-center rounded-full ${sizes[size]} ${tones[tone]} ${className}`}
        >
            <Icon className={iconSizes[size]} />
        </span>
    );
}
