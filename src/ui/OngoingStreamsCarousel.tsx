import React from 'react';

export interface StreamFeedItem {
  id: string;
  title: string;
  studio: string;
  thumbnailUrl: string;
  isLive: boolean;
}

interface OngoingStreamsCarouselProps {
  onSelectFeed: (streamId: string) => void;
}

export const OngoingStreamsCarousel: React.FC<OngoingStreamsCarouselProps> = ({ onSelectFeed }) => {
  const feeds: StreamFeedItem[] = [
    {
      id: 'tokyo',
      title: 'Aura Smartwatch Live',
      studio: 'Tokyo Tech Studio',
      thumbnailUrl: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=300&auto=format&fit=crop&q=80',
      isLive: true,
    },
    {
      id: 'geneva',
      title: 'Maison Horlogère',
      studio: 'Geneva Atelier',
      thumbnailUrl: 'https://images.unsplash.com/photo-1547996160-71dfabbce5ed?w=300&auto=format&fit=crop&q=80',
      isLive: true,
    },
    {
      id: 'milan',
      title: 'Maison Horlogère',
      studio: 'Milan Diamond Lab',
      thumbnailUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&auto=format&fit=crop&q=80',
      isLive: true,
    },
  ];

  return (
    <div className="p-2 rounded-xl bg-white/88 backdrop-blur-xl border border-white/75 shadow-lg flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">Ongoing Live Streams</span>
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pt-2 pr-0.5">
        {feeds.map((feed) => (
          <div
            key={feed.id}
            onClick={() => onSelectFeed(feed.id)}
            className="group relative rounded-xl overflow-hidden cursor-pointer border border-white/80 hover:border-indigo-400 shadow-sm transition-all hover:scale-[1.02]"
          >
            <div className="h-20 bg-slate-800 relative">
              <img src={feed.thumbnailUrl} alt={feed.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center shadow">
                  <svg className="w-3.5 h-3.5 text-slate-900 fill-current ml-0.5" viewBox="0 0 20 20">
                    <path d="M4 4l12 6-12 6z" />
                  </svg>
                </div>
              </div>
              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-600 text-white">
                LIVE
              </span>
            </div>
            <div className="p-1.5 bg-white/95">
              <p className="text-[10px] font-bold text-slate-800 truncate">{feed.title}</p>
              <p className="text-[9px] text-slate-400">{feed.studio}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
