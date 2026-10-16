import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type PaymentType = 'Cash' | 'QR';

type Transaction = {
  id: string;
  amount: number;
  paymentType: PaymentType;
  status: string;
  date: string;
  time: string;
};

const transactions: Transaction[] = [
  {
    id: 'TXN-SPEND-MT02QSRS',
    amount: 25.0,
    paymentType: 'Cash',
    status: 'Successful',
    date: '17 Oct 2026',
    time: '10:30 AM',
  },
  {
    id: 'TXN-SPEND-MT02QST2',
    amount: 12.5,
    paymentType: 'QR',
    status: 'Successful',
    date: '17 Oct 2026',
    time: '10:15 AM',
  },
  {
    id: 'TXN-SPEND-MT02QST8',
    amount: 8.0,
    paymentType: 'Cash',
    status: 'Successful',
    date: '17 Oct 2026',
    time: '09:45 AM',
  },
  {
    id: 'TXN-SPEND-MT02QSU4',
    amount: 15.0,
    paymentType: 'QR',
    status: 'Successful',
    date: '17 Oct 2026',
    time: '09:20 AM',
  },
];

export default function SalesScreen() {
  // Demo sahaja: false = tiada active shift
  const [hasActiveShift, setHasActiveShift] = useState(false);

  const handleRefresh = () => {
    // Nanti sambungkan dengan API backend.
    console.log('Refresh sales');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Page Title */}
        <Text style={styles.pageTitle}>Sales</Text>

        {hasActiveShift ? (
          <>
            {/* Current Sales Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Current Sales
              </Text>

              <Pressable
                style={styles.refreshButton}
                onPress={handleRefresh}
              >
                <Ionicons
                  name="refresh-outline"
                  size={18}
                  color="#4F46E5"
                />

                <Text style={styles.refreshText}>
                  Refresh
                </Text>
              </Pressable>
            </View>

            <ActiveShiftSales />
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

function ActiveShiftSales() {
  const totalSales = transactions.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  );

  const cashSales = transactions
    .filter((transaction) => transaction.paymentType === 'Cash')
    .reduce((total, transaction) => total + transaction.amount, 0);

  const qrSales = transactions
    .filter((transaction) => transaction.paymentType === 'QR')
    .reduce((total, transaction) => total + transaction.amount, 0);

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

            <Text style={styles.cardLabel}>Total Sales</Text>
          </View>

          <Text style={styles.cardAmount}>
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
            {transactions.length}
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
            {transactions.length} Transactions
          </Text>
        </View>
      </View>

      {/* Transaction List */}
      {transactions.map((transaction) => (
        <View key={transaction.id} style={styles.transactionItem}>
          {/* Left Side */}
          <View style={styles.transactionLeft}>
            <Text style={styles.transactionAmount}>
              RM {transaction.amount.toFixed(2)}
            </Text>

            <View style={styles.paymentRow}>
              <Ionicons
                name={
                  transaction.paymentType === 'Cash'
                    ? 'cash-outline'
                    : 'qr-code-outline'
                }
                size={16}
                color={
                  transaction.paymentType === 'Cash'
                    ? '#16A34A'
                    : '#7C3AED'
                }
              />

              <Text style={styles.paymentType}>
                {transaction.paymentType}
              </Text>
            </View>

            <View style={styles.successBadge}>
              <Ionicons
                name="checkmark-circle"
                size={13}
                color="#16A34A"
              />

              <Text style={styles.successText}>
                {transaction.status}
              </Text>
            </View>
          </View>

          {/* Right Side */}
          <View style={styles.transactionRight}>
            <Text
              style={styles.transactionId}
              numberOfLines={1}
            >
              {transaction.id}
            </Text>

            <Text style={styles.transactionDate}>
              {transaction.date}
            </Text>

            <Text style={styles.transactionTime}>
              {transaction.time}
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
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 24,
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
    rowGap: 12,
    marginBottom: 28,
  },

  summaryCard: {
    width: '48.2%',
    minHeight: 112,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    justifyContent: 'space-between',
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
    fontSize: 21,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 14,
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
    fontSize: 18,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },

  transactionLeft: {
    flex: 1,
    minWidth: 0,
  },

  transactionAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
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

  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
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
    color: '#94A3B8',
    textAlign: 'right',
  },
});