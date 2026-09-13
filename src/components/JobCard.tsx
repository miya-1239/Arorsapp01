import React from 'react';
import { 
  Calendar, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Car, 
  ArrowRight,
  ShieldAlert,
  PlayCircle,
  FileText
} from 'lucide-react';
import { VehicleJob, PROCESS_STEPS, BillingType, getChecklistRecords } from '../types';

interface JobCardProps {
  job: VehicleJob;
  onOpenDetail: (job: VehicleJob) => void;
  onRecordEntry: (job: VehicleJob) => void;
  onAdvanceStep: (job: VehicleJob) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onOpenDetail,
  onRecordEntry,
  onAdvanceStep,
}) => {
  const currentStep = PROCESS_STEPS.find(s => s.id === job.currentStepId) || PROCESS_STEPS[0];
  const nextStep = PROCESS_STEPS.find(s => s.id === job.currentStepId + 1);

  // Check inspections
  const checklistValues = getChecklistRecords(job.checklist);
  const abnormalCount = checklistValues.filter(i => i.status === 'abnormal').length;
  const inspectedCount = checklistValues.filter(i => i.status !== 'uninspected').length;

  // Format dates
  const formatDateTime = (dtStr?: string | null) => {
    if (!dtStr) return '-';
    try {
      const d = new Date(dtStr);
      const m = d.getMonth() + 1;
      const day = d.getDate();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
      const dayOfWeek = dayNames[d.getDay()];
      return `${m}/${day}(${dayOfWeek}) ${hours}:${mins}`;
    } catch {
      return dtStr;
    }
  };

  const formatDateOnly = (dStr?: string | null) => {
    if (!dStr) return '-';
    try {
      const d = new Date(dStr);
      const m = d.getMonth() + 1;
      const day = d.getDate();
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
      const dayOfWeek = dayNames[d.getDay()];
      return `${m}/${day}(${dayOfWeek})`;
    } catch {
      return dStr;
    }
  };

  const isBooking = job.status === 'booking';
  const isInProgress = job.status === 'in_progress';
  const isCompleted = job.status === 'completed';

  // Progress percentage
  const progressPercent = Math.min(100, Math.round(((job.currentStepId - 1) / 11) * 100));

  return (
    <div 
      className={`rounded-2xl border transition-all duration-200 bg-white shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
        isBooking
          ? 'border-blue-200 hover:border-blue-400'
          : isInProgress
          ? 'border-amber-200 hover:border-amber-400'
          : 'border-emerald-200 hover:border-emerald-400'
      }`}
    >
      {/* Top Banner & Status Header */}
      <div className={`px-4 py-2.5 flex items-center justify-between border-b ${
        isBooking
          ? 'bg-blue-50/80 border-blue-100'
          : isInProgress
          ? 'bg-amber-50/80 border-amber-100'
          : 'bg-emerald-50/80 border-emerald-100'
      }`}>
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          {isBooking && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs">
              <Calendar className="w-3 h-3" />
              入庫予定（予約）
            </span>
          )}
          {isInProgress && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-600 text-white shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              現在作業中
            </span>
          )}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 className="w-3 h-3" />
              納車完了
            </span>
          )}

          {/* Job ID */}
          <span className="text-[11px] font-mono font-medium text-slate-500">
            {job.id}
          </span>
        </div>

        {/* Billing Type Badge */}
        <div>
          {job.billingType === 'insurance' ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              保険修理
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              自費修理
            </span>
          )}
        </div>
      </div>

      {/* Main Vehicle & Customer Info */}
      <div className="p-4 space-y-3 cursor-pointer" onClick={() => onOpenDetail(job)}>
        
        {/* Plate & Vehicle Model */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-mono flex items-center gap-2">
                <span>{job.plateNumber || 'ナンバー未登録'}</span>
              </div>
              <div className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5">
                <Car className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{job.vehicleModel || '車種未入力'}</span>
                {job.color && (
                  <span className="text-xs text-slate-400 font-normal">({job.color})</span>
                )}
              </div>
            </div>

            {/* Customer Name */}
            <div className="text-right shrink-0">
              <div className="text-xs text-slate-400 font-medium">ご依頼主</div>
              <div className="text-sm font-bold text-slate-900 flex items-center justify-end gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{job.customerName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Insurance Details info if insurance */}
        {job.billingType === 'insurance' && job.insuranceDetails && (
          <div className="px-2.5 py-1.5 rounded-lg bg-purple-50 border border-purple-100 text-xs text-purple-900 line-clamp-1">
            <span className="font-semibold">損保: </span>
            {job.insuranceDetails}
          </div>
        )}

        {/* Summary Note Preview */}
        {job.summaryNotes && (
          <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
            {job.summaryNotes}
          </p>
        )}

        {/* 12-Step Process Pipeline Indicator */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-500">
              工程進捗: <span className="text-blue-600 font-bold">{job.currentStepId}/12</span>
            </span>
            <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100">
              {currentStep.name}
            </span>
          </div>

          {/* Step Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
            <div 
              className={`h-full transition-all duration-300 ${
                isCompleted 
                  ? 'bg-emerald-500' 
                  : isBooking 
                  ? 'bg-blue-500' 
                  : 'bg-gradient-to-r from-blue-500 via-amber-500 to-indigo-600'
              }`}
              style={{ width: `${Math.max(8, progressPercent)}%` }}
            />
          </div>
        </div>

        {/* Inspection & Schedule Footnotes */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          
          {/* Inspection Summary Badge */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-100">
            {abnormalCount > 0 ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="text-rose-700 font-semibold truncate">
                  異常・傷 {abnormalCount}件
                </span>
              </>
            ) : inspectedCount >= 11 ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-emerald-700 font-semibold truncate">
                  点検完了 (12/12)
                </span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-600 truncate">
                  点検 {inspectedCount}/12 完了
                </span>
              </>
            )}
          </div>

          {/* Assigned Staff */}
          <div className="flex items-center justify-end gap-1.5 p-1.5 text-slate-500 text-right">
            <span className="text-[11px] text-slate-400">担当:</span>
            <span className="font-medium text-slate-700 truncate">{job.assignedStaff}</span>
          </div>

        </div>

        {/* Schedule Timestamps */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>入庫: {formatDateTime(job.actualEntryAt || job.scheduledEntryAt)}</span>
          </div>
          <div className="flex items-center gap-1 font-medium text-slate-700">
            <span>納車予定: {formatDateOnly(job.scheduledDeliveryDate)}</span>
          </div>
        </div>

      </div>

      {/* Bottom Action Footer */}
      <div className="px-4 py-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2">
        
        {/* If Booking: Big "実車入庫" Button */}
        {isBooking ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRecordEntry(job);
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition active:scale-98"
          >
            <PlayCircle className="w-4 h-4" />
            <span>🚗 実車入庫（受付・作業中へ）</span>
          </button>
        ) : isInProgress && nextStep ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdvanceStep(job);
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition active:scale-98"
          >
            <span>次工程へ: {nextStep.shortName}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex-1 text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>全工程完了・納車済</span>
          </div>
        )}

        {/* Open Details Button */}
        <button
          type="button"
          onClick={() => onOpenDetail(job)}
          className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1 transition shadow-2xs"
        >
          <span>詳細・点検</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

      </div>

    </div>
  );
};
