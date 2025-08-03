const supabase = require('./supabaseClient');
const fs = require('fs');
const path = require('path');

async function setupApprovalSystem() {
  try {
    console.log('Setting up approval system...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'setup-approval-system.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split the SQL file into individual statements
    const statements = sql.split(';').filter(statement => statement.trim().length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        const { error } = await supabase.rpc('execute_sql', { query: statement.trim() });
        
        if (error) {
          console.error('Error executing statement:', error);
          // Continue with other statements
        } else {
          console.log('✓ Statement executed successfully');
        }
      }
    }
    
    console.log('Approval system setup completed!');
    
    // Test the setup by fetching some data
    console.log('\nTesting setup...');
    
    // Check if approvals column exists
    const { data: testData, error: testError } = await supabase
      .from('algosheetreq')
      .select('id, questionName, approvals')
      .limit(1);
    
    if (testError) {
      console.error('Test failed:', testError);
    } else {
      console.log('✓ algosheetreq table with approvals column working');
      if (testData && testData.length > 0) {
        console.log('Sample data:', testData[0]);
      }
    }
    
    // Check question_votes table
    const { data: votesData, error: votesError } = await supabase
      .from('question_votes')
      .select('*')
      .limit(1);
    
    if (votesError) {
      console.error('question_votes table test failed:', votesError);
    } else {
      console.log('✓ question_votes table working');
    }
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

// Run the setup
setupApprovalSystem();
