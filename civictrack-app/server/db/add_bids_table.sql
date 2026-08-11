-- Migration: Create bids table
CREATE TABLE IF NOT EXISTS bids (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
    estimated_time INTEGER NOT NULL, -- in days
    budget NUMERIC(12,2) NOT NULL, -- amount
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending/accepted/rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migration: Create reported_bids table
CREATE TABLE IF NOT EXISTS reported_bids (
    id SERIAL PRIMARY KEY,
    bid_id INTEGER REFERENCES bids(id) ON DELETE CASCADE,
    ministry_id INTEGER REFERENCES ministries(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);