import React, { useState } from 'react';

export type CommunityTab = 'chat' | 'rag' | 'catalog';

export interface ProductItem {
  id: string;
  title: string;
  brand: string;
  price: number;
  originalPrice: number;
  discount: string;
  stock: number;
  image: string;
}

interface CommunityTrayProps {
  products: ProductItem[];
  onAddToCart: (title: string, price: number) => void;
  onAskRAG: (query: string) => void;
}

export const CommunityTray: React.FC<CommunityTrayProps> = ({ products, onAddToCart, onAskRAG }) => {
  const [activeTab, setActiveTab] = useState<CommunityTab>('chat');
  const [inputMsg, setInputMsg] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', sender: 'Sarah Jenkins', isVIP: true, text: 'Does the bracelet have micro-adjustments for smaller wrists?' },
    { id: '2', sender: 'Maison Horlogère', isHost: true, text: 'Yes Sarah! 3-point toolless micro-adjust clasp included.' },
    { id: '3', sender: 'David Ross', text: 'Ordered one! Flash checkout was so fast 🔥🔥' },
    { id: '4', sender: 'Kenji Sato', isTranslated: true, text: 'How long is international shipping to Tokyo? (Original: 東京への発送は何日かかりますか？)' },
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'You', text: inputMsg.trim() }]);
    setInputMsg('');
  };

  return (
    <aside className="w-80 lg:w-[380px] bg-white border-l border-slate-200/80 flex flex-col z-20 flex-shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
      {/* Top Header & Tabs */}
      <div className="p-3.5 border-b border-slate-100 flex flex-col gap-2.5 bg-slate-50/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-extrabold text-slate-900 tracking-tight">Live Broadcast Community</h2>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            AI Guard (Active)
          </div>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl text-[11px] font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'chat' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500'
            }`}
          >
            Community Chat
          </button>
          <button
            onClick={() => setActiveTab('rag')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'rag' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500'
            }`}
          >
            AI Q&A Grounding
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'catalog' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500'
            }`}
          >
            Catalog ({products.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Chat Stream */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
            {messages.map((m) => (
              <div key={m.id} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-[10px] flex-shrink-0">
                  {m.sender[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">{m.sender}</span>
                    {m.isHost && <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-600 text-white">HOST</span>}
                    {m.isVIP && <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">VIP</span>}
                    {m.isTranslated && <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">AI translated</span>}
                  </div>
                  <p className="text-slate-600 mt-0.5 leading-snug">{m.text}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-slate-100 flex items-center gap-2 bg-white">
            <button
              type="button"
              onClick={() => setActiveTab('rag')}
              className="p-2 rounded-xl bg-indigo-50 text-indigo-600"
              title="Ask AI RAG"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Chat or ask specs... / Ask AI RAG"
              className="flex-1 text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
            <button type="submit" className="p-2 rounded-xl bg-slate-900 text-white">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: AI Q&A Grounding */}
      {activeTab === 'rag' && (
        <div className="flex-1 flex flex-col p-3.5 gap-3 overflow-y-auto">
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">
            <strong>pgvector RAG Grounding Engine:</strong> Answers are retrieved strictly from live database specifications with cosine similarity score.
          </div>
          <div className="space-y-1.5">
            <button
              onClick={() => onAskRAG('Is the titanium hypoallergenic and scratch resistant?')}
              className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-700"
            >
              💎 "Is the titanium hypoallergenic & scratch resistant?"
            </button>
            <button
              onClick={() => onAskRAG('What is the 5-year international warranty policy?')}
              className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-700"
            >
              🛡️ "What is the 5-year international warranty policy?"
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Catalog 12 Items */}
      {activeTab === 'catalog' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-white shadow-sm">
              <img src={p.image} alt={p.title} className="w-14 h-14 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{p.brand}</p>
                <h5 className="text-xs font-bold text-slate-900 truncate">{p.title}</h5>
                <p className="text-xs font-bold font-mono mt-0.5">${p.price.toFixed(2)}</p>
                <button
                  onClick={() => onAddToCart(p.title, p.price)}
                  className="mt-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded"
                >
                  + Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};
