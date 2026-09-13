import React, { useState } from 'react';
import { 
  Car, 
  Plus, 
  Wifi, 
  RotateCcw, 
  UserCheck, 
  Wrench,
  ChevronDown,
  Users,
  Settings,
  Database
} from 'lucide-react';
import { Staff } from '../types';
import { JobService, staffStorage } from '../services/api';

interface HeaderProps {
  connectedClients: number;
  activeStaff: Staff;
  staffList: Staff[];
  onStaffChange: (staff: Staff) => void;
  onOpenNewJob: () => void;
  onOpenStaffManagement: () => void;
  onOpenSupabaseSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectedClients,
  activeStaff,
  staffList,
  onStaffChange,
  onOpenNewJob,
  onOpenStaffManagement,
  onOpenSupabaseSync,
}) => {
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetDemo = async () => {
    if (window.confirm('デモデータ（案件一覧）を初期状態にリセットしますか？\n※登録された従業員データは保持されます。')) {
      setIsResetting(true);
      await JobService.resetDemo();
      setIsResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Left: Logo & System Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white font-bold">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
                  AutoCraft
                </span>
                <span className="hidden md:inline-block text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  整備・板金工程管理
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                車両入庫予約・12工程・点検チェック リアルタイム共有
              </p>
            </div>
          </div>

          {/* Right: Live Sync Badge + Staff Switcher + New Booking Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Realtime Live Sync Status */}
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs font-medium text-emerald-400 shadow-inner"
              title={`リアルタイム同期中 (${connectedClients}台の端末が接続中)`}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline font-mono">LIVE共有</span>
              <span className="text-slate-400 text-[11px]">({connectedClients}台)</span>
            </div>

            {/* Direct Staff Management Button */}
            <button
              type="button"
              id="btn-manage-staff"
              onClick={onOpenStaffManagement}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition active:scale-95 shadow-xs"
              title="従業員の新規登録・編集・削除"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">従業員管理</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-mono">
                {staffList.length}
              </span>
            </button>

            {/* Supabase Sync Button */}
            {onOpenSupabaseSync && (
              <button
                type="button"
                id="btn-supabase-sync"
                onClick={onOpenSupabaseSync}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-emerald-300 hover:text-emerald-200 text-xs font-semibold transition active:scale-95 shadow-xs"
                title="Supabaseデータ保存・同期"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline">Supabase保存</span>
              </button>
            )}

            {/* Staff Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowStaffDropdown(!showStaffDropdown)}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/90 border border-slate-700 transition active:scale-95"
              >
                <div className={`w-6 h-6 rounded-md ${activeStaff.avatarColor} text-white flex items-center justify-center text-xs font-bold`}>
                  {activeStaff.initials[0] || 'ス'}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">{activeStaff.name}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{activeStaff.role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {showStaffDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowStaffDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-slate-700/70 text-xs font-semibold text-slate-400 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                        <span>操作スタッフの選択</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{staffList.length}名登録中</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto py-1 divide-y divide-slate-700/40">
                      {staffList.map(staff => (
                        <button
                          key={staff.id}
                          type="button"
                          onClick={() => {
                            onStaffChange(staff);
                            staffStorage.setActiveStaff(staff);
                            setShowStaffDropdown(false);
                          }}
                          className={`w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-slate-700/80 transition ${
                            activeStaff.id === staff.id ? 'bg-blue-600/20 text-blue-300 font-medium' : 'text-slate-200'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg ${staff.avatarColor} text-white flex items-center justify-center text-xs font-bold shrink-0 shadow`}>
                            {staff.initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold truncate">{staff.name}</div>
                            <div className="text-xs text-slate-400 truncate">{staff.role}</div>
                          </div>
                          {activeStaff.id === staff.id && (
                            <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                    
                    <div className="mt-1 pt-2 border-t border-slate-700/70 px-3 space-y-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowStaffDropdown(false);
                          onOpenStaffManagement();
                        }}
                        className="w-full text-xs font-bold text-blue-300 hover:text-white py-2 px-2.5 flex items-center justify-center gap-1.5 bg-blue-900/40 hover:bg-blue-800/60 rounded-lg border border-blue-700/50 transition shadow-xs"
                      >
                        <Users className="w-3.5 h-3.5" />
                        従業員の登録・編集・削除
                      </button>

                      {onOpenSupabaseSync && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowStaffDropdown(false);
                            onOpenSupabaseSync();
                          }}
                          className="w-full text-xs font-bold text-emerald-300 hover:text-white py-2 px-2.5 flex items-center justify-center gap-1.5 bg-emerald-950/50 hover:bg-emerald-900/60 rounded-lg border border-emerald-700/50 transition shadow-xs"
                        >
                          <Database className="w-3.5 h-3.5 text-emerald-400" />
                          Supabaseへ保存・同期
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowStaffDropdown(false);
                          handleResetDemo();
                        }}
                        disabled={isResetting}
                        className="w-full text-xs text-slate-400 hover:text-slate-200 py-1.5 flex items-center justify-center gap-1.5 hover:bg-slate-700/50 rounded transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        案件デモデータを初期化
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Prominent New Job / Booking Button */}
            <button
              type="button"
              id="btn-add-booking"
              onClick={onOpenNewJob}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/30 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden xs:inline">入庫予約・登録</span>
              <span className="xs:hidden">予約</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
