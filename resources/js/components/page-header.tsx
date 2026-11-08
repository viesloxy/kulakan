import type { ReactNode } from 'react';

export default function PageHeader({
    title,
    description,
    className,
}: {
    title: ReactNode;
    description?: ReactNode;
    className?: string;
}) {
    return (
        <div className={className}>
            {typeof title === 'string' ? (
                <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            ) : (
                title
            )}
            {description ? (
                typeof description === 'string' ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                    </p>
                ) : (
                    description
                )
            ) : null}
        </div>
    );
}
