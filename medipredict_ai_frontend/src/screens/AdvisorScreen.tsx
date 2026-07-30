import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface Message {
    id: string;
    sender: 'user' | 'advisor';
    text: string;
    timestamp: Date;
}

interface Assessment {
    id: number;
    diseaseType: string;
    riskScore: number;
    riskLevel: string;
    createdAt: string;
}

export default function AdvisorScreen({ navigation }: any) {
    const { colors } = useTheme();

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [latestAssessment, setLatestAssessment] = useState<Assessment | null>(null);

    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        fetchLatestAssessment();
    }, []);

    const fetchLatestAssessment = async () => {
        try {
            const res = await api.get('/assessments?size=10');
            const logs = res.data.content || [];
            const completed = logs.find((a: any) => a.status === 'COMPLETED');
            if (completed) {
                setLatestAssessment(completed);
            }
        } catch (err) {
            console.error('Failed to fetch latest assessment for chatbot:', err);
        }
    };

    useEffect(() => {
        if (messages.length === 0) {
            const welcomeText = getWelcomeMessage(latestAssessment);
            setMessages([
                {
                    id: 'welcome',
                    sender: 'advisor',
                    text: welcomeText,
                    timestamp: new Date(),
                },
            ]);
        }
    }, [latestAssessment]);

    const getWelcomeMessage = (assessment: Assessment | null) => {
        if (!assessment) {
            return "### Hello! I am your MediPredict Advisor. 👋\n\nOnce you run a health assessment, I will load your vitals context here to explain your risk scores and provide personalized clinical guidance.\n\nFeel free to ask me general questions about diabetes, heart, kidney, or liver wellness!";
        }
        
        const diseaseName = assessment.diseaseType.replace("_", " ");
        return `### Hello! I am your MediPredict Advisor. 👋\n\nI have loaded your latest **${diseaseName} Assessment**:\n\n* **Risk Level:** ${assessment.riskLevel}\n* **Risk Score:** ${assessment.riskScore}%\n\nHow can I help explain your diagnostic findings or recommend lifestyle modifications today?`;
    };

    const handleSend = async (textToSend: string) => {
        if (!textToSend.trim() || isLoading) return;

        const userMsg: Message = {
            id: Math.random().toString(),
            sender: 'user',
            text: textToSend,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const res = await api.post('/assessments/chat', {
                message: textToSend,
                assessmentId: latestAssessment?.id || null,
            });

            const responseText = res.data.response || "I apologize, but I could not formulate an advisor response. Please try again.";

            const advisorMsg: Message = {
                id: Math.random().toString(),
                sender: 'advisor',
                text: responseText,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, advisorMsg]);
        } catch (err) {
            setMessages(prev => [
                ...prev,
                {
                    id: Math.random().toString(),
                    sender: 'advisor',
                    text: "Connection Error: I was unable to connect to the AI advisor service. Please check your backend connection.",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="#263238" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Ionicons name="chatbubbles" size={20} color="#06B6D4" />
                    <Text style={styles.headerTitle}>MediPredict Telehealth Assistant</Text>
                </View>
                <View style={{ width: 42 }} />
            </View>

            {/* Chat History */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.chatScroll}
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={false}
            >
                {messages.map((msg) => (
                    <View
                        key={msg.id}
                        style={[
                            styles.messageBubble,
                            msg.sender === 'user' ? styles.userBubble : styles.advisorBubble,
                        ]}
                    >
                        {msg.sender === 'advisor' && (
                            <View style={styles.advisorAvatar}>
                                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.messageText, msg.sender === 'user' && styles.userMessageText]}>
                                {msg.text.replace(/###/g, '').replace(/\*\*/g, '')}
                            </Text>
                        </View>
                    </View>
                ))}
                {isLoading && (
                    <View style={styles.loadingBubble}>
                        <ActivityIndicator size="small" color="#1E88E5" />
                        <Text style={styles.loadingText}>MediPredict AI is composing response...</Text>
                    </View>
                )}
            </ScrollView>

            {/* Input Bar */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Ask MediPredict AI..."
                    placeholderTextColor="#94A3B8"
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={() => handleSend(inputText)}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                    onPress={() => handleSend(inputText)}
                    disabled={!inputText.trim() || isLoading}
                >
                    <Ionicons name="send" size={18} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FAFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: Platform.OS === 'ios' ? 50 : 36,
        paddingBottom: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
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
    chatScroll: {
        flex: 1,
    },
    chatContent: {
        paddingHorizontal: 18,
        paddingVertical: 18,
        gap: 14,
    },
    messageBubble: {
        maxWidth: '85%',
        padding: 14,
        borderRadius: 18,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#1E88E5',
        borderBottomRightRadius: 4,
    },
    advisorBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderBottomLeftRadius: 4,
        flexDirection: 'row',
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    advisorAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#06B6D4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageText: {
        fontSize: 14,
        color: '#263238',
        lineHeight: 20,
        fontWeight: '500',
    },
    userMessageText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    loadingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 16,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    loadingText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 18,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    textInput: {
        flex: 1,
        height: 48,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        paddingHorizontal: 16,
        fontSize: 14,
        fontWeight: '600',
        color: '#263238',
    },
    sendBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#1E88E5',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    sendBtnDisabled: {
        opacity: 0.5,
    },
});
