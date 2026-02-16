import React, { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 ${className}`}>
            {children}
        </div>
    );
};
