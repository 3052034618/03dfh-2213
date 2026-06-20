import { create } from 'zustand';
import type { Waybill, ReceiptForm, RiskLevel } from '@/types';
import { mockWaybills } from '@/data/mock';

interface ArrivalReminder {
  waybillId: string;
  waybillNo: string;
  goodsName: string;
  minutesLeft: number;
  predictTemp: number;
  predictRisk: RiskLevel;
  triggered: boolean;
  isRead: boolean;
  isSnoozed: boolean;
}

interface SnoozeInfo {
  snoozeUntil: number;
  lastRisk: RiskLevel;
  originalMinutesLeft: number;
}

interface ReceiptQueueGroup {
  title: string;
  waybills: Waybill[];
}

interface WaybillStore {
  waybills: Waybill[];
  currentWaybill: Waybill | null;
  receiptRecords: Record<string, ReceiptForm>;
  searchKeyword: string;
  statusFilter: string;
  selectedReceiptWaybillId: string | null;
  arrivalReminders: ArrivalReminder[];
  nowTimestamp: number;
  snoozedReminders: Record<string, SnoozeInfo>;
  readReminders: Record<string, boolean>;
  setSearchKeyword: (keyword: string) => void;
  setStatusFilter: (status: string) => void;
  setCurrentWaybill: (waybill: Waybill | null) => void;
  setSelectedReceiptWaybillId: (id: string | null) => void;
  getWaybillById: (id: string) => Waybill | undefined;
  getWaybillByNo: (no: string) => Waybill | undefined;
  saveReceipt: (waybillId: string, form: ReceiptForm) => void;
  getReceipt: (waybillId: string) => ReceiptForm | undefined;
  getFilteredWaybills: () => Waybill[];
  tickNow: () => void;
  getArrivalReminders: (includeSnoozed?: boolean) => ArrivalReminder[];
  getWaybillArrivingIn30Min: (waybillId: string) => ArrivalReminder | null;
  snoozeReminder: (waybillId: string) => void;
  readReminder: (waybillId: string) => void;
  getReceiptQueue: () => ReceiptQueueGroup[];
  getNextPendingReceipt: (currentId?: string) => Waybill | null;
}

const calcPredictTemp = (w: Waybill): number => {
  if (w.tempHistory.length === 0) return w.currentTemp;
  const recent = w.tempHistory.slice(-3);
  const avg = recent.reduce((s, t) => s + t.value, 0) / recent.length;
  return Number((avg + (w.currentTemp - avg) * 0.5).toFixed(1));
};

const calcPredictRisk = (temp: number, min: number, max: number): RiskLevel => {
  if (temp >= min && temp <= max) return 'low';
  if (temp >= min - 2 && temp <= max + 2) return 'warn';
  return 'high';
};

const riskOrder: Record<RiskLevel, number> = { low: 0, warn: 1, high: 2 };

export const useWaybillStore = create<WaybillStore>((set, get) => ({
  waybills: mockWaybills,
  currentWaybill: null,
  receiptRecords: {},
  searchKeyword: '',
  statusFilter: 'all',
  selectedReceiptWaybillId: null,
  arrivalReminders: [],
  nowTimestamp: Date.now(),
  snoozedReminders: {},
  readReminders: {},

  setSearchKeyword: (keyword: string) => set({ searchKeyword: keyword }),
  setStatusFilter: (status: string) => set({ statusFilter: status }),
  setCurrentWaybill: (waybill: Waybill | null) => set({ currentWaybill: waybill }),
  setSelectedReceiptWaybillId: (id: string | null) => {
    console.log('[Store] 设置验温运单ID:', id);
    set({ selectedReceiptWaybillId: id });
  },

  getWaybillById: (id: string) => get().waybills.find(w => w.id === id),
  getWaybillByNo: (no: string) => get().waybills.find(w => w.waybillNo.toLowerCase().includes(no.toLowerCase())),

  saveReceipt: (waybillId: string, form: ReceiptForm) => {
    console.log('[Store] 保存验温记录:', waybillId, form);
    set(state => ({
      receiptRecords: {
        ...state.receiptRecords,
        [waybillId]: form
      }
    }));
  },

  getReceipt: (waybillId: string) => get().receiptRecords[waybillId],

  getFilteredWaybills: () => {
    const { waybills, searchKeyword, statusFilter } = get();
    return waybills.filter(w => {
      const matchKeyword = !searchKeyword ||
        w.waybillNo.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        w.goodsName.includes(searchKeyword) ||
        w.receiver.includes(searchKeyword);
      const matchStatus = statusFilter === 'all' || w.status === statusFilter;
      return matchKeyword && matchStatus;
    });
  },

  tickNow: () => set({ nowTimestamp: Date.now() }),

  getArrivalReminders: (includeSnoozed = false) => {
    const { waybills, nowTimestamp, receiptRecords, snoozedReminders, readReminders } = get();
    const reminders: ArrivalReminder[] = [];
    for (const w of waybills) {
      if (w.status === 'completed' || w.status === 'pending') continue;
      if (receiptRecords[w.id]) continue;
      const etaMs = new Date(w.estimatedArrival).getTime() - nowTimestamp;
      const minutesLeft = Math.round(etaMs / 60000);
      if (minutesLeft >= 0 && minutesLeft <= 30) {
        const predictTemp = calcPredictTemp(w);
        const predictRisk = calcPredictRisk(predictTemp, w.agreeTempRange.min, w.agreeTempRange.max);

        let isSnoozed = false;
        const snoozeInfo = snoozedReminders[w.id];
        if (snoozeInfo && !includeSnoozed) {
          const within10Min = minutesLeft <= 10;
          const riskIncreased = riskOrder[predictRisk] > riskOrder[snoozeInfo.lastRisk];
          const snoozeExpired = nowTimestamp > snoozeInfo.snoozeUntil;
          isSnoozed = !within10Min && !riskIncreased && !snoozeExpired;
        }

        reminders.push({
          waybillId: w.id,
          waybillNo: w.waybillNo,
          goodsName: w.goodsName,
          minutesLeft,
          predictTemp,
          predictRisk,
          triggered: minutesLeft <= 30,
          isRead: !!readReminders[w.id],
          isSnoozed
        });
      }
    }
    return reminders.sort((a, b) => {
      if (a.isSnoozed !== b.isSnoozed) return a.isSnoozed ? 1 : -1;
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return a.minutesLeft - b.minutesLeft;
    });
  },

  getWaybillArrivingIn30Min: (waybillId: string) => {
    const all = get().getArrivalReminders(true);
    return all.find(r => r.waybillId === waybillId) || null;
  },

  snoozeReminder: (waybillId: string) => {
    const { nowTimestamp, getWaybillById } = get();
    const waybill = getWaybillById(waybillId);
    if (!waybill) return;
    const predictTemp = calcPredictTemp(waybill);
    const predictRisk = calcPredictRisk(predictTemp, waybill.agreeTempRange.min, waybill.agreeTempRange.max);
    const etaMs = new Date(waybill.estimatedArrival).getTime() - nowTimestamp;
    const minutesLeft = Math.round(etaMs / 60000);
    console.log('[Store] 稍后提醒:', waybillId, '风险:', predictRisk);
    set(state => ({
      snoozedReminders: {
        ...state.snoozedReminders,
        [waybillId]: {
          snoozeUntil: nowTimestamp + 20 * 60 * 1000,
          lastRisk: predictRisk,
          originalMinutesLeft: minutesLeft
        }
      }
    }));
  },

  readReminder: (waybillId: string) => {
    console.log('[Store] 标记已读:', waybillId);
    set(state => ({
      readReminders: {
        ...state.readReminders,
        [waybillId]: true
      }
    }));
  },

  getReceiptQueue: () => {
    const { waybills, nowTimestamp, receiptRecords } = get();
    const arriving: Waybill[] = [];
    const arrived: Waybill[] = [];
    const done: Waybill[] = [];
    for (const w of waybills) {
      if (w.status === 'pending') continue;
      const hasReceipt = !!receiptRecords[w.id];
      if (hasReceipt) {
        done.push(w);
        continue;
      }
      const etaMs = new Date(w.estimatedArrival).getTime() - nowTimestamp;
      const minutesLeft = Math.round(etaMs / 60000);
      if (minutesLeft <= 30 && minutesLeft >= 0) {
        arriving.push(w);
      } else if (minutesLeft < 0 || w.status === 'arriving' || w.status === 'completed') {
        arrived.push(w);
      }
    }
    const sortByEta = (a: Waybill, b: Waybill) =>
      new Date(a.estimatedArrival).getTime() - new Date(b.estimatedArrival).getTime();
    arriving.sort(sortByEta);
    arrived.sort(sortByEta);
    done.sort((a, b) => {
      const ra = receiptRecords[a.id];
      const rb = receiptRecords[b.id];
      if (!ra || !rb) return 0;
      return new Date(rb.operateTime || 0).getTime() - new Date(ra.operateTime || 0).getTime();
    });
    const groups: ReceiptQueueGroup[] = [];
    if (arriving.length > 0) groups.push({ title: '即将到达（30分钟内）', waybills: arriving });
    if (arrived.length > 0) groups.push({ title: '已到达，待验温', waybills: arrived });
    if (done.length > 0) groups.push({ title: '已验温', waybills: done });
    console.log('[Store] 待验温队列:', groups);
    return groups;
  },

  getNextPendingReceipt: (currentId?: string) => {
    const queue = get().getReceiptQueue();
    const pending = queue.filter(g => g.title !== '已验温').flatMap(g => g.waybills);
    if (!currentId) return pending[0] || null;
    const idx = pending.findIndex(w => w.id === currentId);
    if (idx === -1) return pending[0] || null;
    return pending[idx + 1] || null;
  }
}));
