import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import ArrivalReminder from '@/components/ArrivalReminder';
import { useWaybillStore } from '@/store/waybill';
import type { ArrivalReminder as ArrivalReminderType } from '@/store/waybill';
import { getRiskLevelText, getRiskColor, formatTime, maskPhone } from '@/utils';

interface TabConfig {
  key: string;
  title: string;
  emptyIcon: string;
  emptyTitle: string;
  emptyDesc: string;
  getData: (center: ReturnType<typeof useWaybillStore.getState.getReminderCenter>) => ArrivalReminderType[];
}

const RemindersPage: React.FC = () => {
  const {
    tickNow,
    getReminderCenter,
    nowTimestamp,
    getWaybillById,
    setCurrentWaybill,
    setSelectedReceiptWaybillId,
    snoozeReminder,
    readReminder
  } = useWaybillStore();

  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    tickNow();
    const timer = setInterval(() => {
      tickNow();
    }, 15000);
    return () => clearInterval(timer);
  }, [tickNow]);

  const center = useMemo(() => getReminderCenter(), [getReminderCenter, nowTimestamp]);

  const tabs: TabConfig[] = [
    {
      key: 'pending',
      title: '待处理',
      emptyIcon: '✅',
      emptyTitle: '暂无待处理提醒',
      emptyDesc: '当前没有需要处理的到货提醒，\n请稍后再来查看。',
      getData: (c) => c.pending
    },
    {
      key: 'read',
      title: '已读',
      emptyIcon: '📖',
      emptyTitle: '暂无已读提醒',
      emptyDesc: '您阅读过的提醒将显示在这里。',
      getData: (c) => c.read
    },
    {
      key: 'snoozed',
      title: '稍后',
      emptyIcon: '⏰',
      emptyTitle: '暂无稍后提醒',
      emptyDesc: '您点击"稍后提醒"的运单将显示在这里，\n进入10分钟内或风险升高时会重新提醒。',
      getData: (c) => c.snoozed
    },
    {
      key: 'handled',
      title: '已处理',
      emptyIcon: '🎉',
      emptyTitle: '暂无已处理运单',
      emptyDesc: '已验收温的运单将显示在这里。',
      getData: (c) => c.handled
    }
  ];

  const currentTab = tabs[activeTab];
  const reminders = currentTab.getData(center);

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

  const handleGoDetail = (waybillId: string) => {
    readReminder(waybillId);
    Taro.navigateTo({ url: `/pages/detail/index?id=${waybillId}` });
  };

  const handleSnooze = (e: any, waybillId: string) => {
    e.stopPropagation();
    snoozeReminder(waybillId);
    Taro.showToast({ title: '已设置稍后提醒', icon: 'none' });
  };

  const handleRead = (e: any, waybillId: string) => {
    e.stopPropagation();
    readReminder(waybillId);
    if (activeTab !== 1) {
      setActiveTab(1);
    }
  };

  const handleCallDriver = (e: any, waybillId: string) => {
    e.stopPropagation();
    const waybill = getWaybillById(waybillId);
    if (waybill) {
      Taro.makePhoneCall({ phoneNumber: waybill.driverPhone });
    }
  };

  const totalCount = center.pending.length + center.read.length + center.snoozed.length + center.handled.length;

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>提醒中心</Text>
        <Text className={styles.subtitle}>集中管理到货提醒，不错过任何异常</Text>
      </View>

      <View className={styles.content}>
        {totalCount > 0 && (
          <View className={styles.statsBar}>
            <View className={styles.statItem}>
              <Text className={styles.statNum} style={{ color: '#FF9800' }}>
                {center.pending.length}
              </Text>
              <Text className={styles.statLabel}>待处理</Text>
            </View>
            <View className={styles.statDivider} />
            <View className={styles.statItem}>
              <Text className={styles.statNum} style={{ color: '#1E88E5' }}>
                {center.read.length + center.snoozed.length}
              </Text>
              <Text className={styles.statLabel}>处理中</Text>
            </View>
            <View className={styles.statDivider} />
            <View className={styles.statItem}>
              <Text className={styles.statNum} style={{ color: '#4CAF50' }}>
                {center.handled.length}
              </Text>
              <Text className={styles.statLabel}>已处理</Text>
            </View>
          </View>
        )}

        <View className={styles.tabs}>
          {tabs.map((tab, idx) => (
            <View
              key={tab.key}
              className={classnames(styles.tab, activeTab === idx && styles.tabActive)}
              onClick={() => setActiveTab(idx)}
            >
              <Text>{tab.title}</Text>
              <Text className={styles.tabCount}>{tab.getData(center).length}</Text>
            </View>
          ))}
        </View>

        {reminders.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>{currentTab.emptyIcon}</Text>
            <Text className={styles.emptyTitle}>{currentTab.emptyTitle}</Text>
            <Text className={styles.emptyDesc}>{currentTab.emptyDesc}</Text>
          </View>
        ) : (
          reminders.map((r) => {
            const waybill = getWaybillById(r.waybillId);
            if (!waybill) return null;
            const riskColor = getRiskColor(r.predictRisk);
            const riskText = getRiskLevelText(r.predictRisk);
            const isHandled = currentTab.key === 'handled';

            return (
              <View
                key={r.waybillId}
                className={classnames(
                  'card',
                  r.predictRisk === 'warn' && 'card-warn',
                  r.predictRisk === 'high' && 'card-high',
                  r.isRead && 'card-read'
                )}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16rpx',
                  padding: '24rpx',
                  marginBottom: '16rpx',
                  boxShadow: '0 2rpx 16rpx rgba(0,0,0,0.06)',
                  border: r.isRead ? '2rpx solid transparent' : '2rpx solid transparent',
                  borderLeft: `8rpx solid ${riskColor}`
                }}
                onClick={() => handleGoDetail(r.waybillId)}
              >
                <View style={{ display: 'flex', alignItems: 'center', gap: '16rpx', marginBottom: '12rpx' }}>
                  <Text style={{ fontSize: '32rpx' }}>🔔</Text>
                  <Text style={{ fontSize: '28rpx', fontWeight: 600, color: '#1D2129', flex: 1 }}>
                    {r.minutesLeft <= 10 ? '即将到达' : '到货提醒'}
                  </Text>
                  <Text style={{
                    padding: '4rpx 14rpx',
                    borderRadius: '20rpx',
                    fontSize: '20rpx',
                    fontWeight: 500,
                    background: `${riskColor}15`,
                    color: riskColor
                  }}>
                    {riskText}
                  </Text>
                </View>
                <Text style={{ fontSize: '26rpx', color: '#1D2129', fontWeight: 500, marginBottom: '4rpx', display: 'block' }}>
                  {r.goodsName} <Text style={{ fontSize: '22rpx', color: '#86909C', fontWeight: 400 }}>{r.waybillNo}</Text>
                </Text>
                <Text style={{ fontSize: '24rpx', color: '#4E5969', lineHeight: 1.6, display: 'block' }}>
                  约{r.minutesLeft}分钟后到达 · 预测到货温度
                  <Text style={{ color: riskColor, fontWeight: 600 }}> {r.predictTemp.toFixed(1)}°C</Text>
                </Text>
                {!isHandled && (
                  <View style={{ display: 'flex', gap: '12rpx', marginTop: '16rpx' }}>
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleGoReceipt(r.waybillId); }}
                      style={{
                        flex: 1,
                        height: '68rpx',
                        background: '#1E88E5',
                        color: '#FFFFFF',
                        borderRadius: '8rpx',
                        fontSize: '24rpx',
                        fontWeight: 500
                      }}
                    >
                      📋 去验温
                    </Button>
                    {r.predictRisk !== 'low' && (
                      <Button
                        onClick={(e) => handleCallDriver(e, r.waybillId)}
                        style={{
                          flex: 1,
                          height: '68rpx',
                          background: '#FFF3E0',
                          color: '#FF9800',
                          borderRadius: '8rpx',
                          fontSize: '24rpx',
                          fontWeight: 500
                        }}
                      >
                        📞 联系司机
                      </Button>
                    )}
                    {currentTab.key !== 'snoozed' && (
                      <Button
                        onClick={(e) => handleSnooze(e, r.waybillId)}
                        style={{
                          flex: 0.7,
                          height: '68rpx',
                          background: '#F5F9FF',
                          color: '#4E5969',
                          borderRadius: '8rpx',
                          fontSize: '22rpx',
                          fontWeight: 500
                        }}
                      >
                        ⏰ 稍后
                      </Button>
                    )}
                    {currentTab.key !== 'read' && (
                      <Button
                        onClick={(e) => handleRead(e, r.waybillId)}
                        style={{
                          width: '68rpx',
                          height: '68rpx',
                          background: '#E8F5E9',
                          color: '#4CAF50',
                          borderRadius: '8rpx',
                          fontSize: '28rpx',
                          fontWeight: 600
                        }}
                      >
                        ✓
                      </Button>
                    )}
                  </View>
                )}
                {isHandled && (
                  <View style={{ display: 'flex', gap: '12rpx', marginTop: '16rpx' }}>
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleGoDetail(r.waybillId); }}
                      style={{
                        flex: 1,
                        height: '68rpx',
                        background: '#F5F9FF',
                        color: '#1E88E5',
                        borderRadius: '8rpx',
                        fontSize: '24rpx',
                        fontWeight: 500
                      }}
                    >
                      📋 查看详情
                    </Button>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </View>
  );
};

export default RemindersPage;
