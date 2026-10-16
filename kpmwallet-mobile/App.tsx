
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/rootNavigator';
import { initializeLanguage } from './src/i18n';

export default function App() {
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  useEffect(() => {
    async function setupLanguage() {
      try {
        await initializeLanguage();
      } catch (error) {
        console.error('Failed to initialize language:', error);
      } finally {
        setIsLanguageReady(true);
      }
    }

    setupLanguage();
  }, []);

  if (!isLanguageReady) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" color="#1565D8" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <RootNavigator />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
