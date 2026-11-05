import type { ButtonHTMLAttributes } from 'react';

type Variant = 'coral' | 'dark' | 'soft';
type Size = 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
    coral: 'bg-gradient-to-br from-[#F57B54] to-[#E84B20] text-white shadow-[0_10px_24px_rgba(236,88,42,0.22)] hover:-translate-y-0.5',
    dark: 'bg-[#1C1B18] text-white hover:-translate-y-0.5',
    soft: 'bg-secondary text-foreground hover:bg-[#EBEBE8]',
};

const sizes: Record<Size, string> = {
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-sm',
    icon: 'size-9 p-0',
};

export function FxButton({
    variant = 'coral',
    size = 'md',
    className = '',
    type = 'button',
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
    return (
        <button
            type={type}
            className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        />
    );
}