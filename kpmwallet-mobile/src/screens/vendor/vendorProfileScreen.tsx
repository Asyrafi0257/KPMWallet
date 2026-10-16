
import { Ionicons } from '@expo/vector-icons';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';
import i18n from '../../i18n';
import api from '../../services/api';
import { Button } from '../../components';
import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { VendorStackParamList } from '../../navigation/vendorNavigator';

type NavigationProp = NativeStackNavigationProp<
  VendorStackParamList,
  'VendorTabs'
>;

type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
};

type ProfileHeaderProps = {
  title: string;
};

type UserProfile = {
  user_id: number;
  email: string;
  role: string;
  nric: string;
  created_at: string;
  username: string;
};

function ProfileHeader({ title }: ProfileHeaderProps) {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.header}>
      <Text
        style={[
          styles.title,
          { fontSize: Math.min(width * 0.075, 30) },
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  value,
  onPress,
}: MenuItemProps) {
  const { width } = useWindowDimensions();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
    >
      <View
        style={[
          styles.menuIconBox,
          {
            width: Math.min(width * 0.105, 40),
            height: Math.min(width * 0.105, 40),
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={Math.min(width * 0.055, 22)}
          color="#1565d8"
        />
      </View>

      <Text
        style={[
          styles.menuLabel,
          { fontSize: Math.min(width * 0.042, 16) },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {value ? (
        <Text
          style={[
            styles.menuValue,
            { fontSize: Math.min(width * 0.037, 14) },
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
      ) : null}

      <Ionicons
        name="chevron-forward"
        size={Math.min(width * 0.055, 22)}
        color="#9aa8c2"
      />
    </Pressable>
  );
}

export default function Screen() {
  const { width, height } = useWindowDimensions();

  const horizontalSpace = Math.min(width * 0.05, 20);
  const avatarSize = Math.min(width * 0.36, 140);
  const circleBigSize = Math.min(width * 0.72, 280);
  const circleSmallSize = Math.min(width * 0.42, 160);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation<NavigationProp>();

  // Fetch profile whenever this screen becomes active
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchProfile = async () => {
        try {
          const response = await api.get('/users/1');

          if (isActive) {
            setUser(response.data);
          }
        } catch (error) {
          console.log('Failed to fetch profile:', error);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      fetchProfile();

      return () => {
        isActive = false;
      };
    }, []),
  );

  //handle change password
  const handleChangePassword = () => {
    navigation.navigate("ChangePassword");
  }

  // Handle logout
  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' as never }],
    });
  };

  // Handle edit profile
  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565d8" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Failed to load profile.</Text>
        <Pressable
          onPress={() => setLoading(true)}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Background circles */}
      <View
        style={[
          styles.circle,
          {
            width: circleBigSize,
            height: circleBigSize,
            borderRadius: circleBigSize / 2,
            top: -circleBigSize * 0.29,
            right: -circleBigSize * 0.32,
          },
        ]}
      />

      <View
        style={[
          styles.circle,
          {
            width: circleSmallSize,
            height: circleSmallSize,
            borderRadius: circleSmallSize / 2,
            top: height * 0.18,
            left: -circleSmallSize * 0.38,
          },
        ]}
      />

      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <ProfileHeader title="Profile" />

          {/* Profile sheet */}
          <View
            style={[
              styles.sheet,
              {
                marginTop: avatarSize * 0.79,
                paddingHorizontal: horizontalSpace,
              },
            ]}
          >
            {/* Avatar */}
            <View
              style={[
                styles.avatarWrap,
                { marginTop: -avatarSize / 2 },
              ]}
            >
              <View
                style={[
                  styles.avatar,
                  {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                    borderWidth: Math.max(3, width * 0.012),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarText,
                    { fontSize: avatarSize * 0.46 },
                  ]}
                >
                  {(user.username?.trim()?.charAt(0) || 'A').toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Username */}
            <Text
              style={[
                styles.profileUsername,
                { fontSize: Math.min(width * 0.075, 30) },
              ]}
              numberOfLines={1}
            >
              {user.username || 'Username'}
            </Text>

            {/* Email */}
            <Text
              style={[
                styles.profileEmail,
                { fontSize: Math.min(width * 0.042, 16) },
              ]}
              numberOfLines={1}
            >
              {user.email}
            </Text>

            {/* Role */}
            <View style={styles.rolePill}>
              <Text
                style={[
                  styles.roleText,
                  { fontSize: Math.min(width * 0.035, 13) },
                ]}
              >
                {user.role.toUpperCase()}
              </Text>
            </View>

            {/* Account and settings */}
            <View style={styles.containProfile}>
              <Text
                style={[
                  styles.titleAccount,
                  { fontSize: Math.min(width * 0.06, 19) },
                ]}
              >
                Account
              </Text>

              <View style={styles.menuGroup}>
                <MenuItem
                  icon="person-outline"
                  label="Edit profile"
                  onPress={handleEditProfile}
                />

                <MenuItem
                  icon="lock-closed-outline"
                  label="Change password"
                  onPress={handleChangePassword}
                />
              </View>

              <Text
                style={[
                  styles.titleAccount,
                  styles.titleSpacing,
                  { fontSize: Math.min(width * 0.06, 19) },
                ]}
              >
                Settings
              </Text>

              <View style={styles.menuGroup}>
                <MenuItem
                  icon="language-outline"
                  label="Language"
                  value={
                    i18n.language === 'ms'
                      ? 'Bahasa Melayu'
                      : 'English'
                  }
                  onPress={() => {}}
                />
              </View>
            </View>

            {/* Logout */}
            <Button
              title="Logout"
              onPress={handleLogout}
              style={styles.btnLogout}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1565d8',
  },

  safe: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },

  retryButton: {
    marginTop: 12,
    padding: 10,
  },

  retryText: {
    color: '#1565d8',
    fontWeight: '600',
  },

  circle: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  header: {
    marginHorizontal: 20,
  },

  title: {
    fontWeight: '700',
    marginVertical: 10,
    color: '#ffffff',
  },

  sheet: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    alignItems: 'center',
    paddingBottom: 32,
  },

  avatarWrap: {
    alignSelf: 'center',
  },

  avatar: {
    backgroundColor: '#3b82e6',
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontWeight: 'bold',
    color: '#ffffff',
  },

  rolePill: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 30,
    backgroundColor: '#e8f0fe',
  },

  roleText: {
    fontWeight: '700',
    color: '#1565d8',
    letterSpacing: 0.8,
  },

  containProfile: {
  alignSelf: 'stretch',
  flexGrow: 1,
  marginVertical: 20,
},

  titleAccount: {
    fontWeight: '600',
    color: '#0f2a5c',
  },

  titleSpacing: {
    marginTop: 24,
  },

  menuGroup: {
    marginTop: 8,
    backgroundColor: '#ffffff',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D9DEE8',
  },

  menuItemPressed: {
    backgroundColor: '#F8FAFC',
  },

  menuIconBox: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },

  menuLabel: {
    flex: 1,
    flexShrink: 1,
    fontWeight: '600',
    color: '#0f2a5c',
  },

  menuValue: {
    flexShrink: 1,
    color: '#7b8aa5',
    marginRight: 6,
  },

  profileUsername: {
    marginTop: 20,
    fontWeight: '800',
    color: '#0f2a5c',
    textAlign: 'center',
    maxWidth: '95%',
    letterSpacing: 0.3,
  },

  profileEmail: {
    marginTop: 8,
    fontWeight: '400',
    color: '#64748b',
    textAlign: 'center',
    maxWidth: '95%',
  },

  btnLogout: {
    width: '100%',
    backgroundColor: '#ff0b0b',
    marginVertical: 25,
  },
});
