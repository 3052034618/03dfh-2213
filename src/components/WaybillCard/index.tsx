import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { Waybill } from '@/types';
import RiskBadge from '@/components/RiskBadge';
import { formatTime, getStatusColor, getTempStatus, maskPhone } from '@/utils';

interface WaybillCardProps {
  waybill: Waybill;
}

const WaybillCard: React.FC<WaybillCardProps> = ({ waybill }) => {
  const tempStatus = waybill.status === 'pending' ? 'low' : getTempStatus(
    waybill.currentTemp,
    waybill.agreeTempRange.min,
    waybill.agreeTempRange.max
  );

  const tempColors = {
    low: styles.tempValue,
    warn: styles.tempValue,
    high: styles.tempValue
  };

  const tempColorValues = {
    low: '#4CAF50',
    warn: '#FF9800',
    high: '#F44336'
  };

  const handleClick = () => {
    console.log('[WaybillCard] 点击运单:', waybill.waybillNo);
    Taro.navigateTo({
      url: `/pages/detail/index?id=${waybill.id}`
    });
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <Text className={styles.waybillNo}>{waybill.waybillNo}</Text>
        <View
          className={styles.statusBadge}
          style={{ background: `${getStatusColor(waybill.status)}15`, color: getStatusColor(waybill.status) }}
        >
          {waybill.statusText}
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.goodsInfo}>
          <Text className={styles.goodsName}>{waybill.goodsName}</Text>
          <View className={styles.goodsMeta}>
            <Text className={styles.weightTag}>{waybill.goodsWeight}</Text>
            <Text>{waybill.carrier}</Text>
          </View>
        </View>
        <View className={styles.tempInfo}>
          {waybill.status !== 'pending' ? (
            <>
              <Text
                className={tempColors[tempStatus]}
                style={{ color: tempColorValues[tempStatus] }}
              >
                {waybill.currentTemp.toFixed(1)}°C
              </Text>
              <Text className={styles.tempLabel}>当前温度</Text>
              <Text className={styles.tempRange}>
                {waybill.agreeTempRange.min}°C ~ {waybill.agreeTempRange.max}°C
              </Text>
            </>
          ) : (
            <>
              <Text className={styles.tempValue} style={{ color: '#86909C' }}>--°C</Text>
              <Text className={styles.tempLabel}>待装车</Text>
              <Text className={styles.tempRange}>
                约定 {waybill.agreeTempRange.min}°C ~ {waybill.agreeTempRange.max}°C
              </Text>
            </>
          )}
        </View>
      </View>

      <View className={styles.footer}>
        <View className={styles.routeInfo}>
          <View className={styles.routeItem}>
            <Text className={styles.routeLabel}>发</Text>
            <Text className={styles.routeText}>{waybill.shipper}</Text>
          </View>
          <View className={styles.routeItem}>
            <Text className={styles.routeLabel}>收</Text>
            <Text className={styles.routeText}>{waybill.receiver}</Text>
          </View>
        </View>
        <View className={styles.etaInfo}>
          <Text className={styles.etaTime}>{formatTime(waybill.estimatedArrival, 'HH:mm')}</Text>
          <Text className={styles.etaLabel}>预计到达</Text>
        </View>
      </View>

      <View className={styles.riskSection}>
        <RiskBadge level={waybill.riskLevel} />
        {waybill.warnings.length > 0 ? (
          <Text className={styles.warningCount}>
            途中预警 <Text className={styles.warningHighlight}>{waybill.warnings.length}</Text> 条
          </Text>
        ) : (
          <Text className={styles.warningCount} style={{ color: '#86909C' }}>
            司机 {maskPhone(waybill.driverPhone)}
          </Text>
        )}
      </View>
    </View>
  );
};

export default WaybillCard;
