import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

interface Reminder {
    id: string;
    type: string;
    date: string;
    notes: string;
}

interface Medication {
    id: string;
    name: string;
    dosage: string;
    time: string;
    frequency?: string;
}

export default function SchedulerScreen({ navigation }: any) {
    const { colors } = useTheme();

    const [activeTab, setActiveTab] = useState<'tests' | 'medications'>('tests');

    // Tests state
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [newReminderType, setNewReminderType] = useState('DIABETES');
    const [newReminderDate, setNewReminderDate] = useState('');
    const [newReminderNotes, setNewReminderNotes] = useState('');

    // Medications state
    const [medications, setMedications] = useState<Medication[]>([]);
    const [newMedName, setNewMedName] = useState('');
    const [newMedDosage, setNewMedDosage] = useState('');
    const [newMedTime, setNewMedTime] = useState('');
    const [newMedFrequency, setNewMedFrequency] = useState('Everyday');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const savedRem = await AsyncStorage.getItem('mediReminders');
            if (savedRem) setReminders(JSON.parse(savedRem));
            const savedMeds = await AsyncStorage.getItem('mediMedications');
            if (savedMeds) setMedications(JSON.parse(savedMeds));
        } catch (e) {
            console.error('Failed to load scheduler data', e);
        }
    };

    const handleAddReminder = async () => {
        if (!newReminderDate) {
            Alert.alert('Required', 'Please select or enter a date (YYYY-MM-DD).');
            return;
        }

        const newRem: Reminder = {
            id: Date.now().toString(),
            type: newReminderType,
            date: newReminderDate,
            notes: newReminderNotes
        };

        const updated = [...reminders, newRem].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setReminders(updated);
        await AsyncStorage.setItem('mediReminders', JSON.stringify(updated));

        setNewReminderDate('');
        setNewReminderNotes('');
        Alert.alert('Success', 'Diagnostic check added to routine planner.');
    };

    const handleAddMedication = async () => {
        if (!newMedName || !newMedTime) {
            Alert.alert('Required', 'Please enter a medication name and time slot.');
            return;
        }

        const newMed: Medication = {
            id: Date.now().toString(),
            name: newMedName,
            dosage: newMedDosage,
            time: newMedTime,
            frequency: newMedFrequency
        };

        const updated = [...medications, newMed].sort((a, b) => a.time.localeCompare(b.time));
        setMedications(updated);
        await AsyncStorage.setItem('mediMedications', JSON.stringify(updated));

        setNewMedName('');
        setNewMedDosage('');
        setNewMedTime('');
        setNewMedFrequency('Everyday');
        Alert.alert('Success', 'Medication added to reminder routine.');
    };

    const handleDeleteReminder = async (id: string) => {
        const updated = reminders.filter(r => r.id !== id);
        setReminders(updated);
        await AsyncStorage.setItem('mediReminders', JSON.stringify(updated));
    };

    const handleDeleteMedication = async (id: string) => {
        const updated = medications.filter(m => m.id !== id);
        setMedications(updated);
        await AsyncStorage.setItem('mediMedications', JSON.stringify(updated));
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="#263238" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Ionicons name="calendar" size={20} color="#1E88E5" />
                    <Text style={styles.headerTitle}>Routine & Reminder Planner</Text>
                </View>
                <View style={{ width: 42 }} />
            </View>

            {/* Top Tabs */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'tests' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('tests')}
                >
                    <Text style={[styles.tabButtonText, activeTab === 'tests' && styles.tabButtonTextActive]}>
                        🧪 Checkup Routine
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'medications' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('medications')}
                >
                    <Text style={[styles.tabButtonText, activeTab === 'medications' && styles.tabButtonTextActive]}>
                        💊 Medication Alarms
                    </Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'tests' ? (
                <>
                    {/* Add Test Form */}
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Schedule Diagnostic Checkup</Text>

                        <Text style={styles.fieldLabel}>Disease Pipeline Type</Text>
                        <View style={styles.chipRow}>
                            {['DIABETES', 'HEART_DISEASE', 'LIVER_DISEASE', 'KIDNEY_DISEASE'].map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.chip, newReminderType === t && styles.chipActive]}
                                    onPress={() => setNewReminderType(t)}
                                >
                                    <Text style={[styles.chipText, newReminderType === t && styles.chipTextActive]}>
                                        {t.replace('_', ' ')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.fieldLabel}>Target Date (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 2026-06-15"
                            placeholderTextColor="#94A3B8"
                            value={newReminderDate}
                            onChangeText={setNewReminderDate}
                        />

                        <Text style={styles.fieldLabel}>Clinical Notes / Hospital Preference</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Saveetha Medical College - Fasting Blood Test"
                            placeholderTextColor="#94A3B8"
                            value={newReminderNotes}
                            onChangeText={setNewReminderNotes}
                        />

                        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleAddReminder}>
                            <Text style={styles.primaryButtonText}>+ Add Checkup Reminder</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Reminders List */}
                    <Text style={styles.sectionTitle}>UPCOMING CHECKUPS ({reminders.length})</Text>
                    {reminders.length === 0 ? (
                        <Text style={styles.emptyText}>No checkups scheduled yet.</Text>
                    ) : (
                        reminders.map((rem) => (
                            <View key={rem.id} style={styles.itemCard}>
                                <View style={styles.itemIconBg}>
                                    <Ionicons name="medical" size={20} color="#1E88E5" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemTitle}>{rem.type.replace('_', ' ')}</Text>
                                    <Text style={styles.itemMeta}>Date: {rem.date}</Text>
                                    {rem.notes ? <Text style={styles.itemDesc}>{rem.notes}</Text> : null}
                                </View>
                                <TouchableOpacity onPress={() => handleDeleteReminder(rem.id)}>
                                    <Ionicons name="trash-outline" size={20} color="#EF5350" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </>
            ) : (
                <>
                    {/* Add Medication Form */}
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Add Medication Reminder</Text>

                        <Text style={styles.fieldLabel}>Medication Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Metformin / Aspirin"
                            placeholderTextColor="#94A3B8"
                            value={newMedName}
                            onChangeText={setNewMedName}
                        />

                        <Text style={styles.fieldLabel}>Dosage Amount</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 500mg (1 Tablet after meals)"
                            placeholderTextColor="#94A3B8"
                            value={newMedDosage}
                            onChangeText={setNewMedDosage}
                        />

                        <Text style={styles.fieldLabel}>Daily Time Slot</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 08:00 AM"
                            placeholderTextColor="#94A3B8"
                            value={newMedTime}
                            onChangeText={setNewMedTime}
                        />

                        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleAddMedication}>
                            <Text style={styles.primaryButtonText}>+ Add Medication Alarm</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Medications List */}
                    <Text style={styles.sectionTitle}>DAILY MEDICATION ALARMS ({medications.length})</Text>
                    {medications.length === 0 ? (
                        <Text style={styles.emptyText}>No medication alarms set.</Text>
                    ) : (
                        medications.map((med) => (
                            <View key={med.id} style={styles.itemCard}>
                                <View style={[styles.itemIconBg, { backgroundColor: 'rgba(46, 189, 133, 0.1)' }]}>
                                    <Ionicons name="alarm" size={20} color="#2EBD85" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemTitle}>{med.name}</Text>
                                    <Text style={styles.itemMeta}>⏰ {med.time} • {med.dosage}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDeleteMedication(med.id)}>
                                    <Ionicons name="trash-outline" size={20} color="#EF5350" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </>
            )}
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
        fontSize: 16,
        fontWeight: '800',
        color: '#263238',
    },
    tabBar: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    tabButtonActive: {
        backgroundColor: '#1E88E5',
        borderColor: '#1E88E5',
    },
    tabButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
    },
    tabButtonTextActive: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    formTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#263238',
        marginBottom: 14,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#263238',
        marginBottom: 6,
        marginTop: 10,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8,
    },
    chip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    chipActive: {
        backgroundColor: '#EBF5FF',
        borderColor: '#1E88E5',
    },
    chipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
    },
    chipTextActive: {
        color: '#1E88E5',
        fontWeight: '800',
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
    primaryButton: {
        backgroundColor: '#1E88E5',
        borderRadius: 16,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 18,
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.8,
        marginBottom: 12,
        marginLeft: 2,
    },
    emptyText: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        marginVertical: 20,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    itemIconBg: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: 'rgba(30, 136, 229, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#263238',
    },
    itemMeta: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1E88E5',
        marginTop: 2,
    },
    itemDesc: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
});
