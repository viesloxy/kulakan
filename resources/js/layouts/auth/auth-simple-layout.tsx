import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { FxCard } from '@/components/fx/fx-card';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden bg-background p-6 md:p-10">
            {/* dekorasi latar: glow coral + arsiran diagonal */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-[radial-gradient(circle,rgba(236,88,42,0.16),transparent_65%)]"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-40 -left-40 size-[28rem] rounded-full fx-hatch opacity-60"
            />

            <div className="relative w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-3">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <span className="mb-1 flex size-12 items-center justify-center rounded-2xl fx-coral shadow-[0_10px_24px_rgba(236,88,42,0.28)]">
                                <AppLogoIcon className="size-7 fill-current text-white" />
                            </span>
                            <span className="text-lg font-bold tracking-tight">
                                Kulakan
                            </span>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-1.5 text-center">
                            <h1 className="text-xl font-semibold tracking-tight">
                                {title}
                            </h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    <FxCard className="rounded-[1.75rem] p-6">
                        {children}
                    </FxCard>
                </div>
            </div>
        </div>
    );
}
