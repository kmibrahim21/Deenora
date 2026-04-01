import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = fs.readFileSync('test_sql.sql', 'utf8');
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  console.log('Data:', data);
  console.log('Error:', error);
}

run();
