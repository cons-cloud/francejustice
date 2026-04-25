import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zchhijltemvrsthdaxex.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaGhpamx0ZW12cnN0aGRheGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNjg0MzksImV4cCI6MjA5MjY0NDQzOX0.vPxSEMq8ENKBn5CxosrZYv9n7KNZgvECX_fDefvueoE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, lawyers!inner(*)')
    .eq('role', 'lawyer')
    .eq('is_verified', true)
    .eq('lawyers.is_available', true)
    .limit(1);
    
  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('SUCCESS:', JSON.stringify(data, null, 2));
  }
}

testQuery();
