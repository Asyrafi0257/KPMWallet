import React, { useEffect } from 'react';
import {
  Image,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { LocalizedText as Text } from '../../components/LocalizedText';
import type { AuthStackParamList } from '../../navigation/authNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('RoleSelect');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.background}>
      <Image
        source={require('../../../assets/school-payment-splash.png')}
        resizeMode="cover"
        style={styles.backgroundImage}
        accessibilityIgnoresInvertColors
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.copy}>
          <Text style={styles.title}>
            E - Bantuan{'\n'}
            <Text style={styles.titleAccent}>Asas Persekolahan</Text>
          </Text>
          <Text style={styles.subtitle}>
            A smarter way to manage school assistance and digital payment, all in one place
          </Text>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F8FCFF',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
    zIndex: 1,
  },
  copy: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: '21%',
    alignItems: 'flex-start',
  },
  title: {
    color: '#103C60',
    fontSize: 36,
    lineHeight: 43,
    fontWeight: '800',
    textAlign: 'left',
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: '#42B9C5',
  },
  subtitle: {
    color: '#527087',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'left',
    marginTop: 10,
    maxWidth: 330,
  },
});
