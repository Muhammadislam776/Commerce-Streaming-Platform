import React from 'react';

export type NavTabKey = 'marketplace' | 'creator' | 'ai-catalog' | 'scheduler' | 'orders' | 'analytics' | 'settings';

interface SidebarNavProps {
  activeTab: NavTabKey;
  onTabChange: (tab: NavTabKey) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: 'marketplace', label: 'Live Marketplace', badge: 'Active' },
    { key: 'creator', label: 'Creator Studio', badge: 'Stream' },
    { key: 'ai-catalog', label: 'AI Grounding Catalog', isAI: true },
    { key: 'scheduler', label: 'Events Scheduler' },
    { key: 'orders', label: 'Order History & Cart' },
    { key: 'analytics', label: 'Analytics Insight' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between p-3.5 flex-shrink-0 z-20">
      <div className="space-y-1">
        <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Navigation Hub</p>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key as NavTabKey)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="truncate">{tab.label}</span>
              {tab.badge && (
                <span
                  className={`ml-auto text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
              {tab.isAI && <span className="ml-auto w-2 h-2 rounded-full bg-indigo-500" />}
            </button>
          );
        })}
      </div>

      {/* Host Profile Capsule */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60 hover:bg-slate-100 cursor-pointer">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Host"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500"
            />
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate block">Maison Horlogère</span>
              <p className="text-[10px] text-slate-400 font-medium">(Host Studio)</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
