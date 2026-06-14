'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-slate-800 bg-slate-50 p-4">
      <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center border border-slate-200/60 backdrop-blur-md shadow-2xl">
        <h2 className="text-3xl font-extrabold text-orange-500 font-mono tracking-tight mb-2">404</h2>
        <h3 className="text-lg font-bold mb-4 text-slate-900">Transit Station Not Found</h3>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          The requested coordinate or operations interface is currently offline or does not exist.
        </p>
        <Link 
          href="/" 
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-orange-500/20"
        >
          Return to Control Center
        </Link>
      </div>
    </div>
  );
}
