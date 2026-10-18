import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

type TabConfig = {
  name: string;
  icon: string;
  library: 'ion' | 'material';
  isCenter?: boolean;
};

const tabConfigs: TabConfig[] = [
  {
    name: 'Sales',
    icon: 'grid-outline',
    library: 'ion',
  },
  {
    name: 'Transaction',
    icon: 'receipt-outline',
    library: 'ion',
  },
   {
    name: 'Item',
    icon: 'cube-outline',
    library: 'ion',
    isCenter: true,
  },
  {
    name: 'Shift',
    icon: 'time-outline',
    library: 'ion',
  },
  {
    name: 'Profile',
    icon: 'person-outline',
    library: 'ion',
  },
];

export default function TabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const renderIcon = (
    tab: TabConfig,
    color: string,
    size: number,
  ) => {
    if (tab.library === 'material') {
      return (
        <MaterialCommunityIcons
          name={tab.icon as any}
          size={size}
          color={color}
        />
      );
    }

    return (
      <Ionicons
        name={tab.icon as any}
        size={size}
        color={color}
      />
    );
  };

  const renderTab = (tab: TabConfig) => {

    const routeIndex = state.routes.findIndex(
      (route) => route.name === tab.name,
    );

    if (routeIndex === -1) {
      return null;
    }

    const route = state.routes[routeIndex];

    const isActive = state.index === routeIndex;

    const color = isActive
      ? '#7142f3'
      : '#A7A7AE';

    const { options } = descriptors[route.key];

    const label =
      typeof options.tabBarLabel === 'string'
        ? options.tabBarLabel
        : options.title ?? tab.name;

    const onPress = () => {

      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isActive && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    return (
      <TouchableOpacity
        key={tab.name}
        style={styles.tab}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={
          isActive
            ? { selected: true }
            : {}
        }
      >

        {renderIcon(tab, color, 24)}

        <Text
          style={[
            styles.tabLabel,
            isActive && styles.activeLabel,
          ]}
        >
          {label}
        </Text>

        {isActive && (
          <View style={styles.activeDot} />
        )}

      </TouchableOpacity>
    );
  };

  const leftTabs = tabConfigs.slice(0, 2);
  const rightTabs = tabConfigs.slice(2);

  return (
    <View style={styles.bottomWrapper}>
      <View style={styles.bottomBar}>

         {tabConfigs.map((tab) => {

        if (tab.isCenter) {
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.ctaButton}
              onPress={() => {
                navigation.navigate(tab.name);
              }}
              activeOpacity={0.8}
            >
              {renderIcon(
                tab,
                '#FFFFFF',
                35
              )}
            </TouchableOpacity>
          );
        }

        return renderTab(tab);

      })}

      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({

  bottomWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: 9,
    paddingBottom: 18,
    overflow: 'visible',
  },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: 56,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 54,
  },

  tabLabel: {
    fontSize: 11,
    color: '#A7A7AE',
    fontWeight: '400',
  },

  activeLabel: {
    color: '#7142f3',
    fontWeight: '700',
  },

  ctaButton: {
    width: 55,
    height: 55,
    borderRadius: 50,
    backgroundColor: '#7142f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -51,
    marginHorizontal: 2,
  },

  activeDot: {
    position: 'absolute',
    bottom: -1,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#7142f3',
  },

});
