import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  CalendarClock, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Car
} from 'lucide-react';
import { VehicleJob, BillingType, Staff, DEFAULT_STAFF, PROCESS_STEPS, getChecklistRecords } from './types';
import { JobService, StaffService, staffStorage } from './services/api';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { JobFilterBar } from './components/JobFilterBar';
import { JobCard } from './components/JobCard';
import { JobTableView } from './components/JobTableView';
import { JobDetailModal } from './components/JobDetailModal';
import { NewJobModal } from './components/NewJobModal';
import { PrintWorkOrderModal } from './components/PrintWorkOrderModal';
import { StaffManagementModal } from './components/StaffManagementModal';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';

export default function App() {
  const [jobs, setJobs] = useState<VehicleJob[]>([]);
  const [connectedClients, setConnectedClients] = useState<number>(1);
  const [staffList, setStaffList] = useState<Staff[]>(StaffService.getStaff());
  const [activeStaff, setActiveStaff] = useState<Staff>(staffStorage.getActiveStaff(staffList));

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<'all' | 'booking' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [billingFilter, setBillingFilter] = useState<'all' | BillingType>('all');
  const [stepFilter, setStepFilter] = useState<number | 'all'>('all');
  const [onlyAbnormal, setOnlyAbnormal] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modal states
  const [selectedJob, setSelectedJob] = useState<VehicleJob | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [isStaffManagementOpen, setIsStaffManagementOpen] = useState(false);
  const [isSupabaseSyncOpen, setIsSupabaseSyncOpen] = useState(false);
  const [printJob, setPrintJob] = useState<VehicleJob | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Initialize Real-time synchronization
  useEffect(() => {
    JobService.initRealtime((updatedJobs, count) => {
      setJobs(updatedJobs);
      if (count) setConnectedClients(count);
    });

    const unsubscribeJobs = JobService.subscribe((updatedJobs, count) => {
      setJobs(updatedJobs);
      if (count) setConnectedClients(count);
    });

    const unsubscribeStaff = StaffService.subscribe((updatedStaff) => {
      setStaffList(updatedStaff);
      setActiveStaff(prev => {
        const found = updatedStaff.find(s => s.id === prev?.id);
        if (found) return found;
        return updatedStaff[0] || DEFAULT_STAFF[0];
      });
    });

    return () => {
      unsubscribeJobs();
      unsubscribeStaff();
    };
  }, []);

  // Filter logic
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // 1. Tab filter
      if (activeTab === 'booking' && job.status !== 'booking') return false;
      if (activeTab === 'in_progress' && job.status !== 'in_progress') return false;
      if (activeTab === 'completed' && job.status !== 'completed') return false;

      // 2. Billing Filter
      if (billingFilter !== 'all' && job.billingType !== billingFilter) return false;

      // 3. Step Filter
      if (stepFilter !== 'all' && job.currentStepId !== stepFilter) return false;

      // 4. Abnormal checklist filter
      if (onlyAbnormal) {
        const hasAbnormal = getChecklistRecords(job.checklist).some(item => item.status === 'abnormal');
        if (!hasAbnormal) return false;
      }

      // 5. Search Query (plate, model, customer, notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const plate = (job.plateNumber || '').toLowerCase();
        const model = (job.vehicleModel || '').toLowerCase();
        const cust = (job.customerName || '').toLowerCase();
        const notes = (job.summaryNotes || '').toLowerCase();
        const ins = (job.insuranceDetails || '').toLowerCase();
        const id = (job.id || '').toLowerCase();

        return plate.includes(q) || model.includes(q) || cust.includes(q) || notes.includes(q) || ins.includes(q) || id.includes(q);
      }

      return true;
    });
  }, [jobs, activeTab, billingFilter, stepFilter, onlyAbnormal, searchQuery]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: jobs.length,
      booking: jobs.filter(j => j.status === 'booking').length,
      in_progress: jobs.filter(j => j.status === 'in_progress').length,
      completed: jobs.filter(j => j.status === 'completed').length,
    };
  }, [jobs]);

  // Actions
  const handleOpenDetail = (job: VehicleJob) => {
    setSelectedJob(job);
    setIsDetailOpen(true);
  };

  const handleCreateJob = async (jobData: Partial<VehicleJob>) => {
    const created = await JobService.createJob(jobData);
    showToast(`✅ 「${created.plateNumber}」を登録しました`);
  };

  const handleSaveJob = async (updatedJob: VehicleJob) => {
    await JobService.updateJob(
      updatedJob.id,
      updatedJob,
      'データ保存・更新',
      '詳細画面から内容を更新しました'
    );
    showToast(`💾 「${updatedJob.plateNumber}」の情報を保存しました`);
  };

  const handleRecordEntry = async (jobOrId: VehicleJob | string) => {
    const id = typeof jobOrId === 'string' ? jobOrId : jobOrId.id;
    const target = jobs.find(j => j.id === id);
    const updated = await JobService.recordVehicleEntry(id);
    showToast(`🚗 「${target?.plateNumber || id}」の実車入庫を確認・作業中（受付）へ移行しました`);
  };

  const handleAdvanceStep = async (job: VehicleJob) => {
    const nextStepId = job.currentStepId + 1;
    if (nextStepId > 12) return;
    const nextStep = PROCESS_STEPS.find(s => s.id === nextStepId);
    if (!nextStep) return;

    await JobService.updateStep(
      job.id,
      nextStepId,
      nextStep.name,
      `${activeStaff.name} が工程を「${nextStep.name}」に進めました`
    );
    showToast(`▶ 「${job.plateNumber}」工程を【${nextStep.name}】に更新しました`);
  };

  const handleDeleteJob = async (jobId: string) => {
    await JobService.deleteJob(jobId);
    showToast('🗑️ 入庫データを削除しました');
  };

  const handleOpenPrint = (job: VehicleJob) => {
    setPrintJob(job);
    setIsPrintOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navigation Header with Real-time indicator & Staff Switcher */}
      <Header
        connectedClients={connectedClients}
        activeStaff={activeStaff}
        staffList={staffList}
        onStaffChange={setActiveStaff}
        onOpenNewJob={() => setIsNewJobOpen(true)}
        onOpenStaffManagement={() => setIsStaffManagementOpen(true)}
        onOpenSupabaseSync={() => setIsSupabaseSyncOpen(true)}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5">
        
        {/* KPI Summary Dashboard */}
        <DashboardStats
          jobs={jobs}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        {/* Filters, Search & View Controls */}
        <JobFilterBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          billingFilter={billingFilter}
          onBillingFilterChange={setBillingFilter}
          stepFilter={stepFilter}
          onStepFilterChange={setStepFilter}
          onlyAbnormal={onlyAbnormal}
          onToggleOnlyAbnormal={() => setOnlyAbnormal(!onlyAbnormal)}
          counts={counts}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Job Content List / Grid */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Car className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              該当する車両データが見つかりませんでした
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              検索条件を変更するか、右上の「入庫予約・登録」ボタンから新しい車両を登録してください。
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setBillingFilter('all');
                  setStepFilter('all');
                  setOnlyAbnormal(false);
                  setActiveTab('all');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                フィルターを解除
              </button>
              <button
                type="button"
                onClick={() => setIsNewJobOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition"
              >
                ＋ 新規入庫予約を追加
              </button>
            </div>
          </div>
        ) : viewMode === 'cards' ? (
          /* Cards Grid Layout (Mobile-first, 1 col on mobile, 2 col on tablet, 3 col on large desktop) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onOpenDetail={handleOpenDetail}
                onRecordEntry={handleRecordEntry}
                onAdvanceStep={handleAdvanceStep}
              />
            ))}
          </div>
        ) : (
          /* Spreadsheet / Table View for Desktop users */
          <JobTableView
            jobs={filteredJobs}
            onOpenDetail={handleOpenDetail}
            onRecordEntry={handleRecordEntry}
          />
        )}

      </main>

      {/* Floating Action Button on Mobile */}
      <div className="sm:hidden fixed bottom-5 right-5 z-20">
        <button
          type="button"
          onClick={() => setIsNewJobOpen(true)}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-xl shadow-blue-600/40 flex items-center justify-center transition active:scale-95"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-full shadow-2xl border border-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 backdrop-blur-xs">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <JobDetailModal
        job={selectedJob}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedJob(null);
        }}
        onSave={handleSaveJob}
        onRecordEntry={handleRecordEntry}
        onDelete={handleDeleteJob}
        onPrint={handleOpenPrint}
        activeStaff={activeStaff}
        staffList={staffList}
      />

      <NewJobModal
        isOpen={isNewJobOpen}
        onClose={() => setIsNewJobOpen(false)}
        onCreate={handleCreateJob}
        activeStaff={activeStaff}
        staffList={staffList}
      />

      <PrintWorkOrderModal
        job={printJob}
        isOpen={isPrintOpen}
        onClose={() => {
          setIsPrintOpen(false);
          setPrintJob(null);
        }}
      />

      <StaffManagementModal
        isOpen={isStaffManagementOpen}
        onClose={() => setIsStaffManagementOpen(false)}
        staffList={staffList}
        activeStaff={activeStaff}
        onSelectActiveStaff={(staff) => {
          setActiveStaff(staff);
          staffStorage.setActiveStaff(staff);
          showToast(`👤 操作スタッフを「${staff.name}」さんに切り替えました`);
        }}
        onStaffUpdated={() => {
          showToast('👥 従業員データが更新・同期されました');
        }}
      />

      <SupabaseSyncModal
        isOpen={isSupabaseSyncOpen}
        onClose={() => setIsSupabaseSyncOpen(false)}
        totalJobs={jobs.length}
        totalStaff={staffList.length}
        onSyncComplete={(msg) => showToast(`💾 ${msg}`)}
      />

    </div>
  );
}
