import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen({ navigation }: any) {
    const { colors } = useTheme();

    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            await login({ email, password });
        } catch (error: any) {
            Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };


    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address first to receive the reset token.');
            return;
        }
        setLoading(true);
        try {
            await authService.forgotPassword(email);
            Alert.alert('Success', 'Password reset instructions have been sent to your email.', [
                { text: 'OK', onPress: () => navigation.navigate('ResetPassword') }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to request password reset');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                {/* Back to Landing Navigation */}
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Landing')}>
                    <Ionicons name="arrow-back" size={24} color="#263238" />
                </TouchableOpacity>

                {/* Minimal Header Section */}
                <View style={styles.logoSection}>
                    <View style={styles.logoIconBg}>
                        <Ionicons name="pulse" size={28} color="#FFFFFF" />
                    </View>
                    <Text style={styles.appName}>
                        MediPredict AI
                    </Text>
                    <Text style={styles.subtitle}>Welcome back to your enterprise medical protection portal.</Text>
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            placeholderTextColor="#94A3B8"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#94A3B8"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.forgotLink} onPress={handleForgotPassword} disabled={loading}>
                        <Text style={styles.forgotText}>Recover Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.primaryButton, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.primaryButtonText}>{loading ? 'Signing In...' : 'Sign In ➔'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>New to MediPredict AI? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.footerLink}>Create Account</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FAFF'
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 60
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 54 : 40,
        left: 20,
        zIndex: 10,
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 36
    },
    logoIconBg: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#1E88E5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    appName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#263238',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        maxWidth: 340,
        lineHeight: 20
    },
    formSection: {
        width: '100%',
        maxWidth: 440,
        alignSelf: 'center'
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        paddingHorizontal: 16,
        marginBottom: 16,
        height: 54,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 10
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#263238'
    },
    eyeIcon: {
        padding: 6
    },
    forgotLink: {
        alignSelf: 'flex-end',
        marginBottom: 24
    },
    forgotText: {
        color: '#1E88E5',
        fontSize: 13,
        fontWeight: '700'
    },
    primaryButton: {
        backgroundColor: '#1E88E5',
        borderRadius: 18,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800'
    },
    googleButton: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    googleIcon: {
        marginRight: 10
    },
    googleButtonText: {
        color: '#263238',
        fontSize: 15,
        fontWeight: '800'
    },
    buttonDisabled: {
        opacity: 0.6
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10
    },
    footerText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '500'
    },
    footerLink: {
        color: '#1E88E5',
        fontSize: 14,
        fontWeight: '800'
    },
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 24,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
    },
    googleModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#263238',
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
        marginBottom: 16,
    },
    modalInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        height: 50,
        paddingHorizontal: 16,
        fontSize: 15,
        fontWeight: '600',
        color: '#263238',
        marginBottom: 16,
    },
    modalSubmitBtn: {
        backgroundColor: '#1E88E5',
        borderRadius: 16,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    modalSubmitBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    accountOptionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
    },
    avatarBg: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '800',
    },
    accountName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#263238',
    },
    accountEmail: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    modalDividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginVertical: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    dividerText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
    },
});
