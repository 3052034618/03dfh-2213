import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import WaybillCard from '@/components/WaybillCard';
import { useWaybillStore } from '@/store/waybill';
import type { Waybill } from '@/types';

interface FilterOption {
  key: string;
  label: string;
}

const filterOptions: FilterOption[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待装车' },
  { key: 'loading', label: '装车中' },
  { key: 'transit', label: '运输中' },
  { key: 'arriving', label: '即将到达' },
  { key: 'completed', label: '已完成' }
];

const WaybillsPage: React.FC = () => {
  const {
    waybills,
    searchKeyword,
    statusFilter,
    setSearchKeyword,
    setStatusFilter,
    getFilteredWaybills
  } = useWaybillStore();

  const filteredWaybills = useMemo(() => getFilteredWaybills(), [searchKeyword, statusFilter, waybills]);

  const getFilterCount = (key: string): number => {
    if (key === 'all') return waybills.length;
    return waybills.filter((w: Waybill) => w.status === key).length;
  };

  const handleSearch = (e: any) => {
    const value = e.detail.value || '';
    console.log('[WaybillsPage] 搜索关键词:', value);
    setSearchKeyword(value);
  };

  const handleScan = () => {
    console.log('[WaybillsPage] 点击扫码');
    Taro.navigateTo({ url: '/pages/scan/index' });
  };

  const handleFilterClick = (key: string) => {
    console.log('[WaybillsPage] 选择筛选:', key);
    setStatusFilter(key);
  };

  const handlePullDownRefresh = () => {
    console.log('[WaybillsPage] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }, 800);
  };

  React.useEffect(() => {
    Taro.eventCenter.on('__taroStartPullDownRefresh', handlePullDownRefresh);
    return () => {
      Taro.eventCenter.off('__taroStartPullDownRefresh', handlePullDownRefresh);
    };
  }, []);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>冷链通</Text>
        <Text className={styles.subtitle}>实时掌握冷链运输温度与路线风险</Text>

        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="输入运单号、货物名称、收货方"
            placeholderClass="input-placeholder"
            value={searchKeyword}
            onInput={handleSearch}
            confirmType="search"
          />
          <Button className={styles.scanBtn} onClick={handleScan}>
            扫码
          </Button>
        </View>
      </View>

      <View className={styles.filterSection}>
        <ScrollView scrollX className={styles.filterScroll} showScrollbar={false}>
          {filterOptions.map((opt) => (
            <View
              key={opt.key}
              className={classnames(styles.filterChip, statusFilter === opt.key && styles.active)}
              onClick={() => handleFilterClick(opt.key)}
            >
              <Text>{opt.label}</Text>
              <Text className={styles.filterCount}>{getFilterCount(opt.key)}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.listSection}>
        <View className={styles.listHeader}>
          <Text className={styles.listTitle}>运单列表</Text>
          <Text className={styles.listCount}>共 {filteredWaybills.length} 条</Text>
        </View>

        {filteredWaybills.length > 0 ? (
          filteredWaybills.map((waybill) => (
            <WaybillCard key={waybill.id} waybill={waybill} />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📦</Text>
            <Text className={styles.emptyTitle}>暂无运单</Text>
            <Text className={styles.emptyDesc}>
              {searchKeyword ? '未找到匹配的运单，请换个关键词试试' : '点击扫码或输入运单号查询'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default WaybillsPage;
