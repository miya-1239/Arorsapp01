import React from 'react';
import { 
  Search, 
  Filter, 
  CalendarClock, 
  Wrench, 
  CheckCircle2, 
  Layers, 
  LayoutGrid, 
  List,
  AlertCircle,
  X
} from 'lucide-react';
import { BillingType, PROCESS_STEPS } from '../types';

interface JobFilterBarProps {
  activeTab: 'all' | 'booking' | 'in_progress' | 'completed';
  onTabChange: (tab: 'all' | 'booking' | 'in_progress' | 'completed') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  billingFilter: 'all' | BillingType;
  onBillingFilterChange: (type: 'all' | BillingType) => void;
  stepFilter: number | 'all';
  onStepFilterChange: (step: number | 'all') => void;
  onlyAbnormal: boolean;
  onToggleOnlyAbnormal: () => void;
  counts: {
    all: number;
    booking: number;
    in_progress: number;
    completed: number;
  };
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
}

export const JobFilterBar: React.FC<JobFilterBarProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  billingFilter,
  onBillingFilterChange,
  stepFilter,
  onStepFilterChange,
  onlyAbnormal,
  onToggleOnlyAbnormal,
  counts,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="space-y-3 mb-5">
      
      {/* Primary Tab Navigation */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="inline-flex p-1 bg-slate-200/80 rounded-xl">
          
          <button
            type="button"
            id="tab-all"
            onClick={() => onTabChange('all')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span>すべて</span>
            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-xs font-mono ${
              activeTab === 'all' ? 'bg-slate-100 text-slate-800 font-bold' : 'bg-slate-300/60 text-slate-600'
            }`}>
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            id="tab-booking"
            onClick={() => onTabChange('booking')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'booking'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <CalendarClock className={`w-4 h-4 ${activeTab === 'booking' ? 'text-white' : 'text-blue-600'}`} />
            <span>入庫予定（予約）</span>
            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-xs font-mono font-bold ${
              activeTab === 'booking' ? 'bg-blue-800/60 text-white' : 'bg-blue-100 text-blue-800'
            }`}>
              {counts.booking}
            </span>
          </button>

          <button
            type="button"
            id="tab-in-progress"
            onClick={() => onTabChange('in_progress')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'in_progress'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Wrench className={`w-4 h-4 ${activeTab === 'in_progress' ? 'text-white' : 'text-amber-600'}`} />
            <span>現在作業中（入庫中）</span>
            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-xs font-mono font-bold ${
              activeTab === 'in_progress' ? 'bg-amber-800/60 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {counts.in_progress}
            </span>
          </button>

          <button
            type="button"
            id="tab-completed"
            onClick={() => onTabChange('completed')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${activeTab === 'completed' ? 'text-white' : 'text-emerald-600'}`} />
            <span>納車完了</span>
            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-xs font-mono font-bold ${
              activeTab === 'completed' ? 'bg-emerald-800/60 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {counts.completed}
            </span>
          </button>

        </div>

        {/* View Switcher (Cards / Table) */}
        <div className="hidden sm:inline-flex p-1 bg-slate-200/80 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange('cards')}
            className={`p-1.5 rounded-lg transition ${
              viewMode === 'cards' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="カード表示"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`p-1.5 rounded-lg transition ${
              viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="一覧リスト表示"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Search & Filter Options Row */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="input-search-jobs"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ナンバー、顧客名、車種、メモで検索..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg text-sm transition outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Billing Type Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 px-1">請求:</span>
            <button
              type="button"
              onClick={() => onBillingFilterChange('all')}
              className={`px-2 py-1 rounded font-medium transition ${
                billingFilter === 'all' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全件
            </button>
            <button
              type="button"
              onClick={() => onBillingFilterChange('self')}
              className={`px-2 py-1 rounded font-medium transition ${
                billingFilter === 'self' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              自費
            </button>
            <button
              type="button"
              onClick={() => onBillingFilterChange('insurance')}
              className={`px-2 py-1 rounded font-medium transition ${
                billingFilter === 'insurance' ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              保険
            </button>
          </div>

          {/* Process Step Filter (Dropdown) */}
          <select
            value={stepFilter}
            onChange={(e) => onStepFilterChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">すべての工程</option>
            {PROCESS_STEPS.map(step => (
              <option key={step.id} value={step.id}>
                {step.id}. {step.name}
              </option>
            ))}
          </select>

          {/* Abnormal Filter Toggle */}
          <button
            type="button"
            onClick={onToggleOnlyAbnormal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              onlyAbnormal
                ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-xs'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-800'
            }`}
          >
            <AlertCircle className={`w-3.5 h-3.5 ${onlyAbnormal ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>要確認・異常のみ</span>
          </button>

        </div>

      </div>

    </div>
  );
};
