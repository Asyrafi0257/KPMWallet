import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en';
import ms from './locales/ms';

const LANGUAGE_KEY = 'appLanguage';

export type AppLanguage = 'en' | 'ms';

export async function initializeLanguage() {
  const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ms: { translation: ms },
    },
    lng: savedLanguage === 'ms' ? 'ms' : 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });
}

export async function changeAppLanguage(language: AppLanguage) {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}

export default i18n;