import React from 'react';
import { X, Printer, Car, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { VehicleJob, PROCESS_STEPS, INSPECTION_ITEMS } from '../types';

interface PrintWorkOrderModalProps {
  job: VehicleJob | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintWorkOrderModal: React.FC<PrintWorkOrderModalProps> = ({
  job,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !job) return null;

  const currentStep = PROCESS_STEPS.find(s => s.id === job.currentStepId) || PROCESS_STEPS[0];

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Bar (Hidden in Print) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-base">作業指示書・車両点検シート（印刷プレビュー）</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Printer className="w-4 h-4" />
              印刷する (Print)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white text-slate-900 font-sans text-xs sm:text-sm">
          
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
            <div>
              <div className="text-xl font-black tracking-wider text-slate-900">
                AutoCraft 自動車整備・板金作業指示書
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                車両入庫点検および工程管理票
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-base font-bold text-slate-900">{job.id}</div>
              <div className="text-xs text-slate-500">発行: {new Date().toLocaleDateString('ja-JP')}</div>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-300">
            <div>
              <div className="text-[10px] text-slate-500 font-semibold">ナンバープレート</div>
              <div className="text-lg font-black font-mono text-slate-900">{job.plateNumber}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold">車種・型式</div>
              <div className="text-sm font-bold text-slate-800">{job.vehicleModel}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold">ご依頼主 (顧客名)</div>
              <div className="text-sm font-bold text-slate-800">{job.customerName} 様</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold">請求区分</div>
              <div className="text-sm font-bold text-slate-800">
                {job.billingType === 'insurance' ? `保険 (${job.insuranceDetails || '協定'})` : '自費修理'}
              </div>
            </div>
          </div>

          {/* Dates and Staff */}
          <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-3">
            <div>
              <span className="text-slate-500 text-xs">入庫日時: </span>
              <span className="font-bold font-mono">
                {job.actualEntryAt ? job.actualEntryAt.replace('T', ' ') : `${job.scheduledEntryAt.replace('T', ' ')} (予定)`}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-xs">納車予定日: </span>
              <span className="font-bold font-mono text-rose-600">{job.scheduledDeliveryDate}</span>
            </div>
            <div>
              <span className="text-slate-500 text-xs">主担当: </span>
              <span className="font-bold">{job.assignedStaff}</span>
            </div>
          </div>

          {/* Summary Scope */}
          {job.summaryNotes && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs font-bold text-slate-700 mb-1">【総合メモ・修理箇所概要】</div>
              <p className="text-xs text-slate-800 whitespace-pre-wrap">{job.summaryNotes}</p>
            </div>
          )}

          {/* 12-Item Inspection Checklist Table */}
          <div>
            <div className="text-sm font-bold text-slate-900 mb-2 flex items-center justify-between">
              <span>【車両入庫時 12項目点検チェック結果】</span>
              <span className="text-xs font-normal text-slate-500">点検員: {job.assignedStaff}</span>
            </div>

            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                  <tr>
                    <th className="py-2 px-3 w-10 text-center">No</th>
                    <th className="py-2 px-3 w-36">点検部位</th>
                    <th className="py-2 px-3 w-24 text-center">状態</th>
                    <th className="py-2 px-3">詳細メモ・既存キズ等の記録</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {INSPECTION_ITEMS.map((item, idx) => {
                    const rec = job.checklist[item.id] || { itemId: item.id, status: 'uninspected', note: '' };
                    return (
                      <tr key={item.id} className={rec.status === 'abnormal' ? 'bg-rose-50/70 font-semibold' : ''}>
                        <td className="py-1.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-medium text-slate-800">{item.name}</td>
                        <td className="py-1.5 px-3 text-center">
                          {rec.status === 'normal' ? (
                            <span className="text-emerald-700 font-bold">○ 正常</span>
                          ) : rec.status === 'abnormal' ? (
                            <span className="text-rose-600 font-bold">× 異常</span>
                          ) : (
                            <span className="text-slate-400">未点検</span>
                          )}
                        </td>
                        <td className="py-1.5 px-3 text-slate-700">
                          {rec.note || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 12-Step Progress Grid for Sign-off */}
          <div>
            <div className="text-sm font-bold text-slate-900 mb-2">【12工程 作業サイン・完了印欄】</div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 border border-slate-300 p-2 rounded-lg bg-slate-50">
              {PROCESS_STEPS.map((step) => {
                const isPassed = step.id <= job.currentStepId;
                return (
                  <div key={step.id} className="p-1.5 bg-white border border-slate-200 rounded text-center">
                    <div className="text-[10px] text-slate-400 font-mono">#{step.id}</div>
                    <div className="text-xs font-bold text-slate-800 truncate">{step.name}</div>
                    <div className="h-6 mt-1 flex items-center justify-center text-[10px] text-slate-400 border-t border-dashed border-slate-200">
                      {isPassed ? (step.id === job.currentStepId ? '作業中' : '完了済') : '未着手'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Signoff stamps */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-300 text-xs">
            <div className="border border-slate-300 p-3 rounded h-20 flex flex-col justify-between">
              <span className="text-slate-500">工場長 検印</span>
              <span className="text-slate-300 text-center">印</span>
            </div>
            <div className="border border-slate-300 p-3 rounded h-20 flex flex-col justify-between">
              <span className="text-slate-500">主担当 整備士印</span>
              <span className="text-slate-300 text-center">印</span>
            </div>
            <div className="border border-slate-300 p-3 rounded h-20 flex flex-col justify-between">
              <span className="text-slate-500">お客様 納車受領サイン</span>
              <span className="text-slate-300 text-center">署名</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
