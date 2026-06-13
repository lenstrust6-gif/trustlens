-- Migration 005: Add staging_queue table for new product detection and editorial approval
-- Date: 2026-06-14

CREATE TABLE IF NOT EXISTS staging_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asin VARCHAR(20),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  brand VARCHAR(100),
  locale VARCHAR(5) DEFAULT 'in',
  source VARCHAR(50) NOT NULL,
  review_count_amazon INTEGER DEFAULT 0,
  review_count_youtube INTEGER DEFAULT 0,
  status VARCHAR(30) DEFAULT 'pending_editorial',
  priority VARCHAR(20) DEFAULT 'normal',
  demand_count INTEGER DEFAULT 0,
  approved_by VARCHAR(255),
  approved_at TIMESTAMP,
  go_live_at TIMESTAMP,
  notes TEXT,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_staging_queue_status ON staging_queue(status);
CREATE INDEX IF NOT EXISTS idx_staging_queue_priority ON staging_queue(priority);
CREATE INDEX IF NOT EXISTS idx_staging_queue_asin ON staging_queue(asin);
CREATE INDEX IF NOT EXISTS idx_staging_queue_detected_at ON staging_queue(detected_at DESC);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_staging_queue_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_staging_queue_timestamp ON staging_queue;
CREATE TRIGGER trigger_staging_queue_timestamp
BEFORE UPDATE ON staging_queue
FOR EACH ROW
EXECUTE FUNCTION update_staging_queue_timestamp();
