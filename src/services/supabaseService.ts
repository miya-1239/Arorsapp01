import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VehicleJob, Staff } from '../types';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseCredentials(): { url?: string; key?: string } {
  const url = process.env.SUPABASE_URL || (typeof window !== 'undefined' ? (window as any).__SUPABASE_URL__ : undefined);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || (typeof window !== 'undefined' ? (window as any).__SUPABASE_KEY__ : undefined);
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key && url.trim().length > 0 && key.trim().length > 0);
}

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    throw new Error(
      'Supabaseの環境変数 (SUPABASE_URL, SUPABASE_KEY または SUPABASE_SERVICE_ROLE_KEY) が設定されていません。'
    );
  }

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}

export function mapStaffToSupabaseRow(staff: Staff) {
  return {
    id: staff.id,
    name: staff.name,
    role: staff.role,
    avatar_color: staff.avatarColor || 'bg-blue-600',
    initials: staff.initials,
    phone: staff.phone || null,
    updated_at: new Date().toISOString(),
  };
}

export function mapJobToSupabaseRow(job: VehicleJob) {
  return {
    id: job.id,
    status: job.status,
    current_step_id: job.currentStepId,
    scheduled_entry_at: job.scheduledEntryAt,
    actual_entry_at: job.actualEntryAt || null,
    scheduled_delivery_date: job.scheduledDeliveryDate,
    actual_delivery_at: job.actualDeliveryAt || null,
    customer_name: job.customerName,
    customer_phone: job.customerPhone || null,
    vehicle_model: job.vehicleModel,
    plate_number: job.plateNumber,
    color: job.color || null,
    mileage: job.mileage || null,
    billing_type: job.billingType,
    insurance_details: job.insuranceDetails || null,
    summary_notes: job.summaryNotes || null,
    parts_notes: job.partsNotes || null,
    assigned_staff: job.assignedStaff,
    checklist: job.checklist || {},
    logs: job.logs || [],
    created_at: job.createdAt || new Date().toISOString(),
    updated_at: job.updatedAt || new Date().toISOString(),
  };
}

export async function syncDataToSupabase(jobs: VehicleJob[], staff: Staff[]): Promise<{
  success: boolean;
  syncedJobs: number;
  syncedStaff: number;
  message: string;
  error?: string;
}> {
  try {
    const supabase = getSupabaseClient();

    // 1. Sync Staff
    const staffRows = staff.map(mapStaffToSupabaseRow);
    const { error: staffError } = await supabase
      .from('staff')
      .upsert(staffRows, { onConflict: 'id' });

    if (staffError) {
      throw new Error(`従業員テーブル(staff)の同期に失敗しました: ${staffError.message}`);
    }

    // 2. Sync Jobs
    const jobRows = jobs.map(mapJobToSupabaseRow);
    const { error: jobsError } = await supabase
      .from('jobs')
      .upsert(jobRows, { onConflict: 'id' });

    if (jobsError) {
      throw new Error(`案件テーブル(jobs)の同期に失敗しました: ${jobsError.message}`);
    }

    return {
      success: true,
      syncedJobs: jobRows.length,
      syncedStaff: staffRows.length,
      message: `Supabaseへの保存が完了しました（車両案件: ${jobRows.length}件、スタッフ: ${staffRows.length}名）`,
    };
  } catch (err: any) {
    console.error('Supabase sync error:', err);
    return {
      success: false,
      syncedJobs: 0,
      syncedStaff: 0,
      message: err.message || 'Supabaseへの保存処理でエラーが発生しました',
      error: err.message,
    };
  }
}
