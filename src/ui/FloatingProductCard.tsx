import React, { useState, useEffect } from 'react';

export interface PinnedProductProps {
  id: string;
  title: string;
  brand: string;
  basePrice: number;
  liveDiscountPrice: number;
  currency: string;
  totalStock: number;
  availableStock: number;
  imageUrl: string;
  onAddToCart: (productId: string) => Promise<void>;
  onBuyNow: (productId: string) => void;
  onAskAI: (productTitle: string) => void;
}

export const FloatingProductCard: React.FC<PinnedProductProps> = ({
  id,
  title,
  brand,
  basePrice,
  liveDiscountPrice,
  currency,
  totalStock,
  availableStock,
  imageUrl,
  onAddToCart,
  onBuyNow,
  onAskAI,
}) => {
  const [isReserving, setIsReserving] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const discountPercent = Math.round(((basePrice - liveDiscountPrice) / basePrice) * 100);
  const stockPercentage = Math.min(100, Math.max(0, (availableStock / totalStock) * 100));

  const handleReserve = async () => {
    setIsReserving(true);
    try {
      await onAddToCart(id);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <div className="relative group overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_20px_50px_rgba(15,23,42,0.12)] p-4 max-w-sm transition-all duration-300 hover:shadow-[0_25px_60px_rgba(15,23,42,0.16)] hover:-translate-y-0.5">
      {/* Top Spotlight Ribbon */}
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          HOST SPOTLIGHT
        </div>
        <button
          onClick={() => onAskAI(title)}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
          title="Ask AI Concierge about this product"
        >
          <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Ask AI
        </button>
      </div>

      <div className="flex gap-3.5">
        {/* Product Media with Badge */}
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200/60">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shadow-sm">
            -{discountPercent}%
          </span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{brand}</p>
          <h4 className="text-sm font-semibold text-slate-900 truncate leading-snug">{title}</h4>

          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-base font-bold text-slate-900 tracking-tight">
              {currency === 'USD' ? '$' : currency}{liveDiscountPrice.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 line-through">
              {currency === 'USD' ? '$' : currency}{basePrice.toFixed(2)}
            </span>
          </div>

          {/* Flash Stock Progress Bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-500 font-medium">Flash Stock</span>
              <span className={`font-semibold ${availableStock <= 10 ? 'text-amber-600' : 'text-slate-700'}`}>
                {availableStock} left
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  availableStock <= 10 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${stockPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2">
        <button
          onClick={handleReserve}
          disabled={isReserving || availableStock === 0}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 border ${
            addedSuccess
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 active:scale-[0.98]'
          }`}
        >
          {isReserving ? (
            <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          ) : addedSuccess ? (
            'Reserved (10m)!'
          ) : (
            'Add to Cart'
          )}
        </button>

        <button
          onClick={() => onBuyNow(id)}
          disabled={availableStock === 0}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white shadow-sm transition-all duration-200"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};
