
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const mobile = '01700000000'; // Dummy mobile
  const password = 'password123';
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

  console.log('Testing check_teacher_login RPC with p_mobile and p_password_hash...');
  const { data, error } = await supabase.rpc('check_teacher_login', { 
    p_mobile: mobile, 
    p_password_hash: passwordHash 
  });

  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC Success:', data);
  }
}

test();
