import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, spacing, typography } from '../../theme';
import { Button, Input } from '../../components';
import type { AuthStackParamList } from '../../navigation/authNavigator';
import api from "../../services/api";

type Props = NativeStackScreenProps<AuthStackParamList, 'FirstTimeEmail'>;

export default function FirstTimeEmailScreen({
  navigation,
  route,
}: Props) {
  const { nric, role } = route.params;

  const [email, setEmail] = React.useState('');
  

  const handleContinue = async () => {
  if (!email.trim()) {
    Alert.alert('Error', 'Please enter your email.');
    return;
  }

  try {
    await api.post('/auth/send-code', {
      email: email.trim(),
    });

    navigation.navigate('CreatePassword', {
    nric,
    email: email.trim(),
    role
  });
  } catch (error) {
    console.log('Send code error:', error);

    Alert.alert(
      'Server Problem',
      'Unable to send email. Please try again.',
    );
  }
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.progress}>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
          <Text style={styles.stepText}>Step 1 of 2</Text>
        </View>

        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.content}>
          <Text style={styles.title}>First Time Login</Text>
          <Text style={styles.subtitle}>
            Please enter your email address to continue. A verification code will be sent to your email for account activation.
          </Text>

          <Input
            label="Email address"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            containerStyle={styles.input}
          />
        </View>

        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!email.trim()}
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
    lineHeight: 24,
  },
  input: {
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: 'auto',
  },
});
