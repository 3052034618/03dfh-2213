import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { WarningRecord as WarningRecordType } from '@/types';
import { formatTime } from '@/utils';

interface WarningRecordProps {
  warnings: WarningRecordType[];
}

const typeTextMap = {
  temp: '温度',
  route: '路线',
  traffic: '拥堵',
  detour: '改道'
};

const WarningRecord: React.FC<WarningRecordProps> = ({ warnings }) => {
  if (warnings.length === 0) {
    return (
      <View className={styles.card}>
        <View className={styles.header}>
          <Text className={styles.title}>途中预警</Text>
        </View>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>✓</Text>
          <Text className={styles.emptyText}>运输途中暂无预警记录</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <Text className={styles.title}>途中预警记录</Text>
        <View className={styles.count}>{warnings.length} 条</View>
      </View>

      <View className={styles.warningList}>
        {warnings.map((warning) => (
          <View
            key={warning.id}
            className={classnames(styles.warningItem, styles[warning.level])}
          >
            <View className={styles.warningHeader}>
              <View className={styles.warningTitle}>
                <Text className={styles.typeTag}>{typeTextMap[warning.type]}</Text>
                <Text>{warning.title}</Text>
              </View>
              <Text className={styles.warningTime}>{formatTime(warning.time)}</Text>
            </View>
            <Text className={styles.warningDesc}>{warning.description}</Text>
            {warning.temperature !== undefined && (
              <View className={styles.warningTemp}>
                <Text>异常温度：</Text>
                <Text className={styles.tempValue}>{warning.temperature.toFixed(1)}°C</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

export default WarningRecord;
