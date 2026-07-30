export const lightColors = {
    primary: '#1E88E5',
    primaryDark: '#1565C0',
    primaryLight: '#E3F2FD',
    secondary: '#2EBD85',
    secondaryLight: '#E8F8F2',
    accent: '#8B5CF6',
    danger: '#EF5350',
    dangerLight: '#FFEBEE',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    success: '#10B981',
    successLight: '#D1FAE5',

    background: '#F5FAFF',
    surface: '#FFFFFF',
    surfaceSecondary: '#F8FAFC',
    border: '#E2E8F0',

    textPrimary: '#263238',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    textOnPrimary: '#FFFFFF',
    textLink: '#1E88E5',

    gradientStart: '#2563EB',
    gradientEnd: '#1E88E5',
};

export const darkColors = {
    primary: '#1E88E5',
    primaryDark: '#1565C0',
    primaryLight: '#E3F2FD',
    secondary: '#2EBD85',
    secondaryLight: 'rgba(46, 189, 133, 0.15)',
    accent: '#8B5CF6',
    danger: '#EF5350',
    dangerLight: 'rgba(239, 83, 80, 0.15)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.15)',
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.15)',

    background: '#F5FAFF',
    surface: '#FFFFFF',
    surfaceSecondary: '#F8FAFC',
    border: '#E2E8F0',

    textPrimary: '#263238',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    textOnPrimary: '#FFFFFF',
    textLink: '#1E88E5',

    gradientStart: '#2563EB',
    gradientEnd: '#1E88E5',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export const borderRadius = {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
    full: 999,
};

export const typography = {
    h1: { fontSize: 28, fontWeight: '800' as const, color: '#263238' },
    h2: { fontSize: 24, fontWeight: '800' as const, color: '#263238' },
    h3: { fontSize: 20, fontWeight: '700' as const, color: '#263238' },
    h4: { fontSize: 18, fontWeight: '700' as const, color: '#263238' },
    body: { fontSize: 16, fontWeight: '400' as const, color: '#263238' },
    bodySmall: { fontSize: 14, fontWeight: '400' as const, color: '#64748B' },
    caption: { fontSize: 12, fontWeight: '400' as const, color: '#94A3B8' },
    button: { fontSize: 16, fontWeight: '800' as const, color: '#FFFFFF' },
    label: { fontSize: 12, fontWeight: '700' as const, color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase' as const },
};

export const shadows = {
    sm: {
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    lg: {
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 20,
        elevation: 8,
    },
};
