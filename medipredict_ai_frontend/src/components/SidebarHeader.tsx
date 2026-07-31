import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, Animated, Dimensions, TouchableWithoutFeedback, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(width * 0.75, 300);

export default function SidebarHeader() {
    const { colors, isDark } = useTheme();
    const { user, logout } = useAuth();
    const navigation = useNavigation<any>();
    const route = useRoute();

    const [visible, setVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

    const openMenu = () => {
        setVisible(true);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start();
    };

    const closeMenu = () => {
        Animated.timing(slideAnim, {
            toValue: -SIDEBAR_WIDTH,
            duration: 150,
            useNativeDriver: true,
        }).start(() => setVisible(false));
    };

    const handleNavigation = (routeName: string) => {
        closeMenu();
        if (route.name !== routeName) {
            navigation.navigate(routeName);
        }
    };

    const handleLogout = async () => {
        closeMenu();
        await logout();
        navigation.navigate('Login');
    };

    const getInitials = () => {
        if (!user) return "";
        const f = user.firstName ? user.firstName[0] : "";
        const l = user.lastName ? user.lastName[0] : "";
        return (f + l).toUpperCase();
    };

    const menuItems = [
        { label: 'Dashboard', route: 'Home', icon: 'home-outline' as const },
        { label: 'Risk Predictor', route: 'DiseaseSelection', icon: 'pulse-outline' as const },
        { label: 'Diet Planner', route: 'Diet', icon: 'restaurant-outline' as const },
        { label: 'Exercise Planner', route: 'Exercise', icon: 'barbell-outline' as const },
        { label: 'Scheduler', route: 'Scheduler', icon: 'calendar-outline' as const },
        { label: 'History Logs', route: 'History', icon: 'clipboard-outline' as const },
        { label: 'Medical Vault', route: 'Reports', icon: 'document-text-outline' as const },
        { label: 'Clinic Centers', route: 'ClinicCenters', icon: 'map-outline' as const },
        { label: 'Settings', route: 'Profile', icon: 'settings-outline' as const },
    ];

    const styles = getStyles(colors);

    return (
        <View style={styles.header}>
            <View style={styles.leftContainer}>
                <TouchableOpacity onPress={openMenu} style={styles.menuButton} activeOpacity={0.7}>
                    <Ionicons name="menu" size={24} color="#fff" />
                </TouchableOpacity>
                <Image 
                    source={require('../../assets/logo.png')} 
                    style={styles.logo} 
                    resizeMode="cover"
                />
                <Text style={styles.headerTitle}>
                    MediPredict <Text style={{ color: colors.primary }}>AI</Text>
                </Text>
            </View>

            {/* Status Indicator */}
            <View style={styles.statusCapsule}>
                <View style={styles.pulseDot} />
                <Text style={styles.statusText}>ONLINE</Text>
            </View>

            <Modal
                transparent
                visible={visible}
                onRequestClose={closeMenu}
                animationType="none"
            >
                <View style={styles.modalOverlay}>
                    {/* Backdrop */}
                    <TouchableWithoutFeedback onPress={closeMenu}>
                        <View style={styles.backdrop} />
                    </TouchableWithoutFeedback>

                    {/* Sliding Sidebar Menu */}
                    <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
                        <SafeAreaView style={styles.safeArea}>
                            <View style={styles.sidebarContent}>
                                {/* Header / Close Button */}
                                <View style={styles.sidebarHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <Image 
                                            source={require('../../assets/logo.png')} 
                                            style={{ width: 28, height: 28, borderRadius: 6 }} 
                                            resizeMode="cover"
                                        />
                                        <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0.5 }}>
                                            MediPredict <Text style={{ color: colors.primary }}>AI</Text>
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
                                        <Ionicons name="close" size={22} color="#94a3b8" />
                                    </TouchableOpacity>
                                </View>

                                {/* User Info Capsule */}
                                <View style={styles.userCapsule}>
                                    <View style={styles.avatarMini}>
                                        <Text style={styles.avatarText}>{getInitials()}</Text>
                                    </View>
                                    <View style={styles.userDetails}>
                                        <Text style={styles.userName} numberOfLines={1}>
                                            {user?.firstName} {user?.lastName}
                                        </Text>
                                        <Text style={styles.userId} numberOfLines={1}>
                                            ID: {user?.healthId || "MP-PENDING"}
                                        </Text>
                                        <Text style={styles.userEmail} numberOfLines={1}>
                                            {user?.email}
                                        </Text>
                                    </View>
                                </View>

                                {/* Navigation Links */}
                                <View style={styles.navLinks}>
                                    {menuItems.map((item, idx) => {
                                        const isActive = route.name === item.route;
                                        return (
                                            <TouchableOpacity
                                                key={idx}
                                                style={[styles.navLink, isActive && styles.navLinkActive]}
                                                onPress={() => handleNavigation(item.route)}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons 
                                                    name={item.icon} 
                                                    size={20} 
                                                    color={isActive ? colors.primary : '#94a3b8'} 
                                                    style={styles.navIcon}
                                                />
                                                <Text style={[styles.navLinkText, isActive && styles.navLinkTextActive]}>
                                                    {item.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Bottom Actions (Sign Out) */}
                                <View style={styles.sidebarFooter}>
                                    <TouchableOpacity
                                        style={styles.signOutButton}
                                        onPress={handleLogout}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="log-out-outline" size={18} color="#ef4444" style={styles.navIcon} />
                                        <Text style={styles.signOutText}>Sign Out</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </SafeAreaView>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingTop: 12,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    menuButton: {
        padding: 4,
        marginRight: 4,
    },
    logo: {
        width: 28,
        height: 28,
        borderRadius: 6,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    statusCapsule: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10b981',
    },
    statusText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 10,
    },
    modalOverlay: {
        flex: 1,
        flexDirection: 'row',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    sidebar: {
        width: SIDEBAR_WIDTH,
        height: '100%',
        backgroundColor: '#0f131a', // Dark theme surface color
        borderRightWidth: 1,
        borderRightColor: 'rgba(255, 255, 255, 0.08)',
    },
    safeArea: {
        flex: 1,
    },
    sidebarContent: {
        flex: 1,
        padding: 20,
    },
    sidebarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    closeButton: {
        padding: 4,
    },
    userCapsule: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        padding: 12,
        marginBottom: 25,
    },
    avatarMini: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#fff',
    },
    userDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    userName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    userId: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 2,
    },
    userEmail: {
        fontSize: 10,
        color: '#3b82f6',
        fontWeight: '600',
        marginTop: 2,
    },
    navLinks: {
        flex: 1,
        gap: 8,
    },
    navLink: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    navLinkActive: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    navIcon: {
        marginRight: 12,
    },
    navLinkText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94a3b8',
    },
    navLinkTextActive: {
        color: '#fff',
    },
    sidebarFooter: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        paddingTop: 15,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.1)',
    },
    signOutText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ef4444',
    },
});
