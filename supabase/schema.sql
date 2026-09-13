-- ==============================================================================
-- AutoCraft - Supabase データベース定義スキーマ (PostgreSQL)
-- ==============================================================================
-- 使い方:
-- 1. Supabaseダッシュボード (https://supabase.com/dashboard) にログイン
-- 2. 対象プロジェクトの左メニュー「SQL Editor」を開く
-- 3. 「+ New Query」をクリックし、このファイルの内容を貼り付けて「Run」を実行してください
-- ==============================================================================

-- 1. 従業員・スタッフテーブル (staff)
CREATE TABLE IF NOT EXISTS public.staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar_color TEXT DEFAULT 'bg-blue-600',
    initials TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 車両入庫・工程・チェック管理テーブル (jobs)
CREATE TABLE IF NOT EXISTS public.jobs (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL CHECK (status IN ('booking', 'in_progress', 'completed', 'cancelled')),
    current_step_id INTEGER NOT NULL DEFAULT 1 CHECK (current_step_id BETWEEN 1 AND 12),
    scheduled_entry_at TEXT NOT NULL,
    actual_entry_at TEXT,
    scheduled_delivery_date TEXT NOT NULL,
    actual_delivery_at TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    vehicle_model TEXT NOT NULL,
    plate_number TEXT NOT NULL,
    color TEXT,
    mileage TEXT,
    billing_type TEXT NOT NULL CHECK (billing_type IN ('self', 'insurance')),
    insurance_details TEXT,
    summary_notes TEXT,
    parts_notes TEXT,
    assigned_staff TEXT NOT NULL,
    checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
    logs JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成（検索とパフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_plate_number ON public.jobs(plate_number);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_name ON public.jobs(customer_name);
CREATE INDEX IF NOT EXISTS idx_jobs_current_step ON public.jobs(current_step_id);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_entry ON public.jobs(scheduled_entry_at);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_delivery ON public.jobs(scheduled_delivery_date);

-- Row Level Security (RLS) 設定
-- 全社共有の現場業務用アプリのため、認証ユーザーまたはサービスロールによるアクセスを許可
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 全ての操作（SELECT, INSERT, UPDATE, DELETE）を許可するポリシー（必要に応じて権限を調整可能）
CREATE POLICY "Allow public read access on staff" 
    ON public.staff FOR SELECT USING (true);

CREATE POLICY "Allow service/authenticated upsert on staff" 
    ON public.staff FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on jobs" 
    ON public.jobs FOR SELECT USING (true);

CREATE POLICY "Allow service/authenticated upsert on jobs" 
    ON public.jobs FOR ALL USING (true) WITH CHECK (true);

-- 自動更新タイムスタンプ用トリガー関数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_staff_updated_at
    BEFORE UPDATE ON public.staff
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
