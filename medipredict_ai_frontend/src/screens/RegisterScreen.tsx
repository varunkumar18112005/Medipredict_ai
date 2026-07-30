import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function RegisterScreen({ navigation }: any) {
    const { colors } = useTheme();

    const { registerInitiate, registerVerify } = useAuth();
    const [step, setStep] = useState(1);

    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '',
        dateOfBirth: '', gender: '', password: '', confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const [dateObj, setDateObj] = useState(new Date(2000, 0, 1));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showGenderPicker, setShowGenderPicker] = useState(false);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const updateField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateChange = (event: any, selectedDate: Date | undefined) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) {
            setDateObj(selectedDate);
            updateField('dateOfBirth', formatDate(selectedDate));
        }
    };

    const handleInitiate = async () => {
        if (!form.firstName || !form.lastName || !form.email || !form.password || !form.dateOfBirth) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }
        if (!form.email.toLowerCase().endsWith('@gmail.com')) {
            Alert.alert('Error', 'Only @gmail.com email addresses are allowed.');
            return;
        }
        if (form.password !== form.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        if (form.password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters');
            return;
        }
        setLoading(true);
        try {
            await registerInitiate({
                firstName: form.firstName, lastName: form.lastName,
                email: form.email, password: form.password,
                dateOfBirth: form.dateOfBirth, gender: form.gender
            });
            setStep(2);
        } catch (error: any) {
            Alert.alert('Failed to send OTP', error.response?.data?.message || 'Please verify your backend connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!otp || otp.length < 6) {
            Alert.alert('Error', 'Please enter the valid OTP');
            return;
        }
        setLoading(true);
        try {
            await registerVerify({
                firstName: form.firstName, lastName: form.lastName,
                email: form.email, password: form.password,
                dateOfBirth: form.dateOfBirth, gender: form.gender,
                otp
            });
        } catch (error: any) {
            Alert.alert('Verification Failed', error.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    if (step === 2) {
        return (
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={[styles.scrollContent, { justifyContent: 'center', flex: 1 }]}>
                    <TouchableOpacity onPress={() => setStep(1)} style={styles.backButtonInline}>
                        <Ionicons name="arrow-back" size={24} color="#263238" />
                    </TouchableOpacity>

                    <View style={styles.headerSection}>
                        <View style={styles.iconCircle}>
                          <Ionicons name="mail-unread-outline" size={32} color="#1E88E5" />
                        </View>
                        <Text style={styles.appName}>Verify Your Email</Text>
                        <Text style={styles.subtitle}>We've sent a 6-digit verification OTP to {form.email}</Text>
                    </View>

                    <View style={styles.formSection}>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="keypad-outline" size={20} color="#64748B" style={styles.inputIcon} />
                            <TextInput 
                              style={styles.input} 
                              placeholder="Enter 6-digit OTP" 
                              placeholderTextColor="#94A3B8" 
                              value={otp} 
                              onChangeText={setOtp} 
                              keyboardType="number-pad" 
                              maxLength={6} 
                            />
                        </View>
                        <TouchableOpacity style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={handleVerify} disabled={loading}>
                            <Text style={styles.primaryButtonText}>{loading ? 'Verifying...' : 'Complete Registration ➔'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        );
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonInline}>
                    <Ionicons name="arrow-back" size={24} color="#263238" />
                </TouchableOpacity>

                <View style={styles.headerSection}>
                    <Text style={styles.appName}>Create Patient Account</Text>
                    <Text style={styles.subtitle}>Join MediPredict AI for real-time diagnostic risk intelligence</Text>
                </View>

                <View style={styles.formSection}>
                    <View style={styles.row}>
                        <View style={[styles.inputWrapper, styles.halfInput]}>
                            <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#94A3B8" value={form.firstName} onChangeText={v => updateField('firstName', v)} />
                        </View>
                        <View style={[styles.inputWrapper, styles.halfInput]}>
                            <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#94A3B8" value={form.lastName} onChangeText={v => updateField('lastName', v)} />
                        </View>
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput style={styles.input} placeholder="Gmail Address (@gmail.com)" placeholderTextColor="#94A3B8" value={form.email} onChangeText={v => updateField('email', v)} keyboardType="email-address" autoCapitalize="none" />
                    </View>

                    <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowDatePicker(true)}>
                        <Ionicons name="calendar-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <Text style={[styles.input, { paddingTop: 16, color: form.dateOfBirth ? '#263238' : '#94A3B8' }]}>
                            {form.dateOfBirth || 'Date of Birth (YYYY-MM-DD)'}
                        </Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker value={dateObj} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleDateChange} maximumDate={new Date()} />
                    )}

                    <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowGenderPicker(true)}>
                        <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <Text style={[styles.input, { paddingTop: 16, color: form.gender ? '#263238' : '#94A3B8' }]}>
                            {form.gender ? form.gender.charAt(0).toUpperCase() + form.gender.slice(1) : 'Select Gender'}
                        </Text>
                    </TouchableOpacity>

                    <Modal visible={showGenderPicker} transparent animationType="fade">
                        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setShowGenderPicker(false)}>
                            <View style={styles.modalCard}>
                                <Text style={styles.modalTitle}>Select Gender</Text>
                                {['MALE', 'FEMALE', 'OTHER'].map(g => (
                                    <TouchableOpacity key={g} style={styles.modalOption} onPress={() => { updateField('gender', g); setShowGenderPicker(false); }}>
                                        <Text style={styles.modalOptionText}>{g.charAt(0) + g.slice(1).toLowerCase()}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput style={styles.input} placeholder="Password (min 8 chars)" placeholderTextColor="#94A3B8" value={form.password} onChangeText={v => updateField('password', v)} secureTextEntry={!showPassword} />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                        <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#94A3B8" value={form.confirmPassword} onChangeText={v => updateField('confirmPassword', v)} secureTextEntry={!showPassword} />
                    </View>

                    <TouchableOpacity style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={handleInitiate} disabled={loading}>
                        <Text style={styles.primaryButtonText}>{loading ? 'Sending OTP...' : 'Send Verification OTP ➔'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already registered? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.footerLink}>Sign In</Text>
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
        paddingBottom: 40 
    },
    backButtonInline: { 
        width: 42, 
        height: 42, 
        borderRadius: 14, 
        backgroundColor: '#FFFFFF', 
        borderWidth: 1, 
        borderColor: '#E2E8F0', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginBottom: 20 
    },
    headerSection: { 
        alignItems: 'flex-start', 
        marginBottom: 24 
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(30, 136, 229, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    appName: { 
        fontSize: 26, 
        fontWeight: '800', 
        color: '#263238', 
        marginBottom: 6 
    },
    subtitle: { 
        fontSize: 14, 
        color: '#64748B', 
        lineHeight: 20 
    },
    formSection: { 
        width: '100%', 
        maxWidth: 440, 
        alignSelf: 'center' 
    },
    row: { 
        flexDirection: 'row', 
        gap: 12 
    },
    halfInput: { 
        flex: 1 
    },
    inputWrapper: {
        flexDirection: 'row', 
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16, 
        borderWidth: 1.5, 
        borderColor: '#CBD5E1',
        paddingHorizontal: 16, 
        marginBottom: 14, 
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
        backgroundColor: 'rgba(15, 23, 42, 0.5)', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 24 
    },
    modalCard: { 
        width: '100%', 
        maxWidth: 320, 
        backgroundColor: '#FFFFFF', 
        borderRadius: 20, 
        padding: 20, 
        borderWidth: 1, 
        borderColor: '#CBD5E1' 
    },
    modalTitle: { 
        fontSize: 16, 
        fontWeight: '800', 
        color: '#263238', 
        marginBottom: 14, 
        textAlign: 'center' 
    },
    modalOption: { 
        paddingVertical: 12, 
        borderBottomWidth: 1, 
        borderBottomColor: '#F1F5F9' 
    },
    modalOptionText: { 
        fontSize: 15, 
        fontWeight: '700', 
        color: '#1E88E5', 
        textAlign: 'center' 
    },
});
