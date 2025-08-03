-- SQL script to set up the approval system for algosheetreq

-- First, add the approvals column to algosheetreq table if it doesn't exist
ALTER TABLE algosheetreq 
ADD COLUMN IF NOT EXISTS approvals integer DEFAULT 0;

-- Create question_votes table to track who voted on which questions
CREATE TABLE IF NOT EXISTS question_votes (
    id SERIAL PRIMARY KEY,
    question_id integer NOT NULL,
    voter_email varchar(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(question_id, voter_email)
);

-- Add foreign key constraint (optional, depends on your setup)
-- ALTER TABLE question_votes 
-- ADD CONSTRAINT fk_question_votes_question_id 
-- FOREIGN KEY (question_id) REFERENCES algosheetreq(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_question_votes_question_id ON question_votes(question_id);
CREATE INDEX IF NOT EXISTS idx_question_votes_voter_email ON question_votes(voter_email);

-- Update existing records to have 0 approvals if null
UPDATE algosheetreq SET approvals = 0 WHERE approvals IS NULL;
