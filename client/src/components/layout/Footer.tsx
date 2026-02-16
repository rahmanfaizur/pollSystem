import React from 'react';

export const Footer = () => {
    return (
        <footer className="py-8 text-center border-t border-slate-200 mt-auto bg-slate-50">
            <div className="text-slate-400 text-sm">
                Built with <span className="font-semibold text-slate-500">React</span> & <span className="font-semibold text-slate-500">Socket.io</span> • Made by <span className="font-semibold text-violet-600">Faizur Rahman</span>
            </div>
        </footer>
    );
};
