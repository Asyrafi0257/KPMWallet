import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StudentHomeScreen from '../screens/student/studentHomeScreen';
import StudentProfileScreen from '../screens/student/studentProfileScreen';
import StudentEditProfileScreen from '../screens/student/studentEditProfileScreen';
import ChangePasswordScreen from '../screens/vendor/vendorChangePassword';
import StudentParentProfileScreen from '../screens/student/studentParentProfileScreen';
import StudentSchoolProfileScreen from '../screens/student/studentSchoolProfileScreen';
import StudentDigitalIdScreen from '../screens/student/studentDigitalIdScreen';

export type StudentTabParamList = {
  Home: undefined;
  Transaction: undefined;
  Wallet: undefined;
  DigitalID: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<StudentTabParamList>();
const Stack = createNativeStackNavigator<StudentStackParamList>();

export type StudentStackParamList = {
  StudentTabs: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  ParentProfile: undefined;
  SchoolProfile: undefined;
};

function StudentPlaceholder({ title }: { title: string }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>Student {title.toLowerCase()} screen</Text>
    </View>
  );
}

function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0041C2',
        tabBarInactiveTintColor: '#A7A7AE',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarLabel: route.name === 'DigitalID' ? 'Digital ID' : route.name,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<keyof StudentTabParamList, keyof typeof Ionicons.glyphMap> = {
            Home: 'home-outline',
            Transaction: 'receipt-outline',
            Wallet: 'wallet-outline',
            DigitalID: 'card-outline',
            Profile: 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={StudentHomeScreen} />
      <Tab.Screen name="Transaction" component={StudentTransactionScreen} />
      <Tab.Screen name="DigitalID" component={StudentDigitalIdScreen} />
      <Tab.Screen name="Wallet">{() => <StudentPlaceholder title="Wallet" />}</Tab.Screen>
      <Tab.Screen name="Profile" component={StudentProfileScreen} />
    </Tab.Navigator>
  );
}

function StudentTransactionScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const periods: Array<{ key: 'all' | 'today' | 'week' | 'month'; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
  ];
  const now = new Date();
  const paymentHistory: Array<{ vendor: string; createdAt: Date; amount: number }> = [];
  const periodStart = new Date(now);
  periodStart.setHours(0, 0, 0, 0);
  if (selectedPeriod === 'week') {
    periodStart.setDate(periodStart.getDate() - ((periodStart.getDay() + 6) % 7));
  } else if (selectedPeriod === 'month') {
    periodStart.setDate(1);
  }
  const visiblePayments = selectedPeriod === 'all'
    ? paymentHistory
    : paymentHistory.filter((payment) => payment.createdAt >= periodStart);
  const totalSpending = visiblePayments.reduce((total, payment) => total + payment.amount, 0);
  const formatPaymentDate = (date: Date) => {
    if (date.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const paymentGroups = visiblePayments.reduce<Array<{ date: string; payments: typeof paymentHistory }>>((groups, payment) => {
    const date = formatPaymentDate(payment.createdAt);
    const group = groups.find((entry) => entry.date === date);
    if (group) group.payments.push(payment);
    else groups.push({ date, payments: [payment] });
    return groups;
  }, []);

  return (
    <SafeAreaView style={styles.transactionScreen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.transactionContent}>
        <View style={styles.transactionTop}>
          <View style={styles.transactionHeader}>
            <View>
              <Text style={styles.transactionTitle}>Transactions</Text>
              <Text style={styles.transactionSubtitle}>View your payment history</Text>
            </View>
            <Pressable
              style={styles.printButton}
              onPress={() => {}}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Print transactions"
            >
              <Ionicons name="print-outline" size={20} color="#0041C2" />
            </Pressable>
          </View>
          <View style={styles.periodRow}>
            {periods.map((period) => {
              const selected = selectedPeriod === period.key;
              return (
                <Pressable
                  key={period.key}
                  onPress={() => setSelectedPeriod(period.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[styles.periodChip, selected && styles.periodChipSelected]}
                >
                  <Text style={[styles.periodLabel, selected && styles.periodLabelSelected]}>
                    {period.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.spendingCard}>
          <View pointerEvents="none" style={[styles.spendingCircle, styles.spendingCircleTopRight]} />
          <View pointerEvents="none" style={[styles.spendingCircle, styles.spendingCircleBottomLeft]} />
          <View style={styles.spendingInfo}>
            <Text style={styles.spendingHeading}>
              {selectedPeriod === 'all'
                ? 'Total spending overall'
                : `Total spending ${selectedPeriod === 'today' ? 'today' : `this ${selectedPeriod}`}`}
            </Text>
            <Text style={styles.spendingAmount}>RM {totalSpending.toFixed(2)}</Text>
            <Text style={styles.spendingCount}>{visiblePayments.length} transactions</Text>
          </View>
          <View style={styles.chart} accessibilityLabel="Spending chart">
            <View style={[styles.chartBar, styles.chartBarOne]} />
            <View style={[styles.chartBar, styles.chartBarTwo]} />
            <View style={[styles.chartBar, styles.chartBarThree]} />
            <View style={[styles.chartBar, styles.chartBarFour]} />
            <View style={[styles.chartBar, styles.chartBarFive]} />
          </View>
        </View>
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Payment History</Text>
          {paymentGroups.length > 0 ? paymentGroups.map((group) => {
            const expanded = !!expandedDates[group.date];
            const shownPayments = expanded ? group.payments : group.payments.slice(0, 2);
            return (
              <View key={group.date}>
                <Text style={styles.historyDate}>{group.date}</Text>
                {shownPayments.map((payment, index) => (
                  <View key={`${payment.createdAt.toISOString()}-${payment.vendor}`}>
                    <View style={styles.paymentRow}>
                      <View style={styles.vendorIcon}>
                        <Ionicons name="storefront-outline" size={19} color="#0041C2" />
                      </View>
                      <View style={styles.paymentDetails}>
                        <Text style={styles.vendorName} numberOfLines={1}>{payment.vendor}</Text>
                        <Text style={styles.paymentTime}>{payment.createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>
                      <Text style={styles.paymentAmount}>RM {payment.amount.toFixed(2)}</Text>
                    </View>
                    {index < shownPayments.length - 1 && <View style={styles.paymentDivider} />}
                  </View>
                ))}
                {group.payments.length > 2 && (
                  <Pressable
                    style={styles.seeAllButton}
                    onPress={() => setExpandedDates((current) => ({ ...current, [group.date]: !expanded }))}
                    accessibilityRole="button"
                  >
                    <Text style={styles.seeAllText}>{expanded ? 'See less' : `See all (${group.payments.length})`}</Text>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color="#0041C2" />
                  </Pressable>
                )}
              </View>
            );
          }) : (
            <View style={styles.historyEmpty}>
              <Ionicons name="receipt-outline" size={24} color="#94A3B8" />
              <Text style={styles.historyEmptyText}>Your payment history will appear here.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function StudentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentTabs" component={StudentTabs} />
      <Stack.Screen name="EditProfile" component={StudentEditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="ParentProfile" component={StudentParentProfileScreen} />
      <Stack.Screen name="SchoolProfile" component={StudentSchoolProfileScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    color: '#1A1A2E',
    fontSize: 24,
    fontWeight: '700',
  },
  description: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
  },
  tabBar: {
    height: 70,
    paddingTop: 8,
    paddingBottom: 10,
  },
  tabLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  tabItem: { paddingHorizontal: 0 },
  transactionScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  transactionContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 58,
  },
  transactionTop: {
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 20,
  },
  periodChip: {
    minWidth: 72,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  periodChipSelected: {
    backgroundColor: '#0041C2',
  },
  periodLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  periodLabelSelected: {
    color: '#FFFFFF',
  },
  spendingCard: {
    position: 'relative',
    minHeight: 166,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: '#0041C2',
    overflow: 'hidden',
  },
  spendingCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  spendingCircleTopRight: {
    width: 150,
    height: 150,
    top: -78,
    right: -42,
  },
  spendingCircleBottomLeft: {
    width: 118,
    height: 118,
    bottom: -72,
    left: -46,
  },
  spendingInfo: {
    flex: 1,
    paddingRight: 8,
  },
  spendingHeading: {
    color: '#DBEAFE',
    fontSize: 13,
    fontWeight: '600',
  },
  spendingAmount: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  spendingCount: {
    marginTop: 7,
    color: '#DBEAFE',
    fontSize: 12,
    fontWeight: '500',
  },
  chart: {
    height: 76,
    width: 92,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.45)',
  },
  chartBar: {
    width: 11,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
  chartBarOne: { height: 24 },
  chartBarTwo: { height: 42, opacity: 0.72 },
  chartBarThree: { height: 32, opacity: 0.88 },
  chartBarFour: { height: 58 },
  chartBarFive: { height: 48, opacity: 0.82 },
  historySection: { marginTop: 24 },
  historyTitle: { color: '#1A1A2E', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  historyDate: { color: '#64748B', fontSize: 12, fontWeight: '600', marginTop: 15, marginBottom: 4 },
  paymentRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12 },
  vendorIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2FF' },
  paymentDetails: { flex: 1, gap: 5 },
  vendorName: { color: '#1E293B', fontSize: 14, fontWeight: '600' },
  paymentTime: { color: '#64748B', fontSize: 12 },
  paymentAmount: { color: '#1E293B', fontSize: 14, fontWeight: '700' },
  paymentDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E2E8F0', marginLeft: 54 },
  seeAllButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  seeAllText: { color: '#0041C2', fontSize: 12, fontWeight: '700' },
  historyEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, gap: 9 },
  historyEmptyText: { color: '#94A3B8', fontSize: 13 },
  printButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#DBE5FF',
  },
  transactionTitle: {
    color: '#1A1A2E',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  transactionSubtitle: {
    marginTop: 5,
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
  },
});
