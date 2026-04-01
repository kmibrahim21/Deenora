import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://risgwrppzvufbelusxlo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc2d3cnBwenZ1ZmJlbHVzeGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzY1ODEsImV4cCI6MjA4Nzk1MjU4MX0.ntPON5RswqkFYjaHLLzVJ3ZJkviJOIB5Pd7vA6uCfmk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  const { data, error } = await supabase.from('teachers').select('*').limit(1);
  console.log('Teachers columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No data');
  
  // Try to insert a dummy teacher to test
  const { data: inst } = await supabase.from('institutions').select('id').limit(1);
  if (inst && inst.length > 0) {
    const instId = inst[0].id;
    const { error: insErr } = await supabase.from('teachers').insert({
      institution_id: instId,
      name: 'Test Teacher',
      phone: '01711111111',
      login_code: '1234',
      is_active: true
    });
    console.log('Insert error:', insErr);
  }
}
checkSchema();
