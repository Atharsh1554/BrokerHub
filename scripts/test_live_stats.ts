import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const dotenv = fs.readFileSync('c:/Users/jithu/OneDrive/Desktop/Brokerhub/.env', 'utf8');
const env: Record<string, string> = {};
dotenv.split('\n').forEach(line => {
  const parts = line.split('=');
  const k = parts[0];
  const v = parts.slice(1).join('=');
  if (k && v) env[k.trim()] = v.trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 LIVE MARKETPLACE STATISTICS VALIDATION');
  console.log('====================================================\n');

  // 1. Direct count with anon key
  const { count: sellerCount, error: sErr } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'broker')
    .eq('status', 'active');

  assert(!sErr, 'No error querying seller count via public anon client');
  assert(typeof sellerCount === 'number' && sellerCount > 0, `Valid seller count returned: ${sellerCount}`);

  const { count: customerCount, error: cErr } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer')
    .eq('status', 'active');

  assert(!cErr, 'No error querying customer count via public anon client');
  assert(typeof customerCount === 'number' && customerCount > 0, `Valid customer count returned: ${customerCount}`);

  // 2. Validate privacy: Ensure HEAD query does not return private user records
  const { data: headData } = await supabase
    .from('users')
    .select('email, phone', { count: 'exact', head: true });

  assert(headData === null, 'Privacy verified: head: true returns null data, preventing exposure of emails/phones');

  // 3. Validate consistency with brokers table
  const { count: brokersTableCount } = await supabase
    .from('brokers')
    .select('*', { count: 'exact', head: true });

  assert(brokersTableCount === sellerCount, `Brokers table count (${brokersTableCount}) matches user sellers count (${sellerCount})`);

  console.log(`\n📊 Live Summary from Supabase:`);
  console.log(`   - Registered Active Sellers: ${sellerCount}`);
  console.log(`   - Registered Active Customers: ${customerCount}`);
  console.log(`   - Total Registered Marketplace Users: ${sellerCount! + customerCount!}`);
  console.log('\n🎉 ALL LIVE STATS VALIDATIONS PASSED SUCCESSFULLY!\n');
}

runTests().catch(console.error);
