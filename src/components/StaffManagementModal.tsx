import React, { useState } from 'react';
import { 
  X, 
  Users, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Phone, 
  Briefcase, 
  UserCheck,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Staff } from '../types';
import { StaffService } from '../services/api';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: Staff[];
  activeStaff: Staff;
  onSelectActiveStaff: (staff: Staff) => void;
  onStaffUpdated?: () => void;
}

const COLOR_OPTIONS = [
  { label: 'ブルー', class: 'bg-blue-600', ring: 'ring-blue-500' },
  { label: 'アンバー', class: 'bg-amber-600', ring: 'ring-amber-500' },
  { label: 'パープル', class: 'bg-purple-600', ring: 'ring-purple-500' },
  { label: 'シアン', class: 'bg-cyan-600', ring: 'ring-cyan-500' },
  { label: 'エメラルド', class: 'bg-emerald-600', ring: 'ring-emerald-500' },
  { label: 'ローズ', class: 'bg-rose-600', ring: 'ring-rose-500' },
  { label: 'インディゴ', class: 'bg-indigo-600', ring: 'ring-indigo-500' },
  { label: 'スレート', class: 'bg-slate-700', ring: 'ring-slate-500' },
];

const PRESET_ROLES = [
  'フロント受付・見積',
  '板金主任（整備士）',
  '塗装スペシャリスト',
  '電装・組付メカニック',
  '総括工場長・検査員',
  '一般整備・車検担当',
  '見習い・アシスタント'
];

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
  staffList,
  activeStaff,
  onSelectActiveStaff,
  onStaffUpdated,
}) => {
  if (!isOpen) return null;

  // Form states
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarColor, setAvatarColor] = useState('bg-blue-600');
  const [initials, setInitials] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEditingStaffId(null);
    setName('');
    setRole('');
    setPhone('');
    setAvatarColor(COLOR_OPTIONS[staffList.length % COLOR_OPTIONS.length]?.class || 'bg-blue-600');
    setInitials('');
    setErrorMessage(null);
  };

  const handleStartEdit = (staff: Staff) => {
    setEditingStaffId(staff.id);
    setName(staff.name);
    setRole(staff.role);
    setPhone(staff.phone || '');
    setAvatarColor(staff.avatarColor || 'bg-blue-600');
    setInitials(staff.initials || '');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-suggest initials if editing is not overriding
    if (!initials || initials.length <= 2) {
      const parts = val.trim().split(/\s+/);
      const suggested = parts[0]?.slice(0, 2) || val.slice(0, 2);
      setInitials(suggested);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('氏名を入力してください');
      return;
    }
    if (!role.trim()) {
      setErrorMessage('役職・担当業務を入力または選択してください');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (editingStaffId) {
        const updated = await StaffService.updateStaff(editingStaffId, {
          name: name.trim(),
          role: role.trim(),
          phone: phone.trim() || undefined,
          avatarColor,
          initials: initials.trim() || name.trim().slice(0, 2),
        });
        setSuccessMessage(`「${updated.name}」の情報を更新しました`);
        if (activeStaff.id === updated.id) {
          onSelectActiveStaff(updated);
        }
      } else {
        const created = await StaffService.createStaff({
          name: name.trim(),
          role: role.trim(),
          phone: phone.trim() || undefined,
          avatarColor,
          initials: initials.trim() || name.trim().slice(0, 2),
        });
        setSuccessMessage(`「${created.name}」を登録しました`);
      }

      resetForm();
      if (onStaffUpdated) onStaffUpdated();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '処理に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async (staff: Staff) => {
    if (staffList.length <= 1) {
      alert('最低1名のスタッフ登録が必要です。これ以上削除できません。');
      return;
    }

    const confirmed = window.confirm(
      `従業員「${staff.name}（${staff.role}）」を削除しますか？\n※この操作は即座に全端末へ反映されます。`
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await StaffService.deleteStaff(staff.id);
      setSuccessMessage(`「${staff.name}」を削除しました`);

      // If deleted staff was the currently active staff, auto-switch to another staff
      if (activeStaff.id === staff.id) {
        const remaining = staffList.filter(s => s.id !== staff.id);
        if (remaining.length > 0) {
          onSelectActiveStaff(remaining[0]);
        }
      }

      if (editingStaffId === staff.id) {
        resetForm();
      }

      if (onStaffUpdated) onStaffUpdated();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '削除に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">従業員・スタッフ管理</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  実稼働モード
                </span>
              </div>
              <p className="text-xs text-slate-400">
                現場スタッフの登録・編集・削除。全デバイスへ即時リアルタイム同期されます。
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

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          
          {/* Messages */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Registration / Edit Form */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                {editingStaffId ? (
                  <>
                    <Edit3 className="w-4 h-4 text-amber-600" />
                    <span>従業員情報の編集</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-blue-600" />
                    <span>新規スタッフの登録</span>
                  </>
                )}
              </div>
              {editingStaffId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                >
                  編集をキャンセルして新規登録へ
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    氏名 (必須)
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="例: 佐藤 健一"
                    className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    役職・担当業務 (必須)
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="例: 板金主任 / 塗装スペシャリスト"
                    className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none"
                  />
                </div>

                {/* Initials */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    表示略称・イニシャル (2〜3文字)
                  </label>
                  <input
                    type="text"
                    value={initials}
                    maxLength={4}
                    onChange={(e) => setInitials(e.target.value)}
                    placeholder="例: 佐藤"
                    className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    連絡先電話番号 (任意)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="例: 090-1234-5678"
                    className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-500 rounded-lg text-sm text-slate-900 outline-none"
                  />
                </div>

              </div>

              {/* Preset Role Quick Chips */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  よく使われる役職プリセット (タップで入力):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_ROLES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRole(preset)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                        role === preset 
                          ? 'bg-blue-600 text-white border-blue-600 font-bold' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  テーマアイコンカラー
                </label>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {COLOR_OPTIONS.map((col) => (
                    <button
                      key={col.class}
                      type="button"
                      onClick={() => setAvatarColor(col.class)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${col.class} text-white flex items-center justify-center transition transform active:scale-95 shadow-xs ${
                        avatarColor === col.class ? 'ring-3 ring-offset-2 ring-blue-500 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      title={col.label}
                    >
                      {avatarColor === col.class && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                  ))}
                  <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-200">
                    <div className={`w-8 h-8 rounded-lg ${avatarColor} text-white flex items-center justify-center text-xs font-bold shadow`}>
                      {initials || (name ? name.slice(0, 2) : '氏')}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">プレビュー</span>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                {editingStaffId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs sm:text-sm transition"
                  >
                    キャンセル
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center gap-1.5 ${
                    editingStaffId 
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20' 
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                  }`}
                >
                  {editingStaffId ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>変更を保存する</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>従業員を新規登録する</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Current Staff List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">
                  登録済み従業員一覧 ({staffList.length}名)
                </h3>
                <span className="text-[11px] text-slate-500">
                  ※作業履歴や点検表の担当者として選択可能
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {staffList.map((staff) => {
                const isActive = activeStaff.id === staff.id;
                const isEditing = editingStaffId === staff.id;

                return (
                  <div
                    key={staff.id}
                    className={`p-3.5 rounded-2xl border transition relative flex flex-col justify-between ${
                      isActive 
                        ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-sm' 
                        : isEditing 
                        ? 'bg-amber-50/60 border-amber-400' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl ${staff.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow shrink-0`}>
                            {staff.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm truncate">{staff.name}</span>
                              {isActive && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white flex items-center gap-0.5">
                                  <UserCheck className="w-2.5 h-2.5" />
                                  操作中
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600 font-medium truncate mt-0.5">
                              {staff.role}
                            </div>
                          </div>
                        </div>

                        {/* Edit & Delete Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(staff)}
                            title="従業員情報を編集"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(staff)}
                            disabled={staffList.length <= 1}
                            title={staffList.length <= 1 ? '最後の1名は削除できません' : '従業員を削除'}
                            className={`p-1.5 rounded-lg transition ${
                              staffList.length <= 1 
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                                : 'bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Phone note if present */}
                      {staff.phone && (
                        <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{staff.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom switcher button */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">
                        {staff.id}
                      </span>
                      {isActive ? (
                        <span className="text-xs text-blue-700 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          現在の操作者
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectActiveStaff(staff)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition shadow-2xs hover:text-blue-600"
                        >
                          このスタッフで操作
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            登録・変更された従業員データは自動的にサーバーへ永続保存されます
          </div>
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
