import React from "react";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center font-sans">
      <div className="space-y-3">
        <h1 className="text-5xl font-black text-studio-red tracking-tighter">404</h1>
        <h2 className="text-xl font-bold text-zinc-800">Page Not Found</h2>
        <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
          The page you are looking for might have been moved, deleted, or does not exist.
        </p>
        <div className="pt-2">
          <a
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-4 text-xs font-bold text-white hover:bg-zinc-800 transition-all shadow-sm"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
