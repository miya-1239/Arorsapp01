// Vehicle, Job, Process and Checklist Types for AutoCraft

export type JobStatus = 'booking' | 'in_progress' | 'completed';

export type BillingType = 'self' | 'insurance';

export interface ProcessStepDef {
  id: number;
  key: string;
  name: string;
  shortName: string;
  category: 'booking' | 'prep' | 'body' | 'paint' | 'finish' | 'delivery';
  description: string;
  color: string;
}

export const PROCESS_STEPS: ProcessStepDef[] = [
  { id: 1, key: 'booking', name: '入庫予約', shortName: '予約', category: 'booking', description: 'Web/電話からの入庫予約受付段階', color: 'slate' },
  { id: 2, key: 'reception', name: '受付・実車入庫', shortName: '受付', category: 'prep', description: 'お客様実車ご来店・受領・ヒアリング', color: 'blue' },
  { id: 3, key: 'disassembly', name: '分解', shortName: '分解', category: 'prep', description: '損傷部位・関連パーツの取り外し・内部確認', color: 'indigo' },
  { id: 4, key: 'sheet_metal', name: '板金', shortName: '板金', category: 'body', description: 'フレーム修正・パネル叩き出し・引き出し作業', color: 'amber' },
  { id: 5, key: 'putty', name: 'パテ', shortName: 'パテ', category: 'body', description: 'パテ盛り・成形・研磨作業', color: 'orange' },
  { id: 6, key: 'primer', name: '下地（サフ）', shortName: '下地', category: 'paint', description: 'サーフェイサー塗布・下地研ぎ・マスキング', color: 'violet' },
  { id: 7, key: 'painting', name: '塗装', shortName: '塗装', category: 'paint', description: '調色・ベースコート＆クリア塗装・ブース乾燥', color: 'purple' },
  { id: 8, key: 'assembly', name: '組付', shortName: '組付', category: 'finish', description: 'バンパー・ライト・内装・電装パーツ復元', color: 'cyan' },
  { id: 9, key: 'polishing', name: '磨き', shortName: '磨き', category: 'finish', description: 'コンパウンド肌調整・ゴミ取り・光沢仕上げ', color: 'teal' },
  { id: 10, key: 'car_wash', name: '洗車・清掃', shortName: '洗車', category: 'finish', description: '撥水洗車・車内バキューム清掃・ホイール洗浄', color: 'emerald' },
  { id: 11, key: 'final_check', name: '最終確認（検査）', shortName: '検査', category: 'finish', description: '光軸・電装・塗装色ムラ・走行最終チェック', color: 'sky' },
  { id: 12, key: 'delivered', name: '納車完了', shortName: '納車', category: 'delivery', description: 'お客様へのお引き渡し・ご精算完了', color: 'green' },
];

export type InspectionState = 'normal' | 'abnormal' | 'uninspected';

export interface InspectionItemDef {
  id: string;
  name: string;
  category: 'exterior' | 'electrical' | 'interior' | 'final';
  iconName: string;
  description: string;
}

export const INSPECTION_ITEMS: InspectionItemDef[] = [
  { id: 'exterior_scratch', name: '外装傷・凹み', category: 'exterior', iconName: 'ShieldAlert', description: 'バンパー・フェンダー・ドア等の既存キズやヘコミ' },
  { id: 'glass', name: 'ガラス', category: 'exterior', iconName: 'Layers', description: 'フロント・リア・サイドガラスの飛び石・ヒビ' },
  { id: 'tires_wheels', name: 'タイヤ・ホイール', category: 'exterior', iconName: 'Disc', description: 'タイヤ溝・偏摩耗・エア圧・ホイールガリ傷' },
  { id: 'lights', name: '灯火類', category: 'electrical', iconName: 'SunMedium', description: 'ヘッドライト・ウインカー・ブレーキランプ・フォグ点灯' },
  { id: 'mirrors', name: 'ミラー格納', category: 'electrical', iconName: 'Maximize2', description: '電動格納・ミラー角度調整・ウインカー連動' },
  { id: 'sensors', name: 'センサー', category: 'electrical', iconName: 'Radio', description: '障害物ソナー・自動ブレーキカメラ・ミリ波レーダー' },
  { id: 'power_windows', name: 'パワーウィンドウ', category: 'electrical', iconName: 'Maximize', description: '全席昇降動作・オート機能・挟み込み防止' },
  { id: 'air_conditioner', name: 'エアコン', category: 'electrical', iconName: 'Wind', description: '冷暖房効き・風量切替・異音・異臭' },
  { id: 'navigation', name: 'ナビ・オーディオ', category: 'electrical', iconName: 'Compass', description: '画面表示・タッチ感度・バックカメラ映像・ETC連動' },
  { id: 'warning_lights', name: '警告灯', category: 'interior', iconName: 'AlertTriangle', description: 'エンジン・ABS・エアバッグ等の警告灯点灯有無' },
  { id: 'interior', name: '車内（シート・臭い）', category: 'interior', iconName: 'Sparkles', description: 'シート汚れ・タバコ/ペット臭・貴重品置き忘れ' },
  { id: 'delivery_check', name: '最終確認（納車前用）', category: 'final', iconName: 'CheckCircle2', description: '忘れ物なし・作業箇所の仕上がり・取扱説明書' },
];

export interface InspectionRecord {
  itemId: string;
  status: InspectionState;
  note: string;
  photos?: string[];
  inspectedBy?: string;
  inspectedAt?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  staffName: string;
  action: string;
  details?: string;
}

export interface VehicleJob {
  id: string; // e.g. "JOB-202609-001"
  status: JobStatus; // 'booking' | 'in_progress' | 'completed'
  currentStepId: number; // 1 ~ 12
  
  // Schedule & Timestamps
  scheduledEntryAt: string; // ISO string e.g. "2026-09-04T10:00"
  actualEntryAt?: string | null; // ISO string when actually checked in
  scheduledDeliveryDate: string; // Date string e.g. "2026-09-10"
  actualDeliveryAt?: string | null;
  createdAt: string;
  updatedAt: string;

  // Customer & Vehicle Info
  customerName: string;
  customerPhone?: string;
  vehicleModel: string; // e.g. "トヨタ プリウス", "ホンダ N-BOX"
  plateNumber: string; // e.g. "品川 500 あ 12-34"
  color?: string; // e.g. "パールホワイト"
  mileage?: string; // e.g. "45,200 km"

  // Billing
  billingType: BillingType; // 'self' | 'insurance'
  insuranceDetails?: string; // e.g. "東京海上日動 (100:0協定済) 担当: 佐藤様"
  
  // Work Scope & Notes
  summaryNotes: string; // 総合メモ・不良箇所概要
  partsNotes?: string; // 部品発注・入荷状況
  assignedStaff: string; // 担当スタッフ名

  // Checklist
  checklist: Record<string, InspectionRecord>;

  // Activity Logs
  logs: ActivityLog[];
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  initials: string;
  phone?: string;
  createdAt?: string;
}

export const DEFAULT_STAFF: Staff[] = [
  { id: 'staff-1', name: '佐藤 健一', role: 'フロント受付・見積', avatarColor: 'bg-blue-600', initials: '佐藤' },
  { id: 'staff-2', name: '田中 浩二', role: '板金主任（1級整備士）', avatarColor: 'bg-amber-600', initials: '田中' },
  { id: 'staff-3', name: '鈴木 雅人', role: '塗装スペシャリスト', avatarColor: 'bg-purple-600', initials: '鈴木' },
  { id: 'staff-4', name: '高橋 雄介', role: '電装・組付メカニック', avatarColor: 'bg-cyan-600', initials: '高橋' },
  { id: 'staff-5', name: '山本 工場長', role: '総括工場長・検査員', avatarColor: 'bg-emerald-600', initials: '山本' },
];

export function getChecklistRecords(checklist?: Record<string, InspectionRecord>): InspectionRecord[] {
  if (!checklist) return [];
  return Object.values(checklist) as InspectionRecord[];
}


