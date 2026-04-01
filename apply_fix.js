
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://risgwrppzvufbelusxlo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc2d3cnBwenZ1ZmJlbHVzeGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzY1ODEsImV4cCI6MjA4Nzk1MjU4MX0.ntPON5RswqkFYjaHLLzVJ3ZJkviJOIB5Pd7vA6uCfmk';

// Note: We'd ideally use the service_role key here, but we only have the anon key.
// If the exec_sql RPC exists, it might allow us to run this.
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runFix() {
  const sql = fs.readFileSync('./fix_schema_and_cache.sql', 'utf8');
  
  console.log("Attempting to run SQL via exec_sql RPC...");
  const { data, error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    console.error("Error executing SQL:", error);
    console.log("If 'method not found', the exec_sql RPC is missing.");
  } else {
    console.log("SQL executed successfully:", data);
  }
}

runFix();
