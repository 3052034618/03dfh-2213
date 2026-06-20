import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Waybill } from '@/types';
import { getTempStatus } from '@/utils';

interface TemperatureCardProps {
  waybill: Waybill;
}

const statusTextMap = {
  low: '温度正常',
  warn: '温度关注',
  high: '温度异常'
};

const TemperatureCard: React.FC<TemperatureCardProps> = ({ waybill }) => {
  const tempStatus = waybill.status === 'pending' ? 'low' : getTempStatus(
    waybill.currentTemp,
    waybill.agreeTempRange.min,
    waybill.agreeTempRange.max
  );

  if (waybill.status === 'pending') {
    return (
      <View className={styles.card} style={{ background: 'linear-gradient(135deg, #90A4AE 0%, #B0BEC5 100%)' }}>
        <View className={styles.header}>
          <Text className={styles.title}>温度监测</Text>
          <View className={styles.statusBadge}>待启动</View>
        </View>
        <View className={styles.tempMain}>
          <View className={styles.tempLeft}>
            <Text className={styles.currentTemp}>--</Text>
            <Text className={styles.tempUnit}>°C</Text>
          </View>
          <View className={styles.tempRight}>
            <Text className={styles.tempLabel}>约定温度</Text>
            <Text className={styles.tempRange}>
              {waybill.agreeTempRange.min}°C ~ {waybill.agreeTempRange.max}°C
            </Text>
          </View>
        </View>
        <View className={styles.stats}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>--</Text>
            <Text className={styles.statLabel}>最低</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>--</Text>
            <Text className={styles.statLabel}>最高</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>--</Text>
            <Text className={styles.statLabel}>平均</Text>
          </View>
        </View>
      </View>
    );
  }

  const avgTemp = waybill.tempHistory.length > 0
    ? (waybill.tempHistory.reduce((sum, t) => sum + t.value, 0) / waybill.tempHistory.length).toFixed(1)
    : waybill.currentTemp.toFixed(1);

  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <Text className={styles.title}>实时温度监测</Text>
        <View className={classnames(styles.statusBadge, styles[tempStatus])}>
          {statusTextMap[tempStatus]}
        </View>
      </View>
      <View className={styles.tempMain}>
        <View className={styles.tempLeft}>
          <Text className={styles.currentTemp}>{waybill.currentTemp.toFixed(1)}</Text>
          <Text className={styles.tempUnit}>°C</Text>
        </View>
        <View className={styles.tempRight}>
          <Text className={styles.tempLabel}>约定范围</Text>
          <Text className={styles.tempRange}>
            {waybill.agreeTempRange.min}°C ~ {waybill.agreeTempRange.max}°C
          </Text>
        </View>
      </View>
      <View className={styles.stats}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{waybill.minTemp.toFixed(1)}°C</Text>
          <Text className={styles.statLabel}>运输最低</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{waybill.maxTemp.toFixed(1)}°C</Text>
          <Text className={styles.statLabel}>运输最高</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{avgTemp}°C</Text>
          <Text className={styles.statLabel}>平均温度</Text>
        </View>
      </View>
    </View>
  );
};

export default TemperatureCard;
