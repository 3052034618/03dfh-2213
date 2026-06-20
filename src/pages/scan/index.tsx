import React, { useState } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useWaybillStore } from '@/store/waybill';

const ScanPage: React.FC = () => {
  const {
    getWaybillByNo,
    setCurrentWaybill,
    setSelectedReceiptWaybillId
  } = useWaybillStore();
  const [waybillNo, setWaybillNo] = useState<string>('');
  const [inputFocused, setInputFocused] = useState<boolean>(false);

  const handleScan = () => {
    console.log('[ScanPage] 调用扫码');
    Taro.scanCode({
      success: (res) => {
        console.log('[ScanPage] 扫码结果:', res.result);
        const result = res.result || '';
        handleSearchByNo(result);
      },
      fail: (err) => {
        console.error('[ScanPage] 扫码失败:', err);
        Taro.showToast({
          title: '扫码已取消',
          icon: 'none'
        });
      }
    });
  };

  const handleSearchByNo = (no?: string) => {
    const searchNo = (no || waybillNo).trim();
    console.log('[ScanPage] 搜索运单:', searchNo);

    if (!searchNo) {
      Taro.showToast({ title: '请输入运单号', icon: 'none' });
      return;
    }

    const waybill = getWaybillByNo(searchNo);
    if (waybill) {
      console.log('[ScanPage] 找到运单，设置上下文并跳转:', waybill.id);
      setCurrentWaybill(waybill);
      setSelectedReceiptWaybillId(waybill.id);
      Taro.redirectTo({
        url: `/pages/detail/index?id=${waybill.id}`
      });
    } else {
      Taro.showModal({
        title: '未找到运单',
        content: `未找到运单号「${searchNo}」对应的运单，请检查运单号是否正确。`,
        showCancel: false,
        confirmText: '我知道了'
      });
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.scanArea}>
        <View className={styles.scanIconWrap}>
          <View className={styles.scanFrame} />
          <View className={styles.scanLine} />
          <Text className={styles.scanIcon}>📷</Text>
        </View>
        <Text className={styles.scanTitle}>扫描发货单二维码</Text>
        <Text className={styles.scanDesc}>
          将摄像头对准发货单上的二维码{'\n'}
          即可快速查看运单详情
        </Text>
        <Button className={styles.scanBtn} onClick={handleScan}>
          开始扫描
        </Button>
      </View>

      <View className={styles.inputSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>🔢</Text>
          手动输入运单号
        </Text>
        <View
          className={classnames(styles.inputWrap, inputFocused && styles.focused)}
        >
          <Input
            className={styles.input}
            placeholder="请输入运单号，如 CC202606210001"
            placeholderStyle="color: #86909C"
            value={waybillNo}
            onInput={(e) => setWaybillNo(e.detail.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onConfirm={() => handleSearchByNo()}
          />
          <Button className={styles.searchBtn} onClick={() => handleSearchByNo()}>
            查询
          </Button>
        </View>
      </View>

      <View className={styles.tipSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>💡</Text>
          操作提示
        </Text>
        <View className={styles.tipList}>
          <View className={styles.tipItem}>
            <View className={styles.tipNum}>1</View>
            <Text className={styles.tipText}>
              二维码通常位于发货单右上角或随货清单上
            </Text>
          </View>
          <View className={styles.tipItem}>
            <View className={styles.tipNum}>2</View>
            <Text className={styles.tipText}>
              扫码时请保持光线充足，距离二维码约15-20cm
            </Text>
          </View>
          <View className={styles.tipItem}>
            <View className={styles.tipNum}>3</View>
            <Text className={styles.tipText}>
              如扫码失败，可手动输入运单号进行查询
            </Text>
          </View>
          <View className={styles.tipItem}>
            <View className={styles.tipNum}>4</View>
            <Text className={styles.tipText}>
              收货时可展示验温记录与承运方进行对账沟通
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ScanPage;
