import React, { useState, useMemo } from 'react';
import { Product, mockProducts } from '../data/mockProducts';

export type CategoryKey = 'All' | 'Watches' | 'Apparel' | 'Electronics' | 'Beauty' | 'Jewelry';

interface MultiCategoryMarketplaceProps {
  onSelectLiveStream?: () => void;
  onInstantBuy?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export const MultiCategoryMarketplace: React.FC<MultiCategoryMarketplaceProps> = ({
  onSelectLiveStream,
  onInstantBuy,
  onAddToCart,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('All');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryKey, number> = {
      All: mockProducts.length,
      Watches: 0,
      Apparel: 0,
      Electronics: 0,
      Beauty: 0,
      Jewelry: 0,
    };
    mockProducts.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return mockProducts;
    return mockProducts.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  // Recommendation engine: 4 to 6 items sharing the same category
  const relatedProducts = useMemo(() => {
    if (!activeProduct) return [];
    return mockProducts
      .filter((p) => p.category === activeProduct.category && p.id !== activeProduct.id)
      .slice(0, 6);
  }, [activeProduct]);

  const categories: Array<{ key: CategoryKey; label: string; icon: string }> = [
    { key: 'All', label: 'All Items', icon: '✨' },
    { key: 'Watches', label: 'Horology & Watches', icon: '⌚' },
    { key: 'Apparel', label: 'Luxury Apparel', icon: '🧥' },
    { key: 'Electronics', label: 'Hi-Fi Electronics', icon: '🎧' },
    { key: 'Beauty', label: 'Haute Beauty', icon: '💄' },
    { key: 'Jewelry', label: 'Fine Jewelry', icon: '💎' },
  ];

  return (
    <div className="w-full bg-[#F8FAFC] text-slate-900 pb-16 font-sans">
      
      {/* ============================================================= */}
      {/* 1. HERO SECTION (HOMEPAGE BANNER)                             */}
      {/* ============================================================= */}
      <section className="relative w-full h-[420px] lg:h-[480px] rounded-3xl overflow-hidden shadow-2xl mx-auto max-w-7xl mt-4 border border-slate-200/80">
        {/* Wide-Aspect Lifestyle Image */}
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80"
          alt="Luxury Winter Collection"
          className="w-full h-full object-cover object-center filter brightness-[0.92]"
        />

        {/* Subtle Dark-to-Glass Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent flex items-center p-8 lg:p-16">
          <div className="max-w-xl space-y-4">
            
            {/* Live Drop Beacon Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-rose-400">EXCLUSIVE BROADCAST DROP</span>
              <span className="text-white/40">|</span>
              <span className="font-mono text-white/90">14.8k Viewers</span>
            </div>

            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
              Discover The Winter <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-white to-teal-200">
                Luxury Collection
              </span>
            </h1>

            <p className="text-sm lg:text-base text-slate-200/90 leading-relaxed max-w-lg font-medium">
              Curated artisanal timepieces, bespoke apparel, and fine jewelry streamed directly from Paris, Geneva, and Milan ateliers with instant in-stream checkout.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onSelectLiveStream}
                className="px-6 py-3.5 rounded-2xl bg-white text-slate-950 font-extrabold text-xs shadow-xl hover:bg-slate-100 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
              >
                <span>Join Live Showcase</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('marketplace-category-bar');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold text-xs transition-all"
              >
                Explore Catalog
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 2. DYNAMIC CATEGORY NAVIGATION (FILTER BAR)                  */}
      {/* ============================================================= */}
      <div id="marketplace-category-bar" className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Curated Marketplace</h2>
            <p className="text-xs text-slate-500 font-medium">Browse verified luxury categories with live auction prices</p>
          </div>
          <span className="text-xs font-bold text-slate-400 font-mono">
            {filteredProducts.length} Items Available
          </span>
        </div>

        {/* Horizontal Scrollable Pill Filter Bar */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                    : 'bg-white text-slate-600 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {categoryCounts[cat.key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================= */}
      {/* 3. PRODUCT GRID                                               */}
      {/* ============================================================= */}
      <section className="max-w-7xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => {
                setActiveProduct(product);
                setActiveGalleryIndex(0);
              }}
              className="group relative bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
            >
              {/* Media Image Container */}
              <div className="relative w-full h-56 bg-slate-100 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Top Left Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {product.isLiveFeatured && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black tracking-wider uppercase shadow flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      LIVE DROP
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-bold tracking-wide">
                    {product.discountPercent}% OFF
                  </span>
                </div>

                {/* Category Pill */}
                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold shadow-sm">
                  {product.category}
                </span>
              </div>

              {/* Product Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    <span>{product.brand}</span>
                    <span className="flex items-center gap-1 text-amber-500 font-mono">
                      ★ {product.rating} ({product.reviewsCount})
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                    {product.title}
                  </h3>
                </div>

                {/* Price & Flash Stock */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-base font-extrabold text-slate-900 font-mono">
                        Rs. {product.pricePkr.toLocaleString('en-PK')}
                      </span>
                      <span className="text-xs text-slate-400 line-through font-mono ml-2">
                        Rs. {product.originalPricePkr.toLocaleString('en-PK')}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      ${product.priceUsd.toFixed(2)}
                    </span>
                  </div>

                  {/* Flash Stock Bar */}
                  <div className="mt-2 flex items-center justify-between text-[10px] mb-1">
                    <span className="text-slate-500 font-medium">Stock Status</span>
                    <span className="font-bold text-amber-700 font-mono">{product.stock} units left</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, (product.stock / 25) * 100)}%` }}
                    />
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart?.(product);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInstantBuy?.(product);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      Instant Buy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================= */}
      {/* 4. PRODUCT DEEP-DIVE MODAL & RELATED RECOMMENDATIONS         */}
      {/* ============================================================= */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                  {activeProduct.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">SKU: {activeProduct.sku}</span>
              </div>
              <button
                onClick={() => setActiveProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Upper Region: Media Gallery & Full Specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left: Media Gallery */}
                <div className="space-y-3">
                  <div className="relative h-80 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={activeProduct.galleryImages[activeGalleryIndex] || activeProduct.image}
                      alt={activeProduct.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-rose-600 text-white text-xs font-black">
                      -{activeProduct.discountPercent}% OFF
                    </span>
                  </div>

                  {/* Thumbnails */}
                  {activeProduct.galleryImages.length > 1 && (
                    <div className="flex items-center gap-2.5">
                      {activeProduct.galleryImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveGalleryIndex(idx)}
                          className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                            activeGalleryIndex === idx
                              ? 'border-slate-900 ring-2 ring-slate-900/20'
                              : 'border-slate-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Product Overview, Specs & Purchase */}
                <div className="flex flex-col justify-between space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{activeProduct.brand}</p>
                    <h2 className="text-xl font-black text-slate-900 mt-1 leading-snug">{activeProduct.title}</h2>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-amber-500 text-xs font-bold font-mono">★ {activeProduct.rating}</span>
                      <span className="text-xs text-slate-400 font-medium">({activeProduct.reviewsCount} customer reviews)</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-emerald-600 font-bold">{activeProduct.origin}</span>
                    </div>

                    <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-black text-slate-900 font-mono">
                          Rs. {activeProduct.pricePkr.toLocaleString('en-PK')}
                        </span>
                        <span className="text-sm text-slate-400 line-through font-mono">
                          Rs. {activeProduct.originalPricePkr.toLocaleString('en-PK')}
                        </span>
                        <span className="ml-auto text-xs font-bold font-mono text-slate-500">
                          ${activeProduct.priceUsd.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                        ✓ In-Stock · Free Express Courier Delivery Across Pakistan
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 mt-4 leading-relaxed">{activeProduct.description}</p>

                    {/* Technical Specifications Table */}
                    <div className="mt-4">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Technical Specifications</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(activeProduct.specifications).map(([key, val]) => (
                          <div key={key} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-slate-400 block text-[10px] font-bold uppercase">{key}</span>
                            <span className="text-slate-800 font-semibold truncate block">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                    <button
                      onClick={() => {
                        onAddToCart?.(activeProduct);
                        setActiveProduct(null);
                      }}
                      className="flex-1 py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-sm transition-all"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => {
                        onInstantBuy?.(activeProduct);
                        setActiveProduct(null);
                      }}
                      className="flex-1 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-lg transition-all"
                    >
                      Instant Buy Now (🇵🇰)
                    </button>
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* RELATED PRODUCTS RECOMMENDATION CAROUSEL                   */}
              {/* ========================================================= */}
              <div className="pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Related Products</h3>
                    <p className="text-xs text-slate-500">Curated recommendations in {activeProduct.category}</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 font-mono">
                    AI Cosine Match
                  </span>
                </div>

                {/* Related Cards Horizontal Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {relatedProducts.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => {
                        setActiveProduct(rel);
                        setActiveGalleryIndex(0);
                      }}
                      className="group p-3 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-400 hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                    >
                      <div className="w-full h-32 rounded-xl bg-slate-100 overflow-hidden relative">
                        <img src={rel.image} alt={rel.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-900/80 text-white">
                          -{rel.discountPercent}%
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-2 truncate group-hover:text-indigo-600 transition-colors">
                        {rel.title}
                      </h4>
                      <p className="text-xs font-extrabold text-slate-900 font-mono mt-1">
                        Rs. {rel.pricePkr.toLocaleString('en-PK')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
