import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Car, 
  User, 
  Phone, 
  Clock, 
  ShieldAlert, 
  Save, 
  Plus,
  CheckCircle2,
  Wrench
} from 'lucide-react';
import { VehicleJob, BillingType, Staff, DEFAULT_STAFF } from '../types';
import { createDefaultChecklist } from '../data/seedData';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (jobData: Partial<VehicleJob>) => Promise<void>;
  activeStaff: Staff;
  staffList?: Staff[];
}

export const NewJobModal: React.FC<NewJobModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  activeStaff,
  staffList,
}) => {
  if (!isOpen) return null;

  const currentStaffList = staffList && staffList.length > 0 ? staffList : DEFAULT_STAFF;

  // Tomorrow morning 10:00 default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().slice(0, 10);
  const tomorrowDateTimeStr = `${tomorrowDateStr}T10:00`;

  // Delivery in 5 days
  const delivery = new Date();
  delivery.setDate(delivery.getDate() + 5);
  const deliveryDateStr = delivery.toISOString().slice(0, 10);

  const [status, setStatus] = useState<'booking' | 'in_progress'>('booking');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [scheduledEntryAt, setScheduledEntryAt] = useState(tomorrowDateTimeStr);
  const [scheduledDeliveryDate, setScheduledDeliveryDate] = useState(deliveryDateStr);
  const [billingType, setBillingType] = useState<BillingType>('self');
  const [insuranceDetails, setInsuranceDetails] = useState('');
  const [summaryNotes, setSummaryNotes] = useState('');
  const [assignedStaff, setAssignedStaff] = useState(activeStaff.name);
  const [color, setColor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick helper to fill demo values
  const handleQuickFill = (preset: 'insurance' | 'scratch') => {
    if (preset === 'insurance') {
      setPlateNumber('品川 300 さ 45-67');
      setVehicleModel('トヨタ アルファード (30系)');
      setCustomerName('田中 健太 様');
      setCustomerPhone('090-8765-4321');
      setBillingType('insurance');
      setInsuranceDetails('東京海上日動（過失 0:100 相手方追突） 担当: 山下様');
      setSummaryNotes('リアバンパーおよびバックドア接触破損。アジャスター確認後着工。');
    } else {
      setPlateNumber('横浜 500 つ 12-89');
      setVehicleModel('ホンダ フィット (GR3)');
      setCustomerName('佐藤 直子 様');
      setCustomerPhone('080-1122-3344');
      setBillingType('self');
      setSummaryNotes('左フロントバンパー擦り傷補修。クイック塗装希望。');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim()) {
      alert('ナンバープレートを入力してください');
      return;
    }
    if (!customerName.trim()) {
      alert('お客様名を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const isBooking = status === 'booking';
      const nowIso = new Date().toISOString().slice(0, 16);

      await onCreate({
        status,
        currentStepId: isBooking ? 1 : 2,
        plateNumber,
        vehicleModel,
        customerName,
        customerPhone,
        color,
        scheduledEntryAt,
        actualEntryAt: !isBooking ? nowIso : null,
        scheduledDeliveryDate,
        billingType,
        insuranceDetails: billingType === 'insurance' ? insuranceDetails : '',
        summaryNotes,
        assignedStaff,
        checklist: createDefaultChecklist(),
      });

      onClose();
    } catch (err) {
      console.error(err);
      alert('登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">新規車両 入庫予約・登録</h2>
              <p className="text-xs text-slate-400">入庫予定の予約または工場実車入庫を登録します</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
          
          {/* Quick presets for rapid demo testing */}
          <div className="flex items-center justify-between bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 text-xs">
            <span className="font-semibold text-blue-900">かんたん入力サンプル:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('insurance')}
                className="px-2 py-1 rounded bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium transition"
              >
                保険事故（アルファード）
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('scratch')}
                className="px-2 py-1 rounded bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium transition"
              >
                自費小傷（フィット）
              </button>
            </div>
          </div>

          {/* Status Selection (予約 vs 実車入庫) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              登録ステータス区分 (必須)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('booking')}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                  status === 'booking'
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 text-blue-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-sm font-bold flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    入庫予定（予約）
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">後日・来店予定の予約受付</div>
                </div>
                {status === 'booking' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
              </button>

              <button
                type="button"
                onClick={() => setStatus('in_progress')}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                  status === 'in_progress'
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-sm font-bold flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    直接入庫（受付・作業中）
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">今すぐ実車をお預かり</div>
                </div>
                {status === 'in_progress' && <CheckCircle2 className="w-5 h-5 text-amber-600" />}
              </button>
            </div>
          </div>

          {/* Vehicle and Customer Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Plate Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ナンバープレート (必須)
              </label>
              <input
                type="text"
                required
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="例: 品川 300 あ 12-34"
                className="w-full px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg text-sm font-mono font-bold text-slate-900 outline-none"
              />
            </div>

            {/* Vehicle Model */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                車種・型式
              </label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="例: トヨタ プリウス"
                className="w-full px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none"
              />
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                お客様のお名前 (必須)
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="例: 田中 太郎 様"
                className="w-full px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none"
              />
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ご連絡先電話番号
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="例: 090-1234-5678"
                className="w-full px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none"
              />
            </div>

            {/* Scheduled Entry */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                入庫予定日時
              </label>
              <input
                type="datetime-local"
                value={scheduledEntryAt}
                onChange={(e) => setScheduledEntryAt(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none"
              />
            </div>

            {/* Scheduled Delivery */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                納車予定日
              </label>
              <input
                type="date"
                value={scheduledDeliveryDate}
                onChange={(e) => setScheduledDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                車体カラー
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="例: パールホワイト (070)"
                className="w-full px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none"
              />
            </div>

            {/* Staff */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                担当スタッフ
              </label>
              <select
                value={assignedStaff}
                onChange={(e) => setAssignedStaff(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none bg-white"
              >
                {currentStaffList.map(s => (
                  <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>

          </div>

          {/* Billing Type Selection */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              請求区分
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBillingType('self')}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                  billingType === 'self'
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>自費修理</span>
                {billingType === 'self' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </button>

              <button
                type="button"
                onClick={() => setBillingType('insurance')}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                  billingType === 'insurance'
                    ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 text-purple-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>保険修理</span>
                {billingType === 'insurance' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
              </button>
            </div>

            {/* Insurance Details */}
            {billingType === 'insurance' && (
              <div className="mt-2.5 p-3 bg-purple-50/80 rounded-xl border border-purple-200 space-y-1 animate-in fade-in duration-100">
                <label className="block text-xs font-bold text-purple-900">
                  損保会社名・協定情報
                </label>
                <input
                  type="text"
                  value={insuranceDetails}
                  onChange={(e) => setInsuranceDetails(e.target.value)}
                  placeholder="例: 東京海上日動 / 担当者名・事故受付番号等"
                  className="w-full px-3 py-2 bg-white border border-purple-300 focus:border-purple-600 rounded-lg text-xs sm:text-sm text-slate-900 outline-none"
                />
              </div>
            )}
          </div>

          {/* Summary Notes */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              総合メモ・不良箇所概要 (Text)
            </label>
            <textarea
              rows={3}
              value={summaryNotes}
              onChange={(e) => setSummaryNotes(e.target.value)}
              placeholder="ご依頼内容、傷や凹みの部位、代車の有無などをご記入ください..."
              className="w-full p-2.5 border border-slate-300 focus:border-blue-500 rounded-lg text-xs sm:text-sm text-slate-800 outline-none"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition"
            >
              キャンセル
            </button>
            <button
              type="submit"
              id="btn-submit-new-job"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? '登録中...' : '入庫データを登録する'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
