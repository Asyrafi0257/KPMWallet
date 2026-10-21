import React, { useMemo, useState } from 'react';
import { LocalizedText as Text } from '../../components/LocalizedText';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,


  View,
} from 'react-native';
import { LocalizedTextInput as TextInput } from '../../components/LocalizedTextInput';
import { LocalizedAlert as Alert } from '../../components/LocalizedAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { VendorStackParamList } from '../../navigation/vendorNavigator';
import { requestNewCustomer } from './vendorItemsStore';
import api from '../../services/api';

type CheckoutRoute = RouteProp<VendorStackParamList, 'Checkout'>;
type PaymentMethod = 'QR' | 'Cash';
type SavedTransaction = {
  transaction_id: number;
  transaction_code: string;
  payment: PaymentMethod;
  amount: number;
  amount_received: number;
  change_amount: number;
  created_at: string;
  items: Array<{ item_id: number; name: string; quantity: number; unit_price: number; line_total: number }>;
};

const money = (value: number) => `RM ${value.toFixed(2)}`;

export default function VendorCheckoutScreen() {
  const navigation = useNavigation<any>();
  const { params } = useRoute<CheckoutRoute>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [amountReceived, setAmountReceived] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [savedTransaction, setSavedTransaction] = useState<SavedTransaction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(
    () => params.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [params.cartItems],
  );
  const received = Number(amountReceived) || 0;
  const change = Math.max(0, received - total);
  const canConfirm = Boolean(paymentMethod) && received >= total;

  const confirmPayment = async () => {
    if (!paymentMethod || !canConfirm || submitting) return;
    setSubmitting(true);
    try {
      const response = await api.post<SavedTransaction>('/transaction', {
        payment: paymentMethod,
        amount_received: received,
        items: params.cartItems.map((item) => ({
          item_id: Number(item.id),
          quantity: item.quantity,
        })),
      });
      setSavedTransaction(response.data);
      setTransactionId(response.data.transaction_code);
      setTransactionDate(new Date(response.data.created_at));
      setConfirmed(true);
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert(
        'Unable to complete sale',
        Array.isArray(message) ? message.join('\n') : message || 'Check the open shift, item stock, and payment amount, then try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const receiptItems = savedTransaction?.items ?? params.cartItems.map((item) => ({
    item_id: Number(item.id),
    name: item.name,
    quantity: item.quantity,
    unit_price: item.price,
    line_total: item.price * item.quantity,
  }));
  const receiptTotal = savedTransaction?.amount ?? total;
  const receiptReceived = savedTransaction?.amount_received ?? received;
  const receiptChange = savedTransaction?.change_amount ?? change;

  if (confirmed) {
    return (
      <SafeAreaView style={styles.receiptSafeArea} edges={['top', 'bottom']}>
        <ScrollView style={styles.receiptScroll} contentContainerStyle={styles.receiptPage} showsVerticalScrollIndicator={false}>
          <View style={styles.receiptSuccess}>
            <View style={styles.successIcon}><Ionicons name="checkmark" size={31} color="#FFFFFF" /></View>
            <Text style={styles.successTitle}>Payment successful</Text>
            <Text style={styles.successCopy}>Transaction recorded</Text>
          </View>

          <View style={styles.receiptCard}>
            <View style={styles.receiptBrand}>
              <Text style={styles.receiptBrandName}>PAYMENT RECEIPT</Text>
            </View>

            <View style={styles.receiptIdBox}>
              <Text style={styles.receiptMetaLabel}>TRANSACTION ID</Text>
              <Text style={styles.receiptId}>{transactionId}</Text>
            </View>

            <View style={styles.receiptItems}>
              <Text style={styles.receiptSectionLabel}>ITEMS PURCHASED</Text>
              {receiptItems.map((item) => (
                <View key={item.item_id} style={styles.receiptItemRow}>
                  <View style={styles.receiptItemDescription}>
                    <Text style={styles.receiptItemName}>{item.name}</Text>
                    <Text style={styles.receiptItemQty}>{item.quantity} × {money(item.unit_price)}</Text>
                  </View>
                  <Text style={styles.receiptItemAmount}>{money(item.line_total)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptTotalLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.receiptTotal}>{money(receiptTotal)}</Text>
            </View>

            <View style={styles.receiptDetails}>
              <View style={styles.receiptDetailRow}>
                <Text style={styles.receiptDetailLabel}>Payment method</Text>
                <Text style={styles.receiptDetailValue}>{paymentMethod === 'QR' ? 'QR Pay' : 'Cash'}</Text>
              </View>
              <View style={styles.receiptDetailRow}>
                <Text style={styles.receiptDetailLabel}>Amount received</Text>
                <Text style={styles.receiptDetailValue}>{money(receiptReceived)}</Text>
              </View>
              {paymentMethod === 'Cash' && (
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLabel}>Change</Text>
                <Text style={styles.receiptDetailValue}>{money(receiptChange)}</Text>
                </View>
              )}
              <View style={styles.receiptDetailRow}>
                <Text style={styles.receiptDetailLabel}>Date & time</Text>
                <Text style={styles.receiptDetailValue}>{transactionDate.toLocaleString('en-MY')}</Text>
              </View>
            </View>
            <View style={styles.receiptThanks}>
              <Text style={styles.receiptThanksText}>Thank you!</Text>
            </View>
          </View>

        </ScrollView>
        <View style={styles.receiptFooter}>
          <Pressable
            onPress={() => {
              requestNewCustomer();
              navigation.popToTop();
            }}
            style={styles.nextCustomerButton}
          >
            <Ionicons name="person-add-outline" size={19} color="#FFFFFF" />
            <Text style={styles.nextCustomerText}>Next customer</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Back to cart">
            <Ionicons name="chevron-back" size={23} color="#243650" />
          </Pressable>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Payment</Text>
            <Text style={styles.headerSubtitle}>Review order and record payment</Text>
          </View>
          <View style={styles.stepBadge}><Text style={styles.stepText}>2 of 2</Text></View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.orderCard}>
            <View style={styles.cardHeading}>
              <Text style={styles.cardTitle}>Order summary</Text>
              <Text style={styles.muted}>{params.cartItems.reduce((count, item) => count + item.quantity, 0)} items</Text>
            </View>
            {params.cartItems.map((item) => (
              <View key={item.id} style={styles.orderRow}>
                <View style={styles.orderItemName}>
                  <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.productQuantity}>{item.quantity} × {money(item.price)}</Text>
                </View>
                <Text style={styles.lineTotal}>{money(item.price * item.quantity)}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total to pay</Text>
              <Text style={styles.totalValue}>{money(total)}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Choose payment method</Text>
          <View style={styles.methodRow}>
            <Pressable
              onPress={() => setPaymentMethod('QR')}
              accessibilityRole="button"
              accessibilityState={{ selected: paymentMethod === 'QR' }}
              style={[styles.methodCard, paymentMethod === 'QR' && styles.methodSelected]}
            >
              <View style={[styles.methodIcon, { backgroundColor: '#EAF2FF' }]}>
                <Ionicons name="qr-code-outline" size={23} color="#3478D4" />
              </View>
              <Text style={styles.methodName}>QR Pay</Text>
              <Text style={styles.methodHint}>Scan and pay</Text>
              {paymentMethod === 'QR' && <Ionicons name="checkmark-circle" size={19} color="#1769E0" style={styles.methodCheck} />}
            </Pressable>
            <Pressable
              onPress={() => setPaymentMethod('Cash')}
              accessibilityRole="button"
              accessibilityState={{ selected: paymentMethod === 'Cash' }}
              style={[styles.methodCard, paymentMethod === 'Cash' && styles.methodSelected]}
            >
              <View style={[styles.methodIcon, { backgroundColor: '#E8F7F0' }]}>
                <Ionicons name="cash-outline" size={23} color="#2A9B69" />
              </View>
              <Text style={styles.methodName}>Cash</Text>
              <Text style={styles.methodHint}>Pay at counter</Text>
              {paymentMethod === 'Cash' && <Ionicons name="checkmark-circle" size={19} color="#1769E0" style={styles.methodCheck} />}
            </Pressable>
          </View>

          {paymentMethod && (
            <View style={styles.receivedCard}>
              <View style={styles.cardHeading}>
                <Text style={styles.cardTitle}>Amount received</Text>
                <Text style={styles.requiredLabel}>Required</Text>
              </View>
              <Text style={styles.receivedHelp}>
                {paymentMethod === 'Cash'
                  ? 'Enter the cash amount handed over by the customer.'
                  : 'Enter the amount confirmed as received by QR payment.'}
              </Text>
              <View style={styles.amountInputWrap}>
                <Text style={styles.currencyPrefix}>RM</Text>
                <TextInput
                  value={amountReceived}
                  onChangeText={(value) => setAmountReceived(value.replace(/[^\d.]/g, ''))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#A0AABC"
                  style={styles.amountInput}
                  onSubmitEditing={Keyboard.dismiss}
                />
                {received >= total && received > 0 && (
                  <Ionicons name="checkmark-circle" size={20} color="#2AA66D" />
                )}
              </View>
              {received > 0 && received < total && (
                <Text style={styles.shortfallText}>Still due {money(total - received)}</Text>
              )}
              {paymentMethod === 'Cash' && received >= total && received > 0 && (
                <View style={styles.changeRow}>
                  <Text style={styles.changeLabel}>Change to return</Text>
                  <Text style={styles.changeValue}>{money(change)}</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerTotal}>
            <Text style={styles.footerLabel}>Total</Text>
            <Text style={styles.footerAmount}>{money(total)}</Text>
          </View>
          <Pressable
            disabled={!canConfirm || submitting}
            onPress={() => { Keyboard.dismiss(); void confirmPayment(); }}
            style={[styles.primaryButton, (!canConfirm || submitting) && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>{submitting ? 'Recording payment…' : 'Confirm payment'}</Text>
            {!submitting && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  header: { minHeight: 74, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EDF0F5' },
  backButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#F1F4F8', alignItems: 'center', justifyContent: 'center' },
  headerTitles: { flex: 1, marginLeft: 12 },
  headerTitle: { color: '#1B2C48', fontSize: 18, fontWeight: '800' },
  headerSubtitle: { marginTop: 3, color: '#8290A5', fontSize: 11 },
  stepBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#EAF2FF' },
  stepText: { color: '#1769E0', fontSize: 10, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 },
  orderCard: { padding: 17, borderRadius: 19, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEFF5' },
  cardHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#263852', fontSize: 14, fontWeight: '700' },
  muted: { color: '#8793A5', fontSize: 11 },
  orderRow: { marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderItemName: { flex: 1, marginRight: 12 },
  productName: { color: '#33445F', fontSize: 13, fontWeight: '600' },
  productQuantity: { marginTop: 3, color: '#8793A5', fontSize: 11 },
  lineTotal: { color: '#33445F', fontSize: 12, fontWeight: '600' },
  divider: { height: 1, marginTop: 17, backgroundColor: '#EDF0F5' },
  totalRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#52627A', fontSize: 13, fontWeight: '600' },
  totalValue: { color: '#1B2C48', fontSize: 18, fontWeight: '800' },
  sectionTitle: { marginTop: 23, marginBottom: 11, color: '#263852', fontSize: 15, fontWeight: '700' },
  methodRow: { flexDirection: 'row', gap: 11 },
  methodCard: { flex: 1, minHeight: 116, padding: 13, position: 'relative', borderWidth: 1.5, borderColor: '#E6EBF2', borderRadius: 17, backgroundColor: '#FFFFFF' },
  methodSelected: { borderColor: '#1769E0', backgroundColor: '#F7FAFF' },
  methodIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  methodName: { marginTop: 10, color: '#263852', fontSize: 13, fontWeight: '700' },
  methodHint: { marginTop: 3, color: '#8793A5', fontSize: 10 },
  methodCheck: { position: 'absolute', top: 10, right: 10 },
  receivedCard: { marginTop: 17, padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEFF5' },
  requiredLabel: { color: '#1769E0', fontSize: 10, fontWeight: '700' },
  receivedHelp: { marginTop: 6, color: '#8290A5', fontSize: 11, lineHeight: 17 },
  amountInputWrap: { height: 52, marginTop: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DDE5EF', borderRadius: 13, backgroundColor: '#FBFCFE' },
  currencyPrefix: { color: '#728199', fontSize: 14, fontWeight: '700' },
  amountInput: { flex: 1, height: '100%', marginLeft: 10, color: '#1B2C48', fontSize: 18, fontWeight: '700' },
  shortfallText: { marginTop: 9, color: '#D17A37', fontSize: 11, fontWeight: '600' },
  changeRow: { marginTop: 13, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EDF0F5' },
  changeLabel: { color: '#718099', fontSize: 12 },
  changeValue: { color: '#269260', fontSize: 13, fontWeight: '700' },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E9EDF3' },
  footerTotal: { marginBottom: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { color: '#7C899C', fontSize: 12 },
  footerAmount: { color: '#1B2C48', fontSize: 17, fontWeight: '800' },
  primaryButton: { minHeight: 52, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 16, backgroundColor: '#1769E0' },
  disabledButton: { backgroundColor: '#AEBBD0' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  successWrap: { flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  successIcon: { width: 76, height: 76, borderRadius: 26, backgroundColor: '#2AA66D', alignItems: 'center', justifyContent: 'center' },
  successTitle: { marginTop: 22, color: '#1B2C48', fontSize: 21, fontWeight: '800', textAlign: 'center' },
  successCopy: { marginTop: 8, color: '#718099', fontSize: 14 },
  successChange: { marginTop: 10, color: '#269260', fontSize: 13, fontWeight: '700' },
  receiptSafeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  receiptScroll: { flex: 1 },
  receiptPage: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 },
  receiptFooter: { paddingHorizontal: 20, paddingTop: 11, paddingBottom: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E9EDF3' },
  receiptSuccess: { alignItems: 'center', marginBottom: 19 },
  receiptCard: { paddingHorizontal: 19, paddingTop: 20, paddingBottom: 15, borderRadius: 21, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EDF4', shadowColor: '#20314C', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  receiptBrand: { alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#EDF0F5' },
  receiptBrandName: { color: '#243650', fontSize: 13, fontWeight: '900', letterSpacing: 1.1 },
  receiptIdBox: { paddingVertical: 13, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EDF0F5', borderStyle: 'dashed' },
  receiptMetaLabel: { color: '#8A97AA', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  receiptId: { marginTop: 5, color: '#1769E0', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  receiptItems: { paddingTop: 15, paddingBottom: 6 },
  receiptSectionLabel: { marginBottom: 5, color: '#8A97AA', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  receiptItemRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  receiptItemDescription: { flex: 1, marginRight: 10 },
  receiptItemName: { color: '#34445D', fontSize: 12, fontWeight: '700' },
  receiptItemQty: { marginTop: 3, color: '#8A97AA', fontSize: 10 },
  receiptItemAmount: { color: '#34445D', fontSize: 11, fontWeight: '700' },
  receiptTotalRow: { paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E9EDF3', borderBottomWidth: 1, borderBottomColor: '#E9EDF3' },
  receiptTotalLabel: { color: '#68778F', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  receiptTotal: { color: '#1B2C48', fontSize: 20, fontWeight: '900' },
  receiptDetails: { paddingTop: 10 },
  receiptDetailRow: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  receiptDetailLabel: { color: '#8390A3', fontSize: 10 },
  receiptDetailValue: { maxWidth: '58%', color: '#34445D', fontSize: 10, fontWeight: '700', textAlign: 'right' },
  receiptThanks: { marginTop: 11, paddingTop: 13, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EDF0F5', borderStyle: 'dashed' },
  receiptThanksText: { color: '#1769E0', fontSize: 12, fontWeight: '800' },
  nextCustomerButton: { minHeight: 53, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 16, backgroundColor: '#1769E0' },
  nextCustomerText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
