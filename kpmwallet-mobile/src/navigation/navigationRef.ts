import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './rootNavigator';

const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default navigationRef;
