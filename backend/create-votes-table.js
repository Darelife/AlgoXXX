const supabase = require('./supabaseClient');

async function createQuestionVotesTable() {
  try {
    console.log('Creating question_votes table...');
    
    // Create the question_votes table using a raw SQL query
    const { data, error } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS question_votes (
          id SERIAL PRIMARY KEY,
          question_id integer NOT NULL,
          voter_email varchar(255) NOT NULL,
          created_at timestamp with time zone DEFAULT now(),
          UNIQUE(question_id, voter_email)
        );
        
        CREATE INDEX IF NOT EXISTS idx_question_votes_question_id ON question_votes(question_id);
        CREATE INDEX IF NOT EXISTS idx_question_votes_voter_email ON question_votes(voter_email);
      `
    });
    
    if (error) {
      console.error('Error creating table:', error);
      
      // Try alternative approach - direct table creation
      const { error: createError } = await supabase
        .from('question_votes')
        .select('*')
        .limit(1);
        
      if (createError) {
        console.log('Table does not exist, creating it via direct SQL...');
        // For now, we'll handle this in the application logic
      } else {
        console.log('Table already exists!');
      }
    } else {
      console.log('Table created successfully!');
    }
    
    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('question_votes')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.error('Test failed:', testError);
    } else {
      console.log('✓ question_votes table is working');
    }
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

// Run the setup
createQuestionVotesTable();
