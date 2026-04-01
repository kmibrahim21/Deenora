import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://risgwrppzvufbelusxlo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc2d3cnBwenZ1ZmJlbHVzeGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzY1ODEsImV4cCI6MjA4Nzk1MjU4MX0.ntPON5RswqkFYjaHLLzVJ3ZJkviJOIB5Pd7vA6uCfmk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTeacherLogin() {
  const { data, error } = await supabase.rpc('check_teacher_login', {
    p_phone: '01712345678', // Just a dummy phone
    p_pin: '1234'
  });

  if (error) {
    console.error("RPC Error:", error);
  } else {
    console.log("RPC Success:", data);
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: '01712345678@teacher.deenora.com',
    password: '1234'
  });

  if (signInError) {
    console.error("SignIn Error:", signInError);
  } else {
    console.log("SignIn Success:", signInData);
  }
}

testTeacherLogin();
