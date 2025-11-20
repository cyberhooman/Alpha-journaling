-- Migration: Make entry_price and quantity nullable for simple mode support
-- This allows trades to be created with only P&L information

-- For SQLite, we need to recreate the table since ALTER COLUMN is limited
-- But first, let's check if this is needed by trying the PostgreSQL approach

-- PostgreSQL approach (will work on Railway if using PostgreSQL)
ALTER TABLE trades ALTER COLUMN entry_price DROP NOT NULL;
ALTER TABLE trades ALTER COLUMN quantity DROP NOT NULL;
