import React from 'react';
import { CalendarClock, Wrench, CheckCircle2, AlertTriangle } from 'lucide-react';
import { VehicleJob, getChecklistRecords } from '../types';

interface DashboardStatsProps {
  jobs: VehicleJob[];
  onSelectTab: (tab: 'all' | 'booking' | 'in_progress' | 'completed') => void;
  activeTab: 'all' | 'booking' | 'in_progress' | 'completed';
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  jobs,
  onSelectTab,
  activeTab,
}) => {
  const bookingCount = jobs.filter(j => j.status === 'booking').length;
  const inProgressCount = jobs.filter(j => j.status === 'in_progress').length;
  const completedCount = jobs.filter(j => j.status === 'completed').length;
  
  // Count jobs with any abnormal inspection items
  const abnormalJobsCount = jobs.filter(j => {
    return getChecklistRecords(j.checklist).some(item => item.status === 'abnormal');
  }).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5">
      
      {/* 1. Booking / Reservation */}
      <button
        type="button"
        onClick={() => onSelectTab('booking')}
        className={`p-3.5 sm:p-4 rounded-xl border text-left transition relative overflow-hidden shadow-xs ${
          activeTab === 'booking'
            ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-500/20 shadow-blue-500/10'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <CalendarClock className="w-4 h-4 text-blue-600" />
            入庫予定（予約）
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700">
            予定
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
            {bookingCount}
          </span>
          <span className="text-xs text-slate-500">台</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1 truncate">
          実車入庫待ちの予約車両
        </div>
      </button>

      {/* 2. In Progress / Inbound */}
      <button
        type="button"
        onClick={() => onSelectTab('in_progress')}
        className={`p-3.5 sm:p-4 rounded-xl border text-left transition relative overflow-hidden shadow-xs ${
          activeTab === 'in_progress'
            ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-500/20 shadow-amber-500/10'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-amber-600" />
            現在作業中（入庫中）
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">
            工場内
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
            {inProgressCount}
          </span>
          <span className="text-xs text-slate-500">台</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1 truncate">
          受付〜磨き・洗車・検査工程
        </div>
      </button>

      {/* 3. Completed / Delivered */}
      <button
        type="button"
        onClick={() => onSelectTab('completed')}
        className={`p-3.5 sm:p-4 rounded-xl border text-left transition relative overflow-hidden shadow-xs ${
          activeTab === 'completed'
            ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500/20 shadow-emerald-500/10'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            納車完了
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
            完了
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
            {completedCount}
          </span>
          <span className="text-xs text-slate-500">台</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1 truncate">
          引渡し・精算済みの車両
        </div>
      </button>

      {/* 4. Inspection Abnormalities Flagged */}
      <div className="p-3.5 sm:p-4 rounded-xl border bg-white border-slate-200 text-left shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            点検要確認・異常あり
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800">
            チェック
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-rose-600">
            {abnormalJobsCount}
          </span>
          <span className="text-xs text-slate-500">台</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1 truncate">
          既存傷・不良箇所メモ記録あり
        </div>
      </div>

    </div>
  );
};
