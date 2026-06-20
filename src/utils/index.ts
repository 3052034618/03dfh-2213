import dayjs from 'dayjs';
import type { RiskLevel, WaybillStatus } from '@/types';

export const formatTime = (time: string, format: string = 'MM-DD HH:mm'): string => {
  return dayjs(time).format(format);
};

export const formatFullTime = (time: string): string => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
};

export const getRiskColor = (level: RiskLevel): string => {
  const colors: Record<RiskLevel, string> = {
    low: '#4CAF50',
    warn: '#FF9800',
    high: '#F44336'
  };
  return colors[level];
};

export const getRiskBgColor = (level: RiskLevel): string => {
  const colors: Record<RiskLevel, string> = {
    low: 'rgba(76, 175, 80, 0.1)',
    warn: 'rgba(255, 152, 0, 0.1)',
    high: 'rgba(244, 67, 54, 0.1)'
  };
  return colors[level];
};

export const getRiskText = (level: RiskLevel): string => {
  const texts: Record<RiskLevel, string> = {
    low: '低风险',
    warn: '需关注',
    high: '建议联系司机'
  };
  return texts[level];
};

export const getRiskLevelText = getRiskText;

export const getStatusText = (status: WaybillStatus): string => {
  const texts: Record<WaybillStatus, string> = {
    pending: '待装车',
    loading: '装车中',
    transit: '运输中',
    arriving: '即将到达',
    completed: '已完成'
  };
  return texts[status];
};

export const getStatusColor = (status: WaybillStatus): string => {
  const colors: Record<WaybillStatus, string> = {
    pending: '#86909C',
    loading: '#1E88E5',
    transit: '#1E88E5',
    arriving: '#FF9800',
    completed: '#4CAF50'
  };
  return colors[status];
};

export const getTempStatus = (temp: number, min: number, max: number): RiskLevel => {
  if (temp >= min && temp <= max) return 'low';
  if (temp >= min - 2 && temp <= max + 2) return 'warn';
  return 'high';
};

export const getPackageConditionText = (condition: string): string => {
  const texts: Record<string, string> = {
    good: '包装完好',
    slight_damage: '轻微破损',
    damaged: '严重破损'
  };
  return texts[condition] || condition;
};

export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
};
