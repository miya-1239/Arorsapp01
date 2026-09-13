import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env file
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

console.log('\n======================================================');
console.log('🚗 AutoCraft - Supabase データ保存・同期コマンド');
console.log('======================================================\n');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ エラー: Supabase接続情報が見つかりません。');
  console.log('\n【設定方法】');
  console.log('1. プロジェクトルートの .env ファイルに以下を記入してください:');
  console.log('   SUPABASE_URL="https://your-project.supabase.co"');
  console.log('   SUPABASE_KEY="your-anon-or-service-role-key"');
  console.log('\nまたはコマンドライン引数として環境変数を直接渡して実行することも可能です:');
  console.log('   SUPABASE_URL="https://xxx.supabase.co" SUPABASE_KEY="xxx" npm run supabase:sync\n');
  console.log('2. Supabaseでテーブルが作成されていない場合は、先に以下のSQLを実行してください:');
  console.log('   supabase/schema.sql (SupabaseのSQL Editorに貼り付けて実行)\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  const rootDir = process.cwd();
  const jobsFile = path.join(rootDir, 'jobs_store.json');
  const staffFile = path.join(rootDir, 'staff_store.json');

  if (!fs.existsSync(jobsFile) || !fs.existsSync(staffFile)) {
    console.error('❌ データストアファイル (jobs_store.json または staff_store.json) が見つかりません。');
    process.exit(1);
  }

  const staffData = JSON.parse(fs.readFileSync(staffFile, 'utf-8'));
  const jobsData = JSON.parse(fs.readFileSync(jobsFile, 'utf-8'));

  console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
  console.log(`📦 保存対象データ: スタッフ ${staffData.length}名, 車両案件 ${jobsData.length}件\n`);

  // 1. Sync Staff
  console.log('▶ [1/2] 従業員データ (staff) を同期中...');
  const staffRows = staffData.map((s: any) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    avatar_color: s.avatarColor || 'bg-blue-600',
    initials: s.initials,
    phone: s.phone || null,
    updated_at: new Date().toISOString(),
  }));

  const { error: staffError } = await supabase
    .from('staff')
    .upsert(staffRows, { onConflict: 'id' });

  if (staffError) {
    console.error('❌ staff テーブルの保存に失敗しました:', staffError.message);
    if (staffError.message.includes('relation "public.staff" does not exist')) {
      console.log('\n💡 ヒント: テーブルが存在しません。supabase/schema.sql を Supabase SQL Editor で実行してください。');
    }
    process.exit(1);
  }
  console.log(`✅ staff テーブル: ${staffRows.length}件を正常に保存/更新しました。`);

  // 2. Sync Jobs
  console.log('\n▶ [2/2] 車両案件データ (jobs) を同期中...');
  const jobRows = jobsData.map((j: any) => ({
    id: j.id,
    status: j.status,
    current_step_id: j.currentStepId,
    scheduled_entry_at: j.scheduledEntryAt,
    actual_entry_at: j.actualEntryAt || null,
    scheduled_delivery_date: j.scheduledDeliveryDate,
    actual_delivery_at: j.actualDeliveryAt || null,
    customer_name: j.customerName,
    customer_phone: j.customerPhone || null,
    vehicle_model: j.vehicleModel,
    plate_number: j.plateNumber,
    color: j.color || null,
    mileage: j.mileage || null,
    billing_type: j.billingType,
    insurance_details: j.insuranceDetails || null,
    summary_notes: j.summaryNotes || null,
    parts_notes: j.partsNotes || null,
    assigned_staff: j.assignedStaff,
    checklist: j.checklist || {},
    logs: j.logs || [],
    created_at: j.createdAt || new Date().toISOString(),
    updated_at: j.updatedAt || new Date().toISOString(),
  }));

  const { error: jobsError } = await supabase
    .from('jobs')
    .upsert(jobRows, { onConflict: 'id' });

  if (jobsError) {
    console.error('❌ jobs テーブルの保存に失敗しました:', jobsError.message);
    if (jobsError.message.includes('relation "public.jobs" does not exist')) {
      console.log('\n💡 ヒント: テーブルが存在しません。supabase/schema.sql を Supabase SQL Editor で実行してください。');
    }
    process.exit(1);
  }
  console.log(`✅ jobs テーブル: ${jobRows.length}件を正常に保存/更新しました。`);

  console.log('\n======================================================');
  console.log('🎉 すべてのデータが Supabase に正常に保存・同期されました！');
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('予期せぬエラーが発生しました:', err);
  process.exit(1);
});
