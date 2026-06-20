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
  getArrivalReminders: () => ArrivalReminder[];
  getWaybillArrivingIn30Min: (waybillId: string) => ArrivalReminder | null;
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

export const useWaybillStore = create<WaybillStore>((set, get) => ({
  waybills: mockWaybills,
  currentWaybill: null,
  receiptRecords: {},
  searchKeyword: '',
  statusFilter: 'all',
  selectedReceiptWaybillId: null,
  arrivalReminders: [],
  nowTimestamp: Date.now(),
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
  getArrivalReminders: () => {
    const { waybills, nowTimestamp, receiptRecords } = get();
    const reminders: ArrivalReminder[] = [];
    for (const w of waybills) {
      if (w.status === 'completed' || w.status === 'pending') continue;
      if (receiptRecords[w.id]) continue;
      const etaMs = new Date(w.estimatedArrival).getTime() - nowTimestamp;
      const minutesLeft = Math.round(etaMs / 60000);
      if (minutesLeft >= 0 && minutesLeft <= 30) {
        const predictTemp = calcPredictTemp(w);
        const predictRisk = calcPredictRisk(predictTemp, w.agreeTempRange.min, w.agreeTempRange.max);
        reminders.push({
          waybillId: w.id,
          waybillNo: w.waybillNo,
          goodsName: w.goodsName,
          minutesLeft,
          predictTemp,
          predictRisk,
          triggered: minutesLeft <= 30
        });
      }
    }
    console.log('[Store] 获取30分钟内到达提醒:', reminders.length, '条');
    return reminders.sort((a, b) => a.minutesLeft - b.minutesLeft);
  },
  getWaybillArrivingIn30Min: (waybillId: string) => {
    const all = get().getArrivalReminders();
    return all.find(r => r.waybillId === waybillId) || null;
  }
}));
