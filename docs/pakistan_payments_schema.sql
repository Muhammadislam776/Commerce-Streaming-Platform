-- ============================================================================
-- PROJECT SUPERNOVA: PAKISTAN FINTECH PAYMENT DATABASE SCHEMA
-- Tailored for Supabase PostgreSQL (ACID-Compliant, Zero Floating-Point Errors)
-- Supports JazzCash, EasyPaisa, Safepay, and 1Link Bank Transfers
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE order_status_type AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_gateway_type AS ENUM ('JAZZCASH', 'EASYPAISA', 'SAFEPAY', 'BANK_TRANSFER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status_type AS ENUM ('INITIATED', 'SUCCESS', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. ORDERS TABLE (Adapted & Enhanced)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(64) UNIQUE NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    live_event_id UUID REFERENCES live_events(id) ON DELETE SET NULL,
    
    -- Strict Currency Handling: NEVER use float/double for financial balances
    -- NUMERIC(12, 2) supports up to 9,999,999,999.99 PKR with zero precision loss
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0.00),
    currency VARCHAR(3) NOT NULL DEFAULT 'PKR',
    status order_status_type NOT NULL DEFAULT 'PENDING',
    
    -- Prevents double-charge if user spam-clicks "Instant Buy Now" in live stream
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    
    -- Customer info for mobile wallet push
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- In case orders table already existed with different columns, add required columns safely
DO $$ BEGIN
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
    ALTER TABLE orders ALTER COLUMN currency SET DEFAULT 'PKR';
EXCEPTION
    WHEN others THEN null;
END $$;

-- 4. TRANSACTIONS TABLE (One-to-Many with Orders)
-- Enables multiple payment attempts per order (e.g., JazzCash failed -> retried via EasyPaisa)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    gateway payment_gateway_type NOT NULL,
    
    -- Unique Gateway Reference ID (e.g. JazzCash pp_TxnRefNo, EasyPaisa transactionId)
    gateway_transaction_id VARCHAR(128) UNIQUE,
    
    -- Amount charged in this specific transaction attempt
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0.00),
    currency VARCHAR(3) NOT NULL DEFAULT 'PKR',
    status transaction_status_type NOT NULL DEFAULT 'INITIATED',
    
    -- Mobile wallet metadata (e.g. MSISDN: 03001234567, CNIC last 6 digits)
    account_number VARCHAR(32),
    gateway_response_code VARCHAR(32),
    gateway_response_message TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. WEBHOOK LOGS TABLE (Audit, Dispute Proof & Replay Protection)
-- Stores the exact unadulterated IPN payload before any application logic runs
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    
    gateway VARCHAR(32) NOT NULL, -- 'JAZZCASH', 'EASYPAISA', 'SAFEPAY'
    event_type VARCHAR(64) NOT NULL, -- e.g. 'PAYMENT_NOTIFICATION', 'TRANSACTION_SUCCESS'
    
    -- Exact raw JSON payload received from payment gateway IPN
    raw_payload JSONB NOT NULL,
    
    -- Cryptographic HMAC signature received in webhook headers/body
    received_signature TEXT,
    
    -- True if backend computed HMAC exactly matches received signature
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- True if database order state was successfully updated to PAID
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- HIGH-CONCURRENCY INDEXES (FLASH SALE & INSTANT WEBHOOK OPTIMIZATION)
-- ============================================================================

-- 1. ORDERS: Lightning-fast idempotency lookups (sub-1ms during checkout spikes)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);

-- 2. TRANSACTIONS: Instant matching when Webhook arrives with Gateway Reference ID
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_gateway_txn_id ON transactions(gateway_transaction_id) 
WHERE gateway_transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_order_status ON transactions(order_id, status);

-- 3. WEBHOOK LOGS: Rapid lookups & Dead-letter queue retries
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed_verified ON webhook_logs(processed, is_verified) 
WHERE processed = FALSE; -- Partial index for unprocessed/failed webhooks
CREATE INDEX IF NOT EXISTS idx_webhook_logs_txn_id ON webhook_logs(transaction_id);

-- 4. GIN Index on JSONB for arbitrary payload querying (dispute resolution)
CREATE INDEX IF NOT EXISTS idx_webhook_logs_payload_gin ON webhook_logs USING GIN(raw_payload);
