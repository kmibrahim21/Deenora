import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://risgwrppzvufbelusxlo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc2d3cnBwenZ1ZmJlbHVzeGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzY1ODEsImV4cCI6MjA4Nzk1MjU4MX0.ntPON5RswqkFYjaHLLzVJ3ZJkviJOIB5Pd7vA6uCfmk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  const { data, error } = await supabase.from('teachers').select('*').limit(1);
  console.log('Teachers columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No data');
  
  if (data && data.length > 0) {
    const { data: rpcData, error: rpcError } = await supabase.rpc('check_teacher_login', {
      p_phone: data[0].phone,
      p_pin: data[0].login_code
    });
    console.log('RPC Error:', rpcError);
    console.log('RPC Data:', rpcData);
  }
}
checkSchema();
