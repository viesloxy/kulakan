import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import Reveal from '@/components/motion/reveal';
import PageHeader from '@/components/page-header';
import { cn } from '@/lib/utils';

export type PageShellProps = {
    title: ReactNode;
    headTitle?: string;
    description?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
    headerClassName?: string;
};

export default function PageShell({
    title,
    headTitle,
    description,
    actions,
    children,
    className,
    headerClassName,
}: PageShellProps) {
    const pageTitle =
        headTitle ?? (typeof title === 'string' ? title : undefined);

    return (
        <>
            {pageTitle ? <Head title={pageTitle} /> : null}
            <div className={cn('flex flex-1 flex-col gap-5 p-4 md:p-6', className)}>
                <Reveal>
                    <div
                        className={cn(
                            'flex flex-wrap items-end justify-between gap-3',
                            headerClassName,
                        )}
                    >
                        <PageHeader title={title} description={description} />
                        {actions ? (
                            <div className="flex flex-wrap items-center gap-2">
                                {actions}
                            </div>
                        ) : null}
                    </div>
                </Reveal>

                {children}
            </div>
        </>
    );
}
