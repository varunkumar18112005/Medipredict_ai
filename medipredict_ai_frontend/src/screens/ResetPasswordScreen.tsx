import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/auth';
import { useTheme } from '../context/ThemeContext';

export default function ResetPasswordScreen({ navigation }: any) {
    const { colors } = useTheme();

    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!token || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await authService.resetPassword(token, newPassword);
            Alert.alert('Success', 'Password has been reset successfully', [
                { text: 'Login', onPress: () => navigation.navigate('Login') }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                
                {/* Back to Login */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#263238" />
                </TouchableOpacity>

                {/* Minimal Header Section */}
                <View style={styles.logoSection}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="lock-closed" size={32} color="#1E88E5" />
                    </View>
                    <Text style={styles.appName}>
                        Reset Password
                    </Text>
                    <Text style={styles.subtitle}>Enter the reset token sent to your email along with your new password.</Text>
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="keypad-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Reset Token"
                            placeholderTextColor="#94A3B8"
                            value={token}
                            onChangeText={setToken}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="New Password (min 8 chars)"
                            placeholderTextColor="#94A3B8"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm New Password"
                            placeholderTextColor="#94A3B8"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showPassword}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.primaryButton, loading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        <Text style={styles.primaryButtonText}>{loading ? 'Resetting...' : 'Update Password ➔'}</Text>
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
        paddingHorizontal: 24, 
        paddingTop: Platform.OS === 'ios' ? 54 : 40,
        paddingBottom: 40,
        justifyContent: 'center',
        flexGrow: 1,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    logoSection: { 
        alignItems: 'center', 
        marginBottom: 36 
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(30, 136, 229, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    appName: { 
        fontSize: 26, 
        fontWeight: '800', 
        color: '#263238', 
        marginBottom: 8, 
        textAlign: 'center' 
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
    primaryButton: {
        backgroundColor: '#1E88E5', 
        borderRadius: 18,
        height: 52,
        alignItems: 'center', 
        justifyContent: 'center',
        marginTop: 10,
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
    buttonDisabled: { 
        opacity: 0.6 
    },
});
