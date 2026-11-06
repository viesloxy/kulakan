import { motion } from 'motion/react';
import type { ReactNode } from 'react';

type Props = {
    children: ReactNode;
    delay?: number;
    y?: number;
    className?: string;
};

export default function Reveal({
    children,
    delay = 0,
    y = 16,
    className,
}: Props) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}
