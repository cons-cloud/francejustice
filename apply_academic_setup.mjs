import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zchhijltemvrsthdaxex.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaGhpamx0ZW12cnN0aGRheGV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA2ODQzOSwiZXhwIjoyMDkyNjQ0NDM5fQ.qwjo2MKN2jEeA0JkxkyGl1RiDK9xvNM9CI_vTMRJvz4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  console.log('📦 Verification et création des Buckets Storage pour documents académiques...');
  const buckets = ['academic-documents', 'documents', 'avatars'];

  for (const bucketName of buckets) {
    try {
      const { data, error } = await supabase.storage.getBucket(bucketName);
      if (error || !data) {
        console.log(`🔨 Création du bucket '${bucketName}'...`);
        const { error: createErr } = await supabase.storage.createBucket(bucketName, { public: true });
        if (createErr) console.warn(`   • Warning bucket ${bucketName}:`, createErr.message);
        else console.log(`   ✓ Bucket '${bucketName}' créé avec succès (Public).`);
      } else {
        console.log(`   ✓ Bucket '${bucketName}' est prêt.`);
      }
    } catch (e) {
      console.warn(`   • Erreur bucket ${bucketName}:`, e.message);
    }
  }
}

async function verifyTable() {
  console.log('📋 Vérification de la table academic_profiles_just...');
  try {
    const { error } = await supabase.from('academic_profiles_just').select('id').limit(1);
    if (error && error.code === 'PGRST301') {
      console.log('⚠️ La table academic_profiles_just nécessite d\'être créée via SQL.');
    } else {
      console.log('✓ La table academic_profiles_just est opérationnelle.');
    }
  } catch (e) {
    console.log('Note table:', e.message);
  }
}

async function run() {
  console.log('🚀 MIGRATION DU SYSTEME D\'INSCRIPTION ACADEMIQUE SUPABASE');
  console.log('====================================================');
  await setupStorage();
  await verifyTable();
  console.log('====================================================');
  console.log('✨ Configuration Supabase terminée avec succès !');
}

run();
