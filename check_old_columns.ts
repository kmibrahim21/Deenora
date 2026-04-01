
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Checking if old columns exist...');
  const { data, error } = await supabase.from('teachers').select('phone, name, login_code').limit(1);

  if (error) {
    console.error('Error fetching old columns:', error);
  } else {
    console.log('Old columns exist!');
  }
}

test();
