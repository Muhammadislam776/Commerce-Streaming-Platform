# 🌟 Project Supernova: Next-Gen Live Commerce Streaming Platform

An ultra-premium, enterprise-grade live video commerce and multi-category marketplace ecosystem. Project Supernova merges cinematic edge-to-edge interactive video broadcasting with real-time flash inventory locking, low-latency WebSockets, zero-hallucination Multilingual Catalog RAG, and native Pakistan payment gateways (JazzCash, EasyPaisa, Safepay).

---

## 🎨 UI/UX & Design Philosophy

- **Aesthetic:** Enhanced Professional Light Theme — pristine white surfaces (`#FFFFFF`), subtle slate borders (`#E2E8F0`), high-contrast typography, and refined glassmorphic translucent overlays (`backdrop-blur-md`).
- **Edge-to-Edge Player:** Sub-second latency interactive video player with floating host spotlight overlays, live viewer counters, GMV tickers, and floating reaction particles.
- **In-Stream Conversion:** Zero-interruption shopping experience. Viewers can browse the multi-category marketplace, inspect deep technical specs, and complete biometric mobile checkout without losing video feed sync.

---

## 🚀 Key Features & Architectural Modules

### 1. 🛍️ Multi-Category Luxury Marketplace
- **Hero Banner:** Wide-aspect lifestyle imagery with multi-stop gradient overlays, live broadcast beacons, and smooth-scrolling CTAs.
- **Dynamic Category Navigation:** Horizontal scrollable category pill bar (`All`, `Watches`, `Apparel`, `Electronics`, `Beauty`, `Jewelry`) with real-time count badges and zero page refresh filtering.
- **Product Deep-Dive Modal:** High-resolution multi-angle image gallery, origin atelier verification, 5-year warranty badges, and detailed technical specifications table.
- **AI Related Products Recommendation Engine:** Dynamic clustering algorithm strictly recommending 4 to 6 items sharing the exact category of the inspected product, with interactive scale & glow micro-interactions.

### 2. 📹 Real-Time Media & WebSockets
- **Sub-Second Latency Video:** SFU WebRTC architecture (LiveKit) for two-way interactive host-viewer showcases, with automated fallback to LL-HLS for massive broadcast scale.
- **Bidirectional WebSockets:** Synchronizes community chat delivery, floating emoji reactions, live viewer counters (14.8k+), and host-pinned flash drops.
- **Real-Time Telemetry:** Live SFU cluster latency meters (182ms), sales velocity calculations, and chat sentiment indicators.

### 3. 💳 In-Stream Pakistan Payment Gateway Integration
- **Direct Merchant APIs & Aggregators:**
  - **JazzCash Mobile Wallet:** In-stream MPIN push / USSD prompt to customer mobile with integer paisa conversion.
  - **EasyPaisa Mobile Account:** Instant in-app push authorization with IPN confirmation.
  - **Safepay Aggregator:** Visa, MasterCard, PayPak, and 1Link bank transfers.
- **HMAC-SHA256 Signature Verification:** Secret hash keys prevent payload tampering and replay attacks.
- **Idempotency Safeguards:** Strict `idempotencyKey` cache enforcement prevents duplicate charges during flash sale rushes.
- **Live Social Proof Broadcasting:** Verified webhook confirmations trigger instant glowing toast notifications over the live broadcast feed.

### 4. 🧠 Advanced AI & Catalog RAG
- **Multilingual Catalog RAG:** Vector-grounded Q&A overlay powered by pgvector 1536-dimensional embeddings. Responds to technical inquiries in English, Urdu, Spanish, French, and Arabic strictly grounded in live catalog specs.
- **Intelligent Chat Moderation:** Real-time NLP toxicity scoring, link spam blocking, and auto-moderation pipeline.
- **Post-Event Summaries:** Automated transcript analysis generating timestamped highlight recaps and conversion analytics.

### 5. ⚡ High-Concurrency Flash Inventory
- **Redis Lua Scripts:** Atomically reserves stock and locks carts for 10 minutes to prevent overselling.
- **Automated Expiry:** Expired cart locks automatically return units to the broadcast stock pool.

---

## 🗂️ Project Directory Structure

```
├── docs/
│   ├── ARCHITECTURE_BLUEPRINT.md       # Comprehensive system design & API specs
│   ├── pakistan_payments_schema.sql    # PostgreSQL schema for orders, transactions & webhooks
│   ├── reset_schema.sql                # Supabase schema reset & seed migrations
│   └── schema.sql                      # Base live commerce database definitions
├── prisma/
│   └── schema.prisma                   # Prisma ORM schema definition
├── public/
│   └── live-room-preview.html          # Interactive live dashboard, marketplace & checkout UI
├── src/
│   ├── ai/
│   │   ├── catalog-rag.ts              # Multilingual vector similarity engine
│   │   ├── moderation.ts               # NLP moderation & toxicity filters
│   │   └── transcript-summary.ts       # Post-stream recap pipeline
│   ├── commerce/
│   │   ├── pakistan-payments.ts        # JazzCash, EasyPaisa & Safepay backend engine
│   │   ├── redis-inventory.ts          # Redis flash sale reservation manager
│   │   ├── reserve_inventory.lua       # Atomic Redis Lua stock lock script
│   │   └── webhook-validator.ts        # HMAC signature verification utilities
│   ├── data/
│   │   └── mockProducts.ts             # 22 typed luxury products across 5 categories
│   ├── realtime/
│   │   ├── webrtc-sfu-client.ts        # LiveKit WebRTC client orchestration
│   │   └── websocket-server.ts         # Bidirectional WebSocket server
│   └── ui/
│       ├── CommunityTray.tsx           # Chat stream, RAG terminal & catalog drawer
│       ├── FloatingProductCard.tsx     # Host spotlight pinned product overlay
│       ├── InStreamCheckoutModal.tsx   # Slide-over Pakistan payment modal
│       ├── LiveCommerceRoom.tsx        # Edge-to-edge player and overlays
│       ├── LiveDashboardPanel.tsx      # Telemetry, sentiment & GMV ticker
│       ├── MultiCategoryMarketplace.tsx# React 18 multi-category marketplace hub
│       ├── OngoingStreamsCarousel.tsx  # Channel hopping video tray
│       ├── SidebarNav.tsx              # Navigation shell with host switcher
│       ├── SlideoutCart.tsx            # Slide-out cart with 10-minute timer
│       └── tokens.css                  # Design system CSS variables & tokens
├── server.js                           # Node.js dev server with SSE & payment endpoints
└── package.json                        # Node dependencies & scripts
```

---

## 🛠️ Quickstart & Local Installation

### Prerequisites
- Node.js (v18.0.0 or later)
- npm or pnpm

### 1. Clone the Repository
```bash
git clone https://github.com/Muhammadislam776/Commerce-Streaming-Platform.git
cd Commerce-Streaming-Platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Launch Development Server
```bash
node server.js
```

### 4. Access the Live Platform
Open your browser and navigate to:
- **Interactive Live Room UI:** `http://localhost:8085`
- **Telemetry & Status Endpoint:** `http://localhost:8085/api/status`
- **Real-Time SSE Event Stream:** `http://localhost:8085/api/live/stream`

---

## 🔒 Payment Gateway Configuration

To connect live merchant credentials, set the following environment variables:

```bash
# JazzCash Merchant Sandbox/Production
JAZZCASH_MERCHANT_ID="MC12345"
JAZZCASH_PASSWORD="sample_password"
JAZZCASH_HASH_KEY="your_jazzcash_hash_key"

# EasyPaisa Merchant Sandbox/Production
EASYPAISA_STORE_ID="10042"
EASYPAISA_HASH_KEY="your_easypaisa_hash_key"

# Safepay Aggregator
SAFEPAY_API_KEY="sec_safepay_key"
SAFEPAY_WEBHOOK_SECRET="sec_safepay_webhook_secret"
```

---

## 📄 License
This project is licensed under the MIT License.
