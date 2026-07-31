import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  TouchableWithoutFeedback,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrawer } from '../context/DrawerContext';
import { useAuth } from '../context/AuthContext';

interface SideNavbarProps {
  navigation: any;
  currentRouteName?: string;
}

export default function SideNavbar({ navigation, currentRouteName }: SideNavbarProps) {
  const { isOpen, closeDrawer, animValue, drawerWidth } = useDrawer();
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerWidth, 0],
  });

  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  const handleNavigate = (screenName: string, params?: any) => {
    closeDrawer();
    setTimeout(() => {
      navigation.navigate(screenName, params);
    }, 150);
  };

  const handleLogout = () => {
    closeDrawer();
    Alert.alert('Sign Out', 'Are you sure you want to log out of MediPredict AI?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const getInitials = () => {
    if (!user) return 'MP';
    const f = user.firstName ? user.firstName[0] : '';
    const l = user.lastName ? user.lastName[0] : '';
    return (f + l).toUpperCase() || 'MP';
  };

  const navItems = [
    { label: 'Dashboard', route: 'Home', icon: '📊' },
    { label: 'Predictor', route: 'DiseaseSelection', icon: '🧠' },
    { label: 'Diet', route: 'Diet', icon: '🥗' },
    { label: 'Exercise', route: 'Exercise', icon: '🏋️' },
    { label: 'Scheduler', route: 'Scheduler', icon: '📅' },
    { label: 'History', route: 'History', icon: '📜' },
    { label: 'Centers', route: 'ClinicCenters', icon: '🏥' },
    { label: 'Settings', route: 'Profile', icon: '⚙️' },
  ];

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 999 }]} pointerEvents="box-none">
      {/* Semi-transparent Backdrop Overlay */}
      <TouchableWithoutFeedback onPress={closeDrawer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Side Drawer Container matching Web App Sidebar */}
      <Animated.View
        style={[
          styles.drawerContainer,
          {
            width: drawerWidth,
            transform: [{ translateX }],
          },
        ]}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.drawerInner}>
            {/* Top Brand Logo & Header */}
            <View style={styles.brandHeader}>
              <View style={styles.brandLogoRow}>
                <View style={styles.logoBadge}>
                  <Text style={styles.logoIcon}>🧬</Text>
                </View>

                <View style={styles.brandTitleRow}>
                  <Text style={styles.brandTitle}>MediPredict</Text>
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>AI</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={closeDrawer}>
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Navigation Menu List */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.menuContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.navList}>
                {navItems.map((item) => {
                  const isActive =
                    currentRouteName === item.route ||
                    (item.route === 'Home' && (!currentRouteName || currentRouteName === 'MainTabs')) ||
                    (item.route === 'DiseaseSelection' &&
                      (currentRouteName === 'HealthAnalysis' || currentRouteName === 'Result' || currentRouteName === 'Analyzing' || currentRouteName === 'RequiredTests' || currentRouteName === 'Suggestions'));

                  return (
                    <TouchableOpacity
                      key={item.route}
                      style={[styles.navButton, isActive && styles.navButtonActive]}
                      onPress={() => handleNavigate(item.route)}
                      activeOpacity={0.8}
                    >
                      {isActive && <View style={styles.activeBarIndicator} />}
                      <Text style={styles.navIcon}>{item.icon}</Text>
                      <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                        {item.label}
                      </Text>
                      {isActive && (
                        <View style={styles.activeDotBadge}>
                          <Text style={styles.activeDotBadgeText}>●</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Bottom Section: Profile Card & Sign Out */}
            <View style={styles.bottomSection}>
              {/* User Profile Card */}
              <TouchableOpacity
                style={styles.profileCard}
                onPress={() => handleNavigate('Profile')}
                activeOpacity={0.85}
              >
                <View style={styles.userAvatarCircle}>
                  <Text style={styles.userAvatarInitials}>{getInitials()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userNameText} numberOfLines={1}>
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Patient'}
                  </Text>
                  <View style={styles.healthIdRow}>
                    <View style={styles.greenDot} />
                    <Text style={styles.healthIdText}>
                      {user?.healthId || 'MP-6008'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Sign Out Button */}
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
                <View style={styles.logoutIconCircle}>
                  <Text style={{ fontSize: 13 }}>📜</Text>
                </View>
                <Text style={styles.logoutBtnText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 25,
  },
  drawerInner: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoIcon: {
    fontSize: 20,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  aiBadge: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuContent: {
    paddingVertical: 14,
  },
  navList: {
    gap: 6,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 12,
  },
  navButtonActive: {
    backgroundColor: '#1E88E5',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    position: 'relative',
  },
  activeBarIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  activeDotBadge: {
    marginLeft: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDotBadgeText: {
    color: '#10B981',
    fontSize: 10,
  },
  navIcon: {
    fontSize: 20,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  bottomSection: {
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarInitials: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  healthIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  healthIdText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF1F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  logoutIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E11D48',
  },
});
