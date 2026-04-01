
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listFunctions() {
  const { data, error } = await supabase
    .from('pg_proc')
    .select('proname, proargnames, prosrc')
    .filter('proname', 'ilike', '%check_teacher_login%');

  if (error) {
    // pg_proc might not be accessible via standard API if not exposed
    console.log('Could not query pg_proc directly via from(). Trying RPC if available...');
    
    // Try a simple query via a common RPC if it exists, or just try to call the function to see if it exists
    const { error: rpcError1 } = await supabase.rpc('check_teacher_login', { p_mobile: 'test', p_password_hash: 'test' });
    console.log('Test p_mobile, p_password_hash:', rpcError1?.message);

    const { error: rpcError2 } = await supabase.rpc('check_teacher_login', { p_phone: 'test', p_pin: 'test' });
    console.log('Test p_phone, p_pin:', rpcError2?.message);
  } else {
    console.log('Functions found:', data);
  }
}

listFunctions();
