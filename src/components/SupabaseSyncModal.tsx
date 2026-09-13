import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  FileCode
} from 'lucide-react';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalJobs: number;
  totalStaff: number;
  onSyncComplete?: (message: string) => void;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  totalJobs,
  totalStaff,
  onSyncComplete,
}) => {
  if (!isOpen) return null;

  const [status, setStatus] = useState<{
    configured: boolean;
    url: string | null;
    totalJobs: number;
    totalStaff: number;
  } | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/supabase/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch supabase status:', e);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setResultMessage(null);
    setIsError(false);

    try {
      const res = await fetch('/api/supabase/sync', { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsError(true);
        setResultMessage(data.message || '同期に失敗しました');
      } else {
        setIsError(false);
        setResultMessage(data.message || '正常にSupabaseへデータを保存しました');
        if (onSyncComplete) onSyncComplete(data.message);
      }
    } catch (err: any) {
      setIsError(true);
      setResultMessage(err.message || '通信エラーが発生しました');
    } finally {
      setIsSyncing(false);
      fetchStatus();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const cliCommand = 'npm run supabase:sync';
  const inlineEnvCommand = 'SUPABASE_URL="https://your-project.supabase.co" SUPABASE_KEY="your-key" npm run supabase:sync';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md">
              <Database className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Supabase データ保存・同期</h2>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                  status?.configured 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                }`}>
                  {status?.configured ? '接続設定完了' : '環境変数準備中'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                PostgreSQLクラウドデータベース（Supabase）へ案件・スタッフ全データを同期・保存
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
          
          {/* Target Data Stats */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="text-center p-2 rounded-lg bg-white border border-slate-100 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium block">保存対象の車両案件</span>
              <span className="text-lg font-extrabold text-slate-900 font-mono">{totalJobs} 件</span>
            </div>
            <div className="text-center p-2 rounded-lg bg-white border border-slate-100 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium block">保存対象の従業員</span>
              <span className="text-lg font-extrabold text-slate-900 font-mono">{totalStaff} 名</span>
            </div>
          </div>

          {/* Sync Result Alert */}
          {resultMessage && (
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs sm:text-sm ${
              isError 
                ? 'bg-rose-50 border-rose-200 text-rose-800' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              {isError ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 whitespace-pre-wrap">{resultMessage}</div>
            </div>
          )}

          {/* Section 1: Direct Execute Button */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <RefreshCw className={`w-4 h-4 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
                  ブラウザから今すぐ同期実行
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  現在の工場データをそのままSupabaseのテーブルへ保存（upsert）します
                </p>
              </div>
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-400 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                <Database className="w-4 h-4" />
                <span>{isSyncing ? '同期実行中...' : 'Supabaseに保存する'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Terminal / CLI Commands */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-slate-700" />
              ターミナル・コマンドラインから実行するコマンド
            </h3>

            {/* Standard CLI Command */}
            <div className="bg-slate-900 rounded-xl p-3.5 text-slate-100 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
                <span>標準実行コマンド (推奨):</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(cliCommand, 'cmd1')}
                  className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition"
                >
                  {copiedCmd === 'cmd1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd === 'cmd1' ? 'コピー完了' : 'コピー'}</span>
                </button>
              </div>
              <div className="text-emerald-400 overflow-x-auto py-1">
                $ {cliCommand}
              </div>
            </div>

            {/* Inline ENV Command */}
            <div className="bg-slate-900 rounded-xl p-3.5 text-slate-100 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
                <span>環境変数を直接指定して1行で実行:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(inlineEnvCommand, 'cmd2')}
                  className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition"
                >
                  {copiedCmd === 'cmd2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd === 'cmd2' ? 'コピー完了' : 'コピー'}</span>
                </button>
              </div>
              <div className="text-emerald-400 overflow-x-auto py-1 text-[11px]">
                $ {inlineEnvCommand}
              </div>
            </div>
          </div>

          {/* Section 3: Supabase Setup Checklist */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2.5 text-xs text-slate-700">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-amber-600" />
              初回セットアップ手順 (Supabaseテーブル作成)
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 leading-relaxed">
              <li>
                <span className="font-semibold text-slate-800">テーブル定義の作成:</span> プロジェクトルートの <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-900">supabase/schema.sql</code> の中身をコピーし、Supabaseダッシュボードの「SQL Editor」で実行します。
              </li>
              <li>
                <span className="font-semibold text-slate-800">接続キーの設定:</span> Supabaseの「Project Settings」&gt;「API」から Project URL と API Key を取得し、<code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-900">.env</code> に記述します。
              </li>
              <li>
                <span className="font-semibold text-slate-800">同期の実行:</span> <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-900">npm run supabase:sync</code> を実行するか、上記ボタンを押してデータを同期します。
              </li>
            </ol>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            AutoCraft Data Engine &bull; Supabase PostgreSQL
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
};
