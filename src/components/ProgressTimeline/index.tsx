import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { RoutePoint } from '@/types';
import { formatTime } from '@/utils';

interface ProgressTimelineProps {
  points: RoutePoint[];
  progress: number;
}

const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ points, progress }) => {
  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <Text className={styles.title}>运输进度</Text>
        <Text className={styles.progressText}>{progress}%</Text>
      </View>

      <View className={styles.progressBar}>
        <View
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
      </View>

      <View className={styles.timeline}>
        {points.map((point) => (
          <View
            key={point.id}
            className={classnames(styles.timelineItem, styles[point.status])}
          >
            <View className={styles.dot}>
              <View className={styles.dotInner} />
            </View>
            <View className={styles.itemContent}>
              <Text className={styles.itemName}>{point.name}</Text>
              {point.description && (
                <Text className={styles.itemDesc}>{point.description}</Text>
              )}
              {point.time && (
                <Text className={styles.itemTime}>{formatTime(point.time)}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default ProgressTimeline;
