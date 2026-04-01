import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://risgwrppzvufbelusxlo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc2d3cnBwenZ1ZmJlbHVzeGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzY1ODEsImV4cCI6MjA4Nzk1MjU4MX0.ntPON5RswqkFYjaHLLzVJ3ZJkviJOIB5Pd7vA6uCfmk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  // 1. Get institution
  const { data: insts } = await supabase.from('institutions').select('id').limit(1);
  if (!insts || insts.length === 0) {
    console.log("No institutions found");
    return;
  }
  const instId = insts[0].id;
  console.log("Using institution:", instId);

  // 2. Create teacher
  const phone = '01700000000';
  const pin = '1234';
  
  // Delete if exists
  await supabase.from('teachers').delete().eq('phone', phone);

  const { data: teacher, error: insErr } = await supabase.from('teachers').insert({
    institution_id: instId,
    name: 'Test Teacher',
    phone: phone,
    login_code: pin,
    is_active: true
  }).select().single();

  if (insErr) {
    console.error("Insert teacher error:", insErr);
    return;
  }
  console.log("Teacher created:", teacher.id);

  // 3. Call RPC
  const { data: rpcData, error: rpcError } = await supabase.rpc('check_teacher_login', {
    p_phone: phone,
    p_pin: pin
  });

  if (rpcError) {
    console.error("RPC Error:", rpcError);
  } else {
    console.log("RPC Success:", rpcData);
  }
}

test();
