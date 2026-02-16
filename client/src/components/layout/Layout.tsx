import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface LayoutProps {
    children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
            <Navbar />
            <main className="flex-grow w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
                {children}
            </main>
            <Footer />
        </div>
    );
};
