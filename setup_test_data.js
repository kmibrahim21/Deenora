import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://risgwrppzvufbelusxlo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc2d3cnBwenZ1ZmJlbHVzeGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzY1ODEsImV4cCI6MjA4Nzk1MjU4MX0.ntPON5RswqkFYjaHLLzVJ3ZJkviJOIB5Pd7vA6uCfmk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setup() {
  const instId = '00000000-0000-0000-0000-000000000001';
  
  // 1. Create institution
  const { error: instErr } = await supabase.from('institutions').upsert({
    id: instId,
    name: 'Test Institution',
    is_active: true,
    status: 'active',
    balance: 0,
    sms_balance: 0,
    institution_type: 'madrasah'
  });
  if (instErr) console.error("Inst error:", instErr);
  else console.log("Inst created");

  // 2. Create teacher
  const phone = '01700000000';
  const pin = '1234';
  const { error: teacherErr } = await supabase.from('teachers').upsert({
    institution_id: instId,
    name: 'Test Teacher',
    phone: phone,
    login_code: pin,
    is_active: true
  });
  if (teacherErr) console.error("Teacher error:", teacherErr);
  else console.log("Teacher created");

  // 3. Call RPC to create Supabase user
  const { data: rpcData, error: rpcError } = await supabase.rpc('check_teacher_login', {
    p_phone: phone,
    p_pin: pin
  });
  if (rpcError) console.error("RPC error:", rpcError);
  else console.log("RPC Success:", rpcData);
}
setup();
