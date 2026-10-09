import React, { useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  reservedExpiresAt: number; // Unix timestamp ms
}

export interface SlideoutCartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onCheckout: () => void;
}

export const SlideoutCart: React.FC<SlideoutCartProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onCheckout,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600);

  // Reservation countdown ticker
  useEffect(() => {
    if (!isOpen || items.length === 0) return;
    const interval = setInterval(() => {
      const earliestExpiry = Math.min(...items.map((i) => i.reservedExpiresAt));
      const diffSec = Math.max(0, Math.floor((earliestExpiry - Date.now()) / 1000));
      setSecondsRemaining(diffSec);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, items]);

  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop without blur to avoid obscuring video background excessively */}
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Cart Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-[0_0_50px_rgba(0,0,0,0.15)] flex flex-col z-10 border-l border-slate-200/80 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Your Live Cart</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Live Reservation Urgent Notice */}
        {items.length > 0 && (
          <div className="bg-amber-50/80 border-b border-amber-200/60 px-5 py-2.5 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Stock locked for checkout:</span>
            </div>
            <span className="font-mono font-bold text-amber-700">
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Items Scrollable List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-slate-900 font-semibold text-sm">Your cart is empty</p>
              <p className="text-slate-400 text-xs mt-1">Tap 'Add to Cart' on live pinned items to lock flash prices.</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-white shadow-sm"
              >
                <img src={item.imageUrl} alt={item.title} className="w-16 h-16 rounded-lg object-cover bg-slate-50 border border-slate-100" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 truncate">{item.title}</h4>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">${item.unitPrice.toFixed(2)}</p>
                  
                  {/* Quantity Counter */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => onUpdateQuantity(item.productId, -1)}
                      className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center text-xs text-slate-600 hover:bg-slate-50"
                    >
                      -
                    </button>
                    <span className="text-xs font-semibold text-slate-800 w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.productId, 1)}
                      className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center text-xs text-slate-600 hover:bg-slate-50"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Checkout */}
        {items.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between text-sm text-slate-500 mb-1">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-600 mb-3">
              <span>Live Event Free Express Shipping</span>
              <span>-$0.00</span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition-transform duration-150 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Instant Checkout</span>
              <span className="text-slate-400">·</span>
              <span>${subtotal.toFixed(2)}</span>
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Encrypted 256-Bit SSL Checkout with Stripe
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
