import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TemperatureCard from '@/components/TemperatureCard';
import ProgressTimeline from '@/components/ProgressTimeline';
import RiskBadge from '@/components/RiskBadge';
import WarningRecord from '@/components/WarningRecord';
import ArrivalReminder from '@/components/ArrivalReminder';
import ExceptionCard from '@/components/ExceptionCard';
import { useWaybillStore } from '@/store/waybill';
import type { Waybill } from '@/types';
import { formatTime, maskPhone, getPackageConditionText, formatFullTime } from '@/utils';

const ProgressPage: React.FC = () => {
  const {
    waybills,
    getWaybillById,
    currentWaybill: storeCurrentWaybill,
    nowTimestamp,
    tickNow,
    setSelectedReceiptWaybillId,
    setCurrentWaybill,
    getReceipt,
    getExceptionsByWaybill
  } = useWaybillStore();

  const [currentWaybillId, setCurrentWaybillId] = useState<string>('1');

  useEffect(() => {
    if (storeCurrentWaybill) {
      setCurrentWaybillId(storeCurrentWaybill.id);
    }
  }, [storeCurrentWaybill]);

  useEffect(() => {
    tickNow();
    const timer = setInterval(() => {
      tickNow();
    }, 30000);
    return () => clearInterval(timer);
  }, [tickNow]);

  const activeWaybills = useMemo(
    () => waybills.filter((w: Waybill) => w.status !== 'completed'),
    [waybills]
  );

  const currentWaybill = useMemo(
    () => getWaybillById(currentWaybillId) || activeWaybills[0],
    [currentWaybillId, activeWaybills, getWaybillById]
  );

  const handleSelectWaybill = () => {
    const items = activeWaybills.map((w: Waybill) => ({
      id: w.id,
      name: `${w.waybillNo} - ${w.goodsName}`
    }));
    Taro.showActionSheet({
      itemList: items.map(i => i.name),
      success: (res) => {
        const selected = items[res.tapIndex];
        setCurrentWaybillId(selected.id);
        const w = getWaybillById(selected.id);
        if (w) setCurrentWaybill(w);
      }
    });
  };

  const handleCallDriver = () => {
    if (!currentWaybill) return;
    Taro.makePhoneCall({ phoneNumber: currentWaybill.driverPhone });
  };

  const handleGoReceipt = () => {
    if (!currentWaybill) return;
    setCurrentWaybill(currentWaybill);
    setSelectedReceiptWaybillId(currentWaybill.id);
    Taro.switchTab({ url: '/pages/receipt/index' });
  };

  const goToWaybills = () => {
    Taro.switchTab({ url: '/pages/waybills/index' });
  };

  if (!currentWaybill) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🚚</Text>
          <Text className={styles.emptyTitle}>暂无进行中的运单</Text>
          <Text className={styles.emptyDesc}>
            当前没有正在运输的运单{'\n'}
            请在运单列表中查看历史运单
          </Text>
          <Button className={styles.emptyBtn} onClick={goToWaybills}>
            查看运单列表
          </Button>
        </View>
      </View>
    );
  }

  const etaMs = new Date(currentWaybill.estimatedArrival).getTime() - nowTimestamp;
  const hoursLeft = Math.max(0, Math.floor(etaMs / (1000 * 60 * 60)));
  const minsLeft = Math.max(0, Math.floor((etaMs % (1000 * 60 * 60)) / (1000 * 60)));

  const receipt = getReceipt(currentWaybill.id);
  const hasReceipt = !!receipt;
  const exceptions = getExceptionsByWaybill(currentWaybill.id);

  return (
    <View className={styles.page}>
      <View className={styles.selectorCard}>
        <Text className={styles.selectorLabel}>当前追踪运单</Text>
        <View className={styles.selectorRow}>
          <View className={styles.selectorInfo}>
            <Text className={styles.selectorNo}>{currentWaybill.waybillNo}</Text>
            <Text className={styles.selectorGoods}>
              {currentWaybill.goodsName} · {currentWaybill.receiver}
            </Text>
          </View>
          <Button className={styles.selectorBtn} onClick={handleSelectWaybill}>
            切换
          </Button>
        </View>
      </View>

      <View className={styles.etaCard}>
        <View className={styles.etaHeader}>
          <Text className={styles.etaTitle}>预计到达时间</Text>
          <View className={styles.etaStatus}>{currentWaybill.statusText}</View>
        </View>
        <Text className={styles.etaTime}>
          {formatTime(currentWaybill.estimatedArrival, 'HH:mm')}
        </Text>
        <Text className={styles.etaDate}>
          {formatTime(currentWaybill.estimatedArrival, 'YYYY年MM月DD日 dddd')}
        </Text>
        <View className={styles.etaCountdown}>
          {etaMs > 0 ? (
            <Text>
              距到达还有 {hoursLeft > 0 ? `${hoursLeft}小时` : ''}{minsLeft}分钟
            </Text>
          ) : (
            <Text>预计已到达</Text>
          )}
        </View>
      </View>

      <View style={{ margin: `0 ${32}rpx` }}>
        <ArrivalReminder currentWaybillId={currentWaybill.id} />
      </View>

      {currentWaybill.riskLevel === 'high' && (
        <View className={styles.noticeTip}>
          <Text className={styles.noticeIcon}>⚠️</Text>
          <Text className={styles.noticeText}>
            检测到<Text className={styles.noticeHighlight}>高风险预警</Text>，
            建议立即联系司机确认运输状态，避免货物变质。
          </Text>
        </View>
      )}

      <View style={{ margin: `0 ${32}rpx ${24}rpx` }}>
        <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontSize: 32, fontWeight: 600, color: '#1D2129' }}>风险评估</Text>
          <RiskBadge level={currentWaybill.riskLevel} />
        </View>
      </View>

      <TemperatureCard waybill={currentWaybill} />

      <Text className={styles.sectionTitle}>运输路线</Text>
      <ProgressTimeline
        points={currentWaybill.routePoints}
        progress={currentWaybill.progress}
      />

      <Text className={styles.sectionTitle}>车辆与司机</Text>
      <View className={styles.vehicleCard}>
        <View className={styles.vehicleHeader}>
          <View className={styles.vehicleInfo}>
            <Text className={styles.plateNo}>{currentWaybill.plateNo}</Text>
            <Text className={styles.carrier}>{currentWaybill.carrier}</Text>
          </View>
          <Button className={styles.callBtn} onClick={handleCallDriver}>
            联系司机
          </Button>
        </View>
        <View className={styles.driverRow}>
          <View className={styles.driverInfo}>
            <View className={styles.driverAvatar}>
              {currentWaybill.driverName.charAt(0)}
            </View>
            <View>
              <Text className={styles.driverName}>{currentWaybill.driverName}</Text>
              <Text style={{ display: 'block', fontSize: 22, color: '#86909C' }}>
                {maskPhone(currentWaybill.driverPhone)}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 24, color: '#86909C' }}>驾龄12年</Text>
        </View>
      </View>

      <WarningRecord warnings={currentWaybill.warnings} />

      {exceptions.length > 0 && (
        <View style={{ margin: `0 ${32}rpx ${24}rpx` }}>
          <Text style={{ fontSize: 32, fontWeight: 600, color: '#1D2129', marginBottom: 24, display: 'block' }}>
            异常处理记录
          </Text>
          {exceptions.map(exc => (
            <ExceptionCard key={exc.id} exception={exc} />
          ))}
        </View>
      )}

      {hasReceipt && receipt ? (
        <View className={styles.receiptStatusCard}>
          <View className={styles.receiptStatusHeader}>
            <Text className={styles.receiptStatusIcon}>✓</Text>
            <Text className={styles.receiptStatusTitle}>已验温</Text>
          </View>
          <View className={styles.receiptStatusGrid}>
            <View className={styles.receiptStatusItem}>
              <Text className={styles.receiptStatusLabel}>实测温度</Text>
              <Text className={styles.receiptStatusValue}>
                {receipt.actualTemperature}°C
              </Text>
            </View>
            <View className={styles.receiptStatusItem}>
              <Text className={styles.receiptStatusLabel}>包装状态</Text>
              <Text className={styles.receiptStatusValue}>
                {getPackageConditionText(receipt.packageCondition || '')}
              </Text>
            </View>
            <View className={styles.receiptStatusItem}>
              <Text className={styles.receiptStatusLabel}>是否拒收</Text>
              <Text
                className={styles.receiptStatusValue}
                style={{ color: receipt.isRejected ? '#F44336' : '#4CAF50' }}
              >
                {receipt.isRejected ? '已拒收' : '正常收货'}
              </Text>
            </View>
            <View className={styles.receiptStatusItem}>
              <Text className={styles.receiptStatusLabel}>收货人</Text>
              <Text className={styles.receiptStatusValue}>
                {receipt.operatorName || '-'}
              </Text>
            </View>
            <View className={styles.receiptStatusItemFull}>
              <Text className={styles.receiptStatusLabel}>操作时间</Text>
              <Text className={styles.receiptStatusValue}>
                {formatFullTime(receipt.operateTime || new Date().toISOString())}
              </Text>
            </View>
          </View>
          <View className={styles.receiptStatusActions}>
            <Button
              className={classnames(styles.receiptStatusBtn, styles.receiptStatusSecondary)}
              onClick={handleCallDriver}
            >
              联系司机
            </Button>
            <Button
              className={classnames(styles.receiptStatusBtn, styles.receiptStatusPrimary)}
              onClick={handleGoReceipt}
            >
              修改验温
            </Button>
          </View>
        </View>
      ) : (
        <View className={styles.receiptStatusActions}>
          <Button
            className={classnames(styles.receiptStatusBtn, styles.receiptStatusSecondary)}
            onClick={handleCallDriver}
          >
            联系司机
          </Button>
          <Button
            className={classnames(styles.receiptStatusBtn, styles.receiptStatusPrimary)}
            onClick={handleGoReceipt}
          >
            去验温
          </Button>
        </View>
      )}
    </View>
  );
};

export default ProgressPage;
