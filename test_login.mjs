import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zchhijltemvrsthdaxex.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaGhpamx0ZW12cnN0aGRheGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNjg0MzksImV4cCI6MjA5MjY0NDQzOX0.vPxSEMq8ENKBn5CxosrZYv9n7KNZgvECX_fDefvueoE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('Testing login for justlaw@gmail.com / Justlaw1@');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'justlaw@gmail.com',
    password: 'Justlaw1@'
  });

  if (error) {
    console.error('Login Failed:', error);
    process.exit(1);
  }

  console.log('Login Succeeded! User ID:', data.user.id);
  
  console.log('Testing profile fetch (to check if RLS loop is gone)');
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    console.error('Profile Fetch Failed:', profileError);
    process.exit(1);
  }
  
  console.log('Profile Fetch Succeeded:', profileData);
  process.exit(0);
}

testAuth();
