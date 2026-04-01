
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Attempting to insert a teacher with new schema columns...');
  const { data, error } = await supabase.from('teachers').insert({ 
    teacher_name: 'Test Teacher', 
    mobile: '01700000000', 
    password_hash: 'test_hash',
    institution_id: '00000000-0000-0000-0000-000000000000' // Dummy UUID
  });

  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Insert Success:', data);
  }
}

test();
