-- Create research_notes table for storing AI research results
CREATE TABLE IF NOT EXISTS research_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  query TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_research_notes_created_at ON research_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_notes_tags ON research_notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_research_notes_title ON research_notes(title);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_research_notes_updated_at 
  BEFORE UPDATE ON research_notes 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE research_notes ENABLE ROW LEVEL SECURITY;

-- Example policy for authenticated users (uncomment if using auth)
-- CREATE POLICY "Users can view their own notes" ON research_notes
--   FOR SELECT USING (auth.uid() = user_id);
  
-- CREATE POLICY "Users can insert their own notes" ON research_notes
--   FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add user_id column if you want to associate notes with users
-- ALTER TABLE research_notes ADD COLUMN user_id UUID REFERENCES auth.users(id);
-- CREATE INDEX IF NOT EXISTS idx_research_notes_user_id ON research_notes(user_id);