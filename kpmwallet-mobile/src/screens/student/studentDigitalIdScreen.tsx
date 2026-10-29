import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import QRCode from 'qrcode';
import { captureRef } from 'react-native-view-shot';
import api from '../../services/api';

type StudentProfile = {
  user_id?: number;
  username?: string;
  nric?: string;
  school_name?: string;
  class_name?: string;
};

const LATEST_WALLET_QR_KEY = 'latest_wallet_qr_value';
const DEFAULT_WALLET_QR = 'KPMWALLET:AID';

function QrPreview({ value }: { value: string }) {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' });
  const matrixSize = modules.size;

  return (
    <View style={styles.qrFrame} accessibilityLabel="QR code preview">
      <View style={styles.qrGrid}>
        {Array.from({ length: matrixSize }, (_, row) => (
          <View key={row} style={styles.qrRow}>
            {Array.from({ length: matrixSize }, (_, column) => (
              <View key={column} style={[styles.qrCell, modules.data[row * matrixSize + column] === 1 && styles.qrCellOn]} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function StudentDigitalIdScreen() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [walletQrValue, setWalletQrValue] = useState(DEFAULT_WALLET_QR);
  const cardRef = useRef<View>(null);
  const [, requestMediaPermission] = MediaLibrary.usePermissions({ writeOnly: true, granularPermissions: ['photo'] });

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const latestWalletQr = await AsyncStorage.getItem(LATEST_WALLET_QR_KEY).catch(() => null);
      setWalletQrValue(latestWalletQr || DEFAULT_WALLET_QR);
      const { data } = await api.get('/users/me');
      setProfile(data);
      const savedPhoto = data.user_id ? await AsyncStorage.getItem(`profile_image_uri_${data.user_id}`) : null;
      setPhoto(savedPhoto);
    } catch {
      if (!isRefresh) setProfile(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadProfile();
  }, [loadProfile]));

  const studentId = profile?.nric?.trim() || (profile?.user_id ? `KPM-${String(profile.user_id).padStart(6, '0')}` : 'Not available');

  const saveDigitalId = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const permission = await requestMediaPermission();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Allow photo access to save your Digital ID to the gallery.');
        return;
      }
      const imageUri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      await MediaLibrary.Asset.create(imageUri);
      Alert.alert('Saved', 'Your Digital ID has been saved to your phone gallery.');
    } catch {
      Alert.alert('Unable to save', 'Please try saving your Digital ID again.');
    } finally {
      setSaving(false);
    }
  };

  const printDigitalId = async () => {
    setPrinting(true);
    try {
      const mm = (value: number) => (value / 25.4) * 72;
      const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      })[character] ?? character);
      const cardName = profile?.username?.trim() || 'Student name';
      const schoolName = profile?.school_name?.trim() || 'School name';
      const className = profile?.class_name?.trim() || 'Not set';
      let photoData = '';
      if (photo?.startsWith('file://')) {
        const base64 = await FileSystem.readAsStringAsync(photo, { encoding: FileSystem.EncodingType.Base64 });
        const extension = photo.toLowerCase().split('?')[0].split('.').pop();
        const mimeType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
        photoData = `data:${mimeType};base64,${base64}`;
      }

      const qrCode = QRCode.create(walletQrValue, { errorCorrectionLevel: 'M' });
      const qrSize = qrCode.modules.size;
      const qrPath = qrCode.modules.data.reduce((path, dark, index) => {
        if (!dark) return path;
        const row = Math.floor(index / qrSize) + 4;
        const column = index % qrSize + 4;
        return `${path}M${column} ${row}h1v1h-1z`;
      }, '');
      const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${qrSize + 8} ${qrSize + 8}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${qrPath}" fill="#172844"/></svg>`;
      const qrData = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`;
      const safeName = escapeHtml(cardName);
      const safeStudentId = escapeHtml(studentId);
      const safeClass = escapeHtml(className);
      const safeSchool = escapeHtml(schoolName);
      const photoMarkup = photoData
        ? `<img class="photo" src="${photoData}" />`
        : '<div class="photo fallback">KPM</div>';
      const html = `<!doctype html><html><head><meta charset="utf-8"/><style>
        @page { size: 210mm 297mm; margin: 0; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; overflow: hidden; }
        body { font-family: Arial, Helvetica, sans-serif; color: #172844; }
        .sheet { position: relative; width: 210mm; height: 297mm; overflow: hidden; background: #fff; }
        .card { position: absolute; top: 5mm; left: 5mm; width: 54mm; height: 85.6mm; overflow: hidden; background: #fff; border: .2mm solid #e8ecf4; border-radius: 4mm; }
        .header { height: 19mm; background: #172844; color: #fff; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .7mm; padding: 1mm 3mm; overflow: hidden; }
        .dots { position: absolute; inset: 0; z-index: 0; opacity: .2; background-image: radial-gradient(circle, #b7c9e9 .28mm, transparent .32mm); background-size: 4.2mm 3.8mm; background-position: 2.5mm 2mm; }
        .school { position: relative; z-index: 1; width: 100%; max-height: 7mm; overflow: hidden; text-align: center; font-weight: 700; font-size: 9.5pt; line-height: 1.05; }
        .label { position: relative; z-index: 1; margin-top: 1.4mm; transform: translateY(-.6mm); color: #c6d2e5; letter-spacing: .8pt; font-size: 4.5pt; line-height: 1; }
        .accent { position: relative; z-index: 1; transform: translateY(-.6mm); width: 4mm; height: .45mm; background: #3159c9; }
        .body { height: 61.6mm; padding: 0 2.5mm; display: flex; flex-direction: column; align-items: center; }
        .profile-block { height: 22mm; margin-top: -5.5mm; flex: 0 0 22mm; display: flex; justify-content: center; }
        .photo { position: relative; z-index: 1; display: block; width: 20mm; height: 22mm; object-fit: fill; border-radius: 2.6mm; border: .55mm solid #fff; background: #eef2ff; }
        .fallback { position: relative; z-index: 1; color: #3159c9; font-size: 7pt; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .info { width: 100%; min-width: 0; display: flex; flex-direction: column; align-items: center; }
        .name { width: 100%; margin-top: .7mm; text-align: center; font-size: 8.5pt; line-height: 1.12; font-weight: 700; overflow-wrap: anywhere; }
        .details { width: 100%; display: flex; border-top: .2mm solid #e1e6ef; border-bottom: .2mm solid #e1e6ef; margin-top: 1.5mm; padding: 1mm 0; }
        .detail { width: 50%; min-width: 0; text-align: center; padding: 0 .8mm; }
        .detail + .detail { border-left: .2mm solid #e1e6ef; }
        .detail-label { color: #78849a; font-size: 5pt; line-height: 1.1; font-weight: 700; letter-spacing: .45pt; }
        .detail-value { margin-top: .6mm; font-size: 6.5pt; line-height: 1.1; font-weight: 700; overflow-wrap: anywhere; }
        .qr-wrap { display: flex; flex-direction: column; align-items: center; margin-top: 2mm; }
        .qr { display: block; width: 20.5mm; height: 20.5mm; padding: 1.1mm; border: .2mm solid #e1e6ef; border-radius: 2.8mm; }
        .scan { margin-top: .8mm; font-size: 5pt; letter-spacing: .8pt; font-weight: 700; color: #78849a; }
        .footer { position: absolute; bottom: 0; width: 100%; height: 5mm; background: #f4f6fb; color: #78849a; display: flex; align-items: center; justify-content: center; font-size: 4.5pt; }
      </style></head><body><main class="sheet"><section class="card">
        <header class="header"><div class="dots"></div><div class="school">${safeSchool}</div><div class="label">STUDENT IDENTIFICATION</div><div class="accent"></div></header>
        <section class="body"><div class="profile-block">${photoMarkup}</div><div class="info"><div class="name">${safeName}</div><div class="details"><div class="detail"><div class="detail-label">STUDENT ID</div><div class="detail-value">${safeStudentId}</div></div><div class="detail"><div class="detail-label">CLASS</div><div class="detail-value">${safeClass}</div></div></div></div><div class="qr-wrap"><img class="qr" src="${qrData}"/><div class="scan">SCAN TO PAY</div></div></section>
        <footer class="footer">Please present this ID when requested</footer>
      </section></main></body></html>`;

      const result = await Print.printToFileAsync({
        html,
        width: mm(210),
        height: mm(297),
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
      });
      try {
        await Print.printAsync({ uri: result.uri, orientation: Print.Orientation.portrait });
      } catch (error) {
        // On iOS Expo Print rejects when the print sheet is dismissed without printing.
        if (Platform.OS === 'ios') return;
        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      if (!errorMessage.includes('cancel') && !errorMessage.includes('incomplete')) {
        console.error('Student ID PDF generation failed:', error);
        Alert.alert('Unable to print', 'The print-ready PDF could not be generated. Please try again.');
      }
    } finally {
      setPrinting(false);
    }
  };
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Digital ID</Text>
            <Text style={styles.subtitle}>Your official student identity</Text>
          </View>
          <Pressable onPress={() => void loadProfile(true)} disabled={refreshing} style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Refresh Digital ID">
            {refreshing ? <ActivityIndicator size="small" color="#3159C9" /> : <Ionicons name="refresh" size={20} color="#3159C9" />}
          </Pressable>
        </View>

        {loading ? <ActivityIndicator style={styles.loader} size="large" color="#3159C9" /> : (
          <View ref={cardRef} collapsable={false} style={styles.card}>
            <View style={styles.cardTop}>
              <View pointerEvents="none" style={styles.headerPattern}>
                {Array.from({ length: 8 }, (_, row) => (
                  <View key={row} style={styles.headerPatternRow}>
                    {Array.from({ length: 13 }, (_, column) => (
                      <View key={column} style={styles.headerDot} />
                    ))}
                  </View>
                ))}
              </View>
              <Text style={styles.schoolHeading} numberOfLines={2}>{profile?.school_name?.trim() || 'School name'}</Text>
              <Text style={styles.brandLabel}>STUDENT IDENTIFICATION</Text>
              <View style={styles.headingAccent} />
            </View>

            <View style={styles.profileBlock}>
              <View style={styles.avatarRectangle}>
                {photo ? <Image source={{ uri: photo }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarFallback]}><Ionicons name="person" size={42} color="#3159C9" /></View>}
              </View>
              <Text style={styles.studentName} numberOfLines={2}>{profile?.username?.trim() || 'Student name'}</Text>
            </View>

            <View style={styles.identityDetails}>
              <View style={styles.identityDetail}>
                <Text style={styles.detailLabel}>STUDENT ID</Text>
                <Text style={styles.identityValue} numberOfLines={1}>{studentId}</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.identityDetail}>
                <Text style={styles.detailLabel}>CLASS</Text>
                <Text style={styles.identityValue} numberOfLines={1}>{profile?.class_name?.trim() || 'Not set'}</Text>
              </View>
            </View>

            <View style={styles.qrSection}>
              <QrPreview value={walletQrValue} />
              <Text style={styles.qrHint}>Scan to pay</Text>
            </View>

            <Text style={styles.footerText}>Please present this ID when requested</Text>
          </View>
        )}
        {!loading && (
          <>
            <Pressable onPress={() => void saveDigitalId()} disabled={saving || printing} style={({ pressed }) => [styles.saveButton, pressed && !saving && styles.savePressed, saving && styles.saveDisabled]} accessibilityRole="button" accessibilityLabel="Save Digital ID to phone gallery">
              {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="download-outline" size={19} color="#FFFFFF" />}
              <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save to Gallery'}</Text>
            </Pressable>
            <Pressable onPress={() => void printDigitalId()} disabled={saving || printing} style={({ pressed }) => [styles.printButton, pressed && !printing && styles.printPressed, (saving || printing) && styles.saveDisabled]} accessibilityRole="button" accessibilityLabel="Print ID at standard CR80 card size">
              {printing ? <ActivityIndicator size="small" color="#3159C9" /> : <Ionicons name="print-outline" size={19} color="#3159C9" />}
              <Text style={styles.printButtonText}>{printing ? 'Preparing PDF...' : 'Print ID'}</Text>
            </Pressable>
            <Text style={styles.printHint}>CR80 · 54 × 85.6 mm · actual size on paper</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6FB' },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  title: { color: '#17233F', fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: '#7D879B', fontSize: 13, marginTop: 4 },
  refreshButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8ECF4', alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
  loader: { marginTop: 95 },
  card: { overflow: 'hidden', backgroundColor: '#FFFFFF', borderRadius: 25, paddingHorizontal: 22, paddingTop: 0, paddingBottom: 17, borderWidth: 1, borderColor: '#E8ECF4', shadowColor: '#1D3158', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  cardTop: { position: 'relative', overflow: 'hidden', alignItems: 'center', marginHorizontal: -22, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 49, backgroundColor: '#172844' },
  headerPattern: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-around', paddingHorizontal: 9, opacity: 0.24 },
  headerPatternRow: { flexDirection: 'row', justifyContent: 'space-around' },
  headerDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#B7C9E9' },
  schoolHeading: { color: '#FFFFFF', fontSize: 21, lineHeight: 27, fontWeight: '900', letterSpacing: 0.4, textAlign: 'center' },
  brandLabel: { color: '#C6D2E5', fontSize: 10, fontWeight: '800', letterSpacing: 2, textAlign: 'center', marginTop: 7 },
  headingAccent: { width: 28, height: 2, borderRadius: 1, backgroundColor: '#3159C9', marginTop: 11 },
  profileBlock: { alignItems: 'center', marginTop: -39 },
  avatarRectangle: { width: 144, height: 158, overflow: 'hidden', borderRadius: 19, backgroundColor: '#EEF2FF', borderWidth: 4, borderColor: '#FFFFFF', shadowColor: '#1D3158', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  avatar: { width: '100%', height: '100%', backgroundColor: '#EEF2FF' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  studentName: { color: '#202D46', fontSize: 19, lineHeight: 24, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  identityDetails: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 17, marginHorizontal: 1, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E8ECF4' },
  identityDetail: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  verticalDivider: { width: 1, height: 35, backgroundColor: '#E1E6EF' },
  identityValue: { color: '#26334D', fontSize: 16, fontWeight: '800', marginTop: 5, textAlign: 'center' },
  qrSection: { alignItems: 'center', paddingTop: 19, paddingBottom: 16 },
  qrFrame: { width: 224, height: 224, backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1, borderColor: '#E8ECF4', alignItems: 'center', justifyContent: 'center' },
  qrGrid: { width: 197, height: 197, padding: 3, backgroundColor: '#FFFFFF' },
  qrRow: { flex: 1, flexDirection: 'row' },
  qrCell: { flex: 1, backgroundColor: '#FFFFFF' },
  qrCellOn: { backgroundColor: '#14233D' },
  qrHint: { color: '#66738A', fontSize: 11, fontWeight: '600', marginTop: 11 },
  detailLabel: { color: '#929BAD', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  detailValue: { color: '#26334D', fontSize: 14, lineHeight: 19, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  footerText: { textAlign: 'center', color: '#A0A9B8', fontSize: 10, borderTopWidth: 1, borderTopColor: '#F0F2F6', paddingTop: 13 },
  saveButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 17, borderRadius: 16, backgroundColor: '#3159C9' },
  savePressed: { backgroundColor: '#2648A8', transform: [{ scale: 0.99 }] },
  saveDisabled: { opacity: 0.72 },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  printButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 10, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE4F2' },
  printPressed: { backgroundColor: '#F3F6FC' },
  printButtonText: { color: '#3159C9', fontSize: 14, fontWeight: '700' },
  printHint: { color: '#8A94A6', fontSize: 11, textAlign: 'center', marginTop: 8 },
});
