import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, spacing, borderRadius, typography, shadows } from '../theme';

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
    colors: typeof lightColors;
    spacing: typeof spacing;
    borderRadius: typeof borderRadius;
    typography: typeof typography;
    shadows: typeof shadows;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem('isDarkMode').then(val => {
            if (val === 'false') setIsDark(false);
            else setIsDark(true);
        });
    }, []);

    const toggleTheme = () => {
        setIsDark(!isDark);
        AsyncStorage.setItem('isDarkMode', (!isDark).toString());
    };

    const colors = isDark ? darkColors : lightColors;

    const dynamicTypography = {
        ...typography,
        h1: { ...typography.h1, color: colors.textPrimary },
        h2: { ...typography.h2, color: colors.textPrimary },
        h3: { ...typography.h3, color: colors.textPrimary },
        h4: { ...typography.h4, color: colors.textPrimary },
        body: { ...typography.body, color: colors.textPrimary },
        bodySmall: { ...typography.bodySmall, color: colors.textSecondary },
        caption: { ...typography.caption, color: colors.textTertiary },
        label: { ...typography.label, color: colors.textSecondary },
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, colors, spacing, borderRadius, typography: dynamicTypography, shadows }}>
            {children}
        </ThemeContext.Provider>
    );
};
