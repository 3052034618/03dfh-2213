import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import TemperatureCard from '@/components/TemperatureCard';
import ProgressTimeline from '@/components/ProgressTimeline';
import RiskBadge from '@/components/RiskBadge';
import WarningRecord from '@/components/WarningRecord';
import { useWaybillStore } from '@/store/waybill';
import type { Waybill } from '@/types';
import { formatTime, maskPhone } from '@/utils';

const ProgressPage: React.FC = () => {
  const { waybills, getWaybillById } = useWaybillStore();
  const [currentWaybillId, setCurrentWaybillId] = useState<string>('1');

  const activeWaybills = useMemo(
    () => waybills.filter((w: Waybill) => w.status !== 'completed'),
    [waybills]
  );

  const currentWaybill = useMemo(
    () => getWaybillById(currentWaybillId) || activeWaybills[0],
    [currentWaybillId, activeWaybills, getWaybillById]
  );

  const handleSelectWaybill = () => {
    console.log('[ProgressPage] 选择运单');
    const items = activeWaybills.map((w: Waybill) => ({
      id: w.id,
      name: `${w.waybillNo} - ${w.goodsName}`
    }));
    Taro.showActionSheet({
      itemList: items.map(i => i.name),
      success: (res) => {
        const selected = items[res.tapIndex];
        console.log('[ProgressPage] 选择了运单:', selected.id);
        setCurrentWaybillId(selected.id);
      },
      fail: (err) => {
        if (err.errMsg !== 'showActionSheet:fail cancel') {
          console.error('[ProgressPage] 选择运单失败:', err);
        }
      }
    });
  };

  const handleCallDriver = () => {
    if (!currentWaybill) return;
    console.log('[ProgressPage] 拨打司机电话:', currentWaybill.driverPhone);
    Taro.makePhoneCall({
      phoneNumber: currentWaybill.driverPhone,
      fail: (err) => {
        console.error('[ProgressPage] 拨号失败:', err);
      }
    });
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

  const now = Date.now();
  const etaMs = new Date(currentWaybill.estimatedArrival).getTime() - now;
  const hoursLeft = Math.max(0, Math.floor(etaMs / (1000 * 60 * 60)));
  const minsLeft = Math.max(0, Math.floor((etaMs % (1000 * 60 * 60)) / (1000 * 60)));

  const isArrivingSoon = currentWaybill.status === 'arriving';
  const hasHighRisk = currentWaybill.riskLevel === 'high';

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

      {isArrivingSoon && (
        <View className={styles.pushCard}>
          <View className={styles.pushHeader}>
            <View className={styles.pushIcon}>🔔</View>
            <Text className={styles.pushTitle}>到货提醒</Text>
          </View>
          <Text className={styles.pushContent}>
            {currentWaybill.goodsName} 即将于30分钟内送达，请提前安排收货人员。
            根据当前温度趋势预测，到货时温度约为
          </Text>
          <Text className={styles.pushTemp}>
            {(currentWaybill.currentTemp + 0.3).toFixed(1)}°C（正常范围）
          </Text>
        </View>
      )}

      {hasHighRisk && (
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
    </View>
  );
};

export default ProgressPage;
