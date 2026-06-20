import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useWaybillStore } from '@/store/waybill';
import type { RiskLevel } from '@/types';
import { getRiskLevelText, getRiskColor, getRiskBgColor } from '@/utils';

interface ArrivalReminderProps {
  currentWaybillId?: string | null;
}

const getRiskTempDesc = (risk: RiskLevel, temp: number, min: number, max: number) => {
  switch (risk) {
    case 'low':
      return `${temp}°C，正常范围内`;
    case 'warn':
      if (temp < min) return `${temp}°C，略低于约定范围，需关注`;
      if (temp > max) return `${temp}°C，略高于约定范围，需关注`;
      return `${temp}°C，接近约定范围边界，需关注`;
    case 'high':
      if (temp < min) return `${temp}°C，低于约定范围，建议联系司机`;
      if (temp > max) return `${temp}°C，高于约定范围，建议联系司机`;
      return `${temp}°C，偏离约定范围，建议联系司机`;
  }
};

const ArrivalReminder: React.FC<ArrivalReminderProps> = ({ currentWaybillId }) => {
  const {
    getArrivalReminders,
    nowTimestamp,
    tickNow,
    getWaybillById,
    setSelectedReceiptWaybillId,
    setCurrentWaybill,
    receiptRecords,
    readReminder,
    snoozeReminder
  } = useWaybillStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    tickNow();
    timerRef.current = setInterval(() => {
      tickNow();
    }, 15000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tickNow]);

  const reminders = useMemo(() => {
    const all = getArrivalReminders();
    return all.filter(r => !r.isSnoozed);
  }, [getArrivalReminders, nowTimestamp, receiptRecords]);

  const displayReminders = useMemo(() => {
    if (currentWaybillId) {
      const match = reminders.find(r => r.waybillId === currentWaybillId);
      return match ? [match] : [];
    }
    return reminders;
  }, [reminders, currentWaybillId]);

  const handleGoReceipt = (waybillId: string) => {
    readReminder(waybillId);
    const waybill = getWaybillById(waybillId);
    if (waybill) {
      setCurrentWaybill(waybill);
    }
    setSelectedReceiptWaybillId(waybillId);
    Taro.switchTab({ url: '/pages/receipt/index' });
  };

  const handleGoProgress = (waybillId: string) => {
    readReminder(waybillId);
    const waybill = getWaybillById(waybillId);
    if (waybill) {
      setCurrentWaybill(waybill);
    }
    Taro.switchTab({ url: '/pages/progress/index' });
  };

  const handleSnooze = (e: any, waybillId: string) => {
    e.stopPropagation();
    console.log('[ArrivalReminder] 稍后提醒:', waybillId);
    snoozeReminder(waybillId);
  };

  const handleRead = (e: any, waybillId: string) => {
    e.stopPropagation();
    console.log('[ArrivalReminder] 标记已读:', waybillId);
    readReminder(waybillId);
  };

  if (displayReminders.length === 0) return null;

  return (
    <View className={styles.wrapper}>
      {displayReminders.map((r) => {
        const waybill = getWaybillById(r.waybillId);
        if (!waybill) return null;
        const riskColor = getRiskColor(r.predictRisk);
        const riskBg = getRiskBgColor(r.predictRisk);
        const riskText = getRiskLevelText(r.predictRisk);
        const tempDesc = getRiskTempDesc(
          r.predictRisk,
          Number(r.predictTemp.toFixed(1)),
          waybill.agreeTempRange.min,
          waybill.agreeTempRange.max
        );

        return (
          <View
            key={r.waybillId}
            className={classnames(
              styles.card,
              r.predictRisk === 'warn' && styles.cardWarn,
              r.predictRisk === 'high' && styles.cardHigh,
              r.isRead && styles.cardRead
            )}
            onClick={() => handleGoProgress(r.waybillId)}
          >
            <View className={styles.header}>
              <Text className={styles.icon}>🔔</Text>
              <Text className={styles.title}>
                {r.minutesLeft <= 10 ? '即将到达' : '到货提醒'}
              </Text>
              <View
                className={styles.riskTag}
                style={{ background: riskBg, color: riskColor }}
              >
                {riskText}
              </View>
            </View>
            <View className={styles.body}>
              <Text className={styles.goodsName}>
                {r.goodsName}
                <Text className={styles.waybillNo}>  {r.waybillNo}</Text>
              </Text>
              <Text className={styles.timeText}>
                约{r.minutesLeft}分钟后到达 · 预计到货温度
                <Text style={{ color: riskColor, fontWeight: 600 }}> {tempDesc}</Text>
              </Text>
            </View>
            <View className={styles.actions}>
              <View
                className={styles.actionReceipt}
                onClick={(e) => {
                  e.stopPropagation();
                  handleGoReceipt(r.waybillId);
                }}
              >
                📋 去验温
              </View>
              {r.predictRisk !== 'low' && (
                <View
                  className={styles.actionCall}
                  onClick={(e) => {
                    e.stopPropagation();
                    Taro.makePhoneCall({ phoneNumber: waybill.driverPhone });
                  }}
                >
                  📞 联系司机
                </View>
              )}
              <View
                className={styles.actionSnooze}
                onClick={(e) => handleSnooze(e, r.waybillId)}
              >
                ⏰ 稍后
              </View>
              <View
                className={styles.actionRead}
                onClick={(e) => handleRead(e, r.waybillId)}
              >
                ✓
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default ArrivalReminder;
