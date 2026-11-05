import type { LucideIcon } from 'lucide-react';

type Tone = 'soft' | 'coral' | 'coralSolid' | 'white' | 'success' | 'warning' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const tones: Record<Tone, string> = {
    soft: 'bg-[rgba(22,22,21,0.05)] text-foreground',
    coral: 'bg-[#FDECE7] text-[#EC582A]',
    coralSolid: 'bg-[#EC582A] text-white',
    white: 'bg-white/20 text-white',
    success: 'bg-[#E6F5EC] text-[#1D9E53]',
    warning: 'bg-[#FEF3D6] text-[#9A6B00]',
    danger: 'bg-[#FCEAE8] text-[#D93829]',
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