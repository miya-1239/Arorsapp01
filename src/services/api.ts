import { VehicleJob, Staff, DEFAULT_STAFF } from '../types';

const STORAGE_KEY = 'autocraft_jobs_cache';
const STAFF_KEY = 'autocraft_active_staff';
const STAFF_LIST_KEY = 'autocraft_staff_list_cache';

export const staffStorage = {
  getActiveStaff: (availableStaff?: Staff[]): Staff => {
    try {
      const saved = localStorage.getItem(STAFF_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (availableStaff && availableStaff.length > 0) {
          const found = availableStaff.find(s => s.id === parsed.id);
          if (found) return found;
        } else {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
    if (availableStaff && availableStaff.length > 0) {
      return availableStaff[0];
    }
    return DEFAULT_STAFF[0];
  },
  setActiveStaff: (staff: Staff) => {
    localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
  }
};

export class StaffService {
  private static listeners: Array<(staff: Staff[]) => void> = [];
  private static staffCache: Staff[] = [...DEFAULT_STAFF];

  static subscribe(listener: (staff: Staff[]) => void) {
    this.listeners.push(listener);
    listener(this.staffCache);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  static getStaff(): Staff[] {
    return this.staffCache;
  }

  private static notifyListeners() {
    this.listeners.forEach(fn => fn(this.staffCache));
  }

  static setStaffCache(list: Staff[]) {
    this.staffCache = list;
    try {
      localStorage.setItem(STAFF_LIST_KEY, JSON.stringify(list));
    } catch (e) {}
    this.notifyListeners();
  }

  static handleSSE(type: string, payload: any) {
    if (type === 'STAFF_CREATED') {
      this.staffCache = [...this.staffCache.filter(s => s.id !== payload.id), payload];
      this.setStaffCache(this.staffCache);
    } else if (type === 'STAFF_UPDATED') {
      this.staffCache = this.staffCache.map(s => (s.id === payload.id ? payload : s));
      this.setStaffCache(this.staffCache);
    } else if (type === 'STAFF_DELETED') {
      this.staffCache = this.staffCache.filter(s => s.id !== payload.id);
      this.setStaffCache(this.staffCache);
    }
  }

  static async fetchStaff(): Promise<Staff[]> {
    try {
      const res = await fetch('/api/staff');
      if (res.ok) {
        const data = await res.json();
        if (data.staff && Array.isArray(data.staff)) {
          this.setStaffCache(data.staff);
          return this.staffCache;
        }
      }
    } catch (err) {
      console.warn('Fetch staff failed, using local cache:', err);
    }

    try {
      const saved = localStorage.getItem(STAFF_LIST_KEY);
      if (saved) {
        this.staffCache = JSON.parse(saved);
        this.notifyListeners();
        return this.staffCache;
      }
    } catch (e) {}

    return this.staffCache;
  }

  static async createStaff(data: Partial<Staff>): Promise<Staff> {
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'スタッフの登録に失敗しました');
    }
    const created: Staff = await res.json();
    this.staffCache = [...this.staffCache.filter(s => s.id !== created.id), created];
    this.setStaffCache(this.staffCache);
    return created;
  }

  static async updateStaff(id: string, data: Partial<Staff>): Promise<Staff> {
    const res = await fetch(`/api/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'スタッフ情報の更新に失敗しました');
    }
    const updated: Staff = await res.json();
    this.staffCache = this.staffCache.map(s => (s.id === updated.id ? updated : s));
    this.setStaffCache(this.staffCache);
    return updated;
  }

  static async deleteStaff(id: string): Promise<void> {
    const res = await fetch(`/api/staff/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'スタッフの削除に失敗しました');
    }
    this.staffCache = this.staffCache.filter(s => s.id !== id);
    this.setStaffCache(this.staffCache);
  }
}

export class JobService {
  private static listeners: Array<(jobs: VehicleJob[], connectedCount: number) => void> = [];
  private static jobsCache: VehicleJob[] = [];
  private static connectedClients = 1;
  private static eventSource: EventSource | null = null;
  private static isConnected = false;

  // Initialize Real-time synchronization
  static initRealtime(onUpdate?: (jobs: VehicleJob[], connectedCount: number) => void) {
    if (onUpdate) {
      this.listeners.push(onUpdate);
    }

    // Always fetch latest staff on start
    StaffService.fetchStaff();

    if (this.eventSource) return;

    this.connectSSE();
    this.fetchJobs();
  }

  static subscribe(listener: (jobs: VehicleJob[], connectedCount: number) => void) {
    this.listeners.push(listener);
    // Initial emit
    listener(this.jobsCache, this.connectedClients);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners() {
    this.listeners.forEach(fn => fn(this.jobsCache, this.connectedClients));
  }

  private static connectSSE() {
    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      const sseUrl = '/api/events';
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        this.isConnected = true;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'CONNECTED' || data.type === 'ALL_REFRESHED') {
            if (data.connectedClients !== undefined) {
              this.connectedClients = data.connectedClients;
            }
            if (data.jobs) {
              this.jobsCache = data.jobs;
              this.saveLocalCache();
            } else {
              this.fetchJobs();
            }
            this.notifyListeners();
          } else if (data.type === 'JOB_CREATED') {
            this.jobsCache = [data.payload, ...this.jobsCache.filter(j => j.id !== data.payload.id)];
            this.saveLocalCache();
            this.notifyListeners();
          } else if (data.type === 'JOB_UPDATED') {
            this.jobsCache = this.jobsCache.map(j => (j.id === data.payload.id ? data.payload : j));
            this.saveLocalCache();
            this.notifyListeners();
          } else if (data.type === 'JOB_DELETED') {
            this.jobsCache = this.jobsCache.filter(j => j.id !== data.payload.id);
            this.saveLocalCache();
            this.notifyListeners();
          } else if (data.type && data.type.startsWith('STAFF_')) {
            StaffService.handleSSE(data.type, data.payload);
          }
        } catch (err) {
          console.error('SSE Message parse error:', err);
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        // Auto-reconnect after 3 seconds
        setTimeout(() => this.connectSSE(), 3000);
      };
    } catch (e) {
      console.warn('SSE not available, falling back to polling:', e);
    }
  }

  private static saveLocalCache() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.jobsCache));
    } catch (e) {
      // storage full or disabled
    }
  }

  static async fetchJobs(): Promise<VehicleJob[]> {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        this.jobsCache = data.jobs || [];
        if (data.connectedDevices) {
          this.connectedClients = data.connectedDevices;
        }
        this.saveLocalCache();
        this.notifyListeners();
        return this.jobsCache;
      }
    } catch (err) {
      console.warn('Fetch jobs failed, loading from local cache:', err);
    }

    // Fallback
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        this.jobsCache = JSON.parse(local);
        this.notifyListeners();
      }
    } catch (e) {
      // ignore
    }
    return this.jobsCache;
  }

  static async createJob(jobData: Partial<VehicleJob>): Promise<VehicleJob> {
    const activeStaff = staffStorage.getActiveStaff();
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...jobData,
        assignedStaff: jobData.assignedStaff || activeStaff.name,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to create job');
    }
    const created = await res.json();
    this.jobsCache = [created, ...this.jobsCache.filter(j => j.id !== created.id)];
    this.saveLocalCache();
    this.notifyListeners();
    return created;
  }

  static async updateJob(id: string, updates: Partial<VehicleJob>, logAction?: string, logDetails?: string): Promise<VehicleJob> {
    const activeStaff = staffStorage.getActiveStaff();
    const res = await fetch(`/api/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...updates,
        _logAction: logAction,
        _logDetails: logDetails,
        _staffName: activeStaff.name,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to update job');
    }
    const updated = await res.json();
    this.jobsCache = this.jobsCache.map(j => (j.id === id ? updated : j));
    this.saveLocalCache();
    this.notifyListeners();
    return updated;
  }

  static async recordVehicleEntry(id: string): Promise<VehicleJob> {
    const activeStaff = staffStorage.getActiveStaff();
    const res = await fetch(`/api/jobs/${id}/entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffName: activeStaff.name }),
    });

    if (!res.ok) {
      throw new Error('Failed to record vehicle entry');
    }
    const updated = await res.json();
    this.jobsCache = this.jobsCache.map(j => (j.id === id ? updated : j));
    this.saveLocalCache();
    this.notifyListeners();
    return updated;
  }

  static async updateStep(id: string, stepId: number, stepName: string, note?: string): Promise<VehicleJob> {
    const activeStaff = staffStorage.getActiveStaff();
    const res = await fetch(`/api/jobs/${id}/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepId,
        stepName,
        staffName: activeStaff.name,
        note,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to update step');
    }
    const updated = await res.json();
    this.jobsCache = this.jobsCache.map(j => (j.id === id ? updated : j));
    this.saveLocalCache();
    this.notifyListeners();
    return updated;
  }

  static async updateChecklist(id: string, checklist: Record<string, any>): Promise<VehicleJob> {
    const activeStaff = staffStorage.getActiveStaff();
    const res = await fetch(`/api/jobs/${id}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checklist,
        staffName: activeStaff.name,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to update checklist');
    }
    const updated = await res.json();
    this.jobsCache = this.jobsCache.map(j => (j.id === id ? updated : j));
    this.saveLocalCache();
    this.notifyListeners();
    return updated;
  }

  static async deleteJob(id: string): Promise<void> {
    const res = await fetch(`/api/jobs/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to delete job');
    }
    this.jobsCache = this.jobsCache.filter(j => j.id !== id);
    this.saveLocalCache();
    this.notifyListeners();
  }

  static async resetDemo(): Promise<void> {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (res.ok) {
      await this.fetchJobs();
    }
  }
}
