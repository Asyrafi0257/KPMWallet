import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Modal, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import QRCode from 'qrcode';

const wallets = [
  { key: 'aid', qrValue: 'KPMWALLET:AID', title: 'Wallet Bantuan', subtitle: 'School assistance', colors: ['#3159C9', '#5279E7'] as const },
  { key: 'parent', qrValue: 'KPMWALLET:PARENT', title: 'Wallet Parent', subtitle: 'Parent contribution', colors: ['#176B78', '#2A9A9A'] as const },
];
const LATEST_WALLET_QR_KEY = 'latest_wallet_qr_value';

function WalletQr({ value, displaySize = 76 }: { value: string; displaySize?: number }) {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' });
  const matrixSize = modules.size;

  return (
    <View style={[styles.qrCode, { width: displaySize, height: displaySize }]} accessibilityLabel={`QR code for ${value}`}>
      {Array.from({ length: matrixSize }, (_, row) => (
        <View key={row} style={styles.qrRow}>
          {Array.from({ length: matrixSize }, (_, column) => (
            <View
              key={column}
              style={[styles.qrModule, modules.data[row * matrixSize + column] === 1 && styles.qrModuleDark]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function StudentWalletScreen() {
  const { width, height } = useWindowDimensions();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [currentWallet, setCurrentWallet] = useState(0);
  const [selectedWallet, setSelectedWallet] = useState<(typeof wallets)[number] | null>(null);
  const [savingQr, setSavingQr] = useState(false);
  const carouselRef = useRef<ScrollView>(null);
  const qrSaveRef = useRef<View>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [, requestMediaPermission] = MediaLibrary.usePermissions({ writeOnly: true, granularPermissions: ['photo'] });

  const updateCurrentWallet = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
    setCurrentWallet(Math.max(0, Math.min(wallets.length - 1, page)));
  };

  const openWalletQr = (wallet: (typeof wallets)[number]) => {
    setSelectedWallet(wallet);
  };

  const updateDigitalIdQr = async () => {
    if (!selectedWallet) return;
    try {
      await AsyncStorage.setItem(LATEST_WALLET_QR_KEY, selectedWallet.qrValue);
      Alert.alert('QR updated', 'This wallet QR will appear on your Digital ID.');
    } catch {
      Alert.alert('Unable to update QR', 'Please try again.');
    }
  };

  const saveWalletQr = async () => {
    if (!qrSaveRef.current || !selectedWallet) return;
    setSavingQr(true);
    try {
      const permission = await requestMediaPermission();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Allow photo access to save this wallet QR to your gallery.');
        return;
      }
      const imageUri = await captureRef(qrSaveRef, { format: 'png', quality: 1, result: 'tmpfile' });
      await MediaLibrary.Asset.create(imageUri);
      Alert.alert('Saved', `${selectedWallet.title} QR has been saved to your phone gallery.`);
    } catch {
      Alert.alert('Unable to save', 'Please try saving this wallet QR again.');
    } finally {
      setSavingQr(false);
    }
  };

  const showWalletInfo = () => {
    Alert.alert(
      'About your wallet',
      'Your wallet page is where you can check your available balance and review your school payment activity.',
      [{ text: 'Got it' }],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.blueHeader, { height: height * 0.25 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
          <Pressable
            onPress={showWalletInfo}
            style={({ pressed }) => [styles.infoButton, pressed && styles.infoButtonPressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="About your wallet"
          >
            <Ionicons name="information-circle-outline" size={25} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Total balance</Text>
          <View style={styles.balanceAmountRow}>
            <Text style={styles.balanceAmount}>{balanceVisible ? 'RM 0.00' : 'RM ••••'}</Text>
            <Pressable
              onPress={() => setBalanceVisible((visible) => !visible)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={balanceVisible ? 'Hide balance' : 'Show balance'}
            >
              <Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={19} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => Alert.alert('Top up', 'Top up will be available soon.')}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.actionPressed]}
            accessibilityRole="button"
          >
            <Ionicons name="add-circle-outline" size={23} color="#3159C9" />
            <Text style={styles.primaryActionText}>Top up</Text>
          </Pressable>
          <Pressable
            onPress={() => Alert.alert('Transfer', 'Transfers will be available soon.')}
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.actionPressed]}
            accessibilityRole="button"
          >
            <Ionicons name="paper-plane-outline" size={21} color="#FFFFFF" />
            <Text style={styles.secondaryActionText}>Transfer</Text>
          </Pressable>
          <Pressable
            onPress={() => openWalletQr(wallets[1])}
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.actionPressed]}
            accessibilityRole="button"
            accessibilityLabel="Open Parent Wallet QR code"
          >
            <Ionicons name="qr-code-outline" size={21} color="#FFFFFF" />
            <Text style={styles.secondaryActionText}>QR</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView style={styles.walletContent} contentContainerStyle={styles.walletContentInner} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>My Wallet</Text>
        <Animated.ScrollView
          ref={carouselRef}
          style={styles.walletCarousel}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false },
          )}
          onMomentumScrollEnd={updateCurrentWallet}
          accessibilityLabel="Wallet cards. Swipe sideways to view each wallet."
        >
          {wallets.map((wallet) => (
            <View key={wallet.key} style={{ width }}>
              <LinearGradient colors={wallet.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.walletCard}>
                <View style={styles.walletCardTop}>
                  <View>
                    <Text style={styles.walletTitle}>{wallet.title}</Text>
                    <Text style={styles.walletSubtitle}>{wallet.subtitle}</Text>
                  </View>
                </View>
                <View style={styles.walletCardBottom}>
                  <View>
                    <Text style={styles.walletBalanceLabel}>Balance</Text>
                    <Text style={styles.walletBalance}>{balanceVisible ? 'RM 0.00' : 'RM ****'}</Text>
                  </View>
                </View>
                <View pointerEvents="none" style={styles.cardLayers}>
                  <View style={[styles.cardLayer, styles.cardLayerBack]} />
                  <View style={[styles.cardLayer, styles.cardLayerMiddle]} />
                  <View style={[styles.cardLayer, styles.cardLayerFront]} />
                </View>
              </LinearGradient>
            </View>
          ))}
        </Animated.ScrollView>
        <View style={styles.pagination} accessibilityLabel={`Wallet ${currentWallet + 1} of ${wallets.length}`}>
          {wallets.map((wallet, index) => (
            <Pressable
              key={wallet.key}
              onPress={() => carouselRef.current?.scrollTo({ x: width * index, animated: true })}
              accessibilityRole="button"
              accessibilityLabel={`Show ${wallet.title}`}
              accessibilityState={{ selected: currentWallet === index }}
            >
              <Animated.View
                style={[
                  styles.paginationDot,
                  {
                    width: scrollX.interpolate({
                      inputRange: wallets.map((_, page) => width * page),
                      outputRange: wallets.map((_, page) => page === index ? 20 : 8),
                      extrapolate: 'clamp',
                    }),
                    backgroundColor: scrollX.interpolate({
                      inputRange: wallets.map((_, page) => width * page),
                      outputRange: wallets.map((_, page) => page === index ? '#3159C9' : '#C9D0DE'),
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>
        <Text style={styles.historyTitle}>Money In History</Text>
        <View style={styles.emptyHistory}>
          <View style={styles.emptyHistoryIcon}>
            <Ionicons name="arrow-down" size={20} color="#8792A5" />
          </View>
          <Text style={styles.emptyHistoryText}>No money in yet</Text>
          <Text style={styles.emptyHistoryHint}>Money added to your wallet will appear here.</Text>
        </View>
      </ScrollView>
      <Modal
        visible={selectedWallet !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedWallet(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.qrModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My QR</Text>
              <Pressable
                onPress={() => setSelectedWallet(null)}
                style={styles.closeQrButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close QR code"
              >
                <Ionicons name="close" size={23} color="#68758A" />
              </Pressable>
            </View>
            <View ref={qrSaveRef} collapsable={false} style={styles.qrSaveCard}>
              {selectedWallet && <WalletQr value={selectedWallet.qrValue} displaySize={220} />}
              <Text style={styles.qrSaveCaption}>Show this QR to make payment</Text>
            </View>
            <Pressable
              onPress={() => void saveWalletQr()}
              disabled={savingQr}
              style={({ pressed }) => [styles.saveQrButton, pressed && !savingQr && styles.actionPressed]}
              accessibilityRole="button"
              accessibilityLabel="Save wallet QR to phone"
            >
              {savingQr
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Ionicons name="download-outline" size={20} color="#FFFFFF" />}
              <Text style={styles.saveQrButtonText}>{savingQr ? 'Saving...' : 'Save to phone'}</Text>
            </Pressable>
            <Pressable
              onPress={() => void updateDigitalIdQr()}
              style={({ pressed }) => [styles.updateDigitalIdQrButton, pressed && styles.actionPressed]}
              accessibilityRole="button"
              accessibilityLabel="Update Digital ID with this wallet QR code"
            >
              <Ionicons name="refresh-outline" size={19} color="#3159C9" />
              <Text style={styles.updateDigitalIdQrButtonText}>Update Digital ID QR</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FC' },
  blueHeader: { width: '100%', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8, backgroundColor: '#3159C9', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  infoButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  infoButtonPressed: { backgroundColor: 'rgba(255,255,255,0.18)' },
  balanceSection: { alignItems: 'center', marginTop: 8 },
  balanceLabel: { color: '#E2E9FF', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  balanceAmountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 2 },
  balanceAmount: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', letterSpacing: 0.2 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  primaryAction: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 15, backgroundColor: '#FFFFFF' },
  primaryActionText: { color: '#3159C9', fontSize: 15, fontWeight: '700' },
  secondaryAction: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  secondaryActionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  actionPressed: { opacity: 0.82 },
  walletContent: { flex: 1 },
  walletContentInner: { paddingTop: 24, paddingBottom: 24 },
  sectionTitle: { marginHorizontal: 20, marginBottom: 14, color: '#172844', fontSize: 21, fontWeight: '800' },
  walletCarousel: { height: 176, flexGrow: 0 },
  walletCard: { minHeight: 176, marginHorizontal: 20, padding: 18, borderRadius: 23, justifyContent: 'space-between' },
  walletCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  walletSubtitle: { marginTop: 4, color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '500' },
  walletBalanceLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '500' },
  walletBalance: { marginTop: 4, color: '#FFFFFF', fontSize: 27, fontWeight: '800' },
  walletCardBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-start' },
  qrCode: { padding: 3, borderRadius: 6, backgroundColor: '#FFFFFF' },
  qrRow: { flex: 1, flexDirection: 'row' },
  qrModule: { flex: 1, backgroundColor: '#FFFFFF' },
  qrModuleDark: { backgroundColor: '#14233D' },
  cardLayers: { position: 'absolute', right: 13, top: 86, width: 92, height: 78 },
  cardLayer: { position: 'absolute', width: 54, height: 62, borderRadius: 14 },
  cardLayerBack: { top: 0, right: 0, transform: [{ rotate: '-4deg' }], backgroundColor: 'rgba(255,255,255,0.09)' },
  cardLayerMiddle: { top: 8, right: 14, transform: [{ rotate: '1deg' }], backgroundColor: 'rgba(255,255,255,0.13)' },
  cardLayerFront: { top: 16, right: 28, transform: [{ rotate: '5deg' }], backgroundColor: 'rgba(255,255,255,0.18)' },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 16 },
  paginationDot: { height: 8, borderRadius: 4 },
  historyTitle: { marginHorizontal: 20, marginTop: 24, color: '#172844', fontSize: 21, fontWeight: '800' },
  emptyHistory: { alignItems: 'center', marginHorizontal: 20, marginTop: 12, paddingVertical: 24, paddingHorizontal: 16, borderRadius: 18, backgroundColor: '#FFFFFF' },
  emptyHistoryIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: '#F0F2F6' },
  emptyHistoryText: { marginTop: 10, color: '#172844', fontSize: 14, fontWeight: '700' },
  emptyHistoryHint: { marginTop: 5, color: '#8792A5', fontSize: 12, textAlign: 'center' },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(13,24,45,0.55)' },
  qrModal: { width: '100%', maxWidth: 360, padding: 22, borderRadius: 24, backgroundColor: '#FFFFFF' },
  modalHeader: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  modalTitle: { color: '#172844', fontSize: 19, fontWeight: '800', textAlign: 'center' },
  closeQrButton: { position: 'absolute', right: 0, top: 0 },
  qrSaveCard: { alignItems: 'center', paddingVertical: 18, borderRadius: 18, backgroundColor: '#F7F8FC' },
  qrSaveCaption: { marginTop: 12, color: '#78849A', fontSize: 12, textAlign: 'center' },
  updateDigitalIdQrButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 14, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE4F2' },
  updateDigitalIdQrButtonText: { color: '#3159C9', fontSize: 14, fontWeight: '700' },
  saveQrButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 16, borderRadius: 15, backgroundColor: '#3159C9' },
  saveQrButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
