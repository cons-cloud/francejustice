import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zchhijltemvrsthdaxex.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaGhpamx0ZW12cnN0aGRheGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNjg0MzksImV4cCI6MjA5MjY0NDQzOX0.vPxSEMq8ENKBn5CxosrZYv9n7KNZgvECX_fDefvueoE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
  console.log('Fetching profiles...');
  const { data, error } = await supabase
    .from('profiles')
    .select('role,first_name,last_name,avatar_url,is_verified')
    .limit(1);

  if (error) {
    console.error('Error fetching profiles:', JSON.stringify(error, null, 2));
  } else {
    console.log('Success!', data);
  }
}

testFetch();
