import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen({ navigation }: any) {
    const { colors } = useTheme();
    const { user, logout } = useAuth();

    const [activeTab, setActiveTab] = useState<'PROFILE' | 'HEALTH'>('PROFILE');
    
    // Profile State
    const [firstName, setFirstName] = useState(user?.firstName || 'Patient');
    const [lastName, setLastName] = useState(user?.lastName || 'User');
    const [email, setEmail] = useState(user?.email || 'patient@gmail.com');
    const [gender, setGender] = useState((user as any)?.gender || 'Male');
    const [dob, setDob] = useState((user as any)?.dateOfBirth || '2000-01-01');

    // Health Vitals State
    const [height, setHeight] = useState('175');
    const [weight, setWeight] = useState('70');
    const [hr, setHr] = useState('72');
    const [glucose, setGlucose] = useState('95');
    const [insulin, setInsulin] = useState('6.0');
    const [bpSys, setBpSys] = useState('120');
    const [bpDia, setBpDia] = useState('80');

    const handleSave = () => {
        Alert.alert("Profile Updated ✨", "Your personal and health profile details have been saved successfully.");
    };

    const handleLogout = async () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to log out of your MediPredict AI account?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Log Out", style: "destructive", onPress: () => logout() }
            ]
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="#263238" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Ionicons name="person" size={20} color="#1E88E5" />
                    <Text style={styles.headerTitle}>Patient Account & Health Profile</Text>
                </View>
                <TouchableOpacity style={styles.backBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#EF5350" />
                </TouchableOpacity>
            </View>

            {/* Profile Avatar Hero */}
            <View style={styles.avatarCard}>
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                        {(firstName[0] || 'P') + (lastName[0] || 'U')}
                    </Text>
                </View>
                <Text style={styles.userName}>{firstName} {lastName}</Text>
                <Text style={styles.userEmail}>{email}</Text>
                <View style={styles.healthIdBadge}>
                    <Ionicons name="shield-checkmark" size={14} color="#1E88E5" />
                    <Text style={styles.healthIdBadgeText}>Health ID: {user?.healthId || "MP-VERIFIED"}</Text>
                </View>
            </View>

            {/* Tab Controls */}
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tabButton, activeTab === 'PROFILE' && styles.tabActive]}
                    onPress={() => setActiveTab('PROFILE')}
                >
                    <Ionicons name="person" size={16} color={activeTab === 'PROFILE' ? '#FFFFFF' : '#64748B'} />
                    <Text style={[styles.tabText, activeTab === 'PROFILE' && styles.tabTextActive]}>PERSONAL DETAILS</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tabButton, activeTab === 'HEALTH' && styles.tabActive]}
                    onPress={() => setActiveTab('HEALTH')}
                >
                    <Ionicons name="fitness" size={16} color={activeTab === 'HEALTH' ? '#FFFFFF' : '#64748B'} />
                    <Text style={[styles.tabText, activeTab === 'HEALTH' && styles.tabTextActive]}>VITALS BASELINE</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'PROFILE' ? (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Personal Information</Text>

                    <View style={styles.row}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>FIRST NAME</Text>
                            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholderTextColor="#94A3B8" />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>LAST NAME</Text>
                            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholderTextColor="#94A3B8" />
                        </View>
                    </View>

                    <View style={styles.inputGroupFull}>
                        <Text style={styles.label}>EMAIL ADDRESS</Text>
                        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholderTextColor="#94A3B8" keyboardType="email-address" />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>GENDER</Text>
                            <TextInput style={styles.input} value={gender} onChangeText={setGender} placeholderTextColor="#94A3B8" />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>DATE OF BIRTH</Text>
                            <TextInput style={styles.input} value={dob} onChangeText={setDob} placeholderTextColor="#94A3B8" />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>SAVE PERSONAL DETAILS ➔</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Baseline Vitals & Telemetry</Text>

                    <View style={styles.row}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>HEIGHT (CM)</Text>
                            <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" placeholderTextColor="#94A3B8" />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>WEIGHT (KG)</Text>
                            <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholderTextColor="#94A3B8" />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>RESTING HR (BPM)</Text>
                            <TextInput style={styles.input} value={hr} onChangeText={setHr} keyboardType="numeric" placeholderTextColor="#94A3B8" />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>GLUCOSE (MG/DL)</Text>
                            <TextInput style={styles.input} value={glucose} onChangeText={setGlucose} keyboardType="numeric" placeholderTextColor="#94A3B8" />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>SYSTOLIC BP</Text>
                            <TextInput style={styles.input} value={bpSys} onChangeText={setBpSys} keyboardType="numeric" placeholderTextColor="#94A3B8" />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>DIASTOLIC BP</Text>
                            <TextInput style={styles.input} value={bpDia} onChangeText={setBpDia} keyboardType="numeric" placeholderTextColor="#94A3B8" />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>UPDATE BASELINE VITALS ➔</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Logout Action */}
            <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#EF5350" />
                <Text style={styles.logoutBtnText}>Sign Out of MediPredict AI</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FAFF',
    },
    content: {
        paddingHorizontal: 18,
        paddingTop: Platform.OS === 'ios' ? 50 : 36,
        paddingBottom: 90,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
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
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#263238',
    },
    avatarCard: {
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    avatarCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#1E88E5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    userName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#263238',
    },
    userEmail: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    healthIdBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(30, 136, 229, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 10,
        borderWidth: 1,
        borderColor: 'rgba(30, 136, 229, 0.2)',
    },
    healthIdBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1E88E5',
    },
    tabContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    tabActive: {
        backgroundColor: '#1E88E5',
        borderColor: '#1E88E5',
    },
    tabText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.5,
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#263238',
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 14,
    },
    inputGroup: {
        flex: 1,
    },
    inputGroupFull: {
        marginBottom: 14,
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        height: 48,
        paddingHorizontal: 14,
        fontSize: 14,
        fontWeight: '600',
        color: '#263238',
    },
    saveButton: {
        backgroundColor: '#1E88E5',
        borderRadius: 16,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FFF5F5',
        borderWidth: 1.5,
        borderColor: '#FEB2B2',
        borderRadius: 16,
        height: 50,
    },
    logoutBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#EF5350',
    },
});
