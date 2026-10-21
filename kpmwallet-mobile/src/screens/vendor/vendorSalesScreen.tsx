import React, { useCallback, useState } from 'react';
import { LocalizedText as Text } from '../../components/LocalizedText';
import {
  View,

  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

type PaymentType = 'Cash' | 'QR';

type Transaction = {
  transaction_id: number;
  transaction_code: string;
  amount: number;
  payment: PaymentType;
  created_at: string;
  items: Array<{ name: string; quantity: number }>;
};

type CurrentShiftSales = {
  hasActiveShift: boolean;
  summary: { total_sales: number; transaction_count: number; cash_total: number; qr_total: number };
  transactions: Transaction[];
};

export default function SalesScreen() {
  const [sales, setSales] = useState<CurrentShiftSales | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadSales = useCallback(async (showPageLoading = true) => {
    try {
      setError('');
      if (showPageLoading) setLoading(true);
      const response = await api.get<CurrentShiftSales>('/transaction/current-shift');
      setSales(response.data);
    } catch (requestError) {
      console.log('Failed to load current shift sales:', requestError);
      setError('Unable to load sales. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    void loadSales();
  }, [loadSales]));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Page Title */}
        <Text style={styles.pageTitle}>Sales</Text>

        {loading && !sales ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.emptyMessage}>Loading sales...</Text>
          </View>
        ) : error && !sales ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline-outline" size={52} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Sales unavailable</Text>
            <Text style={styles.emptyMessage}>{error}</Text>
            <Pressable style={styles.refreshButton} onPress={() => { setLoading(true); void loadSales(); }}>
              <Text style={styles.refreshText}>Try again</Text>
            </Pressable>
          </View>
        ) : sales?.hasActiveShift ? (
          <>
            {/* Current Sales Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Current Sales
              </Text>

              <Pressable
                style={styles.refreshButton}
                disabled={refreshing}
                onPress={() => {
                  if (refreshing) return;
                  setRefreshing(true);
                  void loadSales(false);
                }}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                  <Ionicons name="refresh-outline" size={18} color="#4F46E5" />
                )}

                <Text style={styles.refreshText}>
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Text>
              </Pressable>
            </View>

            <ActiveShiftSales sales={sales} />
          </>
        ) : (
          /* No Active Shift */
          <View style={styles.emptyState}>
            <Ionicons
              name="time-outline"
              size={56}
              color="#94A3B8"
            />

            <Text style={styles.emptyTitle}>
              No Active Shift
            </Text>

            <Text style={styles.emptyMessage}>
              Please start a shift first to begin recording sales.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function ActiveShiftSales({ sales }: { sales: CurrentShiftSales }) {
  const { i18n } = useTranslation();
  const { total_sales: totalSales, transaction_count: transactionCount, cash_total: cashSales, qr_total: qrSales } = sales.summary;
  const transactions = sales.transactions;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Sales Summary Grid */}
      <View style={styles.grid}>
        {/* Total Sales */}
        <View style={[styles.summaryCard, styles.totalSalesCard]}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="wallet-outline"
              size={21}
              color="#2563EB"
            />

            <Text style={[styles.cardLabel, styles.totalSalesLabel]}>Total Sales</Text>
          </View>

          <Text style={[styles.cardAmount, styles.totalSalesAmount]}>
            RM {totalSales.toFixed(2)}
          </Text>
        </View>

        {/* Transactions */}
        <View style={[styles.summaryCard, styles.transactionCard]}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="receipt-outline"
              size={21}
              color="#7C3AED"
            />

            <Text style={styles.cardLabel}>Transaction</Text>
          </View>

          <Text style={styles.cardAmount}>
            {transactionCount}
          </Text>
        </View>

        {/* Cash Sales */}
        <View style={[styles.summaryCard, styles.cashCard]}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="cash-outline"
              size={21}
              color="#16A34A"
            />

            <Text style={styles.cardLabel}>Cash</Text>
          </View>

          <Text style={styles.cardAmount}>
            RM {cashSales.toFixed(2)}
          </Text>
        </View>

        {/* QR Sales */}
        <View style={[styles.summaryCard, styles.qrCard]}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="qr-code-outline"
              size={21}
              color="#EA580C"
            />

            <Text style={styles.cardLabel}>QR</Text>
          </View>

          <Text style={styles.cardAmount}>
            RM {qrSales.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Shift Transaction Header */}
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionHeading}>
          Shift Transaction
        </Text>

        <View style={styles.transactionCountBadge}>
          <Text style={styles.transactionCountText}>
            {transactionCount} Transactions
          </Text>
        </View>
      </View>

      {/* Transaction List */}
      {transactions.map((transaction) => (
        <View key={transaction.transaction_id} style={styles.transactionItem}>
          {/* Left Side */}
          <View style={styles.transactionLeft}>
            <Text style={styles.transactionAmount}>
              RM {transaction.amount.toFixed(2)}
            </Text>

            <View style={styles.paymentRow}>
              <Ionicons
                name={
                  transaction.payment === 'Cash'
                    ? 'cash-outline'
                    : 'qr-code-outline'
                }
                size={16}
                color={
                  transaction.payment === 'Cash'
                    ? '#16A34A'
                    : '#7C3AED'
                }
              />

              <Text style={styles.paymentType}>
                {transaction.payment}
              </Text>
            </View>

            <Text style={styles.purchasedItems} numberOfLines={2}>
              {transaction.items.map((item) => `${item.name} × ${item.quantity}`).join(' · ')}
            </Text>

            <View style={styles.successBadge}>
              <Ionicons
                name="checkmark-circle"
                size={13}
                color="#16A34A"
              />

              <Text style={styles.successText}>
              Successful
              </Text>
            </View>
          </View>

          {/* Right Side */}
          <View style={styles.transactionRight}>
            <Text
              style={styles.transactionId}
              numberOfLines={1}
            >
              {transaction.transaction_code}
            </Text>

            <Text style={styles.transactionTime}>
              {new Date(transaction.created_at).toLocaleString(
                i18n.language === 'ms' ? 'ms-MY' : 'en-MY',
              )}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 16,
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
  },

  // Current Sales Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
  },

  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  refreshText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },

  // No Active Shift
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 60,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 8,
  },

  emptyMessage: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
  },

  // Active Shift Content
  scrollContent: {
    paddingBottom: 30,
  },

  // 2 x 2 Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 13,
    marginBottom: 24,
  },

  summaryCard: {
    width: '48.2%',
    minHeight: 124,
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    justifyContent: 'space-between',
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.045,
    shadowRadius: 9,
    elevation: 2,
  },

  totalSalesCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },

  transactionCard: {
    backgroundColor: '#F5F3FF',
    borderColor: '#EDE9FE',
  },

  cashCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },

  qrCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FFEDD5',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    flexShrink: 1,
  },

  cardAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 14,
  },

  totalSalesLabel: {
    color: '#315B91',
  },

  totalSalesAmount: {
    color: '#153D70',
    fontSize: 23,
  },

  // Shift Transaction Header
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },

  transactionHeading: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
  },

  transactionCountBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  transactionCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },

  // Individual Transaction
  transactionItem: {
    marginBottom: 11,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E8EDF4',
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.045,
    shadowRadius: 8,
    elevation: 1,
  },

  transactionLeft: {
    flex: 1,
    minWidth: 0,
  },

  transactionAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 7,
  },

  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },

  paymentType: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },

  purchasedItems: {
    marginTop: 11,
    marginBottom: 12,
    color: '#52627A',
    fontSize: 12,
    lineHeight: 18,
  },

  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#EAF8F0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  successText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },

  transactionRight: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8EDF4',
  },

  transactionId: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'right',
    marginBottom: 8,
  },

  transactionDate: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
    marginBottom: 4,
  },

  transactionTime: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
  },
});
