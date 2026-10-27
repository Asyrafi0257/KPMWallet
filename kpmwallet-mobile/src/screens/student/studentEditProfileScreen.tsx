import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { LocalizedText as Text } from '../../components/LocalizedText';
import { LocalizedAlert as Alert } from '../../components/LocalizedAlert';
import api from '../../services/api';

type Profile = {
  user_id: number; username?: string; email: string; nric: string; address?: string; date_of_birth?: string;
  gender?: string; nationality?: string; class_name?: string;
};

export default function StudentEditProfileScreen() {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nric, setNric] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [nationality, setNationality] = useState('');
  const [className, setClassName] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [draftDate, setDraftDate] = useState(new Date(2008, 0, 1));
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/users/me').then(async ({ data }) => {
      setUser(data); setName(data.username || ''); setEmail(data.email || ''); setNric(data.nric || '');
      setAddress(data.address || ''); setDateOfBirth(data.date_of_birth || ''); setGender(data.gender || ''); setNationality(data.nationality || '');
      setClassName(data.class_name || '');
      setImage(await AsyncStorage.getItem(`profile_image_uri_${data.user_id}`));
    }).catch(() => Alert.alert('Error', 'Failed to load profile.')).finally(() => setLoading(false));
  }, []);

  const chooseImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission required', 'Please allow access to your photo library.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const save = async () => {
    if (!user || !name.trim() || !email.trim() || !nric.trim()) return Alert.alert('Missing information', 'Please fill in all fields.');
    try {
      setSaving(true);
      const { data } = await api.put('/users/me', {
        username: name.trim(), email: email.trim(), nric: nric.replace(/-/g, '').trim(),
        address: address.trim(), date_of_birth: dateOfBirth || null, gender, nationality: nationality.trim(), class_name: className.trim(),
      });
      const updated = data.user as Profile;
      if (image) await AsyncStorage.setItem(`profile_image_uri_${updated.user_id}`, image);
      setUser(updated);
      Alert.alert('Success', 'Your profile has been updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Unable to update profile. Please try again.';
      Alert.alert('Update failed', Array.isArray(message) ? message.join('\n') : message);
    } finally { setSaving(false); }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#3159C9" /></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={25} color="#25324A" /></Pressable>
          <Text style={styles.title}>Edit profile</Text><View style={{ width: 25 }} />
        </View>
        <Pressable style={styles.avatarWrap} onPress={chooseImage}>
          {image ? <Image source={{ uri: image }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarEmpty]}><Ionicons name="person" size={34} color="#3159C9" /></View>}
          <View style={styles.camera}><Ionicons name="camera" size={16} color="#FFFFFF" /></View>
        </Pressable>
        <Text style={styles.avatarHint}>Change profile photo</Text>
        <Field label="Full name" value={name} onChangeText={setName} />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Field label="NRIC" value={nric} onChangeText={setNric} keyboardType="number-pad" />
        <Field label="Class" value={className} onChangeText={setClassName} />
        <Field label="Address" value={address} onChangeText={setAddress} multiline />
        <View style={styles.field}>
          <Text style={styles.label}>Date of birth</Text>
          <View style={styles.select}>
            <Text style={dateOfBirth ? styles.selectValue : styles.placeholder}>{dateOfBirth || 'Select date of birth'}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open date of birth calendar"
              hitSlop={10}
              onPress={() => {
                setDraftDate(dateOfBirth ? new Date(`${dateOfBirth}T00:00:00`) : new Date(2008, 0, 1));
                setShowDatePicker(true);
              }}
            >
              <Ionicons name="calendar-outline" size={20} color="#78849A" />
            </Pressable>
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Gender</Text>
          <Pressable style={styles.select} onPress={() => setShowGenderPicker(true)}>
            <Text style={gender ? styles.selectValue : styles.placeholder}>{gender || 'Select gender'}</Text>
            <Ionicons name="chevron-down" size={20} color="#78849A" />
          </Pressable>
        </View>
        <Field label="Nationality" value={nationality} onChangeText={setNationality} />
        <Pressable disabled={saving} onPress={save} style={[styles.saveButton, saving && { opacity: 0.6 }]}>
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save changes'}</Text>
        </Pressable>
      </ScrollView>
      <Modal visible={showGenderPicker} transparent animationType="fade" onRequestClose={() => setShowGenderPicker(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowGenderPicker(false)}>
          <View style={styles.genderMenu}>
            <Text style={styles.genderTitle}>Select gender</Text>
            {['Female', 'Male', 'Prefer not to say'].map((option) => (
              <Pressable key={option} style={styles.genderOption} onPress={() => { setGender(option); setShowGenderPicker(false); }}>
                <Text style={styles.selectValue}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.dateMenu}>
            <Text style={styles.genderTitle}>Date of birth</Text>
            <DateTimePicker
              value={draftDate}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={(_, selectedDate) => { if (selectedDate) setDraftDate(selectedDate); }}
              style={styles.datePicker}
            />
            <View style={styles.dateActions}>
              <Pressable onPress={() => setShowDatePicker(false)}><Text style={styles.dateActionText}>Cancel</Text></Pressable>
              <Pressable onPress={() => {
                const year = draftDate.getFullYear();
                const month = String(draftDate.getMonth() + 1).padStart(2, '0');
                const day = String(draftDate.getDate()).padStart(2, '0');
                setDateOfBirth(`${year}-${month}-${day}`);
                setShowDatePicker(false);
              }}><Text style={styles.dateActionText}>Done</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Field(props: { label: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'email-address' | 'number-pad' | 'phone-pad'; multiline?: boolean }) {
  const { label, ...inputProps } = props;
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...inputProps} autoCapitalize="none" textAlignVertical={props.multiline ? 'top' : 'center'} style={[styles.input, props.multiline && styles.addressInput]} placeholder={`Enter ${label.toLowerCase()}`} placeholderTextColor="#A2AABA" /></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' }, content: { flexGrow: 1, padding: 22, paddingBottom: 35 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  title: { color: '#1E2A42', fontSize: 20, fontWeight: '700' },
  avatarWrap: { alignSelf: 'center', marginTop: 2 }, avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#EEF2FF' },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' }, camera: { position: 'absolute', right: 0, bottom: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: '#3159C9', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  avatarHint: { textAlign: 'center', color: '#69758A', fontSize: 13, marginTop: 10, marginBottom: 25 },
  sectionTitle: { color: '#26334D', fontSize: 17, fontWeight: '700', marginTop: 10, marginBottom: 15 },
  field: { marginBottom: 17 }, label: { color: '#46536A', fontSize: 13, fontWeight: '600', marginBottom: 7 },
  input: { height: 50, borderWidth: 1, borderColor: '#E2E6ED', borderRadius: 12, paddingHorizontal: 14, color: '#26334D', fontSize: 15 },
  addressInput: { height: 90, paddingTop: 13 },
  select: { height: 50, borderWidth: 1, borderColor: '#E2E6ED', borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectValue: { color: '#26334D', fontSize: 15 }, placeholder: { color: '#A2AABA', fontSize: 15 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20,30,50,0.35)', justifyContent: 'center', padding: 28 },
  genderMenu: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18 },
  dateMenu: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, alignSelf: 'stretch' },
  datePicker: { height: 190 },
  dateActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 24, paddingTop: 12 },
  dateActionText: { color: '#3159C9', fontSize: 15, fontWeight: '700' },
  genderTitle: { color: '#1E2A42', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  genderOption: { paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#EDF0F4' },
  saveButton: { marginTop: 'auto', height: 52, borderRadius: 13, backgroundColor: '#3159C9', alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
