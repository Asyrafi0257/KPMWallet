import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalizedText as Text } from '../../components/LocalizedText';
import { LocalizedAlert as Alert } from '../../components/LocalizedAlert';
import api from '../../services/api';
import type { StudentStackParamList } from '../../navigation/studentNavigator';

type Profile = {
  user_id: number; username?: string; role: string; email: string;
  mother_full_name?: string; father_full_name?: string;
  guardian_full_name?: string; guardian_relationship?: string;
  school_name?: string; school_address?: string;
};

export default function StudentProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<StudentStackParamList>>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    api.get('/users/me').then(async ({ data }) => {
      const savedImage = await AsyncStorage.getItem(`profile_image_uri_${data.user_id}`);
      if (active) { setProfile(data); setImage(savedImage); }
    }).catch(() => {
      if (active) Alert.alert('Error', 'Failed to load profile.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('access_token');
      navigation.getParent()?.getParent()?.reset({ index: 0, routes: [{ name: 'Auth' as never }] });
    } catch {
      Alert.alert('Logout failed', 'Unable to log out. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>
        {loading ? <ActivityIndicator style={styles.loader} size="large" color="#3159C9" /> : (
          <>
            <View style={styles.profileRow}>
              {image ? <Image source={{ uri: image }} style={styles.avatar} /> : (
                <View style={[styles.avatar, styles.avatarFallback]}><Ionicons name="person" size={34} color="#3159C9" /></View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.name} numberOfLines={2}>{profile?.username || 'Student'}</Text>
                <Text style={styles.role}>{profile?.role || 'Student'}</Text>
                <Text style={styles.email} numberOfLines={1}>{profile?.email || 'Email unavailable'}</Text>
              </View>
            </View>

            <Text style={styles.settingTitle}>Settings</Text>
            <View style={styles.settingsList}>
              <Pressable style={styles.settingRow} onPress={() => navigation.navigate('EditProfile')}>
                <Text style={styles.settingLabel}>Edit profile</Text><Ionicons name="chevron-forward" size={21} color="#8A94A6" />
              </Pressable>
              <Pressable style={styles.parentProfileLink} onPress={() => navigation.navigate('ParentProfile')}>
                <View style={styles.parentProfileText}>
                <Text style={styles.linkedTitle}>{profile?.mother_full_name?.trim() || profile?.father_full_name?.trim() ? 'Parent profile' : 'Guardian profile'}</Text>
                  <Text style={styles.linkedValue} numberOfLines={1}>
                    {[profile?.mother_full_name?.trim(), profile?.father_full_name?.trim()].filter(Boolean).join(' · ') || profile?.guardian_full_name?.trim() || 'Add parent or guardian information'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={21} color="#8A94A6" />
              </Pressable>
              <Pressable style={styles.parentProfileLink} onPress={() => navigation.navigate('SchoolProfile')}>
                <View style={styles.parentProfileText}>
                  <Text style={styles.linkedTitle}>School profile</Text>
                  <Text style={styles.linkedValue} numberOfLines={1}>{profile?.school_name?.trim() || 'Add school name and address'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={21} color="#8A94A6" />
              </Pressable>
              <Pressable style={styles.settingRow} onPress={() => navigation.navigate('ChangePassword')}>
                <Text style={styles.settingLabel}>Change password</Text><Ionicons name="chevron-forward" size={21} color="#8A94A6" />
              </Pressable>
            </View>

            <Pressable style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutPressed]} onPress={logout}>
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
              <Text style={styles.logoutText}>Log out</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 16, paddingBottom: 28 },
  title: { color: '#17233F', fontSize: 30, fontWeight: '700', marginBottom: 28 },
  loader: { marginTop: 70 },
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 27, borderBottomWidth: 1, borderBottomColor: '#EDF0F4' },
  avatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#EEF2FF' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  profileInfo: { flex: 1, marginLeft: 17 },
  name: { color: '#1E2A42', fontSize: 19, lineHeight: 23, fontWeight: '700' },
  role: { color: '#3159C9', fontSize: 13, fontWeight: '600', marginTop: 4, textTransform: 'capitalize' },
  email: { color: '#7B8495', fontSize: 13, marginTop: 5 },
  settingTitle: { color: '#26334D', fontSize: 17, fontWeight: '700', marginTop: 28, marginBottom: 8 },
  settingsList: { borderTopWidth: 1, borderTopColor: '#E8EBF0' },
  settingRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E8EBF0' },
  settingLabel: { color: '#344057', fontSize: 15, fontWeight: '500' },
  linkedDetail: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#E8EBF0' },
  parentProfileLink: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E8EBF0' },
  parentProfileText: { flex: 1, paddingVertical: 13, paddingRight: 12 },
  linkedTitle: { color: '#344057', fontSize: 14, fontWeight: '600' },
  linkedValue: { color: '#8791A4', fontSize: 13, marginTop: 5 },
  logoutButton: { marginTop: 'auto', minHeight: 52, borderRadius: 14, backgroundColor: '#D84C4C', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  logoutPressed: { backgroundColor: '#B93636' },
  logoutText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
