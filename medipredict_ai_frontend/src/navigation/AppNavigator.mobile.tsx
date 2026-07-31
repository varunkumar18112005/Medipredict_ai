import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types';
import { ActivityIndicator, View } from 'react-native';

// Screens
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
import ClinicCentersScreen from '../screens/ClinicCentersScreen';
import SchedulerScreen from '../screens/SchedulerScreen';
import AdvisorScreen from '../screens/AdvisorScreen';
import DietScreen from '../screens/DietScreen';
import ExerciseScreen from '../screens/ExerciseScreen';

import { DrawerProvider } from '../context/DrawerContext';
import SideNavbar from '../components/SideNavbar';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator({ currentRouteName }: { currentRouteName?: string }) {
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
    <DrawerProvider>
      <View style={{ flex: 1 }}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="Landing" component={LandingScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Diet" component={DietScreen} />
              <Stack.Screen name="Exercise" component={ExerciseScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen name="Reports" component={ReportsScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="DiseaseSelection" component={DiseaseSelectionScreen} />
              <Stack.Screen name="RequiredTests" component={RequiredTestsScreen} />
              <Stack.Screen name="HealthAnalysis" component={HealthAnalysisScreen} />
              <Stack.Screen name="Analyzing" component={AnalyzingScreen} />
              <Stack.Screen name="Result" component={ResultScreen} />
              <Stack.Screen name="Suggestions" component={SuggestionsScreen} />
              <Stack.Screen name="ClinicCenters" component={ClinicCentersScreen} />
              <Stack.Screen name="Scheduler" component={SchedulerScreen} />
              <Stack.Screen name="Advisor" component={AdvisorScreen} />
            </>
          )}
        </Stack.Navigator>

        {isAuthenticated && <DrawerNavWrapper currentRouteName={currentRouteName} />}
      </View>
    </DrawerProvider>
  );
}

import { useNavigation } from '@react-navigation/native';

function DrawerNavWrapper({ currentRouteName }: { currentRouteName?: string }) {
  const navigation = useNavigation();
  return <SideNavbar navigation={navigation} currentRouteName={currentRouteName} />;
}
