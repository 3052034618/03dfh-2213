import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { RiskLevel } from '@/types';
import { getRiskText } from '@/utils';

interface RiskBadgeProps {
  level: RiskLevel;
  text?: string;
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ level, text }) => {
  return (
    <View className={classnames(styles.riskBadge, styles[level])}>
      <View className={styles.dot} />
      <Text>{text || getRiskText(level)}</Text>
    </View>
  );
};

export default RiskBadge;
