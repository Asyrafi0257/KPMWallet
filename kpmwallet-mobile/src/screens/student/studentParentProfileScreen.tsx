import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LocalizedText as Text } from '../../components/LocalizedText';
import { LocalizedAlert as Alert } from '../../components/LocalizedAlert';
import api from '../../services/api';

type FamilyProfile = {
  mother_full_name?: string; mother_identification_number?: string; mother_phone_number?: string;
  mother_email?: string; mother_occupation?: string;
  father_full_name?: string; father_identification_number?: string; father_phone_number?: string;
  father_email?: string; father_occupation?: string;
  guardian_full_name?: string; guardian_relationship?: string; guardian_phone_number?: string; guardian_email?: string;
};

export default function StudentParentProfileScreen() {
  const navigation = useNavigation<any>();
  const [mother, setMother] = useState({ fullName: '', identificationNumber: '', phoneNumber: '', email: '', occupation: '' });
  const [father, setFather] = useState({ fullName: '', identificationNumber: '', phoneNumber: '', email: '', occupation: '' });
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [guardianPhoneNumber, setGuardianPhoneNumber] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/users/me').then(({ data }) => {
      const value: FamilyProfile = data;
      setMother({
        fullName: value.mother_full_name || '', identificationNumber: value.mother_identification_number || '',
        phoneNumber: value.mother_phone_number || '', email: value.mother_email || '', occupation: value.mother_occupation || '',
      });
      setFather({
        fullName: value.father_full_name || '', identificationNumber: value.father_identification_number || '',
        phoneNumber: value.father_phone_number || '', email: value.father_email || '', occupation: value.father_occupation || '',
      });
      setGuardianName(value.guardian_full_name || '');
      setGuardianRelationship(value.guardian_relationship || '');
      setGuardianPhoneNumber(value.guardian_phone_number || '');
      setGuardianEmail(value.guardian_email || '');
    }).catch(() => Alert.alert('Error', 'Failed to load parent information.'))
      .finally(() => setLoading(false));
  }, []);

  const updateMother = (key: keyof typeof mother, value: string) => setMother((current) => ({ ...current, [key]: value }));
  const updateFather = (key: keyof typeof father, value: string) => setFather((current) => ({ ...current, [key]: value }));
  const hasParent = !!mother.fullName.trim() || !!father.fullName.trim();

  const save = async () => {
    if (!hasParent && (!guardianName.trim() || !guardianRelationship.trim())) {
      return Alert.alert('Missing information', 'Enter mother or father information, or provide the guardian name and relationship.');
    }
    try {
      setSaving(true);
      const { data } = await api.put('/users/me', {
        mother_full_name: mother.fullName.trim(), mother_identification_number: mother.identificationNumber.trim(),
        mother_phone_number: mother.phoneNumber.trim(), mother_email: mother.email.trim(), mother_occupation: mother.occupation.trim(),
        father_full_name: father.fullName.trim(), father_identification_number: father.identificationNumber.trim(),
        father_phone_number: father.phoneNumber.trim(), father_email: father.email.trim(), father_occupation: father.occupation.trim(),
        guardian_full_name: guardianName.trim(), guardian_relationship: guardianRelationship.trim(),
        guardian_phone_number: guardianPhoneNumber.trim(), guardian_email: guardianEmail.trim(),
      });
      Alert.alert('Success', 'Parent information has been updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Unable to update parent information.';
      Alert.alert('Update failed', Array.isArray(message) ? message.join('\n') : message);
    } finally { setSaving(false); }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#3159C9" /></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={25} color="#25324A" /></Pressable>
          <Text style={styles.title}>Parent Profile</Text><View style={{ width: 25 }} />
        </View>
        <Text style={styles.sectionTitle}>Mother information</Text>
        <Field label="Full name" value={mother.fullName} onChangeText={(value) => updateMother('fullName', value)} />
        <Field label="NRIC / identification number" value={mother.identificationNumber} onChangeText={(value) => updateMother('identificationNumber', value)} />
        <Field label="Phone number" value={mother.phoneNumber} onChangeText={(value) => updateMother('phoneNumber', value)} keyboardType="phone-pad" />
        <Field label="Email address" value={mother.email} onChangeText={(value) => updateMother('email', value)} keyboardType="email-address" />
        <Field label="Occupation (optional)" value={mother.occupation} onChangeText={(value) => updateMother('occupation', value)} />

        <Text style={styles.sectionTitle}>Father information</Text>
        <Field label="Full name" value={father.fullName} onChangeText={(value) => updateFather('fullName', value)} />
        <Field label="NRIC / identification number" value={father.identificationNumber} onChangeText={(value) => updateFather('identificationNumber', value)} />
        <Field label="Phone number" value={father.phoneNumber} onChangeText={(value) => updateFather('phoneNumber', value)} keyboardType="phone-pad" />
        <Field label="Email address" value={father.email} onChangeText={(value) => updateFather('email', value)} keyboardType="email-address" />
        <Field label="Occupation (optional)" value={father.occupation} onChangeText={(value) => updateFather('occupation', value)} />

        <Text style={styles.sectionTitle}>Guardian information (if no parent)</Text>
        <Field label="Guardian full name" value={guardianName} onChangeText={setGuardianName} />
        <Field label="Relationship to student" value={guardianRelationship} onChangeText={setGuardianRelationship} />
        <Field label="Guardian phone number" value={guardianPhoneNumber} onChangeText={setGuardianPhoneNumber} keyboardType="phone-pad" />
        <Field label="Guardian email address (optional)" value={guardianEmail} onChangeText={setGuardianEmail} keyboardType="email-address" />
        <Pressable disabled={saving} onPress={save} style={[styles.saveButton, saving && { opacity: 0.6 }]}>
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save changes'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field(props: { label: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'email-address' | 'phone-pad' }) {
  const { label, ...inputProps } = props;
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...inputProps} autoCapitalize="none" style={styles.input} placeholder={`Enter ${label.toLowerCase()}`} placeholderTextColor="#A2AABA" /></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' }, content: { flexGrow: 1, padding: 22, paddingBottom: 35 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  title: { color: '#1E2A42', fontSize: 20, fontWeight: '700' },
  sectionTitle: { color: '#26334D', fontSize: 17, fontWeight: '700', marginTop: 12, marginBottom: 15 },
  field: { marginBottom: 17 }, label: { color: '#46536A', fontSize: 13, fontWeight: '600', marginBottom: 7 },
  input: { height: 50, borderWidth: 1, borderColor: '#E2E6ED', borderRadius: 12, paddingHorizontal: 14, color: '#26334D', fontSize: 15 },
  saveButton: { marginTop: 'auto', height: 52, borderRadius: 13, backgroundColor: '#3159C9', alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
