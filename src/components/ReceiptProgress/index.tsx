import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { useWaybillStore } from '@/store/waybill';

const ReceiptProgress: React.FC = () => {
  const { getReceiptProgress, waybills, getReceipt, nowTimestamp } = useWaybillStore();
  const progress = useMemo(() => getReceiptProgress(), [getReceiptProgress, waybills, nowTimestamp, getReceipt]);

  const total = progress.totalPending + progress.completed;
  const pct = total > 0 ? Math.min(100, Math.round((progress.completed / total) * 100)) : 0;

  return (
    <View className={styles.wrapper}>
      <View className={styles.header}>
        <Text className={styles.title}>📊 今日验温进度</Text>
        <Text className={styles.pct}>{pct}%</Text>
      </View>
      <View className={styles.progressBar}>
        <View className={styles.progressFill} style={{ width: `${pct}%` }} />
      </View>
      <View className={styles.stats}>
        <View className={styles.statItem}>
          <Text className={styles.statNum} style={{ color: '#FF9800' }}>{progress.totalPending}</Text>
          <Text className={styles.statLabel}>待处理</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={styles.statNum} style={{ color: '#4CAF50' }}>{progress.completed}</Text>
          <Text className={styles.statLabel}>已完成</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={styles.statNum} style={{ color: '#F44336' }}>{progress.exceptions}</Text>
          <Text className={styles.statLabel}>异常待处理</Text>
        </View>
      </View>
    </View>
  );
};

export default ReceiptProgress;
