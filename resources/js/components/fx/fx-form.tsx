import type { ComponentProps, ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export function FxField({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
                {label}
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
    'h-11 w-full rounded-2xl border-0 bg-secondary px-4 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-[#EC582A]/30';

export function FxInput({ className = '', ...props }: ComponentProps<'input'>) {
    return <input className={`${fieldClass} ${className}`} {...props} />;
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

export function FxModal({
    open,
    onOpenChange,
    title,
    description,
    children,
    footer,
    wide = false,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    wide?: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={`rounded-[28px] border-0 bg-card p-6 shadow-[0_24px_60px_rgba(22,22,21,0.12)] ${
                    wide ? 'sm:max-w-2xl' : 'sm:max-w-md'
                }`}
            >
                <DialogHeader className="text-left">
                    <DialogTitle className="text-lg font-semibold tracking-tight">
                        {title}
                    </DialogTitle>
                    {description ? (
                        <DialogDescription className="text-sm text-muted-foreground">
                            {description}
                        </DialogDescription>
                    ) : null}
                </DialogHeader>

                <div className="flex flex-col gap-4">{children}</div>

                {footer ? (
                    <DialogFooter className="gap-2 sm:gap-2">
                        {footer}
                    </DialogFooter>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
