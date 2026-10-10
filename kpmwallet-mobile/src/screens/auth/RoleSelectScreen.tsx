import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, spacing, typography } from '../../theme';
import { Button, Input } from '../../components';
import type { AuthStackParamList } from '../../navigation/authNavigator';
import type { RootStackParamList } from '../../navigation/rootNavigator';
import type { CompositeScreenProps } from '@react-navigation/native';
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

  const handleContinue = async () => {
  try {
    const response = await api.post('/auth/check-login', {
      nric: nric.trim(),
      role: selectedRole
    });

    const result = response.data;
    
    //use switch case sbb ada banyak role
    if(result.success){
      switch(result.role){
        case 'School':
          navigation.replace('School');
          Alert.alert(
            "Login Success",
            "You have successfully logged in as a School."
          )
          break;
        
        case 'Parent':
          navigation.replace('Parent');
          Alert.alert(
            "Login Success",
            "You have successfully logged in as a Parent."
          )
          break;

        case 'Student':
          navigation.replace('Student');
          Alert.alert(
            "Login Success",
            "You have successfully logged in as a Student."
          )
          break;

        case 'Vendor':
          navigation.replace('Vendor');
          Alert.alert(
            "Login Success",
            "You have successfully logged in as a Vendor."
          )
          break;
          
      }

    } else {
      navigation.navigate('FirstTimeEmail', {
      role: selectedRole,
      nric: nric.trim(),
    });
    }

    return;
    
  } catch (error) {
    console.log('Check NRIC error:', error);

    Alert.alert(
      'Server Problem',
      'Unable to connect to the server. Please try again.',
    );
  }
};

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
});
