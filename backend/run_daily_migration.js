const supabase = require("./supabaseClient");
const fs = require("fs");
const path = require("path");

async function setupDailyDB() {
  try {
    console.log("Setting up daily questions database...");

    const sqlFile = path.join(__dirname, "setup_daily_db.sql");
    const sql = fs.readFileSync(sqlFile, "utf8");

    // Split statements just in case, though the RPC might handle it or we might need to be careful
    // The previous example script split them.
    const statements = sql
      .split(";")
      .filter((statement) => statement.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        console.log("Executing SQL...");
        // Use the rpc 'execute_sql' as seen in the existing setup-database.js
        // This assumes the RPC function exists on the supabase project
        const { error } = await supabase.rpc("execute_sql", {
          query: statement.trim(),
        });

        if (error) {
          console.error("Error executing statement:", error);
          throw error;
        } else {
          console.log("✓ Success");
        }
      }
    }
    console.log("Database setup completed!");
  } catch (error) {
    console.error("Setup failed:", error);
    process.exit(1);
  }
}

setupDailyDB();
