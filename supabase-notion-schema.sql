-- Create notion_documents table for storing Notion-like documents
CREATE TABLE IF NOT EXISTS notion_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL DEFAULT 'Untitled',
  blocks JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create notion_block_comments table for collaborative comments
CREATE TABLE IF NOT EXISTS notion_block_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  document_id UUID REFERENCES notion_documents(id) ON DELETE CASCADE,
  block_id TEXT NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT,
  author_email TEXT,
  resolved BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notion_documents_created_at ON notion_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notion_documents_user_id ON notion_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_notion_documents_share_token ON notion_documents(share_token);
CREATE INDEX IF NOT EXISTS idx_notion_block_comments_document_id ON notion_block_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_notion_block_comments_block_id ON notion_block_comments(block_id);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_notion_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notion_documents_updated_at 
  BEFORE UPDATE ON notion_documents 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_notion_updated_at_column();

-- Function to generate unique share tokens
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(16), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Add RLS (Row Level Security) policies
ALTER TABLE notion_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_block_comments ENABLE ROW LEVEL SECURITY;

-- Policies for notion_documents
CREATE POLICY "Users can view their own documents" ON notion_documents
  FOR SELECT USING (
    auth.uid() = user_id OR 
    is_public = true
  );

CREATE POLICY "Users can create their own documents" ON notion_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON notion_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON notion_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for notion_block_comments
CREATE POLICY "Anyone can view comments on public documents" ON notion_block_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notion_documents 
      WHERE id = document_id 
      AND (is_public = true OR user_id = auth.uid())
    )
  );

CREATE POLICY "Anyone can add comments to public documents" ON notion_block_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM notion_documents 
      WHERE id = document_id 
      AND is_public = true
    )
  );

-- Create a view for document analytics
CREATE OR REPLACE VIEW notion_document_stats AS
SELECT 
  d.id,
  d.title,
  d.created_at,
  d.updated_at,
  jsonb_array_length(d.blocks) as block_count,
  COUNT(c.id) as comment_count,
  COUNT(DISTINCT c.author_email) as unique_commenters
FROM notion_documents d
LEFT JOIN notion_block_comments c ON d.id = c.document_id
GROUP BY d.id, d.title, d.created_at, d.updated_at, d.blocks;