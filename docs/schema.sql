-- ============================================================================
-- PROJECT SUPERNOVA: PRODUCTION POSTGRESQL + PGVECTOR DDL SCHEMA
-- High-concurrency Live Video Commerce & Multilingual RAG
-- Safe / Idempotent execution (IF NOT EXISTS)
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. LIVE EVENTS
CREATE TABLE IF NOT EXISTS live_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(120) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    banner_url TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, LIVE, PAUSED, ENDED
    host_user_id VARCHAR(64) NOT NULL,
    sfu_room_name VARCHAR(128) UNIQUE NOT NULL,
    rtmp_ingest_key VARCHAR(128) UNIQUE NOT NULL,
    ll_hls_playback_url TEXT,
    webrtc_fallback_threshold INT NOT NULL DEFAULT 5000,
    scheduled_start_time TIMESTAMPTZ NOT NULL,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    peak_viewer_count INT NOT NULL DEFAULT 0,
    total_unique_viewers INT NOT NULL DEFAULT 0,
    total_gross_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_events_status_time ON live_events(status, scheduled_start_time);
CREATE INDEX IF NOT EXISTS idx_live_events_host ON live_events(host_user_id);

-- 2. PRODUCT CATALOG & LIVE PINS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    brand VARCHAR(128) NOT NULL,
    category VARCHAR(128) NOT NULL,
    base_price NUMERIC(10, 2) NOT NULL,
    live_discount_price NUMERIC(10, 2),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    total_stock INT NOT NULL CHECK (total_stock >= 0),
    reserved_stock INT NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
    specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
    media_urls TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_specs_gin ON products USING gin(specifications);

CREATE TABLE IF NOT EXISTS event_product_pins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    live_event_id UUID NOT NULL REFERENCES live_events(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    is_currently_pinned BOOLEAN NOT NULL DEFAULT TRUE,
    pin_order INT NOT NULL DEFAULT 1,
    pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unpinned_at TIMESTAMPTZ,
    impressions INT NOT NULL DEFAULT 0,
    clicks INT NOT NULL DEFAULT 0,
    cart_additions INT NOT NULL DEFAULT 0,
    purchases INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_event_pins_active ON event_product_pins(live_event_id, is_currently_pinned);

-- 3. FLASH SALE INVENTORY RESERVATIONS (Redis-backed ACID shadow table)
CREATE TABLE IF NOT EXISTS inventory_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id VARCHAR(128) NOT NULL,
    user_id VARCHAR(64),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, CONVERTED, EXPIRED, CANCELLED
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_expiry ON inventory_reservations(expires_at, status);
CREATE INDEX IF NOT EXISTS idx_reservations_cart ON inventory_reservations(cart_id, status);

-- 4. MULTILINGUAL RAG & VECTOR EMBEDDINGS (1536 dims, HNSW Index)
CREATE TABLE IF NOT EXISTS catalog_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    locale VARCHAR(8) NOT NULL DEFAULT 'en',
    chunk_type VARCHAR(32) NOT NULL, -- 'specs', 'qa', 'usage', 'pricing'
    chunk_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cosine distance HNSW index for sub-5ms vector similarity queries
CREATE INDEX IF NOT EXISTS idx_catalog_embeddings_hnsw ON catalog_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_catalog_embeddings_prod_locale ON catalog_embeddings(product_id, locale);

-- 5. ORDERS & CHECKOUT
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(64) UNIQUE NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    live_event_id UUID REFERENCES live_events(id) ON DELETE SET NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING_PAYMENT',
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    payment_gateway VARCHAR(32) NOT NULL DEFAULT 'stripe',
    payment_intent_id VARCHAR(128) UNIQUE,
    shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    billing_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_event ON orders(live_event_id);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON orders(idempotency_key);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    discount_applied NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

-- 6. STRICT IDEMPOTENT WEBHOOK LOG
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(32) NOT NULL,
    event_id VARCHAR(128) UNIQUE NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    signature_header TEXT NOT NULL,
    payload_hash CHAR(64) NOT NULL,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'RECEIVED', -- RECEIVED, PROCESSING, PROCESSED, FAILED, DEAD_LETTER
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_status_retries ON webhook_events(status, retry_count);
CREATE INDEX IF NOT EXISTS idx_webhook_provider_type ON webhook_events(provider, event_type);

-- 7. REAL-TIME CHAT & AI MODERATION
CREATE TABLE IF NOT EXISTS live_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    live_event_id UUID NOT NULL REFERENCES live_events(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL,
    user_name VARCHAR(128) NOT NULL,
    user_avatar TEXT,
    content VARCHAR(500) NOT NULL,
    is_host BOOLEAN NOT NULL DEFAULT FALSE,
    is_moderator BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    toxicity_score FLOAT NOT NULL DEFAULT 0.0,
    is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    flag_reason VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_chat_event_time ON live_chat_messages(live_event_id, created_at DESC);
