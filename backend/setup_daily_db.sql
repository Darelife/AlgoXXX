-- Create the daily_generated_questions table
CREATE TABLE IF NOT EXISTS daily_generated_questions (
    date DATE NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    contest_id INTEGER NOT NULL,
    problem_index TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (date, difficulty)
);

-- Drop the old daily_overrides table
DROP TABLE IF EXISTS daily_overrides;
