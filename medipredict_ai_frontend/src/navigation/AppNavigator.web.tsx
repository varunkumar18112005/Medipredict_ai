import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Image } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import LandingScreen from '../screens/LandingScreen';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DiseaseSelectionScreen from '../screens/DiseaseSelectionScreen';
import RequiredTestsScreen from '../screens/RequiredTestsScreen';
import HealthAnalysisScreen from '../screens/HealthAnalysisScreen';
import AnalyzingScreen from '../screens/AnalyzingScreen';
import ResultScreen from '../screens/ResultScreen';
import SuggestionsScreen from '../screens/SuggestionsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function WebSidebar({ navigation }: any) {
    const { colors, isDark } = useTheme();
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const sidebarAnim = useRef(new Animated.Value(0)).current;

    const activeRouteName = useNavigationState(state => {
        if (!state) return 'Home';
        const route = state.routes[state.index];
        if (route.name === 'AuthenticatedWebLayout' && route.state) {
            const nestedRoutes = route.state.routes;
            const nestedIndex = route.state.index ?? 0;
            return nestedRoutes[nestedIndex]?.name || 'Home';
        }
        return route.name;
    });

    const handleMouseEnter = () => {
        setIsSidebarOpen(true);
        Animated.timing(sidebarAnim, { toValue: 1, duration: 250, useNativeDriver: false }).start();
    };

    const handleMouseLeave = () => {
        setIsSidebarOpen(false);
        Animated.timing(sidebarAnim, { toValue: 0, duration: 250, useNativeDriver: false }).start();
    };

    const sidebarWidth = sidebarAnim.interpolate({ inputRange: [0, 1], outputRange: [76, 260] });

    const getSidebarItemStyle = (routeName: string) => {
        const isActive = activeRouteName === routeName;
        return [
            styles.sidebarItem,
            isActive && {
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'rgba(59, 130, 246, 0.2)',
                borderWidth: 1,
            }
        ];
    };

    const getSidebarIconColor = (routeName: string) => {
        return activeRouteName === routeName ? '#3b82f6' : colors.textSecondary;
    };

    const getSidebarTextColor = (routeName: string) => {
        return activeRouteName === routeName ? '#ffffff' : colors.textSecondary;
    };

    return (
        <Animated.View 
            // @ts-ignore
            onMouseEnter={handleMouseEnter}
            // @ts-ignore
            onMouseLeave={handleMouseLeave}
            style={[styles.sidebar, { width: sidebarWidth, backgroundColor: colors.surface, borderRightColor: colors.border }]}
        >
            {/* Brand/Logo */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, marginBottom: 40, paddingLeft: 24, height: 32, overflow: 'hidden', alignSelf: 'stretch' }}>
                <Image 
                    source={require('../../assets/logo.png')} 
                    style={{ width: 28, height: 28, borderRadius: 6 }} 
                    resizeMode="cover"
                />
                {isSidebarOpen && (
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 1 }}>
                        MediPredict <Text style={{ color: colors.primary }}>AI</Text>
                    </Text>
                )}
            </View>

            {/* User Info Capsule */}
            {user && (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 10,
                    marginBottom: 30,
                    marginHorizontal: 12,
                    minHeight: 52,
                    alignSelf: 'stretch',
                    overflow: 'hidden'
                }}>
                    <View style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>
                            {((user.firstName ? user.firstName[0] : '') + (user.lastName ? user.lastName[0] : '')).toUpperCase()}
                        </Text>
                    </View>
                    {isSidebarOpen && (
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }} numberOfLines={1}>
                                {user.firstName} {user.lastName}
                            </Text>
                            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                                ID: {user.healthId || 'MP-PENDING'}
                            </Text>
                            <Text style={{ fontSize: 10, color: colors.primary, marginTop: 4, fontWeight: '600' }} numberOfLines={1}>
                                {user.email}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.sidebarMenu}>
                <TouchableOpacity style={getSidebarItemStyle('Home')} onPress={() => navigation.navigate('AuthenticatedWebLayout', { screen: 'Home' })}>
                    <Ionicons name="grid-outline" size={20} color={getSidebarIconColor('Home')} />
                    {isSidebarOpen && <Text style={[styles.sidebarText, { color: getSidebarTextColor('Home') }]}>Dashboard</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={getSidebarItemStyle('DiseaseSelection')} onPress={() => navigation.navigate('AuthenticatedWebLayout', { screen: 'DiseaseSelection' })}>
                    <Ionicons name="pulse" size={20} color={getSidebarIconColor('DiseaseSelection')} />
                    {isSidebarOpen && <Text style={[styles.sidebarText, { color: getSidebarTextColor('DiseaseSelection') }]}>Risk Predictor</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={getSidebarItemStyle('History')} onPress={() => navigation.navigate('AuthenticatedWebLayout', { screen: 'History' })}>
                    <Ionicons name="clipboard-outline" size={20} color={getSidebarIconColor('History')} />
                    {isSidebarOpen && <Text style={[styles.sidebarText, { color: getSidebarTextColor('History') }]}>History Logs</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={getSidebarItemStyle('Reports')} onPress={() => navigation.navigate('AuthenticatedWebLayout', { screen: 'Reports' })}>
                    <Ionicons name="document-text-outline" size={20} color={getSidebarIconColor('Reports')} />
                    {isSidebarOpen && <Text style={[styles.sidebarText, { color: getSidebarTextColor('Reports') }]}>Records Vault</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={getSidebarItemStyle('Profile')} onPress={() => navigation.navigate('AuthenticatedWebLayout', { screen: 'Profile' })}>
                    <Ionicons name="settings-outline" size={20} color={getSidebarIconColor('Profile')} />
                    {isSidebarOpen && <Text style={[styles.sidebarText, { color: getSidebarTextColor('Profile') }]}>Settings</Text>}
                </TouchableOpacity>
            </View>

            {/* Bottom Actions */}
            <View style={{ position: 'absolute', bottom: 20, left: 0, right: 0, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 20, paddingHorizontal: 14 }}>
                <TouchableOpacity 
                    onPress={logout} 
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 16,
                        paddingVertical: 10,
                        paddingHorizontal: isSidebarOpen ? 16 : 0,
                        justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 12,
                        width: '100%',
                    }}
                >
                    <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} />
                    {isSidebarOpen && (
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>Sign Out</Text>
                    )}
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

// Custom wrapper to access navigation prop natively for the sidebar
function AuthenticatedWebLayout() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    return (
        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
            <WebSidebar navigation={navigation} />
            <View style={{ flex: 1, overflow: 'hidden' }}>
                <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen name="History" component={HistoryScreen} />
                    <Stack.Screen name="Reports" component={ReportsScreen} />
                    <Stack.Screen name="Profile" component={ProfileScreen} />
                    <Stack.Screen name="DiseaseSelection" component={DiseaseSelectionScreen} />
                    <Stack.Screen name="RequiredTests" component={RequiredTestsScreen} />
                    <Stack.Screen name="HealthAnalysis" component={HealthAnalysisScreen} />
                    <Stack.Screen name="Analyzing" component={AnalyzingScreen} />
                    <Stack.Screen name="Result" component={ResultScreen} />
                    <Stack.Screen name="Suggestions" component={SuggestionsScreen} />
                </Stack.Navigator>
            </View>
        </View>
    );
}

export default function AppNavigatorWeb() {
    const { colors } = useTheme();
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            {!isAuthenticated ? (
                <>
                    <Stack.Screen name="Landing" component={LandingScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                </>
            ) : (
                <Stack.Screen name="AuthenticatedWebLayout" component={AuthenticatedWebLayout} />
            )}
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    sidebar: { height: '100%', borderRightWidth: 1, paddingTop: 20, overflow: 'hidden', alignItems: 'flex-start', elevation: 10, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.1, shadowRadius: 10 },
    sidebarMenu: { width: '100%' },
    sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, marginHorizontal: 12, marginBottom: 8, borderRadius: 8, borderColor: 'transparent', borderWidth: 1 },
    sidebarText: { fontSize: 15, fontWeight: '600', marginLeft: 16 },
});
