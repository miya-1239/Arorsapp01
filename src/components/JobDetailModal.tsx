import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Car, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft,
  Printer, 
  Trash2, 
  Save, 
  RotateCcw,
  Sparkles,
  Layers,
  Wrench,
  Check,
  FileSpreadsheet,
  PlusCircle,
  HelpCircle,
  Disc,
  SunMedium,
  Maximize2,
  Radio,
  Maximize,
  Wind,
  Compass,
  PlayCircle
} from 'lucide-react';
import { 
  VehicleJob, 
  PROCESS_STEPS, 
  INSPECTION_ITEMS, 
  InspectionState, 
  BillingType, 
  Staff, 
  DEFAULT_STAFF,
  getChecklistRecords
} from '../types';

interface JobDetailModalProps {
  job: VehicleJob | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedJob: VehicleJob) => Promise<void>;
  onRecordEntry: (jobId: string) => Promise<void>;
  onDelete: (jobId: string) => Promise<void>;
  onPrint: (job: VehicleJob) => void;
  activeStaff: Staff;
  staffList?: Staff[];
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  onSave,
  onRecordEntry,
  onDelete,
  onPrint,
  activeStaff,
  staffList,
}) => {
  if (!isOpen || !job) return null;

  const currentStaffList = staffList && staffList.length > 0 ? staffList : DEFAULT_STAFF;

  // Local form state
  const [formData, setFormData] = useState<VehicleJob>({ ...job });
  const [activeTab, setActiveTab] = useState<'process' | 'checklist' | 'info' | 'logs'>('process');
  const [isSaving, setIsSaving] = useState(false);
  const [quickAbnormalItem, setQuickAbnormalItem] = useState<string | null>(null);

  useEffect(() => {
    if (job) {
      setFormData({ ...job });
    }
  }, [job]);

  const currentStep = PROCESS_STEPS.find(s => s.id === formData.currentStepId) || PROCESS_STEPS[0];

  // Helper for quick inspection tags
  const QUICK_TAGS = ['擦り傷あり', '凹みあり', '割れ・ヒビ', '作動不良', '異音・異臭', '要交換部品あり', 'お客様事前了承済'];

  // Handle step click
  const handleSelectStep = (stepId: number) => {
    const stepDef = PROCESS_STEPS.find(s => s.id === stepId);
    let newStatus = formData.status;
    if (stepId === 1) newStatus = 'booking';
    else if (stepId === 12) newStatus = 'completed';
    else newStatus = 'in_progress';

    setFormData(prev => ({
      ...prev,
      currentStepId: stepId,
      status: newStatus,
      actualEntryAt: (stepId > 1 && !prev.actualEntryAt) ? new Date().toISOString().slice(0, 16) : prev.actualEntryAt,
      actualDeliveryAt: stepId === 12 ? new Date().toISOString().slice(0, 16) : prev.actualDeliveryAt,
    }));
  };

  // Quick "Mark All Normal"
  const handleMarkAllNormal = () => {
    const updatedChecklist = { ...formData.checklist };
    const nowStr = new Date().toISOString().slice(0, 16);
    INSPECTION_ITEMS.forEach(item => {
      // Keep existing abnormal notes unless user explicitly overrides, or set normal
      if (updatedChecklist[item.id]?.status !== 'abnormal') {
        updatedChecklist[item.id] = {
          itemId: item.id,
          status: 'normal',
          note: updatedChecklist[item.id]?.note || '',
          inspectedBy: activeStaff.name,
          inspectedAt: nowStr,
        };
      }
    });
    setFormData(prev => ({ ...prev, checklist: updatedChecklist }));
  };

  // Toggle single checklist state
  const handleSetInspectionStatus = (itemId: string, status: InspectionState) => {
    const nowStr = new Date().toISOString().slice(0, 16);
    const existing = formData.checklist[itemId] || { itemId, status: 'uninspected', note: '' };
    
    setFormData(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [itemId]: {
          ...existing,
          status,
          inspectedBy: activeStaff.name,
          inspectedAt: nowStr,
        }
      }
    }));

    if (status === 'abnormal') {
      setQuickAbnormalItem(itemId);
    }
  };

  // Update inspection note
  const handleInspectionNoteChange = (itemId: string, note: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [itemId]: {
          ...(prev.checklist[itemId] || { itemId, status: 'abnormal', note: '' }),
          note,
        }
      }
    }));
  };

  // Append quick tag to note
  const handleAddQuickTag = (itemId: string, tag: string) => {
    const currentNote = formData.checklist[itemId]?.note || '';
    const newNote = currentNote ? `${currentNote}、${tag}` : tag;
    handleInspectionNoteChange(itemId, newNote);
  };

  // Handle Save
  const handleSubmitSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // Check stats
  const checklistValues = getChecklistRecords(formData.checklist);
  const normalCount = checklistValues.filter(i => i.status === 'normal').length;
  const abnormalCount = checklistValues.filter(i => i.status === 'abnormal').length;
  const uninspectedCount = 12 - (normalCount + abnormalCount);

  // Helper for item icons
  const renderItemIcon = (id: string) => {
    switch (id) {
      case 'exterior_scratch': return <ShieldAlert className="w-5 h-5" />;
      case 'glass': return <Layers className="w-5 h-5" />;
      case 'tires_wheels': return <Disc className="w-5 h-5" />;
      case 'lights': return <SunMedium className="w-5 h-5" />;
      case 'mirrors': return <Maximize2 className="w-5 h-5" />;
      case 'sensors': return <Radio className="w-5 h-5" />;
      case 'power_windows': return <Maximize className="w-5 h-5" />;
      case 'air_conditioner': return <Wind className="w-5 h-5" />;
      case 'navigation': return <Compass className="w-5 h-5" />;
      case 'warning_lights': return <AlertTriangle className="w-5 h-5" />;
      case 'interior': return <Sparkles className="w-5 h-5" />;
      case 'delivery_check': return <CheckCircle2 className="w-5 h-5" />;
      default: return <Wrench className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-mono text-white">
                  {formData.plateNumber || 'ナンバー未設定'}
                </h2>
                <span className="text-xs text-slate-300 font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {formData.vehicleModel || '車種未設定'}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {formData.id}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>ご依頼: <b className="text-slate-200">{formData.customerName} 様</b></span>
                {formData.customerPhone && (
                  <span className="hidden sm:inline text-slate-400">({formData.customerPhone})</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPrint(formData)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-semibold flex items-center gap-1.5"
              title="作業指示書・点検票を印刷"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">指示書印刷</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Switcher Bar & One-Tap Arrival */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs">
            <button
              type="button"
              onClick={() => {
                setFormData(p => ({ ...p, status: 'booking', currentStepId: 1 }));
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                formData.status === 'booking'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              入庫予定（予約）
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData(p => ({ 
                  ...p, 
                  status: 'in_progress', 
                  currentStepId: Math.max(2, p.currentStepId),
                  actualEntryAt: p.actualEntryAt || new Date().toISOString().slice(0, 16)
                }));
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                formData.status === 'in_progress'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              現在作業中（入庫中）
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData(p => ({ 
                  ...p, 
                  status: 'completed', 
                  currentStepId: 12,
                  actualDeliveryAt: p.actualDeliveryAt || new Date().toISOString().slice(0, 16)
                }));
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                formData.status === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              納車完了
            </button>
          </div>

          {/* If Booking: Quick "実車入庫確認" Action */}
          {formData.status === 'booking' && (
            <button
              type="button"
              onClick={async () => {
                await onRecordEntry(formData.id);
                setFormData(p => ({
                  ...p,
                  status: 'in_progress',
                  currentStepId: 2,
                  actualEntryAt: new Date().toISOString().slice(0, 16),
                }));
              }}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition active:scale-95"
            >
              <PlayCircle className="w-4 h-4" />
              <span>🚗 実車入庫を記録（作業中へ）</span>
            </button>
          )}

          {/* Current Step Highlight */}
          <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <span className="text-slate-400">現在工程:</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-blue-700">
              {formData.currentStepId}. {currentStep.name}
            </span>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center gap-1 sm:gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('process')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'process'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>12段階 工程進捗</span>
            <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-blue-100 text-blue-800 font-mono">
              {formData.currentStepId}/12
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'checklist'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>12項目 車両点検</span>
            {abnormalCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-rose-100 text-rose-800 font-mono font-bold">
                異常 {abnormalCount}
              </span>
            ) : normalCount === 12 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-emerald-100 text-emerald-800 font-mono">
                完了
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-slate-100 text-slate-700 font-mono">
                {normalCount}/12
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>車両・顧客・請求詳細</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>作業履歴・ログ</span>
            <span className="text-[11px] text-slate-400 font-mono">
              ({formData.logs?.length || 0})
            </span>
          </button>
        </div>

        {/* Modal Scrollable Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* TAB 1: 12-STEP PROCESS PIPELINE */}
          {activeTab === 'process' && (
            <div className="space-y-5">
              
              {/* Process Header & Fast Advance */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400 font-semibold">現在の工程ステータス</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                      {formData.currentStepId}
                    </span>
                    <span>{currentStep.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {currentStep.description}
                  </p>
                </div>

                {/* Step Jump Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={formData.currentStepId <= 1}
                    onClick={() => handleSelectStep(formData.currentStepId - 1)}
                    className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    前の工程
                  </button>
                  <button
                    type="button"
                    disabled={formData.currentStepId >= 12}
                    onClick={() => handleSelectStep(formData.currentStepId + 1)}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <span>次工程へ進める</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 12-Step Grid / Interactive Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  12段階の工程一覧（タップして切り替え）
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {PROCESS_STEPS.map((step) => {
                    const isCurrent = step.id === formData.currentStepId;
                    const isPast = step.id < formData.currentStepId;
                    const isFuture = step.id > formData.currentStepId;

                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => handleSelectStep(step.id)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between min-h-[82px] active:scale-98 ${
                          isCurrent
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 ring-2 ring-blue-400'
                            : isPast
                            ? 'bg-emerald-50/70 border-emerald-200 text-slate-800 hover:border-emerald-300'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-xs font-mono font-bold px-1.5 py-0.2 rounded ${
                            isCurrent ? 'bg-white/20 text-white' : isPast ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {step.id}
                          </span>
                          {isPast && (
                            <Check className="w-4 h-4 text-emerald-600" />
                          )}
                          {isCurrent && (
                            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                          )}
                        </div>

                        <div>
                          <div className={`font-bold text-sm leading-tight ${isCurrent ? 'text-white' : 'text-slate-900'}`}>
                            {step.name}
                          </div>
                          <div className={`text-[10px] mt-0.5 truncate ${isCurrent ? 'text-blue-100' : 'text-slate-400'}`}>
                            {step.category === 'booking' ? '予約受付' : step.category === 'prep' ? '準備・分解' : step.category === 'body' ? '板金・成形' : step.category === 'paint' ? '塗装ブース' : step.category === 'finish' ? '組付・仕上' : 'お引き渡し'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Progress Summary Box */}
              <div className="p-4 bg-slate-100/80 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-slate-500" />
                  <span>
                    現在担当: <b>{formData.assignedStaff}</b>
                  </span>
                </div>
                <div className="text-slate-500 font-mono">
                  実車入庫: {formData.actualEntryAt ? formData.actualEntryAt.replace('T', ' ') : '未入庫（予約）'} / 納車予定: {formData.scheduledDeliveryDate}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: 12-ITEM VEHICLE INSPECTION CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              
              {/* Checklist Control Header */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    車両入庫点検チェックシート (12項目)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    外装傷や電装品等の既存不良を記録し、お客様とのトラブルを未然に防ぎます。
                  </p>
                </div>

                {/* Mark all normal button */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleMarkAllNormal}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>すべて正常にする（一括）</span>
                  </button>
                </div>
              </div>

              {/* Progress status pills */}
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  正常: {normalCount}件
                </span>
                <span className={`px-2.5 py-1 rounded-full ${abnormalCount > 0 ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-slate-100 text-slate-600'}`}>
                  異常あり: {abnormalCount}件
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  未点検: {uninspectedCount}件
                </span>
              </div>

              {/* 12 Checklist Items */}
              <div className="space-y-2.5">
                {INSPECTION_ITEMS.map((item, index) => {
                  const record = formData.checklist[item.id] || { itemId: item.id, status: 'uninspected', note: '' };
                  const isNormal = record.status === 'normal';
                  const isAbnormal = record.status === 'abnormal';
                  const isUninspected = record.status === 'uninspected';

                  return (
                    <div 
                      key={item.id}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                        isAbnormal
                          ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-400/20'
                          : isNormal
                          ? 'bg-white border-emerald-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        
                        {/* Item Info */}
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isAbnormal 
                              ? 'bg-rose-100 text-rose-700' 
                              : isNormal 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {renderItemIcon(item.id)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-400">
                                #{index + 1}
                              </span>
                              <span className="font-bold text-sm sm:text-base text-slate-900">
                                {item.name}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Large Touch Toggle Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          
                          {/* 正常 Button */}
                          <button
                            type="button"
                            onClick={() => handleSetInspectionStatus(item.id, 'normal')}
                            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95 ${
                              isNormal
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>○ 正常</span>
                          </button>

                          {/* 異常あり Button */}
                          <button
                            type="button"
                            onClick={() => handleSetInspectionStatus(item.id, 'abnormal')}
                            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95 ${
                              isAbnormal
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                            <span>× 異常あり</span>
                          </button>

                        </div>

                      </div>

                      {/* Expand Note Field (Always visible if abnormal, or collapsible) */}
                      {(isAbnormal || record.note) && (
                        <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2 animate-in fade-in duration-100">
                          
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-rose-800 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>詳細メモ・不良箇所（傷の位置や程度など）:</span>
                            </label>
                            {record.inspectedBy && (
                              <span className="text-[11px] text-slate-400">
                                記録: {record.inspectedBy} ({record.inspectedAt?.slice(5, 16) || ''})
                              </span>
                            )}
                          </div>

                          <textarea
                            rows={2}
                            value={record.note || ''}
                            onChange={(e) => handleInspectionNoteChange(item.id, e.target.value)}
                            placeholder="例: 右バンパー角に擦り傷5cm、タッチアップ跡あり。"
                            className="w-full p-2.5 rounded-lg bg-white border border-rose-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-xs sm:text-sm text-slate-800 outline-none"
                          />

                          {/* Quick Tag Pills */}
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-semibold">定型入力:</span>
                            {QUICK_TAGS.map(tag => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleAddQuickTag(item.id, tag)}
                                className="px-2 py-0.5 rounded bg-white hover:bg-rose-100 border border-slate-200 text-[11px] text-slate-700 font-medium transition"
                              >
                                + {tag}
                              </button>
                            ))}
                          </div>

                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 3: VEHICLE & CUSTOMER & BILLING DETAILS */}
          {activeTab === 'info' && (
            <div className="space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Plate Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    車両ナンバー (必須)
                  </label>
                  <input
                    type="text"
                    value={formData.plateNumber}
                    onChange={(e) => setFormData(p => ({ ...p, plateNumber: e.target.value }))}
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
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData(p => ({ ...p, vehicleModel: e.target.value }))}
                    placeholder="例: トヨタ プリウス (ZVW51)"
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
                    value={formData.customerName}
                    onChange={(e) => setFormData(p => ({ ...p, customerName: e.target.value }))}
                    placeholder="例: 山田 太郎 様"
                    className="w-full px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none"
                  />
                </div>

                {/* Customer Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    連絡先電話番号
                  </label>
                  <input
                    type="tel"
                    value={formData.customerPhone || ''}
                    onChange={(e) => setFormData(p => ({ ...p, customerPhone: e.target.value }))}
                    placeholder="例: 090-1234-5678"
                    className="w-full px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    車体カラー・カラー番号
                  </label>
                  <input
                    type="text"
                    value={formData.color || ''}
                    onChange={(e) => setFormData(p => ({ ...p, color: e.target.value }))}
                    placeholder="例: パールホワイト (070)"
                    className="w-full px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none"
                  />
                </div>

                {/* Mileage */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    走行距離
                  </label>
                  <input
                    type="text"
                    value={formData.mileage || ''}
                    onChange={(e) => setFormData(p => ({ ...p, mileage: e.target.value }))}
                    placeholder="例: 35,000 km"
                    className="w-full px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none"
                  />
                </div>

                {/* Scheduled Entry Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    入庫予定日時 (予約日時)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledEntryAt}
                    onChange={(e) => setFormData(p => ({ ...p, scheduledEntryAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none"
                  />
                </div>

                {/* Scheduled Delivery Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    納車予定日
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDeliveryDate}
                    onChange={(e) => setFormData(p => ({ ...p, scheduledDeliveryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none"
                  />
                </div>

                {/* Actual Entry Timestamp */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    実車入庫日時 (実際に工場に入った日時)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.actualEntryAt || ''}
                    onChange={(e) => setFormData(p => ({ ...p, actualEntryAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none"
                  />
                </div>

                {/* Assigned Staff */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    主担当スタッフ
                  </label>
                  <select
                    value={formData.assignedStaff}
                    onChange={(e) => setFormData(p => ({ ...p, assignedStaff: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none bg-white"
                  >
                    {currentStaffList.map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Billing Section (自費 vs 保険) */}
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  請求区分 (Select)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, billingType: 'self' }))}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                      formData.billingType === 'self'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold">自費修理</div>
                      <div className="text-xs text-slate-500">お客様直接お支払い</div>
                    </div>
                    {formData.billingType === 'self' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, billingType: 'insurance' }))}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                      formData.billingType === 'insurance'
                        ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 text-purple-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold">保険修理</div>
                      <div className="text-xs text-slate-500">任意保険・対物・車両保険等</div>
                    </div>
                    {formData.billingType === 'insurance' && <CheckCircle2 className="w-5 h-5 text-purple-600" />}
                  </button>
                </div>

                {/* Insurance Details Field (Only if Insurance) */}
                {formData.billingType === 'insurance' && (
                  <div className="mt-3 p-3 bg-purple-50/70 rounded-xl border border-purple-200 space-y-1.5 animate-in fade-in duration-150">
                    <label className="block text-xs font-bold text-purple-900">
                      保険詳細 (損保会社名・協定状況・担当者など)
                    </label>
                    <input
                      type="text"
                      value={formData.insuranceDetails || ''}
                      onChange={(e) => setFormData(p => ({ ...p, insuranceDetails: e.target.value }))}
                      placeholder="例: 東京海上日動 (過失 100:0) 担当: 佐藤様 / アジャスター協定済"
                      className="w-full px-3 py-2 bg-white border border-purple-300 focus:border-purple-600 rounded-lg text-xs sm:text-sm text-slate-900 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Summary Notes & Scope */}
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  総合メモ・不良箇所概要 (Text)
                </label>
                <textarea
                  rows={3}
                  value={formData.summaryNotes}
                  onChange={(e) => setFormData(p => ({ ...p, summaryNotes: e.target.value }))}
                  placeholder="損傷状況やお客様からのご要望、特記事項をご記入ください..."
                  className="w-full p-3 border border-slate-300 focus:border-blue-500 rounded-lg text-xs sm:text-sm text-slate-800 outline-none"
                />
              </div>

              {/* Parts & Procurement Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  部品発注・納期メモ
                </label>
                <input
                  type="text"
                  value={formData.partsNotes || ''}
                  onChange={(e) => setFormData(p => ({ ...p, partsNotes: e.target.value }))}
                  placeholder="例: フロントバンパー新品入荷済み、クリップ類手配中"
                  className="w-full px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg text-xs sm:text-sm text-slate-800 outline-none"
                />
              </div>

            </div>
          )}

          {/* TAB 4: ACTIVITY LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-500 flex items-center justify-between">
                <span>更新・工程変更履歴タイムライン</span>
                <span>全 {formData.logs?.length || 0} 件</span>
              </div>

              <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                {formData.logs && formData.logs.length > 0 ? (
                  formData.logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 border-b border-slate-100 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {log.staffName ? log.staffName[0] : '工'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{log.action}</span>
                          <span className="text-slate-400 font-mono">{log.timestamp}</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          担当: <span className="font-medium text-slate-800">{log.staffName}</span>
                          {log.details && (
                            <span className="text-slate-500 ml-2">({log.details})</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 text-center py-6">
                    履歴ログはありません
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 sm:px-6 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          
          {/* Delete Button */}
          <button
            type="button"
            onClick={async () => {
              if (window.confirm(`「${formData.plateNumber}」の入庫データを削除しますか？`)) {
                await onDelete(formData.id);
                onClose();
              }
            }}
            className="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">データを削除</span>
          </button>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition"
            >
              閉じる
            </button>
            <button
              type="button"
              id="btn-save-job"
              onClick={handleSubmitSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? '保存中...' : '変更を保存する'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
