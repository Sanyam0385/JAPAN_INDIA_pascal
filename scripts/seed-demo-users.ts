// CIRCULO Demo Personas & Shared Record Layer Seed Script
// Local-only: Reads service_role key from git-ignored .env.local
// Usage: npm run seed

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Helper to parse key-values from .env files without external dependencies
function loadEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return env;

  const content = fs.readFileSync(filePath, 'utf-8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  });
  return env;
}

async function runSeed() {
  console.log('🌱 --- CIRCULO Demo Personas & Database Seeder ---');

  const rootDir = process.cwd();
  const envLocal = loadEnvFile(path.join(rootDir, '.env.local'));
  const envMain = loadEnvFile(path.join(rootDir, '.env'));

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    envLocal.SUPABASE_URL ||
    envLocal.EXPO_PUBLIC_SUPABASE_URL ||
    envMain.EXPO_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    envLocal.SUPABASE_SERVICE_ROLE_KEY ||
    envMain.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.log('\n⚠️  Supabase Service Role Key not found in .env.local!');
    console.log('To seed real Supabase Auth accounts for the 5 demo personas:');
    console.log('1. Go to your Supabase Dashboard -> Project Settings -> API');
    console.log("2. Copy 'Project URL' and the 'service_role' secret key");
    console.log('3. Create a .env.local file in the project root:');
    console.log('   EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>');
    console.log('4. Run: npm run seed\n');
    console.log('ℹ️  Stand-alone offline demo mode remains 100% operational without backend keys.');
    return;
  }

  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const DEMO_PERSONAS = [
    {
      id: 'd0000000-0000-0000-0000-000000000001',
      email: 'priya@circulo.app',
      password: 'demo1234',
      name: 'Priya Sharma',
      role: 'household',
      locality: 'Koramangala, Bengaluru',
      ward: 'Ward 151',
      cityKey: 'BLR',
      lat: 12.9352,
      lng: 77.6245,
      phone: '+91-9876543210',
      language: 'en',
    },
    {
      id: 'd0000000-0000-0000-0000-000000000002',
      email: 'ramesh@circulo.app',
      password: 'demo1234',
      name: 'Ramesh Kumar',
      role: 'formal_collector',
      locality: 'BBMP Zone 3, Bengaluru',
      ward: 'Ward 151',
      cityKey: 'BLR',
      lat: 12.9348,
      lng: 77.6238,
      phone: '+91-9876543211',
      language: 'hi',
    },
    {
      id: 'd0000000-0000-0000-0000-000000000003',
      email: 'meena@circulo.app',
      password: 'demo1234',
      name: 'Meena Devi',
      role: 'informal_picker',
      locality: 'Koramangala, Bengaluru',
      ward: 'Ward 151',
      cityKey: 'BLR',
      lat: 12.9360,
      lng: 77.6250,
      phone: '+91-9876543212',
      language: 'hi',
    },
    {
      id: 'd0000000-0000-0000-0000-000000000004',
      email: 'admin@circulo.app',
      password: 'demo1234',
      name: 'Kavitha Reddy',
      role: 'municipal_admin',
      locality: 'BBMP Municipal Office',
      ward: 'Ward 151',
      cityKey: 'BLR',
      lat: 12.9716,
      lng: 77.5946,
      phone: '+91-9876543213',
      language: 'en',
    },
    {
      id: 'd0000000-0000-0000-0000-000000000005',
      email: 'recycler@circulo.app',
      password: 'demo1234',
      name: 'EcoPlast Circular MRF',
      role: 'recycler',
      locality: 'Industrial Suburb, Yeshwanthpur',
      ward: 'Ward 151',
      cityKey: 'BLR',
      lat: 13.0280,
      lng: 77.5400,
      phone: '+91-9876543214',
      language: 'en',
    },
  ];

  console.log('\n--- Seeding 5 Demo Personas (Pre-confirmed Auth Users) ---');
  const userIds: Record<string, string> = {};

  for (const p of DEMO_PERSONAS) {
    let uid = p.id;

    // Check if user already exists
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: p.email,
      password: p.password,
      email_confirm: true,
      user_metadata: {
        full_name: p.name,
        role: p.role,
        locality: p.locality,
        ward: p.ward,
        city_key: p.cityKey,
        lat: p.lat,
        lng: p.lng,
        phone: p.phone,
        preferred_language: p.language,
      },
    });

    if (createError) {
      if (createError.message.includes('already exists') || (createError as any).code === 'user_already_exists') {
        // Find existing user id
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users?.find((u) => u.email?.toLowerCase() === p.email.toLowerCase());
        if (existing) {
          uid = existing.id;
          // Update credentials and confirm email
          await supabase.auth.admin.updateUserById(uid, {
            password: p.password,
            email_confirm: true,
            user_metadata: {
              full_name: p.name,
              role: p.role,
              locality: p.locality,
              ward: p.ward,
              city_key: p.cityKey,
              lat: p.lat,
              lng: p.lng,
              phone: p.phone,
            },
          });
          console.log(`  ✓ Updated existing user: ${p.email} (${p.role})`);
        }
      } else {
        console.error(`  ✗ Error creating ${p.email}:`, createError.message);
      }
    } else if (createData?.user) {
      uid = createData.user.id;
      console.log(`  ✓ Created new auth user: ${p.email} (${p.role})`);
    }

    userIds[p.role] = uid;

    // Ensure profile row exists with exact role (service_role bypasses self-signup coercion)
    await supabase.from('profiles').upsert({
      id: uid,
      email: p.email,
      full_name: p.name,
      name: p.name,
      role: p.role,
      locality: p.locality,
      ward: p.ward,
      city_key: p.cityKey,
      lat: p.lat,
      lng: p.lng,
      phone: p.phone,
      language: p.language,
      share_live_location: p.role === 'informal_picker' || p.role === 'formal_collector',
      updated_at: new Date().toISOString(),
    });
  }

  console.log('\n--- Seeding Initial Realtime Pickup Jobs ---');
  const householdId = userIds['household'];
  const pickerId = userIds['informal_picker'];

  if (householdId) {
    const demoJobs = [
      {
        household_id: householdId,
        household_name: 'Priya Sharma [DEMO]',
        household_address: '42, 4th Cross, Koramangala 4th Block',
        picker_id: null,
        material: 'Cardboard',
        estimated_kg: 15.0,
        status: 'listed',
        proposed_rate_per_kg: 14.0,
        pickup_window: 'Morning (8am - 12pm)',
        ward: 'Ward 151',
        city_key: 'BLR',
        lat: 12.9352,
        lng: 77.6245,
        notes: '[DEMO] Flattened clean cardboard boxes from delivery shipments.',
      },
      {
        household_id: householdId,
        household_name: 'Priya Sharma [DEMO]',
        household_address: '42, 4th Cross, Koramangala 4th Block',
        picker_id: null,
        material: 'PET Bottles',
        estimated_kg: 8.5,
        status: 'rate_locked',
        locked_rate_per_kg: 22.0,
        pickup_window: 'Afternoon (1pm - 5pm)',
        ward: 'Ward 151',
        city_key: 'BLR',
        lat: 12.9355,
        lng: 77.6248,
        notes: '[DEMO] Clean crushed mineral water and soda bottles.',
      },
    ];

    if (pickerId) {
      demoJobs.push({
        household_id: householdId,
        household_name: 'Priya Sharma [DEMO]',
        household_address: '42, 4th Cross, Koramangala 4th Block',
        picker_id: pickerId,
        material: 'Mixed Plastics',
        estimated_kg: 20.0,
        status: 'claimed',
        proposed_rate_per_kg: 18.0,
        pickup_window: 'Morning (8am - 12pm)',
        ward: 'Ward 151',
        city_key: 'BLR',
        lat: 12.936,
        lng: 77.625,
        notes: '[DEMO] Segregated HDPE milk containers and shampoo bottles.',
      });
    }

    for (const job of demoJobs) {
      const { error } = await supabase.from('pickup_jobs').insert(job);
      if (!error) {
        console.log(`  ✓ Seeded pickup job: ${job.material} (${job.status})`);
      }
    }
  }

  console.log('\n✅ Demo Seeding Completed Successfully!');
  console.log('You can now log in directly with any of the demo accounts using password: demo1234');
}

runSeed().catch((e) => {
  console.error('Fatal seed script error:', e);
  process.exit(1);
});
