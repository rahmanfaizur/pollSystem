import React from 'react';

export const Navbar = () => {
    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 transition-all">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer group" onClick={() => window.location.href = '/'}>
                        <div className="w-8 h-8 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform">
                            P
                        </div>
                        <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
                            PollCheck
                        </span>
                    </div>
                    <div className="hidden sm:block text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        Real-time Voting
                    </div>
                </div>
            </div>
        </nav>
    );
};
