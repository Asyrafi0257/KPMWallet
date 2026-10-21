import React, { useCallback, useEffect, useState } from "react";
import { LocalizedText as Text } from '../../components/LocalizedText';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,


  View,
} from "react-native";
import { LocalizedTextInput as TextInput } from '../../components/LocalizedTextInput';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import api from "../../services/api";

type Period = "today" | "week" | "month" | "all";
type SalesRecord = {
  shift_id: number;
  date: string;
  start_shift: string | null;
  end_shift: string | null;
  closed_at: string | null;
  starting_cash: number;
  cash_sales: number;
  qr_sales: number;
  total_sales: number;
  expected_cash: number;
  closing_cash: number;
  discrepancy: number;
  transaction_count: number;
};
type ClosedShift = {
  shift_id: number;
  date: string;
  start_shift: string | null;
  end_shift: string | null;
  closed_at: string | null;
  shift_status: "CLOSED";
  sales_summary: SalesRecord | null;
  transactions: Array<{
    transaction_id: number;
    transaction_code: string;
    payment: string;
    amount: number;
    created_at: string;
    items: Array<{ item_name: string; quantity: number }>;
  }>;
};

const periods: Array<{ key: Period; label: string }> = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "all", label: "All" },
];
const money = (value: number) => `RM ${Number(value ?? 0).toFixed(2)}`;

const formatDate = (value: string) => {
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "Date unavailable";
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    weekday: "long", day: "2-digit", month: "short", year: "numeric",
  });
};

const formatClosedTime = (record: ClosedShift) => record.closed_at
  ? new Date(record.closed_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  : record.end_shift?.slice(0, 5) ?? "--:--";

export default function VendorTransactionScreen() {
  const navigation = useNavigation();
  const [period, setPeriod] = useState<Period>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [records, setRecords] = useState<ClosedShift[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ClosedShift | null>(null);
  const [expandedShiftId, setExpandedShiftId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => navigation.addListener("focus", () => setPeriod("all")), [navigation]);

  const loadRecords = useCallback(async () => {
    try {
      setError("");
      const response = await api.get<ClosedShift[]>("/shift/closed-history", {
        params: { period, search: debouncedSearch || undefined },
      });
      setRecords(response.data ?? []);
    } catch (requestError: any) {
      console.error("Failed to load closed shift records:", requestError?.response?.data ?? requestError);
      const message = requestError?.response?.data?.message;
      setError(Array.isArray(message) ? message.join("\n") : message || "Unable to load closed shifts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [period, debouncedSearch]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    void loadRecords();
  }, [loadRecords]));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Transaction</Text>
            <Text style={styles.subtitle}>Closed shift sales</Text>
          </View>
          <Pressable style={styles.refreshButton} onPress={() => { setLoading(true); void loadRecords(); }}>
            <Ionicons name="refresh-outline" size={20} color="#4F46E5" />
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={19} color="#64748B" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search transaction ID"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            keyboardType="numeric"
            returnKeyType="search"
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={19} color="#94A3B8" />
            </Pressable>
          )}
        </View>

        <View style={styles.periodRow}>
          {periods.map((option) => {
            const selected = period === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => setPeriod(option.key)}
                style={[styles.periodChip, selected && styles.periodChipSelected]}
              >
                <Text style={[styles.periodText, selected && styles.periodTextSelected]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.stateText}>Loading sales records...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Ionicons name="cloud-offline-outline" size={42} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Sales unavailable</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => { setLoading(true); void loadRecords(); }}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons name="receipt-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No closed shifts found</Text>
            <Text style={styles.stateText}>
              {search ? "No sales record matches that transaction ID." : "Closed shift sales records will appear here."}
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {records.map((record) => (
              <View key={record.shift_id}>
                <View style={styles.shiftCard}>
                  <View style={styles.shiftHeader}>
                    <View style={styles.shiftHeaderLeft}>
                      <View style={styles.shiftIcon}>
                        <Ionicons name="time-outline" size={19} color="#4F46E5" />
                      </View>
                      <View style={styles.shiftTitleBlock}>
                        <Text style={styles.shiftTitle}>Shift #{record.shift_id}</Text>
                        <Text style={styles.shiftDate}>{formatDate(record.date)}</Text>
                      </View>
                    </View>
                    <View style={styles.closedBadge}>
                      <Text style={styles.closedBadgeText}>Closed</Text>
                    </View>
                  </View>
                  <View style={styles.closedDetailsRow}>
                    <Text style={styles.closedTime}>Ended at {formatClosedTime(record)}</Text>
                    <Pressable style={styles.detailButton} onPress={() => setSelectedRecord(record)}>
                      <Text style={styles.detailButtonText}>Details</Text>
                      <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                    </Pressable>
                  </View>
                {record.transactions.length > 0 && (
                  <View style={styles.cardTransactions}>
                    <View style={styles.transactionSectionHeader}>
                      <Text style={styles.transactionsHeading}>Transactions</Text>
                      <Text style={styles.transactionMetaInline}>
                        {new Date(record.transactions[0].created_at).toLocaleString("en-GB", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    {record.transactions.slice(0, expandedShiftId === record.shift_id ? undefined : 2).map((transaction) => (
                      <View key={transaction.transaction_id} style={styles.transactionRow}>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionCode} numberOfLines={1}>
                            {transaction.transaction_code || `#${transaction.transaction_id}`} · {transaction.payment}
                          </Text>
                        </View>
                        <Text style={styles.transactionAmount}>{money(transaction.amount)}</Text>
                      </View>
                    ))}
                    {record.transactions.length > 2 && (
                      <Pressable
                        style={styles.seeAllButton}
                        onPress={() => setExpandedShiftId(expandedShiftId === record.shift_id ? null : record.shift_id)}
                      >
                        <Text style={styles.seeAllText}>
                          {expandedShiftId === record.shift_id ? "See less" : `See all (${record.transactions.length})`}
                        </Text>
                        <Ionicons name={expandedShiftId === record.shift_id ? "chevron-up" : "chevron-down"} size={15} color="#4F46E5" />
                      </Pressable>
                    )}
                  </View>
                )}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <Modal visible={selectedRecord !== null} transparent animationType="fade" onRequestClose={() => setSelectedRecord(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedRecord(null)}>
          <Pressable style={styles.detailModal} onPress={() => {}}>
            {selectedRecord && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Shift Details</Text>
                    <Text style={styles.modalSubtitle}>Shift #{selectedRecord.shift_id} · {formatDate(selectedRecord.date)}</Text>
                  </View>
                  <Pressable onPress={() => setSelectedRecord(null)} hitSlop={10}>
                    <Ionicons name="close-circle" size={27} color="#94A3B8" />
                  </Pressable>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {selectedRecord.sales_summary ? (
                    <>
                      <DetailRow label="Starting Cash" value={money(selectedRecord.sales_summary.starting_cash)} />
                      <DetailRow label="Cash Sales" value={money(selectedRecord.sales_summary.cash_sales)} />
                      <DetailRow label="QR Sales" value={money(selectedRecord.sales_summary.qr_sales)} />
                      <DetailRow label="Total Sales" value={money(selectedRecord.sales_summary.total_sales)} />
                      <DetailRow label="Expected Cash" value={money(selectedRecord.sales_summary.expected_cash)} />
                      <DetailRow label="Closing Cash" value={money(selectedRecord.sales_summary.closing_cash)} />
                      <DetailRow
                        label="Discrepancy"
                        value={`${selectedRecord.sales_summary.discrepancy < 0 ? "-" : ""}${money(Math.abs(selectedRecord.sales_summary.discrepancy))}`}
                        valueStyle={selectedRecord.sales_summary.discrepancy === 0 ? styles.discrepancyGood : styles.discrepancyBad}
                      />
                      <DetailRow label="Transactions" value={String(selectedRecord.sales_summary.transaction_count)} last />
                    </>
                  ) : (
                    <Text style={styles.stateText}>No sales summary was saved for this shift.</Text>
                  )}
                </ScrollView>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  last = false,
  valueStyle,
}: {
  label: string;
  value: string;
  last?: boolean;
  valueStyle?: object;
}) {
  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12, paddingBottom: 14 },
  title: { fontSize: 27, fontWeight: "800", color: "#1E1B4B" },
  subtitle: { marginTop: 3, fontSize: 13, color: "#64748B" },
  refreshButton: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  searchBox: { height: 46, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 13 },
  searchInput: { flex: 1, height: "100%", color: "#1E293B", fontSize: 13 },
  periodRow: { flexDirection: "row", gap: 8, marginTop: 12, marginBottom: 12 },
  periodChip: { flex: 1, minHeight: 36, alignItems: "center", justifyContent: "center", paddingHorizontal: 5, borderRadius: 10, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0" },
  periodChipSelected: { backgroundColor: "#4F46E5", borderColor: "#4F46E5" },
  periodText: { fontSize: 11, fontWeight: "700", color: "#64748B" },
  periodTextSelected: { color: "#FFFFFF" },
  list: { paddingBottom: 24, gap: 12 },
  shiftCard: { paddingHorizontal: 14, paddingTop: 14, borderRadius: 17, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E6EAF2" },
  cardTransactions: { marginTop: 2, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E7EAF0", borderBottomLeftRadius: 17, borderBottomRightRadius: 17, backgroundColor: "#FFFFFF" },
  transactionSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 },
  shiftHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  shiftHeaderLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  shiftIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#EEF2FF" },
  shiftTitleBlock: { flex: 1, marginLeft: 10 },
  shiftTitle: { fontSize: 14, fontWeight: "800", color: "#1E1B4B" },
  shiftDate: { marginTop: 3, fontSize: 11, color: "#64748B" },
  closedBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: "#F1F5F9" },
  closedBadgeText: { fontSize: 10, fontWeight: "700", color: "#475569" },
  closedDetailsRow: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 9, marginBottom: 10 },
  closedTime: { flex: 1, fontSize: 11, color: "#64748B" },
  detailButton: { minHeight: 36, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginLeft: 10, paddingHorizontal: 13, borderRadius: 11, backgroundColor: "#4F46E5" },
  detailButtonText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  transactionsHeading: { marginBottom: 4, fontSize: 12, fontWeight: "800", color: "#64748B" },
  transactionRow: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  transactionInfo: { flex: 1, justifyContent: "center", gap: 3 },
  transactionCode: { fontSize: 10, color: "#64748B" },
  transactionMetaInline: { fontSize: 10, color: "#64748B" },
  transactionAmount: { fontSize: 12, fontWeight: "700", color: "#111827" },
  seeAllButton: { minHeight: 30, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 3 },
  seeAllText: { fontSize: 12, fontWeight: "700", color: "#4F46E5" },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  stateText: { marginTop: 9, fontSize: 13, lineHeight: 19, color: "#64748B", textAlign: "center" },
  emptyTitle: { marginTop: 14, fontSize: 17, fontWeight: "800", color: "#1E1B4B", textAlign: "center" },
  retryButton: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: "#4F46E5" },
  retryText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  modalOverlay: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "rgba(15,23,42,0.55)" },
  detailModal: { maxHeight: "85%", padding: 19, borderRadius: 20, backgroundColor: "#FFFFFF" },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1E1B4B" },
  modalSubtitle: { marginTop: 4, fontSize: 12, color: "#64748B" },
  detailRow: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E7EAF0" },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel: { fontSize: 12, color: "#64748B" },
  detailValue: { fontSize: 12, fontWeight: "700", color: "#111827" },
  discrepancyGood: { color: "#15803D" },
  discrepancyBad: { color: "#DC2626" },
});
