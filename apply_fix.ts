
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const sql = fs.readFileSync('final_teacher_fix.sql', 'utf8');
    console.log('Applying SQL fix...');
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error applying SQL fix:', error);
      if (error.message.includes('function "exec_sql" does not exist')) {
        console.log('The "exec_sql" RPC is missing. Please run the SQL in the Supabase Dashboard.');
      }
    } else {
      console.log('SQL fix applied successfully:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

run();
