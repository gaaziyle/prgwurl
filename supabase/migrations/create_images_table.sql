-- Create images table if it doesn't exist
CREATE TABLE IF NOT EXISTS images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(127),
    size_in_bytes BIGINT,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create an index on created_at for faster queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public View Access" ON images;
DROP POLICY IF EXISTS "Public Insert Access" ON images;
DROP POLICY IF EXISTS "Public Update Access" ON images;
DROP POLICY IF EXISTS "Public Delete Access" ON images;

-- Create policies for public access
-- Policy for anyone to view images
CREATE POLICY "Public View Access"
ON images FOR SELECT
USING (true);

-- Policy for anyone to insert images
CREATE POLICY "Public Insert Access"
ON images FOR INSERT
WITH CHECK (true);

-- Policy for anyone to update images
CREATE POLICY "Public Update Access"
ON images FOR UPDATE
USING (true);

-- Policy for anyone to delete images
CREATE POLICY "Public Delete Access"
ON images FOR DELETE
USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_images_updated_at ON images;

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_images_updated_at
    BEFORE UPDATE ON images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 