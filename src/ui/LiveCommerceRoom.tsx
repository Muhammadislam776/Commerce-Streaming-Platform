import React, { useState, useEffect, useRef } from 'react';
import { FloatingProductCard } from './FloatingProductCard';
import { SlideoutCart, CartItem } from './SlideoutCart';

export interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  isHost?: boolean;
  isVIP?: boolean;
}

export const LiveCommerceRoom: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [viewerCount, setViewerCount] = useState<number>(14890);
  const [playbackMode, setPlaybackMode] = useState<'WEBRTC_SFU' | 'LL_HLS'>('WEBRTC_SFU');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAIOpen, setIsAIOpen] = useState<boolean>(false);
  const [aiQuestion, setAiQuestion] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 'c_1',
      productId: 'prod_901',
      title: 'Aura Titanium Chrono 44mm Edition',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80',
      unitPrice: 249.00,
      quantity: 1,
      reservedExpiresAt: Date.now() + 580 * 1000,
    },
  ]);

  // Pinned Product state (Host-triggered)
  const [pinnedProduct, setPinnedProduct] = useState({
    id: 'prod_901',
    title: 'Aura Titanium Chrono 44mm Edition',
    brand: 'Supernova Timepieces',
    basePrice: 420.00,
    liveDiscountPrice: 249.00,
    currency: 'USD',
    totalStock: 50,
    availableStock: 14,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
  });

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'Elena Rostova', avatar: 'https://i.pravatar.cc/100?img=1', text: 'Does this bezel come with sapphire crystal?', isVIP: true },
    { id: '2', sender: 'Alex Chen', avatar: 'https://i.pravatar.cc/100?img=2', text: 'Just grabbed mine! The live discount is insane 🔥' },
    { id: '3', sender: 'Host Marcus', avatar: 'https://i.pravatar.cc/100?img=33', text: 'Yes Elena! Grade 5 titanium and sapphire coating on both sides.', isHost: true },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  // Reactions
  const [reactions, setReactions] = useState<Array<{ id: number; emoji: string; left: number }>>([]);

  const triggerReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const left = Math.floor(Math.random() * 60) + 20; // 20% to 80% horizontal offset
    setReactions((prev) => [...prev, { id, emoji, left }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'You',
        avatar: 'https://i.pravatar.cc/100?img=12',
        text: inputMsg.trim(),
      },
    ]);
    setInputMsg('');
  };

  const handleAskAI = async (query: string) => {
    setIsAIOpen(true);
    setAiQuestion(query);
    setAiLoading(true);
    setAiAnswer(null);

    // Simulate RAG response
    setTimeout(() => {
      setAiAnswer(
        `The Aura Titanium Chrono features aerospace Grade 5 titanium, 100m water resistance, and a 42-hour automatic kinetic reserve. Under today's live drop, it carries a full 5-year international warranty.`
      );
      setAiLoading(false);
    }, 900);
  };

  return (
    <div className="relative w-full h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden flex flex-col md:flex-row select-none">
      {/* ------------------------------------------------------------- */}
      {/* LEFT / CENTER: CINEMATIC VIDEO STAGE (EDGE-TO-EDGE)           */}
      {/* ------------------------------------------------------------- */}
      <div className="relative flex-1 h-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Stream Simulation Video Player */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          poster="https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=1600&auto=format&fit=crop&q=80"
        >
          <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
        </video>

        {/* Ambient Dark-to-Transparent Edge Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

        {/* Top Header Floating Glass Bar */}
        <div className="absolute top-5 left-5 right-5 flex items-center justify-between pointer-events-auto">
          {/* Host Info & Live Pill */}
          <div className="flex items-center gap-3 p-2 pr-4 rounded-full bg-white/90 backdrop-blur-md border border-white/70 shadow-lg">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Host"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-rose-500"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">Maison Horlogère</span>
                <svg className="w-3.5 h-3.5 text-blue-500 fill-current" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Paris Atelier Live</p>
            </div>
            <button className="ml-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 transition-colors">
              Follow
            </button>
          </div>

          {/* Viewer Count & Stream Telemetry */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-white/70 shadow-lg text-xs font-semibold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>LIVE</span>
              <span className="text-slate-300">|</span>
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{viewerCount.toLocaleString()}</span>
            </div>

            {/* Sub-Second Latency Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/70 text-[11px] font-medium text-slate-700 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{playbackMode === 'WEBRTC_SFU' ? 'WebRTC 180ms' : 'LL-HLS 1.8s'}</span>
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-full bg-white/90 backdrop-blur-md border border-white/70 text-slate-800 hover:bg-white shadow-lg transition-transform active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Floating Reactions Emitter */}
        <div className="absolute inset-x-0 bottom-36 h-64 pointer-events-none overflow-hidden">
          {reactions.map((r) => (
            <div
              key={r.id}
              className="absolute text-3xl animate-bounce transition-all duration-1000"
              style={{
                left: `${r.left}%`,
                bottom: '10px',
                animation: 'supernova-float-up 1.8s ease-out forwards',
              }}
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* Pinned Product Glass Showcase (Floating Bottom Left) */}
        <div className="absolute bottom-6 left-6 z-20 pointer-events-auto">
          <FloatingProductCard
            {...pinnedProduct}
            onAddToCart={async () => {
              setIsCartOpen(true);
            }}
            onBuyNow={() => setIsCartOpen(true)}
            onAskAI={(title) => handleAskAI(`Tell me about the craftsmanship and warranty of ${title}`)}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RIGHT PANEL: LIVE CHAT & AI CONCIERGE (LIGHT THEME)           */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full md:w-[380px] lg:w-[420px] h-full bg-white border-l border-slate-200/80 flex flex-col z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
        {/* Chat Title Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Live Chat & AI Concierge</h2>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <span className="text-[11px] font-medium text-slate-400">AI Moderated</span>
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((m) => (
            <div key={m.id} className="flex items-start gap-2.5">
              <img src={m.avatar} alt={m.sender} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-800">{m.sender}</span>
                  {m.isHost && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700">
                      HOST
                    </span>
                  )}
                  {m.isVIP && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                      VIP
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">{m.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Emoji Taps */}
        <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-around bg-slate-50/30">
          {['❤️', '🔥', '👏', '💎', '🚀'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => triggerReaction(emoji)}
              className="text-lg hover:scale-125 transition-transform duration-150 active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Chat Input & Multilingual AI Query */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex items-center gap-2 bg-white">
          <button
            type="button"
            onClick={() => handleAskAI('What is the battery and water resistance rating?')}
            className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
            title="Ask Multilingual Catalog AI"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Ask host or AI concierge in any language..."
            className="flex-1 text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-800"
          />
          <button
            type="submit"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SLIDEOUT CART DRAWER                                          */}
      {/* ------------------------------------------------------------- */}
      <SlideoutCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={(prodId, delta) => {
          setCartItems((prev) =>
            prev
              .map((i) => (i.productId === prodId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
              .filter((i) => i.quantity > 0)
          );
        }}
        onCheckout={() => {
          alert('Redirecting to Stripe Idempotent 1-Click Checkout...');
        }}
      />

      {/* ------------------------------------------------------------- */}
      {/* MULTILINGUAL AI CONCIERGE MODAL OVERLAY                       */}
      {/* ------------------------------------------------------------- */}
      {isAIOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Live Shopping Concierge</h3>
                  <p className="text-[11px] text-indigo-600 font-medium">Multilingual RAG · Strictly Grounded in Live Specs</p>
                </div>
              </div>
              <button
                onClick={() => setIsAIOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Question</label>
                <p className="text-sm font-medium text-slate-800 mt-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  "{aiQuestion}"
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Grounded AI Answer</label>
                <div className="mt-1 p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 text-sm text-slate-800 leading-relaxed min-h-[90px] flex items-center">
                  {aiLoading ? (
                    <div className="flex items-center gap-2 text-indigo-600 text-xs font-medium">
                      <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Searching catalog vectors & translating specs...
                    </div>
                  ) : (
                    aiAnswer
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Supports English, Español, Urdu/Hindi, Français, 日本語, Arabic</span>
              <button
                onClick={() => setIsAIOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
