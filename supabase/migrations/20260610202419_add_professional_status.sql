ALTER TABLE professionals
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'blocked'));

CREATE INDEX IF NOT EXISTS professionals_status_idx ON professionals(status);
