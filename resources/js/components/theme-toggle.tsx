import { Moon, Sun } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';

export function ThemeToggle({ className = '' }: { className?: string }) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    return (
        <button
            type="button"
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            title={isDark ? 'Mode terang' : 'Mode gelap'}
            className={`flex size-11 items-center justify-center fx-pill text-muted-foreground transition-colors hover:text-primary ${className}`}
        >
            {isDark ? (
                <Sun className="size-[18px]" />
            ) : (
                <Moon className="size-[18px]" />
            )}
        </button>
    );
}
