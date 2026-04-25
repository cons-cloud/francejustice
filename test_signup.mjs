import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zchhijltemvrsthdaxex.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaGhpamx0ZW12cnN0aGRheGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNjg0MzksImV4cCI6MjA5MjY0NDQzOX0.vPxSEMq8ENKBn5CxosrZYv9n7KNZgvECX_fDefvueoE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function signUpUser(email, password, role) {
  console.log(`\n--- Signing up ${email} as ${role} ---`);
  // Sign up
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    if (error.message.includes('User already registered')) {
        console.log(`User ${email} already exists in Auth. Trying to login...`);
        const {data: loginData, error: loginErr} = await supabase.auth.signInWithPassword({email, password});
        if (loginErr) {
            console.error('Login also failed. Credentials must be wrong.', loginErr);
            return;
        } else {
            console.log('Login succeeded. Updating profile to role:', role);
            await createProfile(loginData.user.id, email, role);
            return;
        }
    } else {
        console.error('Signup Error:', error);
        // Supabase trigger might have failed!
        return;     
    }
  }

  console.log('Signup auth succeeded. User ID:', data.user.id);
  await createProfile(data.user.id, email, role);
}

async function createProfile(userId, email, role) {
  // Now explicitly insert/update into profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: email,
      first_name: role.toUpperCase(),
      last_name: 'Test',
      role: role,
      is_verified: true, // Auto verify for testing
    }, { onConflict: 'id' });

  if (profileError) {
    console.error(`Profile ${role} insertion error:`, profileError);
  } else {
    console.log(`Profile ${role} created/updated successfully!`);
    if (role === 'lawyer') {
        const { error: lawyerErr } = await supabase.from('lawyers').upsert({
            id: userId,
            bar_association: 'Paris',
            license_number: 'L-' + Math.floor(Math.random() * 10000),
            is_available: true
        });
        if (lawyerErr) console.error('Lawyer detail insert error:', lawyerErr);
        else console.log('Lawyer details inserted successfully!');
    }
  }
}

async function run() {
  await signUpUser('justlaw@gmail.com', 'Justlaw1@', 'admin');
  await signUpUser('citizen@test.com', 'Password123!', 'user');
  await signUpUser('lawyer@test.com', 'Password123!', 'lawyer');
  process.exit(0);
}

run();
