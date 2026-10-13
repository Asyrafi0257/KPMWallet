import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Animated, Modal, Easing, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, spacing, typography } from '../../theme';
import { Button, Input } from '../../components';
import type { AuthStackParamList } from '../../navigation/authNavigator';
import type { RootStackParamList } from '../../navigation/rootNavigator';
import type { CompositeScreenProps } from '@react-navigation/native';
import { Ionicons } from "@expo/vector-icons";
import api from '../../services/api';

type Props = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, 'RoleSelect'>,
  NativeStackScreenProps<RootStackParamList>
>;

const roles = ['School', 'Parent', 'Student', 'Vendor'] as const;
type Role = (typeof roles)[number];

export default function RoleSelectScreen({ navigation }: Props) {
  const [selectedRole, setSelectedRole] = React.useState<Role>('Parent');
  const [nric, setNric] = React.useState('');
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [PasswordModal, setPasswordModal] = useState(false);
  
  //for animation, so slideAnim akan menyimpan object Animasi bukan fungsi untuk update state
  const slideAnim = useState(new Animated.Value(500))[0];

  const handleOpenCloseModal = () => {
    setPasswordModal(true);
    slideAnim.setValue(900);

    Animated.timing(slideAnim, {
      toValue : 0,
      duration:400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver:true
    }).start();
  };

  const handleContinue = async () => {
    try {
      const response = await api.post('/auth/check-login', {
        nric: nric.trim(),
        role: selectedRole
      });

      const result = response.data;
      
      if (result.success) {
        handleOpenCloseModal();
      } else {
        navigation.navigate('FirstTimeEmail', {
          role: selectedRole,
          nric: nric.trim(),
        });
      }
      
      
    } catch (error) {
      console.log('Check NRIC error:', error);

      Alert.alert(
        'Server Problem',
        'Unable to connect to the server. Please try again.',
      );
    }
  };

  //logic untuk handle logic
  const handleLogin = async () => {
    try {
      const response = await api.post('/auth/login', {
        nric: nric.trim(),
        role: selectedRole,
        password: password,
      });

      const result = response.data;

      if (result.success) {
        setPasswordModal(false);
        setPassword('');
        setShowPassword(false);

        switch (result.role) {
          case 'School':
            navigation.replace('School');
            break;
          case 'Parent':
            navigation.replace('Parent');
            break;
          case 'Student':
            navigation.replace('Student');
            break;
          case 'Vendor':
            navigation.replace('Vendor');
            break;
        }

        Alert.alert('Login Success', `You have successfully logged in as a ${result.role}.`);
      } else {
        Alert.alert('Login Failed', result.message || 'NRIC, role or password is incorrect.');
      }
    } catch (error) {
      console.log('Login error:', error);
      Alert.alert('Server Problem', 'Unable to connect to the server. Please try again.');
    }
  };
  
  //logic untuk handleCancel
  const handleCancel = () => {
    setPassword("");
    setPasswordModal(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.backgroundLayer}>
          <View style={styles.topGradient} />
          <View style={styles.waveBottom}>
            <View style={styles.waveShape} />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>didyk.my</Text>
            <Text style={styles.tagline}>School Wallet</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Login to your account</Text>
            <Text style={styles.subtitle}>Select your account type to continue</Text>

            <View style={styles.roleToggle}>
              {roles.map((role) => {
                const active = role === selectedRole;
                return (
                  <Pressable
                    key={role}
                    onPress={() => setSelectedRole(role)}
                    style={[
                      styles.roleButton,
                      active && styles.roleButtonActive,
                    ]}
                  >
                    <Text style={[styles.roleText, active && styles.roleTextActive]}>
                      {role}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Input
              label="NRIC / Identification Number"
              placeholder="Enter your NRIC"
              value={nric}
              onChangeText={setNric}
              autoCapitalize="characters"
              containerStyle={styles.input}
            />

            <Button
              title="Continue"
              onPress={handleContinue}
              disabled={!nric.trim()}
              style={styles.button}
            />
          </View>
        </View>
      </View>
      
      {/* Bahagian sini untuk modal password */}
      <Modal 
          visible={PasswordModal}
          transparent
          statusBarTranslucent
          animationType = "none"
          onRequestClose={() => setPasswordModal(false)}
      >
        {/* bahagian sini untuk buat bila keyboard muncul then modal akan naik atas sikit */}
        <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
              <Animated.View
            style={[styles.modalCard, { transform: [{ translateY: slideAnim }] }]}
          >
            <View style={styles.handle} />

            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed" size={26} color={colors.primary} />
            </View>

            <Text style={styles.titlePassword}>Enter your password</Text>
            <Text style={styles.paraghPassword}>
              Please enter your password to continue as {selectedRole}
            </Text>

            <View style={styles.passwordWrapper}>
              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={showPassword}
                autoCapitalize="none"
                containerStyle={styles.inputPass}
              />
              <Pressable
                onPress={() => setShowPassword(prev => !prev)}
                style={styles.eyeBtn}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={colors.gray500}
                />
              </Pressable>
            </View>

            <Pressable onPress={() => {}} style={styles.forgetBtn} hitSlop={8}>
              <Text style={styles.titleForget}>Forgot password?</Text>
            </Pressable>

            <Button
              title="Login"
              onPress={handleLogin}
              disabled={!password}
              style={styles.loginButton}
            />

            <Pressable
              onPress={handleCancel}
              style={styles.cancelBtn}
              hitSlop={8}
            >
              <Text style={styles.titleCancel}>Cancel</Text>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>

      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFill,
  },
  topGradient: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  waveBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  waveShape: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 40,
    transform: [{ skewY: '-3deg' }],
    marginTop: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  logoText: {
    ...typography.h1,
    color: colors.white,
    fontSize: 36,
  },
  tagline: {
    ...typography.body,
    color: colors.gray100,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 32,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 6,
  },
  title: {
    ...typography.h2,
    color: colors.black,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  roleToggle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    justifyContent: 'center',
  },
  roleButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray100,
    minWidth: 72,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleText: {
    ...typography.bodySmall,
    color: colors.gray700,
  },
  roleTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  input: {
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(30,27,75,0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
  backgroundColor: colors.white,
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  paddingHorizontal: 24,
  paddingTop: 12,
  paddingBottom: 36,
  alignItems: 'stretch',
},
handle: {
  alignSelf: 'center',
  width: 44,
  height: 5,
  borderRadius: 3,
  backgroundColor: colors.gray100,
  marginBottom: 20,
},
iconCircle: {
  alignSelf: 'center',
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: '#EEF2FF',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 16,
},
titlePassword: {
  fontSize: 22,
  fontWeight: '700',
  color: colors.black,
  textAlign: 'center',
},
paraghPassword: {
  fontSize: 14,
  color: colors.gray500,
  textAlign: 'center',
  marginTop: 6,
  marginBottom: 24,
},
passwordWrapper: {
  position: 'relative',
},
eyeBtn: {
  position: 'absolute',
  right: 14,
  bottom: 21,
},
inputPass: {
  marginBottom: 8,
},
forgetBtn: {
  alignSelf: 'flex-end',
  marginBottom: 20,
},
titleForget: {
  fontSize: 14,
  fontWeight: '600',
  color: colors.primary,
},
loginButton: {
  marginTop: 0,
},
cancelBtn: {
  alignSelf: 'center',
  paddingVertical: 14,
},
titleCancel: {
  fontSize: 15,
  fontWeight: '500',
  color: colors.gray500,
},
});
