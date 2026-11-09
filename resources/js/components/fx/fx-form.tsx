import type { ComponentProps, ReactNode } from 'react';
import { Info } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function FxField({
    label,
    hint,
    tooltip,
    children,
}: {
    label: ReactNode;
    hint?: string;
    tooltip?: {
        title?: string;
        description: string;
    };
    children: ReactNode;
}) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <span>{label}</span>
                {tooltip ? (
                    <TooltipProvider delayDuration={150}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span
                                    tabIndex={0}
                                    role="button"
                                    aria-label={
                                        tooltip.title || 'Informasi bantuan'
                                    }
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === 'Enter' ||
                                            e.key === ' '
                                        ) {
                                            e.preventDefault();
                                        }
                                    }}
                                    className="inline-flex cursor-help items-center text-muted-foreground/70 transition-colors hover:text-foreground focus:outline-none"
                                >
                                    <Info className="size-3.5" />
                                </span>
                            </TooltipTrigger>
                            <TooltipContent
                                side="top"
                                className="max-w-[240px] rounded-xl bg-card p-3 text-xs text-foreground shadow-md ring-1 ring-border [&>svg]:fill-card"
                            >
                                {tooltip.title ? (
                                    <p className="font-semibold text-foreground">
                                        {tooltip.title}
                                    </p>
                                ) : null}
                                <p className="mt-1 leading-relaxed text-muted-foreground">
                                    {tooltip.description}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : null}
            </span>
            {children}
            {hint ? (
                <span className="text-[11px] text-muted-foreground">
                    {hint}
                </span>
            ) : null}
        </label>
    );
}

const fieldClass =
    'h-11 w-full rounded-2xl border-0 bg-secondary px-4 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30';

export function FxInput({
    className = '',
    prefix,
    ...props
}: ComponentProps<'input'> & { prefix?: ReactNode }) {
    if (prefix) {
        return (
            <div className="relative flex w-full items-center">
                <span className="pointer-events-none absolute left-4 text-sm font-semibold text-muted-foreground select-none">
                    {prefix}
                </span>
                <input
                    className={cn(fieldClass, 'pl-11', className)}
                    {...props}
                />
            </div>
        );
    }
    return <input className={cn(fieldClass, className)} {...props} />;
}

export function FxSelect({
    className = '',
    children,
    ...props
}: ComponentProps<'select'>) {
    return (
        <select
            className={`${fieldClass} appearance-none ${className}`}
            {...props}
        >
            {children}
        </select>
    );
}

export function FxTextarea({
    className = '',
    ...props
}: ComponentProps<'textarea'>) {
    return (
        <textarea
            className={`w-full rounded-2xl border-0 bg-secondary p-3.5 text-sm text-foreground transition-shadow outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 ${className}`}
            {...props}
        />
    );
}

export function FxModal({
    open,
    onOpenChange,
    title,
    description,
    children,
    footer,
    wide = false,
    className = '',
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    wide?: boolean;
    className?: string;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    'grid-cols-[minmax(0,1fr)] rounded-[28px] border-0 bg-card p-6 shadow-[0_24px_60px_rgba(22,22,21,0.12)]',
                    wide ? 'sm:max-w-2xl' : 'sm:max-w-md',
                    className,
                )}
            >
                <DialogHeader className="min-w-0 text-left">
                    <DialogTitle className="text-lg font-semibold tracking-tight">
                        {title}
                    </DialogTitle>
                    {description ? (
                        <DialogDescription className="text-sm text-muted-foreground">
                            {description}
                        </DialogDescription>
                    ) : null}
                </DialogHeader>

                <div className="flex min-w-0 flex-col gap-4">{children}</div>

                {footer ? (
                    <DialogFooter className="gap-2 sm:gap-2">
                        {footer}
                    </DialogFooter>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
