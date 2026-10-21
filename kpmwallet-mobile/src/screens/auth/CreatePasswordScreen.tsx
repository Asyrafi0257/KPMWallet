import React from 'react';
import { LocalizedText as Text } from '../../components/LocalizedText';
import { View, StyleSheet, Pressable } from 'react-native';
import { LocalizedAlert as Alert } from '../../components/LocalizedAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, spacing, typography } from '../../theme';
import { Button, Input } from '../../components';
import type { AuthStackParamList } from '../../navigation/authNavigator';
import api from '../../services/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'CreatePassword'>;

export default function CreatePasswordScreen({
  navigation,
  route,
}: Props) {
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const { nric, email, role } = route.params;

  const handleSetPassword = async () => {
  if (password !== confirmPassword) {
    Alert.alert('Error', 'Passwords do not match.');
    return;
  }
  try {
    const response = await api.post('/auth/create-password', {
      nric,
      email,
      role,
      password,
    });

    console.log(response.data);

    Alert.alert(
      'Success',
      'Your account has been created successfully.',
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('RoleSelect');
          },
        },
      ],
    );
  } catch (error) {
    console.log('Create password error:', error);

    Alert.alert(
      'Server Problem',
      'Unable to create your account. Please try again.',
    );
  }
};

  const isValid =
    password.length >= 6 && confirmPassword.length >= 6 && password === confirmPassword;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.progress}>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
          <Text style={styles.stepText}>Step 2 of 2</Text>
        </View>

        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.content}>
          <Text style={styles.title}>Create your password</Text>
          <Text style={styles.subtitle}>Set a secure password to protect your account.</Text>

          <View style={styles.passwordField}>
            <Input
              label="Password"
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              inputStyle={styles.passwordInput}
              containerStyle={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              onPress={() => setShowPassword((visible) => !visible)}
              style={styles.eyeButton}
              hitSlop={8}
            >
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={22} color={colors.gray500} />
            </Pressable>
          </View>

          <View style={styles.passwordField}>
            <Input
              label="Confirm password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              inputStyle={styles.passwordInput}
              containerStyle={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
              onPress={() => setShowConfirmPassword((visible) => !visible)}
              style={styles.eyeButton}
              hitSlop={8}
            >
              <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={22} color={colors.gray500} />
            </Pressable>
          </View>

          {password !== confirmPassword && confirmPassword.length > 0 && (
            <Text style={styles.error}>Passwords do not match.</Text>
          )}
        </View>

        <Button
          title="Set Password"
          onPress={handleSetPassword}
          disabled={!isValid}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  progress: {
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.gray100,
    borderRadius: radii.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
  },
  stepText: {
    ...typography.caption,
    color: colors.gray500,
    textAlign: 'right',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  backArrow: {
    fontSize: 28,
    color: colors.black,
    lineHeight: 30,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.h1,
    color: colors.black,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.gray500,
    marginBottom: spacing.xl,
  },
  input: {
    marginBottom: spacing.lg,
  },
  passwordField: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: 34,
    height: 40,
    justifyContent: 'center',
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginTop: -spacing.md,
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: 'auto',
  },
});
