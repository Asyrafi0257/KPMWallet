import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LocalizedText as Text } from '../../components/LocalizedText';
import { LocalizedAlert as Alert } from '../../components/LocalizedAlert';
import api from '../../services/api';

export default function StudentSchoolProfileScreen() {
  const navigation = useNavigation<any>();
  const [schoolName, setSchoolName] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/users/me').then(({ data }) => {
      setSchoolName(data.school_name || '');
      setSchoolAddress(data.school_address || '');
    }).catch(() => Alert.alert('Error', 'Failed to load school information.'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      await api.put('/users/me', { school_name: schoolName.trim(), school_address: schoolAddress.trim() });
      Alert.alert('Success', 'School information has been updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Unable to update school information.';
      Alert.alert('Update failed', Array.isArray(message) ? message.join('\n') : message);
    } finally { setSaving(false); }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#3159C9" /></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={25} color="#25324A" /></Pressable>
          <Text style={styles.title}>School Profile</Text><View style={{ width: 25 }} />
        </View>
        <Text style={styles.sectionTitle}>School information</Text>
        <View style={styles.field}>
          <Text style={styles.label}>School name</Text>
          <TextInput value={schoolName} onChangeText={setSchoolName} style={styles.input} placeholder="Enter school name" placeholderTextColor="#A2AABA" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>School address</Text>
          <TextInput value={schoolAddress} onChangeText={setSchoolAddress} multiline textAlignVertical="top" style={[styles.input, styles.addressInput]} placeholder="Enter school address" placeholderTextColor="#A2AABA" />
        </View>
        <Pressable disabled={saving} onPress={save} style={[styles.saveButton, saving && { opacity: 0.6 }]}>
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save changes'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' }, content: { flexGrow: 1, padding: 22, paddingBottom: 35 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  title: { color: '#1E2A42', fontSize: 20, fontWeight: '700' },
  sectionTitle: { color: '#26334D', fontSize: 17, fontWeight: '700', marginTop: 12, marginBottom: 15 },
  field: { marginBottom: 17 }, label: { color: '#46536A', fontSize: 13, fontWeight: '600', marginBottom: 7 },
  input: { minHeight: 50, borderWidth: 1, borderColor: '#E2E6ED', borderRadius: 12, paddingHorizontal: 14, color: '#26334D', fontSize: 15 },
  addressInput: { minHeight: 100, paddingTop: 13 },
  saveButton: { marginTop: 'auto', height: 52, borderRadius: 13, backgroundColor: '#3159C9', alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
