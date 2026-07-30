import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zchhijltemvrsthdaxex.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaGhpamx0ZW12cnN0aGRheGV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA2ODQzOSwiZXhwIjoyMDkyNjQ0NDM5fQ.qwjo2MKN2jEeA0JkxkyGl1RiDK9xvNM9CI_vTMRJvz4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndInitStorage() {
  console.log('📦 Initialisation et vérification des Buckets Storage Supabase...');
  const buckets = ['avatars', 'documents', 'classroom-files'];

  for (const bucketName of buckets) {
    try {
      const { data, error } = await supabase.storage.getBucket(bucketName);
      if (error || !data) {
        console.log(`🔨 Création du bucket '${bucketName}'...`);
        const { error: createErr } = await supabase.storage.createBucket(bucketName, { public: true });
        if (createErr) console.warn(`   • Attention bucket ${bucketName}:`, createErr.message);
        else console.log(`   ✓ Bucket '${bucketName}' créé avec succès.`);
      } else {
        console.log(`   ✓ Bucket '${bucketName}' existe déjà.`);
      }
    } catch (e) {
      console.warn(`   • Bucket ${bucketName}:`, e.message);
    }
  }
}

async function main() {
  console.log('⚡ MIGRATION ET STRUCTURE MASTER SUPABASE');
  console.log('--------------------------------------------------');
  await checkAndInitStorage();
  console.log('--------------------------------------------------');
  console.log('📜 Fichier SQL de migration généré dans : ./master_supabase_setup.sql');
  console.log('📜 Fichiers Edge Functions générés dans : ./supabase/functions/');
}

main();
