import React, { useState } from 'react';
import { View, Text, Button, Textarea, Image, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { ExceptionRecord } from '@/types';
import { getExceptionTypeText, getExceptionStatusText, getExceptionStatusColor, formatFullTime } from '@/utils';
import { useWaybillStore } from '@/store/waybill';

interface ExceptionCardProps {
  exception: ExceptionRecord;
}

const ExceptionCard: React.FC<ExceptionCardProps> = ({ exception }) => {
  const {
    resolveException,
    updateException,
    getWaybillById
  } = useWaybillStore();

  const [showHandleForm, setShowHandleForm] = useState(false);
  const [handleRemark, setHandleRemark] = useState('');
  const [handlerName, setHandlerName] = useState('');

  const statusColor = getExceptionStatusColor(exception.status);
  const isResolved = exception.status === 'resolved';

  const handleCallDriver = () => {
    const waybill = getWaybillById(exception.waybillId);
    if (waybill) {
      Taro.makePhoneCall({ phoneNumber: waybill.driverPhone });
    }
  };

  const handleTakePhoto = () => {
    Taro.chooseImage({
      count: 3,
      sourceType: ['album', 'camera'],
      success: (res) => {
        if (res.tempFilePaths?.length) {
          updateException(exception.id, {
            photoUrls: [...(exception.photoUrls || []), ...res.tempFilePaths]
          });
          Taro.showToast({ title: '拍照已保存', icon: 'success' });
        }
      }
    });
  };

  const handleStartProcess = () => {
    updateException(exception.id, { status: 'in_progress' });
    setShowHandleForm(true);
  };

  const handleResolve = () => {
    if (!handlerName.trim()) {
      Taro.showToast({ title: '请输入处理人', icon: 'none' });
      return;
    }
    resolveException(exception.id, handlerName.trim(), handleRemark.trim() || undefined);
    setShowHandleForm(false);
    Taro.showToast({ title: '已标记处理完成', icon: 'success' });
  };

  return (
    <View
      className={classnames(
        styles.card,
        exception.type === 'temp_out_of_range' && styles.cardTemp,
        exception.type === 'package_damaged' && styles.cardPackage,
        exception.type === 'rejected' && styles.cardRejected,
        isResolved && styles.cardResolved
      )}
    >
      <View className={styles.header}>
        <View className={styles.typeIcon}>
          {exception.type === 'temp_out_of_range' && '🌡️'}
          {exception.type === 'package_damaged' && '📦'}
          {exception.type === 'rejected' && '🚫'}
        </View>
        <View className={styles.headerContent}>
          <Text className={styles.title}>{exception.title}</Text>
          <View className={styles.meta}>
            <Text className={styles.typeTag}>{getExceptionTypeText(exception.type)}</Text>
            <Text
              className={styles.statusTag}
              style={{ color: statusColor, background: `${statusColor}15` }}
            >
              {getExceptionStatusText(exception.status)}
            </Text>
          </View>
        </View>
      </View>

      <Text className={styles.desc}>{exception.description}</Text>

      {exception.actualTemp !== undefined && exception.agreedMin !== undefined && exception.agreedMax !== undefined && (
        <View className={styles.tempInfo}>
          <Text className={styles.tempLabel}>实测温度</Text>
          <Text className={styles.tempValue} style={{ color: '#F44336' }}>
            {exception.actualTemp}°C
          </Text>
          <Text className={styles.tempRange}>
            （约定 {exception.agreedMin}°C ~ {exception.agreedMax}°C
          </Text>
        </View>
      )}

      {exception.photoUrls && exception.photoUrls.length > 0 && (
        <View className={styles.photoSection}>
          <Text className={styles.photoLabel}>📸 凭证照片</Text>
          <View className={styles.photoList}>
            {exception.photoUrls.map((url, idx) => (
              <Image
                key={idx}
                src={url}
                className={styles.photoItem}
                mode="aspectFill"
              />
            ))}
          </View>
        </View>
      )}

      {exception.handledAt && (
        <View className={styles.handledInfo}>
          <Text className={styles.handledLabel}>处理结果</Text>
          <View className={styles.handledContent}>
            <Text className={styles.handledText}>
              处理人：{exception.handlerName}
            </Text>
            <Text className={styles.handledTime}>
              {formatFullTime(exception.handledAt)}
            </Text>
            {exception.handleRemark && (
              <Text className={styles.handledRemark}>
                处理备注：{exception.handleRemark}
              </Text>
            )}
          </View>
        </View>
      )}

      {!isResolved && !showHandleForm && (
        <View className={styles.actions}>
          <Button className={classnames(styles.actionBtn, styles.secondary)} onClick={handleCallDriver}>
            📞 联系司机
          </Button>
          <Button className={classnames(styles.actionBtn, styles.secondary)} onClick={handleTakePhoto}>
            📸 拍照留证
          </Button>
          <Button className={classnames(styles.actionBtn, styles.primary)} onClick={handleStartProcess}>
            开始处理
          </Button>
        </View>
      )}

      {showHandleForm && (
        <View className={styles.handleForm}>
          <Text className={styles.formTitle}>处理备注</Text>
          <Textarea
            className={styles.formTextarea}
            placeholder="请填写处理情况和结果..."
            placeholderStyle="color: #86909C"
            value={handleRemark}
            onInput={(e) => setHandleRemark(e.detail.value)}
            maxlength={200}
          />
          <Text className={styles.formTitle}>处理人姓名</Text>
          <Input
            className={styles.formInput}
            placeholder="请输入处理人姓名"
            placeholderStyle="color: #86909C"
            value={handlerName}
            onInput={(e) => setHandlerName(e.detail.value)}
          />
          <View className={styles.formActions}>
            <Button
              className={classnames(styles.formBtn, styles.cancel)}
              onClick={() => setShowHandleForm(false)}
            >
              取消
            </Button>
            <Button
              className={classnames(styles.formBtn, styles.primary)}
              onClick={handleResolve}
            >
              标记处理完成
            </Button>
          </View>
        </View>
      )}

      <View className={styles.footer}>
        <Text className={styles.timeText}>
          创建时间：{formatFullTime(exception.createdAt)}
        </Text>
      </View>
    </View>
  );
};

export default ExceptionCard;
