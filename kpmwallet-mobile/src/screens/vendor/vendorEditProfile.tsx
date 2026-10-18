import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import api from '../../services/api';

type UserProfile = {
  user_id: number;
  email: string;
  username?: string;
  nric: string;
  role: string;
  vendor_name?: string;
};

type FieldKey = 'email' | 'username' | 'nric' | null;

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();

  const [user, setUser] = useState<UserProfile | null>(null);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [nric, setNric] = useState('');

  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // UI only: field yang sedang difokus
  const [focused, setFocused] = useState<FieldKey>(null);

  // Fetch profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/me');

        const data: UserProfile = response.data;

        const savedImage = await AsyncStorage.getItem(`profile_image_uri_${data.user_id}`);

        setUser(data);
        setProfileImage(savedImage);
        setEmail(data.email ?? '');
        setUsername(data.username ?? '');
        setNric(data.nric ?? '');
      } catch (error) {
        console.log('Failed to fetch profile:', error);
        Alert.alert('Error', 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Choose profile picture
  const handleChooseImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission required',
          'Please allow access to your photo library.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Image picker error:', error);
      Alert.alert('Error', 'Unable to select an image.');
    }
  };

  // Validate and save profile
  const handleSaveChanges = async () => {
    if (!user) {
      return;
    }

    if (!email.trim() || !username.trim() || !nric.trim()) {
      Alert.alert('Missing information', 'Please fill in all editable fields.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    if (!/^\d{12}$/.test(nric.replace(/-/g, '').trim())) {
      Alert.alert(
        'Invalid NRIC',
        'Please enter a valid 12-digit NRIC.',
      );
      return;
    }

    try {
      setSaving(true);

      const response = await api.put('/users/me', {
        email: email.trim(),
        username: username.trim(),
        nric: nric.replace(/-/g, '').trim(),
      });

      const updatedUser: UserProfile = response.data.user;
      if (profileImage) {
        await AsyncStorage.setItem(`profile_image_uri_${updatedUser.user_id}`, profileImage);
      }
      setUser(updatedUser);
      setEmail(updatedUser.email ?? '');
      setUsername(updatedUser.username ?? '');
      setNric(updatedUser.nric ?? '');

      Alert.alert('Success', 'Your profile has been updated.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.log(
        'Failed to update profile:',
        error?.response?.data ?? error,
      );

      const message =
        error?.response?.data?.message ??
        'Unable to update profile. Please try again.';

      Alert.alert('Update failed', Array.isArray(message) ? message.join('\n') : message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.brand} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.errorIconWrap}>
          <Ionicons name="cloud-offline-outline" size={30} color={COLORS.brand} />
        </View>

        <Text style={styles.errorText}>Failed to load profile.</Text>

        <Pressable
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const vendorName = user.vendor_name || user.role || 'Vendor';

  const avatarLetter =
    username.trim().charAt(0).toUpperCase() || 'A';

  const fieldBox = (key: Exclude<FieldKey, null>) => [
    styles.inputRow,
    focused === key && styles.inputRowFocused,
    saving && styles.inputRowDisabled,
  ];

  const iconTile = (key: Exclude<FieldKey, null>) => [
    styles.iconTile,
    focused === key && styles.iconTileFocused,
  ];

  const iconColor = (key: Exclude<FieldKey, null>) =>
    focused === key ? '#ffffff' : COLORS.brand;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.blueHeader}>
        {/* Concentric rings */}
        <View style={[styles.ring, styles.ringLarge]} />
        <View style={[styles.ring, styles.ringMedium]} />
        <View style={[styles.ring, styles.ringSmall]} />

        <SafeAreaView edges={['top']} style={styles.safeHeader}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.backButtonPressed,
              ]}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </Pressable>

            <Text style={styles.headerTitle}>Edit profile</Text>

            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          overScrollMode="never"
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Blue band ni ikut scroll, header atas je yang fixed */}
          <View style={styles.headerBand} />

          <View style={styles.profileCard}>
            {/* Identity block */}
            <View style={styles.avatarSection}>
              <Pressable
                onPress={handleChooseImage}
                style={({ pressed }) => [
                  styles.avatarRing,
                  pressed && styles.avatarPressed,
                ]}
              >
                <View style={styles.avatarContainer}>
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarLetter}>{avatarLetter}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cameraButton}>
                  <Ionicons name="camera" size={16} color="#ffffff" />
                </View>
              </Pressable>

              <Text style={styles.identityName} numberOfLines={1}>
                {username.trim() || 'Your name'}
              </Text>

              <Pressable onPress={handleChooseImage} hitSlop={8}>
                <Text style={styles.changePhotoText}>Change photo</Text>
              </Pressable>
            </View>

            {/* Section: account */}
            <Text style={styles.sectionTitle}>Account details</Text>

            {/* Email */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email</Text>

              <View style={fieldBox('email')}>
                <View style={iconTile('email')}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={iconColor('email')}
                  />
                </View>

                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  placeholder="Enter your email"
                  placeholderTextColor="#9aa7bd"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!saving}
                />
              </View>
            </View>

            {/* Username */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Username</Text>

              <View style={fieldBox('username')}>
                <View style={iconTile('username')}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={iconColor('username')}
                  />
                </View>

                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setFocused('username')}
                  onBlur={() => setFocused(null)}
                  placeholder="Enter your username"
                  placeholderTextColor="#9aa7bd"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!saving}
                />
              </View>
            </View>

            {/* NRIC */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>NRIC</Text>

              <View style={fieldBox('nric')}>
                <View style={iconTile('nric')}>
                  <Ionicons
                    name="card-outline"
                    size={20}
                    color={iconColor('nric')}
                  />
                </View>

                <TextInput
                  style={styles.input}
                  value={nric}
                  onChangeText={setNric}
                  onFocus={() => setFocused('nric')}
                  onBlur={() => setFocused(null)}
                  placeholder="Enter your NRIC"
                  placeholderTextColor="#9aa7bd"
                  keyboardType="number-pad"
                  maxLength={12}
                  editable={!saving}
                />
              </View>

              <Text style={styles.helperText}>12 digits, without dashes.</Text>
            </View>

            {/* Vendor - read only */}
            <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
              Vendor
            </Text>

            <View style={styles.lockedCard}>
              <View style={styles.lockedIconTile}>
                <Ionicons
                  name="storefront-outline"
                  size={20}
                  color="#64748b"
                />
              </View>

              <View style={styles.lockedTextWrap}>
                <Text style={styles.lockedValue} numberOfLines={1}>
                  {vendorName}
                </Text>
                <Text style={styles.lockedHint}>
                  Vendor information cannot be edited.
                </Text>
              </View>

              <Ionicons name="lock-closed" size={17} color="#94a3b8" />
            </View>
          </View>
        </ScrollView>

        {/* Sticky action bar */}
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <Pressable
            onPress={handleSaveChanges}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && !saving && styles.saveButtonPressed,
              saving && styles.saveButtonDisabled,
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color="#ffffff"
                />

                <Text style={styles.saveButtonText}>Save changes</Text>
              </>
            )}
          </Pressable>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const COLORS = {
  brand: '#1565d8',
  brandDeep: '#0b3a8c',
  ink: '#0f2a5c',
  muted: '#64748b',
  line: '#e2e8f3',
  tint: '#eaf1fd',
  surface: '#f5f8fd',
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  /* Header */
  blueHeader: {
    backgroundColor: COLORS.brandDeep,
    overflow: 'hidden',
  },

  safeHeader: {},

  headerBand: {
    height: 96,
    backgroundColor: COLORS.brandDeep,
  },

  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'transparent',
  },

  ringLarge: {
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -110,
    right: -60,
  },

  ringMedium: {
    width: 140,
    height: 140,
    borderRadius: 70,
    top: -70,
    right: -20,
  },

  ringSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
    top: -30,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },

  backButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.26)',
  },

  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#ffffff',
    textAlign: 'center',
  },

  headerSpacer: {
    width: 42,
  },

  keyboardContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  scroll: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
  },

  /* Sheet */
  profileCard: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -28,
    paddingHorizontal: 22,
    paddingBottom: 28,
  },

  /* Identity */
  avatarSection: {
    alignItems: 'center',
    marginTop: -58,
    marginBottom: 28,
  },

  avatarRing: {
    width: 124,
    height: 124,
    borderRadius: 62,
    padding: 5,
    backgroundColor: '#ffffff',
    elevation: 6,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },

  avatarPressed: {
    opacity: 0.85,
  },

  avatarContainer: {
    flex: 1,
    borderRadius: 57,
    overflow: 'hidden',
    backgroundColor: COLORS.brand,
  },

  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brand,
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  avatarLetter: {
    fontSize: 50,
    fontWeight: '600',
    color: '#ffffff',
  },

  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.ink,
    borderWidth: 3,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  identityName: {
    marginTop: 14,
    maxWidth: '85%',
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.ink,
  },

  vendorChip: {
    marginTop: 8,
    maxWidth: '85%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.tint,
  },

  vendorChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brand,
  },

  changePhotoText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.brand,
  },

  /* Sections */
  sectionTitle: {
    marginBottom: 16,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 0.2,
  },

  sectionTitleSpaced: {
    marginTop: 4,
  },

  fieldContainer: {
    marginBottom: 20,
  },

  fieldLabel: {
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },

  inputRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 7,
    paddingRight: 14,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },

  inputRowFocused: {
    borderColor: COLORS.brand,
    backgroundColor: '#ffffff',
  },

  inputRowDisabled: {
    opacity: 0.7,
  },

  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.tint,
  },

  iconTileFocused: {
    backgroundColor: COLORS.brand,
  },

  input: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.ink,
  },

  helperText: {
    marginTop: 8,
    marginLeft: 4,
    fontSize: 13,
    color: COLORS.muted,
  },

  /* Read-only vendor */
  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 7,
    paddingRight: 16,
    borderRadius: 16,
    backgroundColor: '#f1f4f9',
    borderWidth: 1.5,
    borderColor: '#e8edf5',
    borderStyle: 'dashed',
  },

  lockedIconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3e9f2',
  },

  lockedTextWrap: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },

  lockedValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.muted,
  },

  lockedHint: {
    marginTop: 2,
    fontSize: 12,
    color: '#8b98ad',
  },

  /* Footer */
  footer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },

  saveButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: COLORS.brand,
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
  },

  saveButtonPressed: {
    backgroundColor: COLORS.brandDeep,
  },

  saveButtonDisabled: {
    opacity: 0.65,
  },

  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },

  /* Loading & error */
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.muted,
  },

  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    backgroundColor: COLORS.tint,
  },

  errorText: {
    fontSize: 16,
    color: COLORS.muted,
  },

  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.brand,
  },

  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
