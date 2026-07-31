import React, { useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const navigationRef = createNavigationContainerRef<any>();

export default function App() {
    const [currentRouteName, setCurrentRouteName] = useState<string | undefined>();

    return (
        <ThemeProvider>
            <AuthProvider>
                <SafeAreaProvider>
                    <NavigationContainer
                        ref={navigationRef}
                        onStateChange={() => {
                            const currentRoute = navigationRef.getCurrentRoute();
                            setCurrentRouteName(currentRoute?.name);
                        }}
                    >
                        <StatusBar style="auto" />
                        <AppNavigator currentRouteName={currentRouteName} />
                    </NavigationContainer>
                </SafeAreaProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
