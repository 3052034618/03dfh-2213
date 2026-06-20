import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Input, Button, Textarea, Switch } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import WarningRecordComp from '@/components/WarningRecord';
import ArrivalReminder from '@/components/ArrivalReminder';
import { useWaybillStore } from '@/store/waybill';
import type { Waybill, PackageCondition, ReceiptForm } from '@/types';
import { formatFullTime, getPackageConditionText } from '@/utils';

const ReceiptPage: React.FC = () => {
  const {
    waybills,
    getWaybillById,
    saveReceipt,
    getReceipt,
    selectedReceiptWaybillId,
    setSelectedReceiptWaybillId
  } = useWaybillStore();

  const arrivingWaybills = useMemo(
    () => waybills.filter((w: Waybill) => w.status === 'arriving' || w.status === 'transit' || w.status === 'completed' || w.status === 'loading'),
    [waybills]
  );

  const [selectedWaybillId, setSelectedWaybillId] = useState<string>('');
  const [actualTemp, setActualTemp] = useState<string>('');
  const [packageCondition, setPackageCondition] = useState<PackageCondition | null>(null);
  const [isRejected, setIsRejected] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [operatorName, setOperatorName] = useState<string>('');
  const [tempFocused, setTempFocused] = useState<boolean>(false);
  const [showSubmittedView, setShowSubmittedView] = useState<boolean>(false);

  useEffect(() => {
    let initialId = selectedReceiptWaybillId;
    console.log('[ReceiptPage] store中selectedReceiptWaybillId:', initialId);

    if (!initialId && arrivingWaybills.length > 0) {
      initialId = arrivingWaybills[0].id;
    }
    if (initialId) {
      setSelectedWaybillId(initialId);
      const existing = getReceipt(initialId);
      if (existing) {
        console.log('[ReceiptPage] 发现已提交记录，自动回显:', existing);
        setActualTemp(existing.actualTemperature.toString());
        setPackageCondition(existing.packageCondition);
        setIsRejected(existing.isRejected);
        setRejectReason(existing.rejectReason || '');
        setRemark(existing.remark || '');
        setOperatorName(existing.operatorName || '');
        setShowSubmittedView(true);
      } else {
        resetForm();
      }
    }
  }, [selectedReceiptWaybillId, arrivingWaybills, getReceipt]);

  const selectedWaybill = useMemo(
    () => getWaybillById(selectedWaybillId) || arrivingWaybills[0],
    [selectedWaybillId, arrivingWaybills, getWaybillById]
  );

  const existingReceipt = selectedWaybill ? getReceipt(selectedWaybill.id) : undefined;

  const resetForm = () => {
    setActualTemp('');
    setPackageCondition(null);
    setIsRejected(false);
    setRejectReason('');
    setRemark('');
    setOperatorName('');
    setShowSubmittedView(false);
  };

  const handleSelectWaybill = () => {
    console.log('[ReceiptPage] 选择运单');
    const items = arrivingWaybills.map((w: Waybill) => {
      const done = getReceipt(w.id) ? ' ✓已验' : '';
      return { id: w.id, name: `${w.waybillNo} - ${w.goodsName}${done}` };
    });
    if (items.length === 0) {
      Taro.showToast({ title: '暂无运单', icon: 'none' });
      return;
    }
    Taro.showActionSheet({
      itemList: items.map(i => i.name),
      success: (res) => {
        const selected = items[res.tapIndex];
        console.log('[ReceiptPage] 选择了运单:', selected.id);
        setSelectedReceiptWaybillId(selected.id);
        setSelectedWaybillId(selected.id);
        const existing = getReceipt(selected.id);
        if (existing) {
          console.log('[ReceiptPage] 切换到已验运单，回显记录');
          setActualTemp(existing.actualTemperature.toString());
          setPackageCondition(existing.packageCondition);
          setIsRejected(existing.isRejected);
          setRejectReason(existing.rejectReason || '');
          setRemark(existing.remark || '');
          setOperatorName(existing.operatorName || '');
          setShowSubmittedView(true);
        } else {
          resetForm();
        }
      }
    });
  };

  const handleTempInput = (e: any) => {
    let val = e.detail.value;
    val = val.replace(/[^\d.\-]/g, '');
    const firstNeg = val.indexOf('-');
    if (firstNeg !== -1) {
      val = '-' + val.slice(firstNeg + 1).replace(/-/g, '');
    }
    const dotCount = (val.match(/\./g) || []).length;
    if (dotCount > 1) {
      const lastDot = val.lastIndexOf('.');
      val = val.slice(0, lastDot) + val.slice(lastDot + 1);
    }
    setActualTemp(val);
  };

  const handlePackageSelect = (condition: PackageCondition) => {
    setPackageCondition(condition);
  };

  const handleRejectToggle = (e: any) => {
    const value = e.detail.value;
    setIsRejected(value);
    if (!value) setRejectReason('');
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
      actualTemperature: Number(parseFloat(actualTemp).toFixed(2)),
      packageCondition,
      isRejected,
      rejectReason: isRejected ? rejectReason : undefined,
      remark: remark || undefined,
      operatorName: operatorName || undefined,
      operateTime: new Date().toISOString()
    };
    console.log('[ReceiptPage] 提交验温单:', form);
    saveReceipt(selectedWaybill.id, form);
    setShowSubmittedView(true);
    Taro.showToast({ title: '验温成功', icon: 'success' });
  };

  const handleReset = () => {
    resetForm();
  };

  const handleEditAgain = () => {
    setShowSubmittedView(false);
  };

  const handleScan = () => {
    Taro.navigateTo({ url: '/pages/scan/index' });
  };

  const goToWaybills = () => {
    Taro.switchTab({ url: '/pages/waybills/index' });
  };

  const displayTemp = useMemo(() => {
    if (actualTemp === '' || isNaN(parseFloat(actualTemp))) return '';
    const num = parseFloat(actualTemp);
    return (num > 0 ? '' : num === 0 ? '' : '') + num.toString();
  }, [actualTemp]);

  if (showSubmittedView && existingReceipt && selectedWaybill) {
    return (
      <View className={styles.page}>
        <View className={styles.header}>
          <Text className={styles.title}>收货验温</Text>
          <Text className={styles.subtitle}>
            {existingReceipt.isRejected ? '已拒收，请联系承运方' : '验温记录已保存'}
          </Text>
        </View>
        <View className={styles.successState}>
          <View className={classnames(styles.successIcon, existingReceipt.isRejected && styles.rejectIcon)}>
            {existingReceipt.isRejected ? '×' : '✓'}
          </View>
          <Text className={classnames(styles.successTitle, existingReceipt.isRejected && styles.rejectTitle)}>
            {existingReceipt.isRejected ? '已拒收' : '验温成功'}
          </Text>
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
                {existingReceipt.actualTemperature}°C
              </Text>
            </View>
            <View className={styles.successReceiptRow}>
              <Text className={styles.successReceiptLabel}>约定范围</Text>
              <Text className={styles.successReceiptValue}>
                {selectedWaybill.agreeTempRange.min}°C ~ {selectedWaybill.agreeTempRange.max}°C
              </Text>
            </View>
            <View className={styles.successReceiptRow}>
              <Text className={styles.successReceiptLabel}>包装状态</Text>
              <Text className={styles.successReceiptValue}>
                {getPackageConditionText(existingReceipt.packageCondition || '')}
              </Text>
            </View>
            <View className={styles.successReceiptRow}>
              <Text className={styles.successReceiptLabel}>是否拒收</Text>
              <Text
                className={styles.successReceiptValue}
                style={{ color: existingReceipt.isRejected ? '#F44336' : '#4CAF50' }}
              >
                {existingReceipt.isRejected ? '已拒收' : '正常收货'}
              </Text>
            </View>
            {existingReceipt.isRejected && existingReceipt.rejectReason && (
              <View className={styles.successReceiptRow}>
                <Text className={styles.successReceiptLabel}>拒收原因</Text>
                <Text className={styles.successReceiptValue}>{existingReceipt.rejectReason}</Text>
              </View>
            )}
            {existingReceipt.remark && (
              <View className={styles.successReceiptRow}>
                <Text className={styles.successReceiptLabel}>备注</Text>
                <Text className={styles.successReceiptValue}>{existingReceipt.remark}</Text>
              </View>
            )}
            {existingReceipt.operatorName && (
              <View className={styles.successReceiptRow}>
                <Text className={styles.successReceiptLabel}>收货人</Text>
                <Text className={styles.successReceiptValue}>{existingReceipt.operatorName}</Text>
              </View>
            )}
            <View className={styles.successReceiptRow}>
              <Text className={styles.successReceiptLabel}>操作时间</Text>
              <Text className={styles.successReceiptValue}>
                {formatFullTime(existingReceipt.operateTime || new Date().toISOString())}
              </Text>
            </View>
          </View>
          <View className={styles.successActions}>
            <Button className={styles.cancelBtn} onClick={handleEditAgain}>
              修改验温
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

        <ArrivalReminder currentWaybillId={selectedWaybill?.id} />

        <View className={styles.waybillSelectCard}>
          <Text className={styles.selectLabel}>待验运单</Text>
          <View className={styles.selectRow}>
            <View className={styles.selectInfo}>
              <Text className={styles.selectNo}>
                {selectedWaybill.waybillNo}
                {existingReceipt && (
                  <Text className={styles.alreadyBadge}>已验</Text>
                )}
              </Text>
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
              <Input
                className={styles.tempInput}
                type="text"
                placeholder="-18.0 或 3.0"
                placeholderStyle="color: #C9CDD4"
                value={actualTemp}
                onInput={handleTempInput}
                onFocus={() => setTempFocused(true)}
                onBlur={() => setTempFocused(false)}
              />
              <Text className={styles.tempUnit}>°C</Text>
            </View>
            <View className={styles.tempRange}>
              <Text>
                当前车内：{selectedWaybill.currentTemp}°C
                {'  |  '}
                全程{selectedWaybill.minTemp.toFixed(1)}°C ~ {selectedWaybill.maxTemp.toFixed(1)}°C
              </Text>
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
