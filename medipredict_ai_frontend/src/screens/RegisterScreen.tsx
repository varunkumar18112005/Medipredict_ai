import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  Modal 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function RegisterScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { registerInitiate, registerVerify } = useAuth();
  
  const [step, setStep] = useState(1); // 1 = Details, 2 = Verification OTP

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (key: string, value: string) => {
    let cleanValue = value;
    if (key === 'firstName' || key === 'lastName') {
      cleanValue = value.replace(/[^a-zA-Z\s'-]/g, '');
    } else if (key === 'password') {
      cleanValue = value.replace(/\s/g, '');
    }
    setForm(prev => ({ ...prev, [key]: cleanValue }));
  };

  const handleInitiate = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password) {
      Alert.alert('Missing Details', 'Please enter your first name, last name, email address, and password.');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Terms & Conditions Required', 'Please agree to the Terms and Conditions and Privacy Policy to proceed.');
      return;
    }

    if (!form.email.toLowerCase().endsWith('@gmail.com')) {
      Alert.alert('Invalid Email', 'Only @gmail.com email addresses are supported.');
      return;
    }

    const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!STRONG_PASSWORD_REGEX.test(form.password)) {
      Alert.alert(
        'Strong Password Required',
        'Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character (e.g. User@1234). Spaces are not allowed.'
      );
      return;
    }

    setLoading(true);
    try {
      await registerInitiate({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setStep(2);
    } catch (error: any) {
      Alert.alert('Registration Error', error.response?.data?.message || 'Failed to initiate registration. Please verify details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification security code sent to your email.');
      return;
    }
    setLoading(true);
    try {
      await registerVerify({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        otp: otp.trim(),
      });
    } catch (error: any) {
      Alert.alert('Verification Failed', error.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: OTP Verification Screen
  if (step === 2) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color="#64748B" />
            </TouchableOpacity>

            <Text style={styles.cardTitle}>Verify Authorization</Text>
            <Text style={styles.cardSubtitle}>
              Enter the 6-digit security verification code sent to {form.email}.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>VERIFICATION CODE</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  placeholderTextColor="#94A3B8"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, loading && styles.buttonDisabled]} 
              onPress={handleVerify} 
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Verifying Credentials...' : 'Verify & Complete Account'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // STEP 1: Registration Form matching Web UI
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Main Card UI matching Web Version */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Account</Text>
          <Text style={styles.cardSubtitle}>Initialize your medical profile credentials.</Text>

          {/* Row 1: First Name & Last Name */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.halfField]}>
              <Text style={styles.fieldLabel}>FIRST NAME</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="John"
                  placeholderTextColor="#94A3B8"
                  value={form.firstName}
                  onChangeText={v => updateField('firstName', v)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={[styles.fieldGroup, styles.halfField]}>
              <Text style={styles.fieldLabel}>LAST NAME</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  placeholderTextColor="#94A3B8"
                  value={form.lastName}
                  onChangeText={v => updateField('lastName', v)}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </View>

          {/* Row 2: Email Address */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="john.doe@example.com"
                placeholderTextColor="#94A3B8"
                value={form.email}
                onChangeText={v => updateField('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Row 3: Secret Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>SECRET PASSWORD</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                value={form.password}
                onChangeText={v => updateField('password', v)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Checkbox: Terms and Conditions */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity 
              style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]} 
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              activeOpacity={0.8}
            >
              {acceptedTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </TouchableOpacity>
            
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink} onPress={() => setShowTermsModal(true)}>
                Terms and Conditions
              </Text>{' '}
              and Privacy Policy
            </Text>
          </View>

          {/* Primary Action Button matching Web */}
          <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.buttonDisabled]} 
            onPress={handleInitiate} 
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Sending Verification Code...' : 'Send Verification Code'}
            </Text>
          </TouchableOpacity>

          {/* Footer Sign In Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already registered? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Terms and Conditions Modal */}
      <Modal visible={showTermsModal} transparent animationType="fade" onRequestClose={() => setShowTermsModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Terms and Conditions</Text>
            <ScrollView style={{ maxHeight: 300, marginBottom: 16 }}>
              <Text style={styles.modalBody}>
                Welcome to MediPredict AI. By registering an account, you agree to adhere to our diagnostic risk processing terms, data encryption protocols, and healthcare privacy guidelines.
                {'\n\n'}
                1. Account Credentials: Users must provide accurate profile details and a secure password.
                {'\n\n'}
                2. Data Privacy: All health assessments and telemetry uploaded to MediPredict AI are strictly encrypted.
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.primaryButton} onPress={() => { setAcceptedTerms(true); setShowTermsModal(false); }}>
              <Text style={styles.primaryButtonText}>I Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#EDF5FF' // Matching soft cyan/blue gradient backdrop from web
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: '#1E293B', 
    marginBottom: 6 
  },
  cardSubtitle: { 
    fontSize: 14, 
    color: '#64748B', 
    lineHeight: 20,
    marginBottom: 24 
  },
  row: { 
    flexDirection: 'row', 
    gap: 12 
  },
  halfField: { 
    flex: 1 
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#CBD5E1',
    paddingHorizontal: 14, 
    height: 48,
  },
  input: { 
    flex: 1, 
    fontSize: 15, 
    fontWeight: '500', 
    color: '#1E293B' 
  },
  eyeIcon: {
    padding: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  termsLink: {
    color: '#2563EB',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  primaryButton: {
    backgroundColor: '#82B1FF', // Soft glowing blue matching web screenshot
    borderRadius: 24,
    height: 52,
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#3B82F6', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  primaryButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  buttonDisabled: { 
    opacity: 0.6 
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  footerText: { 
    color: '#64748B', 
    fontSize: 14,
    fontWeight: '400' 
  },
  footerLink: { 
    color: '#2563EB', 
    fontSize: 14, 
    fontWeight: '700' 
  },
  modalBg: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.5)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  modalCard: { 
    width: '100%', 
    maxWidth: 380, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 24, 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#1E293B', 
    marginBottom: 12, 
  },
  modalBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  }
});
