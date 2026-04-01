import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: madrasahs } = await supabase.from('institutions').select('id').limit(1);
  if (!madrasahs || madrasahs.length === 0) return console.log('No madrasahs');
  const madrasahId = madrasahs[0].id;
  
  const { data, error } = await supabase.rpc('get_monthly_dues_report', {
    p_institution_id: madrasahId,
    p_class_id: null,
    p_month: '2026-03'
  });
  console.log('RPC Error:', error);
  console.log('RPC Data:', data ? data.slice(0, 2) : null);
}
test();
