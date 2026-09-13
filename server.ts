import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_JOBS, createDefaultChecklist } from './src/data/seedData';
import { VehicleJob, ActivityLog, Staff, DEFAULT_STAFF } from './src/types';
import { syncDataToSupabase, isSupabaseConfigured, getSupabaseCredentials } from './src/services/supabaseService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory + local file persistence store
const DATA_FILE = path.join(process.cwd(), 'jobs_store.json');
const STAFF_FILE = path.join(process.cwd(), 'staff_store.json');

let jobs: VehicleJob[] = [];
let staffList: Staff[] = [];

function loadJobs(): void {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      jobs = JSON.parse(raw);
    } else {
      jobs = [...INITIAL_JOBS];
      saveJobs();
    }
  } catch (err) {
    console.error('Failed to load data file, using defaults:', err);
    jobs = [...INITIAL_JOBS];
  }
}

function saveJobs(): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save jobs to file:', err);
  }
}

function loadStaff(): void {
  try {
    if (fs.existsSync(STAFF_FILE)) {
      const raw = fs.readFileSync(STAFF_FILE, 'utf-8');
      staffList = JSON.parse(raw);
      if (!Array.isArray(staffList) || staffList.length === 0) {
        staffList = [...DEFAULT_STAFF];
        saveStaff();
      }
    } else {
      staffList = [...DEFAULT_STAFF];
      saveStaff();
    }
  } catch (err) {
    console.error('Failed to load staff file, using defaults:', err);
    staffList = [...DEFAULT_STAFF];
  }
}

function saveStaff(): void {
  try {
    fs.writeFileSync(STAFF_FILE, JSON.stringify(staffList, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save staff to file:', err);
  }
}

loadJobs();
loadStaff();

// SSE (Server-Sent Events) clients registry for real-time multi-device sync
type SSEClient = {
  id: number;
  res: Response;
};

let clients: SSEClient[] = [];
let nextClientId = 1;

function broadcastUpdate(
  type: 'JOB_UPDATED' | 'JOB_CREATED' | 'JOB_DELETED' | 'ALL_REFRESHED' | 'STAFF_CREATED' | 'STAFF_UPDATED' | 'STAFF_DELETED',
  payload: any
) {
  const data = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  clients.forEach(client => {
    try {
      client.res.write(`data: ${data}\n\n`);
    } catch (err) {
      // client disconnected
    }
  });
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// SSE stream for real-time live sync across phones, tablets, PCs
app.get('/api/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const clientId = nextClientId++;
  const newClient: SSEClient = { id: clientId, res };
  clients.push(newClient);

  // Send initial ping and connected count
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', connectedClients: clients.length })}\n\n`);

  // Broadcast connected device count to all
  broadcastUpdate('ALL_REFRESHED', { connectedClients: clients.length });

  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
    broadcastUpdate('ALL_REFRESHED', { connectedClients: clients.length });
  });
});

// GET /api/jobs - List all jobs
app.get('/api/jobs', (_req: Request, res: Response) => {
  res.json({ jobs, connectedDevices: clients.length });
});

// GET /api/jobs/:id - Get single job
app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

// POST /api/jobs - Create new booking or direct entry
app.post('/api/jobs', (req: Request, res: Response) => {
  const body = req.body;
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const newId = `JOB-${dateStr}-${randomSuffix}`;

  const isBooking = body.status === 'booking' || body.currentStepId === 1;

  const newJob: VehicleJob = {
    id: newId,
    status: isBooking ? 'booking' : (body.status || 'in_progress'),
    currentStepId: body.currentStepId || (isBooking ? 1 : 2),
    scheduledEntryAt: body.scheduledEntryAt || now.toISOString().slice(0, 16),
    actualEntryAt: !isBooking ? (body.actualEntryAt || now.toISOString().slice(0, 16)) : null,
    scheduledDeliveryDate: body.scheduledDeliveryDate || new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    actualDeliveryAt: body.status === 'completed' ? now.toISOString().slice(0, 16) : null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    customerName: body.customerName || '未設定',
    customerPhone: body.customerPhone || '',
    vehicleModel: body.vehicleModel || '',
    plateNumber: body.plateNumber || '',
    color: body.color || '',
    mileage: body.mileage || '',
    billingType: body.billingType || 'self',
    insuranceDetails: body.insuranceDetails || '',
    summaryNotes: body.summaryNotes || '',
    partsNotes: body.partsNotes || '',
    assignedStaff: body.assignedStaff || '佐藤 健一',
    checklist: body.checklist || createDefaultChecklist(),
    logs: [
      {
        id: `log-${Date.now()}`,
        timestamp: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        staffName: body.assignedStaff || '担当スタッフ',
        action: isBooking ? '入庫予約登録' : '直接入庫登録',
        details: body.summaryNotes || '新規作成',
      }
    ]
  };

  jobs.unshift(newJob);
  saveJobs();
  broadcastUpdate('JOB_CREATED', newJob);

  res.status(201).json(newJob);
});

// PUT /api/jobs/:id - Update full job
app.put('/api/jobs/:id', (req: Request, res: Response) => {
  const index = jobs.findIndex(j => j.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const existing = jobs[index];
  const body = req.body;
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const updatedJob: VehicleJob = {
    ...existing,
    ...body,
    id: existing.id, // Preserve ID
    updatedAt: now.toISOString(),
  };

  // If status changed or notes changed, add log if passed
  if (body._logAction) {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: timeStr,
      staffName: body._staffName || updatedJob.assignedStaff || 'スタッフ',
      action: body._logAction,
      details: body._logDetails || '',
    };
    updatedJob.logs = [newLog, ...(updatedJob.logs || [])];
  }

  jobs[index] = updatedJob;
  saveJobs();
  broadcastUpdate('JOB_UPDATED', updatedJob);

  res.json(updatedJob);
});

// POST /api/jobs/:id/entry - One-tap vehicle arrival check-in
app.post('/api/jobs/:id/entry', (req: Request, res: Response) => {
  const index = jobs.findIndex(j => j.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const existing = jobs[index];
  const now = new Date();
  const nowIsoTime = now.toISOString().slice(0, 16);
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const staffName = req.body.staffName || existing.assignedStaff || '受付担当';

  const updatedJob: VehicleJob = {
    ...existing,
    status: 'in_progress',
    currentStepId: Math.max(2, existing.currentStepId), // Move to Reception if was Booking (1)
    actualEntryAt: existing.actualEntryAt || nowIsoTime,
    updatedAt: now.toISOString(),
    logs: [
      {
        id: `log-${Date.now()}`,
        timestamp: timeStr,
        staffName,
        action: '実車入庫確認',
        details: `入庫予約から作業中（受付）へ移行。実車受領時刻: ${timeStr}`
      },
      ...existing.logs
    ]
  };

  jobs[index] = updatedJob;
  saveJobs();
  broadcastUpdate('JOB_UPDATED', updatedJob);

  res.json(updatedJob);
});

// POST /api/jobs/:id/step - Update process step
app.post('/api/jobs/:id/step', (req: Request, res: Response) => {
  const index = jobs.findIndex(j => j.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const { stepId, stepName, staffName, note } = req.body;
  const existing = jobs[index];
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let newStatus = existing.status;
  if (stepId === 1) {
    newStatus = 'booking';
  } else if (stepId === 12) {
    newStatus = 'completed';
  } else {
    newStatus = 'in_progress';
  }

  const updatedJob: VehicleJob = {
    ...existing,
    currentStepId: stepId,
    status: newStatus,
    actualDeliveryAt: stepId === 12 ? now.toISOString().slice(0, 16) : existing.actualDeliveryAt,
    actualEntryAt: (stepId > 1 && !existing.actualEntryAt) ? now.toISOString().slice(0, 16) : existing.actualEntryAt,
    updatedAt: now.toISOString(),
    logs: [
      {
        id: `log-${Date.now()}`,
        timestamp: timeStr,
        staffName: staffName || existing.assignedStaff || 'スタッフ',
        action: `工程更新 → ${stepName || `工程${stepId}`}`,
        details: note || '工程ステータスを変更しました'
      },
      ...existing.logs
    ]
  };

  jobs[index] = updatedJob;
  saveJobs();
  broadcastUpdate('JOB_UPDATED', updatedJob);

  res.json(updatedJob);
});

// POST /api/jobs/:id/checklist - Quick update of checklist
app.post('/api/jobs/:id/checklist', (req: Request, res: Response) => {
  const index = jobs.findIndex(j => j.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const { checklist, staffName } = req.body;
  const existing = jobs[index];
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const updatedJob: VehicleJob = {
    ...existing,
    checklist: checklist || existing.checklist,
    updatedAt: now.toISOString(),
    logs: [
      {
        id: `log-${Date.now()}`,
        timestamp: timeStr,
        staffName: staffName || existing.assignedStaff || '点検担当',
        action: '車両点検チェック更新',
        details: '12項目の点検状態・メモを更新しました'
      },
      ...existing.logs
    ]
  };

  jobs[index] = updatedJob;
  saveJobs();
  broadcastUpdate('JOB_UPDATED', updatedJob);

  res.json(updatedJob);
});

// DELETE /api/jobs/:id - Delete job
app.delete('/api/jobs/:id', (req: Request, res: Response) => {
  const index = jobs.findIndex(j => j.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const deleted = jobs.splice(index, 1)[0];
  saveJobs();
  broadcastUpdate('JOB_DELETED', { id: req.params.id });

  res.json({ success: true, deletedId: deleted.id });
});

// POST /api/reset - Reset sample demo data
app.post('/api/reset', (_req: Request, res: Response) => {
  jobs = [...INITIAL_JOBS];
  saveJobs();
  broadcastUpdate('ALL_REFRESHED', { jobs });
  res.json({ success: true, count: jobs.length });
});

// -------------------------------------------------------------
// Staff (従業員) API Endpoints
// -------------------------------------------------------------

// GET /api/staff - List all staff
app.get('/api/staff', (_req: Request, res: Response) => {
  res.json({ staff: staffList });
});

// POST /api/staff - Register new staff member
app.post('/api/staff', (req: Request, res: Response) => {
  const { name, role, avatarColor, initials, phone } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: '氏名は必須入力です' });
  }
  if (!role || typeof role !== 'string' || !role.trim()) {
    return res.status(400).json({ error: '役職・担当業務は必須入力です' });
  }

  const trimmedName = name.trim();
  const trimmedRole = role.trim();

  // Generate initials if not specified
  const nameParts = trimmedName.split(/\s+/);
  const derivedInitials = initials && typeof initials === 'string' && initials.trim()
    ? initials.trim()
    : (nameParts[0]?.slice(0, 2) || trimmedName.slice(0, 2));

  // Color palette selection
  const palette = [
    'bg-blue-600',
    'bg-amber-600',
    'bg-purple-600',
    'bg-cyan-600',
    'bg-emerald-600',
    'bg-rose-600',
    'bg-indigo-600',
    'bg-teal-600',
    'bg-slate-700'
  ];
  const selectedColor = avatarColor || palette[staffList.length % palette.length];

  const newStaff: Staff = {
    id: `staff-${Date.now()}`,
    name: trimmedName,
    role: trimmedRole,
    avatarColor: selectedColor,
    initials: derivedInitials,
    phone: phone && typeof phone === 'string' ? phone.trim() : undefined,
    createdAt: new Date().toISOString()
  };

  staffList.push(newStaff);
  saveStaff();
  broadcastUpdate('STAFF_CREATED', newStaff);

  res.status(201).json(newStaff);
});

// PUT /api/staff/:id - Update staff
app.put('/api/staff/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = staffList.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '従業員が見つかりません' });
  }

  const { name, role, avatarColor, initials, phone } = req.body;
  const current = staffList[index];

  const updated: Staff = {
    ...current,
    name: name !== undefined && typeof name === 'string' && name.trim() ? name.trim() : current.name,
    role: role !== undefined && typeof role === 'string' && role.trim() ? role.trim() : current.role,
    avatarColor: avatarColor || current.avatarColor,
    initials: initials !== undefined && typeof initials === 'string' && initials.trim() ? initials.trim() : current.initials,
    phone: phone !== undefined ? (typeof phone === 'string' ? phone.trim() : '') : current.phone,
  };

  staffList[index] = updated;
  saveStaff();
  broadcastUpdate('STAFF_UPDATED', updated);

  res.json(updated);
});

// DELETE /api/staff/:id - Delete staff member
app.delete('/api/staff/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = staffList.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '従業員が見つかりません' });
  }

  if (staffList.length <= 1) {
    return res.status(400).json({ error: '最低1名のスタッフ登録が必要です。これ以上削除できません。' });
  }

  const deleted = staffList.splice(index, 1)[0];
  saveStaff();
  broadcastUpdate('STAFF_DELETED', { id: deleted.id });

  res.json({ success: true, deletedId: deleted.id });
});

// -------------------------------------------------------------
// Supabase Cloud Storage & Sync Endpoints
// -------------------------------------------------------------

// GET /api/supabase/status - Check if Supabase connection is configured
app.get('/api/supabase/status', (_req: Request, res: Response) => {
  const configured = isSupabaseConfigured();
  const { url } = getSupabaseCredentials();
  res.json({
    configured,
    url: url ? url.replace(/\/\/([^:]+):.*@/, '//') : null,
    totalJobs: jobs.length,
    totalStaff: staffList.length,
  });
});

// POST /api/supabase/sync - Save / Upsert all current jobs and staff to Supabase
app.post('/api/supabase/sync', async (_req: Request, res: Response) => {
  if (!isSupabaseConfigured()) {
    return res.status(400).json({
      success: false,
      message: 'Supabaseの接続情報 (SUPABASE_URL, SUPABASE_KEY) が設定されていません。'
    });
  }

  try {
    const result = await syncDataToSupabase(jobs, staffList);
    if (!result.success) {
      return res.status(500).json(result);
    }
    res.json(result);
  } catch (error: any) {
    console.error('API Supabase Sync error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Supabase同期処理に失敗しました'
    });
  }
});

// -------------------------------------------------------------
// Vite Middleware / Static Server
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoCraft Factory Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
