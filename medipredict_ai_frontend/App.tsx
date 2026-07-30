import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <SafeAreaProvider>
                    <NavigationContainer>
                        <StatusBar style="auto" />
                        <AppNavigator />
                    </NavigationContainer>
                </SafeAreaProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
