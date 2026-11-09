import type { Auth } from '@/types/auth';
import type { AlertType } from '@/lib/alert-display';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            notifications: {
                count: number;
                items: Array<{
                    id: number;
                    type: AlertType;
                    title: string;
                    description: string;
                    created_at: string | null;
                }>;
            } | null;
            [key: string]: unknown;
        };
    }
}
