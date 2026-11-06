import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            {/* keranjang / peti kulakan */}
            <path
                d="M9 19h21v8a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4z"
                fill="currentColor"
            />
            <path
                d="M14 19v-5a7 7 0 0 1 14 0v5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
            />
            {/* koin / untung */}
            <circle cx="33" cy="8" r="5" fill="currentColor" />
        </svg>
    );
}
