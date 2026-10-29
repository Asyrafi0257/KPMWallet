
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { LocalizedAlert } from '../components/LocalizedAlert';
import navigationRef from '../navigation/navigationRef';

let handlingExpiredSession = false;

const api = axios.create({
  baseURL: 'http://192.168.0.9:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT automatically to API requests
api.interceptors.request.use(
  async (config) => {
    const isAuthRequest = config.url?.includes('/auth/');
    const token = isAuthRequest
      ? null
      : await SecureStore.getItemAsync('access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const hasAuthHeader = Boolean(error.config?.headers?.Authorization);

    if (error.response?.status === 401 && hasAuthHeader && !handlingExpiredSession) {
      handlingExpiredSession = true;

      try {
        await SecureStore.deleteItemAsync('access_token');
      } catch (storageError) {
        console.warn('Failed to clear expired access token:', storageError);
      }

      if (navigationRef.isReady()) {
        navigationRef.resetRoot({
          index: 0,
          routes: [{ name: 'Auth', params: { screen: 'RoleSelect' } }],
        });
      }

      LocalizedAlert.alert(
        'Session expired',
        'Your session has expired. Please log in again.',
        [{ text: 'OK', onPress: () => { handlingExpiredSession = false; } }],
        { cancelable: false },
      );
    }

    return Promise.reject(error);
  },
);

export default api;
