import { create } from 'zustand';
import type { Waybill, ReceiptForm } from '@/types';
import { mockWaybills } from '@/data/mock';

interface WaybillStore {
  waybills: Waybill[];
  currentWaybill: Waybill | null;
  receiptRecords: Record<string, ReceiptForm>;
  searchKeyword: string;
  statusFilter: string;
  setSearchKeyword: (keyword: string) => void;
  setStatusFilter: (status: string) => void;
  setCurrentWaybill: (waybill: Waybill | null) => void;
  getWaybillById: (id: string) => Waybill | undefined;
  getWaybillByNo: (no: string) => Waybill | undefined;
  saveReceipt: (waybillId: string, form: ReceiptForm) => void;
  getReceipt: (waybillId: string) => ReceiptForm | undefined;
  getFilteredWaybills: () => Waybill[];
}

export const useWaybillStore = create<WaybillStore>((set, get) => ({
  waybills: mockWaybills,
  currentWaybill: null,
  receiptRecords: {},
  searchKeyword: '',
  statusFilter: 'all',
  setSearchKeyword: (keyword: string) => set({ searchKeyword: keyword }),
  setStatusFilter: (status: string) => set({ statusFilter: status }),
  setCurrentWaybill: (waybill: Waybill | null) => set({ currentWaybill: waybill }),
  getWaybillById: (id: string) => get().waybills.find(w => w.id === id),
  getWaybillByNo: (no: string) => get().waybills.find(w => w.waybillNo.toLowerCase().includes(no.toLowerCase())),
  saveReceipt: (waybillId: string, form: ReceiptForm) => {
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
  }
}));
