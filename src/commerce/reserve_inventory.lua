-- ============================================================================
-- REDIS LUA SCRIPT: ATOMIC FLASH-SALE INVENTORY RESERVATION
-- Prevents race conditions and overselling across distributed nodes.
-- KEYS[1]: stock_key       e.g., "stock:product:{productId}"
-- KEYS[2]: reserved_key    e.g., "reserved:product:{productId}"
-- KEYS[3]: cart_lock_key   e.g., "cart:{cartId}:product:{productId}"
-- ARGV[1]: requested_qty   e.g., 1
-- ARGV[2]: ttl_seconds     e.g., 600 (10 minutes)
-- ARGV[3]: user_id         e.g., "usr_94812"
-- ============================================================================

local stock_key     = KEYS[1]
local reserved_key  = KEYS[2]
local cart_lock_key = KEYS[3]

local requested_qty = tonumber(ARGV[1])
local ttl_seconds   = tonumber(ARGV[2])
local user_id       = ARGV[3]

-- 1. Check if user already holds an active reservation in this cart
local existing_reservation = redis.call('GET', cart_lock_key)
if existing_reservation then
    local current_reserved = tonumber(existing_reservation)
    return {
        0, 
        "ALREADY_RESERVED", 
        current_reserved,
        redis.call('TTL', cart_lock_key)
    }
end

-- 2. Fetch current available physical stock
local current_stock = tonumber(redis.call('GET', stock_key) or "0")
local currently_reserved = tonumber(redis.call('GET', reserved_key) or "0")
local net_available = current_stock - currently_reserved

if net_available < requested_qty then
    return {
        0, 
        "INSUFFICIENT_STOCK", 
        net_available, 
        0
    }
end

-- 3. Atomically increment reserved quantity
redis.call('INCRBY', reserved_key, requested_qty)

-- 4. Store reservation with expiry timestamp and owner metadata
local payload = cjson.encode({
    qty = requested_qty,
    user_id = user_id,
    timestamp = redis.call('TIME')[1]
})

redis.call('SETEX', cart_lock_key, ttl_seconds, requested_qty)

-- 5. Track in sorted set for background TTL reconciliation
redis.call('ZADD', 'expiring_reservations', redis.call('TIME')[1] + ttl_seconds, cart_lock_key)

local remaining_available = net_available - requested_qty
return {
    1, 
    "RESERVATION_SUCCESSFUL", 
    remaining_available, 
    ttl_seconds
}
