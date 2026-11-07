import type { ButtonHTMLAttributes } from 'react';

type Tone = 'default' | 'danger';
type Size = 'sm' | 'md';

const tones: Record<Tone, string> = {
    // Aksi reguler: hover coral (aksen utama brand).
    default:
        'bg-secondary text-muted-foreground hover:bg-primary hover:text-white',
    // Aksi destruktif (nonaktif/void/hapus): hover merah bahaya.
    danger: 'bg-secondary text-muted-foreground hover:bg-destructive hover:text-white',
};

const sizes: Record<Size, string> = {
    sm: 'size-8',
    md: 'size-9',
};

export function FxIconButton({
    tone = 'default',
    size = 'sm',
    className = '',
    type = 'button',
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: Tone;
    size?: Size;
}) {
    return (
        <button
            type={type}
            className={`flex shrink-0 items-center justify-center rounded-full transition-colors duration-200 disabled:opacity-40 ${sizes[size]} ${tones[tone]} ${className}`}
            {...props}
        />
    );
}
