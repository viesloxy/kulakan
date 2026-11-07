import type { ButtonHTMLAttributes } from 'react';

type Variant = 'coral' | 'dark' | 'soft';
type Size = 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
    coral: 'fx-coral hover:brightness-[0.97] active:brightness-95',
    dark: 'bg-accent text-accent-foreground hover:brightness-110',
    soft: 'bg-secondary text-foreground hover:bg-hover-soft',
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
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
}) {
    return (
        <button
            type={type}
            className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        />
    );
}
