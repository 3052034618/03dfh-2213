import React, { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TemperatureCard from '@/components/TemperatureCard';
import ProgressTimeline from '@/components/ProgressTimeline';
import RiskBadge from '@/components/RiskBadge';
import WarningRecord from '@/components/WarningRecord';
import ExceptionCard from '@/components/ExceptionCard';
import { useWaybillStore } from '@/store/waybill';
import { formatTime, getStatusColor, maskPhone, getPackageConditionText, formatFullTime } from '@/utils';

const DetailPage: React.FC = () => {
  const router = useRouter();
  const {
    getWaybillById,
    setCurrentWaybill,
    setSelectedReceiptWaybillId,
    getReceipt,
    getExceptionsByWaybill
  } = useWaybillStore();
  const [waybill, setWaybill] = useState<any>(null);

  useEffect(() => {
    const id = router.params.id;
    console.log('[DetailPage] 运单ID:', id);
    if (id) {
      const w = getWaybillById(id);
      setWaybill(w || null);
    }
  }, [router.params.id, getWaybillById]);

  const handleCallDriver = () => {
    if (!waybill) return;
    console.log('[DetailPage] 拨打司机电话:', waybill.driverPhone);
    Taro.makePhoneCall({
      phoneNumber: waybill.driverPhone,
      fail: (err) => {
        console.error('[DetailPage] 拨号失败:', err);
      }
    });
  };

  const handleGoReceipt = () => {
    if (!waybill) return;
    console.log('[DetailPage] 从详情页去验温，设置运单ID:', waybill.id);
    setCurrentWaybill(waybill);
    setSelectedReceiptWaybillId(waybill.id);
    Taro.switchTab({ url: '/pages/receipt/index' });
  };

  if (!waybill) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyText}>运单不存在</Text>
        </View>
      </View>
    );
  }

  const receipt = getReceipt(waybill.id);
  const hasReceipt = !!receipt;
  const exceptions = getExceptionsByWaybill(waybill.id);

  return (
    <View className={styles.page}>
      <View className={styles.headerCard}>
        <View className={styles.statusRow}>
          <Text className={styles.waybillNo}>{waybill.waybillNo}</Text>
          <View
            style={{
              padding: '8rpx 20rpx',
              borderRadius: '999rpx',
              background: 'rgba(255,255,255,0.25)',
              fontSize: '24rpx',
              fontWeight: 500
            }}
          >
            {waybill.statusText}
          </View>
        </View>
        <Text className={styles.goodsName}>
          {waybill.goodsName} · {waybill.goodsWeight}
        </Text>

        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>承运方</Text>
            <Text className={styles.infoValue}>{waybill.carrier}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>车牌</Text>
            <Text className={styles.infoValue}>{waybill.plateNo}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>司机</Text>
            <Text className={styles.infoValue}>{waybill.driverName}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>预计到达</Text>
            <Text className={styles.infoValue}>
              {formatTime(waybill.estimatedArrival, 'MM-DD HH:mm')}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ margin: '24rpx 32rpx', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 32, fontWeight: 600, color: '#1D2129' }}>风险评估</Text>
        <RiskBadge level={waybill.riskLevel} />
      </View>

      <TemperatureCard waybill={waybill} />

      <Text className={styles.sectionTitle}>收发货信息</Text>
      <View className={classnames(styles.card, styles.routeSection)}>
        <View className={styles.routeItem}>
          <View className={classnames(styles.routeLabel, styles.sender)}>发</View>
          <View className={styles.routeContent}>
            <Text className={styles.routeTitle}>{waybill.shipper}</Text>
            {waybill.loadingTime && (
              <Text className={styles.routeDetail}>
                装车时间：{formatTime(waybill.loadingTime)}
              </Text>
            )}
          </View>
        </View>
        <View className={styles.routeItem}>
          <View className={classnames(styles.routeLabel, styles.receiver)}>收</View>
          <View className={styles.routeContent}>
            <Text className={styles.routeTitle}>{waybill.receiver}</Text>
            <Text className={styles.routeDetail}>{waybill.receiverAddress}</Text>
          </View>
        </View>
      </View>

      <Text className={styles.sectionTitle}>运输进度</Text>
      <ProgressTimeline points={waybill.routePoints} progress={waybill.progress} />

      <Text className={styles.sectionTitle}>温度历史</Text>
      <View className={styles.card}>
        {waybill.tempHistory.length > 0 ? (
          <>
            <View className={styles.tempChart}>
              <View className={styles.chartPlaceholder}>
                <Text className={styles.chartIcon}>📈</Text>
                <Text className={styles.chartText}>温度趋势图（共{waybill.tempHistory.length}个采样点）</Text>
              </View>
            </View>
            <View className={styles.tempLegend}>
              <View className={styles.legendItem}>
                <Text className={styles.legendValue}>{waybill.minTemp.toFixed(1)}°C</Text>
                <Text className={styles.legendLabel}>最低温</Text>
              </View>
              <View className={styles.legendItem}>
                <Text className={styles.legendValue}>{waybill.currentTemp.toFixed(1)}°C</Text>
                <Text className={styles.legendLabel}>当前温度</Text>
              </View>
              <View className={styles.legendItem}>
                <Text className={styles.legendValue}>{waybill.maxTemp.toFixed(1)}°C</Text>
                <Text className={styles.legendLabel}>最高温</Text>
              </View>
              <View className={styles.legendItem}>
                <Text className={styles.legendValue}>
                  {waybill.agreeTempRange.min}°C ~ {waybill.agreeTempRange.max}°C
                </Text>
                <Text className={styles.legendLabel}>约定范围</Text>
              </View>
            </View>
          </>
        ) : (
          <View className={styles.noWarnings}>暂无温度数据</View>
        )}
      </View>

      <WarningRecord warnings={waybill.warnings} />

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
          <View className={styles.actionBar}>
            <Button className={classnames(styles.actionBtn, styles.secondary)} onClick={handleCallDriver}>
              联系司机
            </Button>
            <Button className={classnames(styles.actionBtn, styles.primary)} onClick={handleGoReceipt}>
              修改验温
            </Button>
          </View>
        </View>
      ) : (
        <View className={styles.actionBar}>
          <Button className={classnames(styles.actionBtn, styles.secondary)} onClick={handleCallDriver}>
            联系司机
          </Button>
          <Button className={classnames(styles.actionBtn, styles.primary)} onClick={handleGoReceipt}>
            去验温
          </Button>
        </View>
      )}
    </View>
  );
};

export default DetailPage;
