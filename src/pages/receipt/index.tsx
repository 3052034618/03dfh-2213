import React, { useState, useMemo } from 'react';
import { View, Text, Input, Button, Textarea, Switch } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import WarningRecordComp from '@/components/WarningRecord';
import { useWaybillStore } from '@/store/waybill';
import type { Waybill, PackageCondition, ReceiptForm } from '@/types';
import { formatFullTime, getPackageConditionText } from '@/utils';

const ReceiptPage: React.FC = () => {
  const { waybills, getWaybillById, saveReceipt, getReceipt } = useWaybillStore();

  const arrivingWaybills = useMemo(
    () => waybills.filter((w: Waybill) => w.status === 'arriving' || w.status === 'transit'),
    [waybills]
  );

  const [selectedWaybillId, setSelectedWaybillId] = useState<string>('2');
  const [actualTemp, setActualTemp] = useState<string>('');
  const [packageCondition, setPackageCondition] = useState<PackageCondition | null>(null);
  const [isRejected, setIsRejected] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [operatorName, setOperatorName] = useState<string>('');
  const [tempFocused, setTempFocused] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submittedForm, setSubmittedForm] = useState<ReceiptForm | null>(null);

  const selectedWaybill = useMemo(
    () => getWaybillById(selectedWaybillId) || arrivingWaybills[0],
    [selectedWaybillId, arrivingWaybills, getWaybillById]
  );

  const existingReceipt = selectedWaybill ? getReceipt(selectedWaybill.id) : undefined;

  const handleSelectWaybill = () => {
    console.log('[ReceiptPage] 选择运单');
    const items = arrivingWaybills.map((w: Waybill) => ({
      id: w.id,
      name: `${w.waybillNo} - ${w.goodsName}`
    }));
    if (items.length === 0) {
      Taro.showToast({ title: '暂无待收货运单', icon: 'none' });
      return;
    }
    Taro.showActionSheet({
      itemList: items.map(i => i.name),
      success: (res) => {
        const selected = items[res.tapIndex];
        console.log('[ReceiptPage] 选择了运单:', selected.id);
        setSelectedWaybillId(selected.id);
        resetForm();
      },
      fail: (err) => {
        if (err.errMsg !== 'showActionSheet:fail cancel') {
          console.error('[ReceiptPage] 选择运单失败:', err);
        }
      }
    });
  };

  const resetForm = () => {
    setActualTemp('');
    setPackageCondition(null);
    setIsRejected(false);
    setRejectReason('');
    setRemark('');
    setOperatorName('');
    setSubmitted(false);
    setSubmittedForm(null);
  };

  const handleTempInput = (e: any) => {
    setActualTemp(e.detail.value);
  };

  const handlePackageSelect = (condition: PackageCondition) => {
    console.log('[ReceiptPage] 选择包装状态:', condition);
    setPackageCondition(condition);
  };

  const handleRejectToggle = (e: any) => {
    const value = e.detail.value;
    console.log('[ReceiptPage] 拒收开关:', value);
    setIsRejected(value);
    if (!value) {
      setRejectReason('');
    }
  };

  const canSubmit = useMemo(() => {
    if (!selectedWaybill) return false;
    if (actualTemp === '' || isNaN(parseFloat(actualTemp))) return false;
    if (!packageCondition) return false;
    if (isRejected && !rejectReason.trim()) return false;
    return true;
  }, [selectedWaybill, actualTemp, packageCondition, isRejected, rejectReason]);

  const handleSubmit = () => {
    if (!selectedWaybill || !canSubmit) return;

    const form: ReceiptForm = {
      waybillId: selectedWaybill.id,
      actualTemperature: parseFloat(actualTemp),
      packageCondition,
      isRejected,
      rejectReason: isRejected ? rejectReason : undefined,
      remark: remark || undefined,
      operatorName: operatorName || undefined,
      operateTime: new Date().toISOString()
    };

    console.log('[ReceiptPage] 提交验温单:', form);
    saveReceipt(selectedWaybill.id, form);
    setSubmittedForm(form);
    setSubmitted(true);

    Taro.showToast({ title: '验温成功', icon: 'success' });
  };

  const handleReset = () => {
    resetForm();
  };

  const handleScan = () => {
    console.log('[ReceiptPage] 点击扫码');
    Taro.navigateTo({ url: '/pages/scan/index' });
  };

  const goToWaybills = () => {
    Taro.switchTab({ url: '/pages/waybills/index' });
  };

  if (submitted && submittedForm && selectedWaybill) {
    return (
      <View className={styles.page}>
        <View className={styles.header}>
          <Text className={styles.title}>收货验温</Text>
          <Text className={styles.subtitle}>验温记录已保存</Text>
        </View>
        <View className={styles.successState}>
          <View className={styles.successIcon}>✓</View>
          <Text className={styles.successTitle}>验温成功</Text>
          <Text className={styles.successDesc}>
            验温记录已同步至承运方，可用于后续对账沟通
          </Text>
          <View className={styles.successReceiptInfo}>
            <View className={styles.successReceiptRow}>
              <Text className={styles.successReceiptLabel}>运单号</Text>
              <Text className={styles.successReceiptValue}>{selectedWaybill.waybillNo}</Text>
            </View>
            <View className={styles.successReceiptRow}>
              <Text className={styles.successReceiptLabel}>货物名称</Text>
              <Text className={styles.successReceiptValue}>{selectedWaybill.goodsName}</Text>
            </View>
            <View className={styles.successReceiptRow}>
              <Text className={styles.successReceiptLabel}>实测温度</Text>
              <Text className={styles.successReceiptValue}>
                {submittedForm.actualTemperature}°C
              </Text>
            </View>
            <View className={styles.successReceiptRow}>
              <Text className={styles.successReceiptLabel}>包装状态</Text>
              <Text className={styles.successReceiptValue}>
                {getPackageConditionText(submittedForm.packageCondition || '')}
              </Text>
            </View>
            <View className={styles.successReceiptRow}>
              <Text className={styles.successReceiptLabel}>是否拒收</Text>
              <Text
                className={styles.successReceiptValue}
                style={{ color: submittedForm.isRejected ? '#F44336' : '#4CAF50' }}
              >
                {submittedForm.isRejected ? '已拒收' : '正常收货'}
              </Text>
            </View>
            <View className={styles.successReceiptRow}>
              <Text className={styles.successReceiptLabel}>操作时间</Text>
              <Text className={styles.successReceiptValue}>
                {formatFullTime(submittedForm.operateTime || new Date().toISOString())}
              </Text>
            </View>
          </View>
          <View className={styles.successActions}>
            <Button className={styles.cancelBtn} onClick={handleReset}>
              继续验温
            </Button>
            <Button className={styles.submitBtn} onClick={goToWaybills}>
              返回运单
            </Button>
          </View>
        </View>

        {selectedWaybill.warnings.length > 0 && (
          <View style={{ padding: `0 ${32}rpx` }}>
            <WarningRecordComp warnings={selectedWaybill.warnings} />
          </View>
        )}
      </View>
    );
  }

  if (!selectedWaybill) {
    return (
      <View className={styles.page}>
        <View className={styles.header}>
          <Text className={styles.title}>收货验温</Text>
          <Text className={styles.subtitle}>请先选择要验温的运单</Text>
        </View>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyTitle}>暂无待收货运单</Text>
          <Text className={styles.emptyDesc}>
            请先在运单列表中查看运输中的运单
          </Text>
          <Button className={styles.submitBtn} style={{ marginTop: 24 }} onClick={goToWaybills}>
            查看运单列表
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>收货验温</Text>
        <Text className={styles.subtitle}>填写实测温度与包装状态，完成收货</Text>
      </View>

      <View className={styles.content}>
        <View style={{ height: 16 }} />

        <View className={styles.waybillSelectCard}>
          <Text className={styles.selectLabel}>待验运单</Text>
          <View className={styles.selectRow}>
            <View className={styles.selectInfo}>
              <Text className={styles.selectNo}>{selectedWaybill.waybillNo}</Text>
              <Text className={styles.selectGoods}>
                {selectedWaybill.goodsName} · {selectedWaybill.receiver}
              </Text>
            </View>
            <Button className={styles.selectBtn} onClick={handleSelectWaybill}>
              切换
            </Button>
          </View>
        </View>

        <Button className={styles.scanBtn} onClick={handleScan}>
          📷 扫描发货单二维码
        </Button>

        <View className={styles.formCard}>
          <Text className={styles.formTitle}>验温信息</Text>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>实测温度
            </Text>
            <View
              className={classnames(styles.tempInputWrap, tempFocused && styles.focused)}
            >
              <Text className={styles.tempUnit}>-</Text>
              <Input
                className={styles.tempInput}
                type="digit"
                placeholder="0.0"
                placeholderStyle="color: #C9CDD4"
                value={actualTemp}
                onInput={handleTempInput}
                onFocus={() => setTempFocused(true)}
                onBlur={() => setTempFocused(false)}
              />
              <Text className={styles.tempUnit}>°C</Text>
            </View>
            <View className={styles.tempRange}>
              <Text>运输过程温度：{selectedWaybill.minTemp.toFixed(1)}°C ~ {selectedWaybill.maxTemp.toFixed(1)}°C</Text>
              <Text className={styles.tempAgree}>
                约定范围 {selectedWaybill.agreeTempRange.min}°C ~ {selectedWaybill.agreeTempRange.max}°C
              </Text>
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>外包装状态
            </Text>
            <View className={styles.optionGroup}>
              {[
                { key: 'good', label: '包装完好' },
                { key: 'slight_damage', label: '轻微破损' },
                { key: 'damaged', label: '严重破损' }
              ].map((opt) => (
                <View
                  key={opt.key}
                  className={classnames(
                    styles.optionItem,
                    packageCondition === opt.key && styles.active,
                    opt.key === 'damaged' && styles.damaged
                  )}
                  onClick={() => handlePackageSelect(opt.key as PackageCondition)}
                >
                  <Text>{opt.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formItem}>
            <View className={styles.toggleRow}>
              <View>
                <Text className={styles.toggleLabel}>是否拒收</Text>
                <Text className={styles.toggleHint}>如拒收请填写拒收原因</Text>
              </View>
              <Switch
                checked={isRejected}
                onChange={handleRejectToggle}
                color="#1E88E5"
              />
            </View>
            {isRejected && (
              <View className={styles.rejectReason}>
                <Textarea
                  className={styles.rejectInput}
                  placeholder="请填写拒收原因，便于承运方整改..."
                  placeholderStyle="color: #86909C"
                  value={rejectReason}
                  onInput={(e) => setRejectReason(e.detail.value)}
                  maxlength={200}
                />
              </View>
            )}
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>备注信息</Text>
            <Textarea
              className={styles.remarkInput}
              placeholder="选填，如有其他异常情况请在此说明..."
              placeholderStyle="color: #86909C"
              value={remark}
              onInput={(e) => setRemark(e.detail.value)}
              maxlength={300}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>收货人姓名</Text>
            <Input
              className={styles.operatorInput}
              placeholder="请输入收货人姓名"
              placeholderStyle="color: #86909C"
              value={operatorName}
              onInput={(e) => setOperatorName(e.detail.value)}
            />
          </View>
        </View>

        {selectedWaybill.warnings.length > 0 && (
          <WarningRecordComp warnings={selectedWaybill.warnings} />
        )}
      </View>

      <View className={styles.footerBar}>
        <Button className={styles.cancelBtn} onClick={handleReset}>
          重置
        </Button>
        <Button
          className={styles.submitBtn}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          确认提交
        </Button>
      </View>
    </View>
  );
};

export default ReceiptPage;
