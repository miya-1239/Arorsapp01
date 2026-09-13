import React from 'react';
import { 
  Car, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight,
  PlayCircle
} from 'lucide-react';
import { VehicleJob, PROCESS_STEPS, getChecklistRecords } from '../types';

interface JobTableViewProps {
  jobs: VehicleJob[];
  onOpenDetail: (job: VehicleJob) => void;
  onRecordEntry: (job: VehicleJob) => void;
}

export const JobTableView: React.FC<JobTableViewProps> = ({
  jobs,
  onOpenDetail,
  onRecordEntry,
}) => {
  const formatDateTime = (dtStr?: string | null) => {
    if (!dtStr) return '-';
    try {
      const d = new Date(dtStr);
      return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return dtStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/90 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">ステータス / ナンバー</th>
              <th className="py-3 px-4">車種・顧客名</th>
              <th className="py-3 px-4">工程進捗 (12段階)</th>
              <th className="py-3 px-4">請求区分</th>
              <th className="py-3 px-4">車両点検</th>
              <th className="py-3 px-4">入庫 / 納車予定</th>
              <th className="py-3 px-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs.map(job => {
              const currentStep = PROCESS_STEPS.find(s => s.id === job.currentStepId) || PROCESS_STEPS[0];
              const checklistValues = getChecklistRecords(job.checklist);
              const abnormalCount = checklistValues.filter(i => i.status === 'abnormal').length;

              return (
                <tr 
                  key={job.id} 
                  className="hover:bg-slate-50/80 transition cursor-pointer"
                  onClick={() => onOpenDetail(job)}
                >
                  {/* Status & Plate */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {job.status === 'booking' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                          予約
                        </span>
                      ) : job.status === 'in_progress' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          作業中
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          納車済
                        </span>
                      )}
                      <span className="font-mono font-bold text-slate-900 text-base">
                        {job.plateNumber || '未登録'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {job.id}
                    </div>
                  </td>

                  {/* Vehicle & Customer */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{job.vehicleModel}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {job.customerName}
                    </div>
                  </td>

                  {/* Step Progress */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-slate-100 font-bold text-xs text-slate-800">
                        {job.currentStepId}. {currentStep.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({Math.round((job.currentStepId / 12) * 100)}%)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      担当: {job.assignedStaff}
                    </div>
                  </td>

                  {/* Billing */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {job.billingType === 'insurance' ? (
                      <div>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800">
                          保険
                        </span>
                        {job.insuranceDetails && (
                          <div className="text-[11px] text-purple-700 truncate max-w-[140px] mt-0.5">
                            {job.insuranceDetails}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                        自費
                      </span>
                    )}
                  </td>

                  {/* Inspection */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {abnormalCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        異常 {abnormalCount}件
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        正常確認済
                      </span>
                    )}
                  </td>

                  {/* Dates */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                    <div>入庫: {formatDateTime(job.actualEntryAt || job.scheduledEntryAt)}</div>
                    <div className="text-slate-500 font-medium">納車: {job.scheduledDeliveryDate}</div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {job.status === 'booking' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRecordEntry(job);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          実車入庫
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenDetail(job)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1"
                      >
                        詳細
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
