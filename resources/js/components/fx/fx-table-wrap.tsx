import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLenis } from 'lenis/react';
import { cn } from '@/lib/utils';

type FxTableWrapProps = {
    children: ReactNode;
    /** Extra classes for the outer container (border, radius, background…). */
    className?: string;
    /** Extra classes for the scrolling viewport (e.g. `max-h-[500px] overflow-y-auto`). */
    viewportClassName?: string;
};

/**
 * Horizontal scroll frame for the app's wide data tables.
 *
 * A phone is ~360px wide while these tables need 400–1100px, so they have to be
 * swiped. A bare `overflow-x-auto` scrolls but gives no clue that columns are
 * waiting off-screen — the table just looks cut off. This adds a thin, always
 * visible scrollbar plus a soft edge shadow that only appears on the side(s)
 * where hidden columns remain, so "there is more, drag me" is obvious instead
 * of a guess.
 */
export function FxTableWrap({
    children,
    className = '',
    viewportClassName = '',
}: FxTableWrapProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [edges, setEdges] = useState({ left: false, right: false });
    const lenis = useLenis();

    // Explicit scroll chaining: when the table reaches bottom/top boundaries,
    // continue forwarding scroll momentum to the page (Lenis or window).
    useEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }

        const onWheel = (e: WheelEvent) => {
            if (e.deltaY === 0) {
                return;
            }

            const maxScroll = el.scrollHeight - el.clientHeight;
            if (maxScroll <= 0) {
                return;
            }

            const isDown = e.deltaY > 0;
            const atBottom = el.scrollTop >= maxScroll - 1;
            const atTop = el.scrollTop <= 1;

            if (isDown && atBottom) {
                if (lenis) {
                    lenis.scrollTo(lenis.targetScroll + e.deltaY, {
                        programmatic: false,
                    });
                } else {
                    window.scrollBy({ top: e.deltaY, behavior: 'smooth' });
                }
            } else if (!isDown && atTop) {
                if (lenis) {
                    lenis.scrollTo(lenis.targetScroll + e.deltaY, {
                        programmatic: false,
                    });
                } else {
                    window.scrollBy({ top: e.deltaY, behavior: 'smooth' });
                }
            }
        };

        el.addEventListener('wheel', onWheel, { passive: true });
        return () => {
            el.removeEventListener('wheel', onWheel);
        };
    }, [lenis]);

    useEffect(() => {
        const el = ref.current;

        if (!el) {
            return;
        }

        const update = () => {
            const max = el.scrollWidth - el.clientWidth;
            setEdges({
                left: el.scrollLeft > 2,
                right: max > 2 && el.scrollLeft < max - 2,
            });
        };

        update();
        el.addEventListener('scroll', update, { passive: true });

        const observer = new ResizeObserver(update);
        observer.observe(el);

        for (const child of Array.from(el.children)) {
            observer.observe(child);
        }

        window.addEventListener('resize', update);

        return () => {
            el.removeEventListener('scroll', update);
            observer.disconnect();
            window.removeEventListener('resize', update);
        };
    }, []);

    return (
        <div className={cn('relative', className)}>
            <div
                ref={ref}
                className={cn(
                    'fx-scroll-x [&_th]:whitespace-nowrap',
                    viewportClassName,
                )}
            >
                {children}
            </div>

            {edges.left ? (
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 z-20 w-8 bg-gradient-to-r from-foreground/15 to-transparent"
                />
            ) : null}
            {edges.right ? (
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 bg-gradient-to-l from-foreground/15 to-transparent"
                />
            ) : null}
        </div>
    );
}
