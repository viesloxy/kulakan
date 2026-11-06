import type { ComponentProps } from 'react';

export function FxCard({ className = '', ...props }: ComponentProps<'div'>) {
    return <div className={`fx-card ${className}`} {...props} />;
}

export function FxSoft({ className = '', ...props }: ComponentProps<'div'>) {
    return <div className={`fx-soft ${className}`} {...props} />;
}
