import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

type StudentProfile = {
  username?: string;
  email?: string;
  nric?: string;
  address?: string;
  date_of_birth?: string | null;
  gender?: string;
  nationality?: string;
  mother_full_name?: string;
  mother_identification_number?: string;
  mother_phone_number?: string;
  mother_email?: string;
  mother_occupation?: string;
  father_full_name?: string;
  father_identification_number?: string;
  father_phone_number?: string;
  father_email?: string;
  father_occupation?: string;
  guardian_full_name?: string;
  guardian_relationship?: string;
  guardian_phone_number?: string;
  guardian_email?: string;
  school_name?: string;
  school_address?: string;
  class_name?: string;
};

type SectionProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  expanded: boolean;
  onToggle: () => void;
  canExpand: boolean;
  children: React.ReactNode;
};

function DetailSection({ title, icon, expanded, onToggle, canExpand, children }: SectionProps) {
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionTitleWrap}>
          <View style={styles.sectionIcon}><Ionicons name={icon} size={19} color="#3159C9" /></View>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {canExpand && <TouchableOpacity onPress={onToggle} accessibilityRole="button" accessibilityLabel={`${expanded ? 'Show less' : 'View all'} ${title.toLowerCase()} details`}>
          <Text style={styles.viewAll}>{expanded ? 'Show less' : 'View all'}</Text>
        </TouchableOpacity>}
      </View>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const isAddress = label === 'Address' || label === 'School address';
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, isAddress && styles.addressValue]} numberOfLines={isAddress ? undefined : 2}>{value}</Text>
    </View>
  );
}

export default function StudentHomeScreen() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    api.get('/users/me')
      .then(({ data }) => { if (active) setProfile(data); })
      .catch(() => { if (active) setProfile(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));

  const toggle = (key: string) => setExpanded((current) => ({ ...current, [key]: !current[key] }));
  const studentRows = [
    { label: 'Full name', value: profile?.username || 'Not set' },
    { label: 'Email', value: profile?.email || 'Not available' },
    { label: 'NRIC', value: profile?.nric || 'Not available' },
    { label: 'Class', value: profile?.class_name || 'Not set' },
    { label: 'Address', value: profile?.address || 'Not set' },
    { label: 'Date of birth', value: profile?.date_of_birth || 'Not set' },
    { label: 'Gender', value: profile?.gender || 'Not set' },
    { label: 'Nationality', value: profile?.nationality || 'Not set' },
  ];
  const parentRows = [
    { label: 'Mother full name', value: profile?.mother_full_name || 'Not set' },
    { label: 'Mother NRIC / identification number', value: profile?.mother_identification_number || 'Not set' },
    { label: 'Mother phone number', value: profile?.mother_phone_number || 'Not set' },
    { label: 'Mother email address', value: profile?.mother_email || 'Not set' },
    { label: 'Mother occupation', value: profile?.mother_occupation || 'Not set' },
    { label: 'Father full name', value: profile?.father_full_name || 'Not set' },
    { label: 'Father NRIC / identification number', value: profile?.father_identification_number || 'Not set' },
    { label: 'Father phone number', value: profile?.father_phone_number || 'Not set' },
    { label: 'Father email address', value: profile?.father_email || 'Not set' },
    { label: 'Father occupation', value: profile?.father_occupation || 'Not set' },
    { label: 'Guardian full name', value: profile?.guardian_full_name || 'Not set' },
    { label: 'Guardian relationship', value: profile?.guardian_relationship || 'Not set' },
    { label: 'Guardian phone number', value: profile?.guardian_phone_number || 'Not set' },
    { label: 'Guardian email address', value: profile?.guardian_email || 'Not set' },
  ];
  const schoolRows = [
    { label: 'School', value: profile?.school_name || 'Not set' },
    { label: 'School address', value: profile?.school_address || 'Not set' },
  ];

  const renderRows = (key: string, rows: { label: string; value: string }[]) =>
    rows.slice(0, expanded[key] ? rows.length : 3).map((row) => <DetailRow key={row.label} {...row} />);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Home</Text>
          <Ionicons name="notifications-outline" size={23} color="#26334D" />
        </View>
        <Text style={styles.subtitle}>Your student account at a glance</Text>

        <View style={styles.welcomeCard}>
          <View style={styles.avatar}><Ionicons name="school-outline" size={25} color="#FFFFFF" /></View>
          <View style={styles.welcomeText}>
            <Text style={styles.welcomeEyebrow}>WELCOME BACK</Text>
            <Text style={styles.studentName} numberOfLines={1}>{profile?.username || 'Student'}</Text>
            <Text style={styles.welcomeHint}>Here are your account details</Text>
          </View>
          <Ionicons name="sparkles-outline" size={24} color="#DCE6FF" />
        </View>

        {loading ? (
          <View style={styles.loading}><ActivityIndicator color="#3159C9" /><Text style={styles.loadingText}>Loading your details…</Text></View>
        ) : (
          <>
            <DetailSection title="Student details" icon="person-outline" expanded={!!expanded.student} onToggle={() => toggle('student')} canExpand>
              {renderRows('student', studentRows)}
            </DetailSection>
            <DetailSection title="Parent / Guardian information" icon="people-outline" expanded={!!expanded.parent} onToggle={() => toggle('parent')} canExpand>
              {renderRows('parent', parentRows)}
            </DetailSection>
            <DetailSection title="School details" icon="business-outline" expanded={!!expanded.school} onToggle={() => toggle('school')} canExpand>
              {renderRows('school', schoolRows)}
            </DetailSection>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FC' },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { color: '#17233F', fontSize: 30, fontWeight: '700', textAlign: 'left' },
  subtitle: { color: '#7D879B', fontSize: 14, marginTop: 4, marginBottom: 20 },
  welcomeCard: { backgroundColor: '#3159C9', borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  welcomeText: { flex: 1 },
  welcomeEyebrow: { color: '#DCE6FF', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  studentName: { color: '#FFFFFF', fontSize: 19, fontWeight: '700', marginTop: 3 },
  welcomeHint: { color: '#E3E9FA', fontSize: 12, marginTop: 3 },
  sectionBlock: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#EDF0F6' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  sectionIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  sectionTitle: { color: '#26334D', fontSize: 15, fontWeight: '700' },
  viewAll: { color: '#3159C9', fontSize: 12, fontWeight: '600' },
  detailRow: { flexDirection: 'column', alignItems: 'flex-start', paddingVertical: 11, gap: 5, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E9ECF2' },
  detailLabel: { color: '#8791A4', fontSize: 13 },
  detailValue: { color: '#27344D', fontSize: 14, fontWeight: '600', width: '100%', textAlign: 'left' },
  addressValue: { lineHeight: 20 },
  loading: { paddingVertical: 36, alignItems: 'center', gap: 10 },
  loadingText: { color: '#7D879B', fontSize: 13 },
});
