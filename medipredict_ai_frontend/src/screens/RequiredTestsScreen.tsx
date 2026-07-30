import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'RequiredTests'>;

export default function RequiredTestsScreen({ route, navigation }: Props) {
    React.useEffect(() => {
        if (route.params?.diseaseType) {
            navigation.replace('HealthAnalysis', { diseaseType: route.params.diseaseType });
        } else {
            navigation.replace('DiseaseSelection');
        }
    }, [navigation, route.params?.diseaseType]);

    return null;
}
