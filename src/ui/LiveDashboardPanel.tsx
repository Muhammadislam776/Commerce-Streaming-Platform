import React from 'react';

export const LiveDashboardPanel: React.FC = () => {
  return (
    <div className="h-16 bg-white rounded-2xl border border-slate-200/80 p-3.5 px-5 flex items-center justify-between shadow-sm flex-shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
            ✨
          </div>
          <span className="text-xs font-bold text-slate-900">Live Dashboard</span>
        </div>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Sales Velocity</span>
          <span className="text-xs font-bold text-slate-900 font-mono">14.8K/hr</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Chat Sentiment</span>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            Positive 😊
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">AI Moderation</span>
          <span className="text-xs font-bold text-slate-800">3 spam auto-moderated</span>
        </div>
      </div>

      <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      </button>
    </div>
  );
};
