import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../context/ThemeContext';
import { useDrawer } from '../context/DrawerContext';
import { fetchMobileHospitals, fetchMobileDrivingRoute, MobileHospital, MobileRouteResponse } from '../services/hospitalMobileApi';

export interface Center {
  id: string;
  name: string;
  rating: number;
  distance: string;
  distKm: number;
  travelTime: string;
  specialization: string;
  address: string;
  contact: string;
  facilities: string[];
  lat: number;
  lon: number;
  category: 'PRIVATE' | 'GOVERNMENT';
  isEmergency: boolean;
  assignedDiseases: string[];
}

interface Country {
  id: string;
  name: string;
  flag: string;
}

interface State {
  id: string;
  name: string;
  countryId: string;
}

interface District {
  id: string;
  name: string;
  stateId: string;
  lat: number;
  lon: number;
}

const COUNTRIES: Country[] = [
  { id: 'IN', name: 'India', flag: '🇮🇳' },
  { id: 'US', name: 'United States', flag: '🇺🇸' },
  { id: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { id: 'AU', name: 'Australia', flag: '🇦🇺' },
];

const STATES: Record<string, State[]> = {
  IN: [
    { id: 'AP', name: 'Andhra Pradesh', countryId: 'IN' },
    { id: 'TS', name: 'Telangana', countryId: 'IN' },
    { id: 'TN', name: 'Tamil Nadu', countryId: 'IN' },
    { id: 'KA', name: 'Karnataka', countryId: 'IN' },
    { id: 'MH', name: 'Maharashtra', countryId: 'IN' },
    { id: 'DL', name: 'Delhi NCR', countryId: 'IN' },
  ],
};

const DISTRICTS: Record<string, District[]> = {
  AP: [
    { id: 'AP_TPT', name: 'Tirupati', stateId: 'AP', lat: 13.6288, lon: 79.4192 },
    { id: 'AP_VSKP', name: 'Visakhapatnam', stateId: 'AP', lat: 17.6868, lon: 83.2185 },
    { id: 'AP_NTR', name: 'Vijayawada', stateId: 'AP', lat: 16.5062, lon: 80.6480 },
    { id: 'AP_GNT', name: 'Guntur', stateId: 'AP', lat: 16.3067, lon: 80.4365 },
    { id: 'AP_CTR', name: 'Chittoor', stateId: 'AP', lat: 13.2172, lon: 79.1003 },
    { id: 'AP_KRN', name: 'Kurnool', stateId: 'AP', lat: 15.8281, lon: 78.0373 },
    { id: 'AP_KDP', name: 'Kadapa', stateId: 'AP', lat: 14.4673, lon: 78.8242 },
  ],
  TS: [
    { id: 'TS_HYD', name: 'Hyderabad', stateId: 'TS', lat: 17.3850, lon: 78.4867 },
    { id: 'TS_WGL', name: 'Warangal', stateId: 'TS', lat: 17.9689, lon: 79.5941 },
    { id: 'TS_KRM', name: 'Karimnagar', stateId: 'TS', lat: 18.4386, lon: 79.1288 },
  ],
  TN: [
    { id: 'TN_MAA', name: 'Chennai', stateId: 'TN', lat: 13.0827, lon: 80.2707 },
    { id: 'TN_CBE', name: 'Coimbatore', stateId: 'TN', lat: 11.0168, lon: 76.9558 },
    { id: 'TN_IXM', name: 'Madurai', stateId: 'TN', lat: 9.9252, lon: 78.1198 },
  ],
  KA: [
    { id: 'KA_BLR', name: 'Bengaluru', stateId: 'KA', lat: 12.9716, lon: 77.5946 },
    { id: 'KA_MYS', name: 'Mysuru', stateId: 'KA', lat: 12.2958, lon: 76.6394 },
  ],
  MH: [
    { id: 'MH_BOM', name: 'Mumbai', stateId: 'MH', lat: 19.0760, lon: 72.8777 },
    { id: 'MH_PUN', name: 'Pune', stateId: 'MH', lat: 18.5204, lon: 73.8567 },
  ],
  DL: [
    { id: 'DL_DEL', name: 'New Delhi', stateId: 'DL', lat: 28.6139, lon: 77.2090 },
  ],
};

function isCoordinateString(str: string): boolean {
  if (!str) return true;
  const s = str.trim();
  if (s.toLowerCase().includes('coordinate') || s.toLowerCase().includes('lat') || s.toLowerCase().includes('lon')) return true;
  return /^[\d.,\s\-\+\(\)]+$/.test(s);
}

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function ClinicCentersScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { openDrawer } = useDrawer();

  // Location Hierarchy Dropdowns
  const [selectedCountryId, setSelectedCountryId] = useState<string>('IN');
  const [selectedStateId, setSelectedStateId] = useState<string>('AP');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('AP_TPT');
  const [activeCityName, setActiveCityName] = useState<string>('Tirupati');
  const [centerLat, setCenterLat] = useState<number>(13.6288);
  const [centerLon, setCenterLon] = useState<number>(79.4192);

  // Filters & Options
  const [specialityFilter, setSpecialityFilter] = useState<string>('ALL');
  const [radiusKm, setRadiusKm] = useState<number>(20);
  const [sortBy, setSortBy] = useState<'nearest' | 'rating'>('nearest');

  // Modal Selectors
  const [pickerModalType, setPickerModalType] = useState<'COUNTRY' | 'STATE' | 'DISTRICT' | 'SPECIALITY' | 'RADIUS' | 'SORT' | null>(null);

  // Data & Loading States
  const [hospitals, setHospitals] = useState<Center[]>([]);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [activeRoute, setActiveRoute] = useState<MobileRouteResponse | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);

  useEffect(() => {
    detectUserLocation();
  }, []);

  const detectUserLocation = async (isUserTriggered: boolean = false) => {
    setIsDetecting(true);

    // 1. Web Platform Browser Geolocation Alignment (Mirrors web-frontend HospitalLocator.tsx)
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          console.log(`[Mobile GPS] Browser Geolocation success: Lat ${latitude}, Lon ${longitude}`);

          let cityName = 'Current Location';
          try {
            const geoRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const geoJson = await geoRes.json();
            if (geoJson) {
              const candidate = geoJson.city || geoJson.locality || geoJson.principalSubdivision;
              if (candidate) cityName = candidate;
            }
          } catch (e) {}

          setCenterLat(latitude);
          setCenterLon(longitude);
          setActiveCityName(cityName);

          // Auto-sync location hierarchy dropdowns
          for (const [stKey, dList] of Object.entries(DISTRICTS)) {
            const matched = dList.find((d) => d.name.toLowerCase().includes(cityName.toLowerCase()) || cityName.toLowerCase().includes(d.name.toLowerCase()));
            if (matched) {
              setSelectedStateId(stKey);
              setSelectedDistrictId(matched.id);
              break;
            }
          }

          fetchHospitals(latitude, longitude, radiusKm * 1000);
          setIsDetecting(false);

          if (isUserTriggered) {
            Alert.alert(
              'Location Detected 📍',
              `Detected your location:\n• City / Area: ${cityName}\n• Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            );
          }
        },
        async (err) => {
          console.warn('[Mobile GPS] Browser Geolocation error:', err);
          await fallbackNativeLocationDetection(isUserTriggered);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
      return;
    }

    // 2. Native Mobile Platform GPS Detection
    await fallbackNativeLocationDetection(isUserTriggered);
  };

  const fallbackNativeLocationDetection = async (isUserTriggered: boolean) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (status === 'granted') {
        try {
          const currentPos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (currentPos && currentPos.coords) {
            latitude = currentPos.coords.latitude;
            longitude = currentPos.coords.longitude;
          }
        } catch (err1) {
          try {
            const lastKnown = await Location.getLastKnownPositionAsync({});
            if (lastKnown && lastKnown.coords) {
              latitude = lastKnown.coords.latitude;
              longitude = lastKnown.coords.longitude;
            }
          } catch (err2) {}
        }
      }

      if (latitude !== null && longitude !== null) {
        let locName = 'Current Location';
        let isUSProxy = false;

        if (latitude > 25 && longitude < -50) {
          isUSProxy = true;
        }

        try {
          const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (geo && geo.length > 0) {
            const country = geo[0].country || '';
            const candidate = geo[0].city || geo[0].district || geo[0].subregion || geo[0].region;

            if (country === 'United States' || country === 'US' || candidate?.includes('Mountain View')) {
              isUSProxy = true;
            } else if (candidate && !isCoordinateString(candidate)) {
              locName = candidate;
            }
          }
        } catch (e) {}

        // If US emulator proxy detected, query secure HTTPS IP-based geolocation service!
        if (isUSProxy) {
          console.log('[GPS Detector] US proxy detected. Attempting secure HTTPS IP geolocation lookup...');
          
          let ipLocation: { city: string; lat: number; lon: number } | null = null;

          // Endpoint 1: https://ipapi.co/json/
          try {
            const res1 = await fetch('https://ipapi.co/json/');
            const json1 = await res1.json();
            if (json1 && json1.latitude && json1.longitude && json1.country_code !== 'US') {
              ipLocation = {
                city: json1.city || json1.region || 'Current Location',
                lat: json1.latitude,
                lon: json1.longitude,
              };
            }
          } catch (err1) {}

          // Endpoint 2: https://ipwho.is/
          if (!ipLocation) {
            try {
              const res2 = await fetch('https://ipwho.is/');
              const json2 = await res2.json();
              if (json2 && json2.success && json2.latitude && json2.longitude && json2.country_code !== 'US') {
                ipLocation = {
                  city: json2.city || json2.region || 'Current Location',
                  lat: json2.latitude,
                  lon: json2.longitude,
                };
              }
            } catch (err2) {}
          }

          // Endpoint 3: https://api.bigdatacloud.net/data/reverse-geocode-client
          if (!ipLocation) {
            try {
              const res3 = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client');
              const json3 = await res3.json();
              if (json3 && json3.latitude && json3.longitude && json3.countryCode !== 'US') {
                ipLocation = {
                  city: json3.city || json3.locality || json3.principalSubdivision || 'Current Location',
                  lat: json3.latitude,
                  lon: json3.longitude,
                };
              }
            } catch (err3) {}
          }

          if (ipLocation) {
            const { city: realCity, lat: realLat, lon: realLon } = ipLocation;
            console.log(`[IP Geolocation] Resolved location via HTTPS: ${realCity} (${realLat}, ${realLon})`);
            setCenterLat(realLat);
            setCenterLon(realLon);
            setActiveCityName(realCity);

            // Match city name to state/district hierarchy dropdowns if possible
            for (const [stKey, dList] of Object.entries(DISTRICTS)) {
              const matched = dList.find((d) => d.name.toLowerCase().includes(realCity.toLowerCase()) || realCity.toLowerCase().includes(d.name.toLowerCase()));
              if (matched) {
                setSelectedStateId(stKey);
                setSelectedDistrictId(matched.id);
                break;
              }
            }

            fetchHospitals(realLat, realLon, radiusKm * 1000);
            if (isUserTriggered) {
              Alert.alert(
                'Location Detected 📍',
                `Found position via network IP:\n• City: ${realCity}\n• Coordinates: ${realLat.toFixed(4)}, ${realLon.toFixed(4)}`
              );
            }
            return;
          }

          // Fallback to active district if IP lookup also fails
          const dists = DISTRICTS[selectedStateId] || [];
          const distObj = dists.find((d) => d.id === selectedDistrictId) || dists[0] || { lat: 13.6288, lon: 79.4192, name: 'Tirupati' };
          setCenterLat(distObj.lat);
          setCenterLon(distObj.lon);
          setActiveCityName(distObj.name);
          fetchHospitals(distObj.lat, distObj.lon, radiusKm * 1000);
          if (isUserTriggered) {
            Alert.alert('Location Notice 📱', `Searching verified hospitals near ${distObj.name}.`);
          }
          return;
        }

        // Successfully detected real GPS coordinates!
        if (locName !== 'Current Location') {
          setActiveCityName(locName);

          // Try matching city name to state/district hierarchy dropdowns
          for (const [stKey, dList] of Object.entries(DISTRICTS)) {
            const matched = dList.find((d) => d.name.toLowerCase().includes(locName.toLowerCase()) || locName.toLowerCase().includes(d.name.toLowerCase()));
            if (matched) {
              setSelectedStateId(stKey);
              setSelectedDistrictId(matched.id);
              break;
            }
          }
        }

        setCenterLat(latitude);
        setCenterLon(longitude);
        fetchHospitals(latitude, longitude, radiusKm * 1000);

        if (isUserTriggered) {
          Alert.alert(
            'GPS Location Detected 📍',
            `Detected your real-time position:\n• City / Area: ${locName}\n• Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          );
        }
        return;
      }

      // Default fallback if GPS is disabled or unavailable
      const dists = DISTRICTS[selectedStateId] || [];
      const distObj = dists.find((d) => d.id === selectedDistrictId) || dists[0] || { lat: 13.6288, lon: 79.4192, name: 'Tirupati' };
      setCenterLat(distObj.lat);
      setCenterLon(distObj.lon);
      setActiveCityName(distObj.name);
      fetchHospitals(distObj.lat, distObj.lon, radiusKm * 1000);
    } catch (e) {
      const dists = DISTRICTS[selectedStateId] || [];
      const distObj = dists.find((d) => d.id === selectedDistrictId) || dists[0] || { lat: 13.6288, lon: 79.4192, name: 'Tirupati' };
      setCenterLat(distObj.lat);
      setCenterLon(distObj.lon);
      setActiveCityName(distObj.name);
      fetchHospitals(distObj.lat, distObj.lon, radiusKm * 1000);
    } finally {
      setIsDetecting(false);
    }
  };

  const fetchHospitals = async (lat: number, lon: number, radiusM: number) => {
    setIsFetching(true);
    setActiveRoute(null);
    setSelectedHospitalId(null);

    try {
      const data = await fetchMobileHospitals(lat, lon, radiusM);
      if (data && data.length > 0) {
        const mapped: Center[] = data.map((h, idx) => {
          const dist = h.distanceKm || calculateHaversineDistance(lat, lon, h.lat, h.lon);
          const travelMins = Math.max(3, Math.round((dist / 30) * 60));
          return {
            id: h.id || `hosp_${idx}`,
            name: h.name,
            rating: h.rating || 4.5,
            distKm: dist,
            distance: `${dist.toFixed(1)} km`,
            travelTime: `${travelMins} mins`,
            specialization: h.specialization || 'General Medicine & Health Care',
            address: h.address || `${h.name}, ${activeCityName}`,
            contact: h.phone || '0877 6667671',
            facilities: h.facilities || ['24/7 Emergency Care', 'ICU', 'Pharmacy', 'Diagnostic Lab'],
            lat: h.lat,
            lon: h.lon,
            category: h.category === 'Government' ? 'GOVERNMENT' : 'PRIVATE',
            isEmergency: h.isEmergency ?? true,
            assignedDiseases: ['ALL'],
          };
        });
        setHospitals(mapped);
      } else {
        setHospitals([]);
      }
    } catch (err) {
      console.warn('Failed to fetch backend hospitals:', err);
      setHospitals([]);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSearchHospitals = () => {
    const dists = DISTRICTS[selectedStateId] || [];
    const distObj = dists.find((d) => d.id === selectedDistrictId);

    if (distObj) {
      setCenterLat(distObj.lat);
      setCenterLon(distObj.lon);
      setActiveCityName(distObj.name);
      fetchHospitals(distObj.lat, distObj.lon, radiusKm * 1000);
    } else {
      fetchHospitals(centerLat, centerLon, radiusKm * 1000);
    }
  };

  const handleViewRoute = async (center: Center) => {
    setSelectedHospitalId(center.id);
    const route = await fetchMobileDrivingRoute(centerLat, centerLon, center.lat, center.lon, center.id);
    if (route) {
      setActiveRoute(route);
      Alert.alert(
        '🚗 Driving Route Active',
        `Distance: ${route.distanceFormatted} | Estimated ETA: ${route.durationFormatted}\nDestination: ${center.name}`,
        [{ text: 'Start Navigation', onPress: () => handleNavigateGoogleMaps(center) }, { text: 'OK' }]
      );
    } else {
      handleNavigateGoogleMaps(center);
    }
  };

  const handleNavigateGoogleMaps = (center: Center) => {
    const encodedName = encodeURIComponent(center.name);
    const url = Platform.select({
      ios: `maps:0,0?q=${encodedName}@${center.lat},${center.lon}`,
      android: `geo:${center.lat},${center.lon}?q=${center.lat},${center.lon}(${encodedName})`,
      web: `https://www.google.com/maps/search/?api=1&query=${encodedName}+${center.lat},${center.lon}`,
    });
    if (url) Linking.openURL(url);
  };

  // Filtered & Sorted Centers List
  const filteredCenters = useMemo(() => {
    let list = [...hospitals];

    if (specialityFilter !== 'ALL') {
      if (specialityFilter === 'EMERGENCY') {
        list = list.filter((c) => c.isEmergency);
      } else if (specialityFilter === 'GOVERNMENT') {
        list = list.filter((c) => c.category === 'GOVERNMENT');
      } else {
        const q = specialityFilter.toLowerCase();
        list = list.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.specialization.toLowerCase().includes(q) ||
            c.address.toLowerCase().includes(q)
        );
      }
    }

    if (sortBy === 'nearest') {
      list.sort((a, b) => a.distKm - b.distKm);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list.filter((c) => c.distKm <= radiusKm);
  }, [hospitals, specialityFilter, radiusKm, sortBy]);

  const currentCountryObj = COUNTRIES.find((c) => c.id === selectedCountryId) || COUNTRIES[0];
  const currentStatesList = STATES[selectedCountryId] || [];
  const currentStateObj = currentStatesList.find((s) => s.id === selectedStateId) || currentStatesList[0] || { name: 'Select State' };
  const currentDistrictsList = DISTRICTS[selectedStateId] || [];
  const currentDistrictObj = currentDistrictsList.find((d) => d.id === selectedDistrictId) || currentDistrictsList[0] || { name: 'Select District' };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F9FF' }}>
      {/* Top Header Bar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.menuIconBtn} onPress={openDrawer} activeOpacity={0.8}>
          <Ionicons name="menu-outline" size={24} color="#1E88E5" />
        </TouchableOpacity>
        <Text style={styles.topAppTitle}>Healthcare Centers</Text>
        <TouchableOpacity style={styles.locateNavBtn} onPress={() => detectUserLocation(true)} activeOpacity={0.8}>
          <Ionicons name="locate" size={22} color="#1E88E5" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* 1. Location Hierarchy Card (Matching Web App Screenshot 1-to-1) */}
        <View style={styles.hierarchyCard}>
          <View style={styles.hierarchyCardHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 20 }}>📍</Text>
                <Text style={styles.hierarchyCardTitle}>Select Healthcare Location Hierarchy</Text>
              </View>
              <Text style={styles.hierarchyCardSub}>Choose Country, State, and District or use GPS to locate nearest hospitals.</Text>
            </View>

            <TouchableOpacity style={styles.gpsActionBtn} onPress={() => detectUserLocation(true)} activeOpacity={0.8}>
              <Ionicons name="navigate-circle-outline" size={16} color="#1E88E5" />
              <Text style={styles.gpsActionBtnText}>Use Current Location</Text>
            </TouchableOpacity>
          </View>

          {/* 3 Selectors (Country -> State -> District) */}
          <View style={styles.dropdownsGrid}>
            {/* Country Selector */}
            <View style={styles.dropdownBox}>
              <Text style={styles.dropdownLabel}>COUNTRY 🌐</Text>
              <TouchableOpacity style={styles.dropdownSelect} onPress={() => setPickerModalType('COUNTRY')}>
                <Text style={styles.dropdownSelectText}>
                  {currentCountryObj.flag} {currentCountryObj.name}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* State Selector */}
            <View style={styles.dropdownBox}>
              <Text style={styles.dropdownLabel}>STATE / PROVINCE 🗺️</Text>
              <TouchableOpacity style={styles.dropdownSelect} onPress={() => setPickerModalType('STATE')}>
                <Text style={styles.dropdownSelectText}>{currentStateObj.name}</Text>
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* District Selector */}
            <View style={styles.dropdownBox}>
              <Text style={styles.dropdownLabel}>DISTRICT / CITY 📍</Text>
              <TouchableOpacity style={styles.dropdownSelect} onPress={() => setPickerModalType('DISTRICT')}>
                <Text style={styles.dropdownSelectText}>{currentDistrictObj.name}</Text>
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Button */}
          <TouchableOpacity style={styles.searchHospitalsBtn} onPress={handleSearchHospitals} activeOpacity={0.85}>
            <Ionicons name="search" size={18} color="#FFFFFF" />
            <Text style={styles.searchHospitalsBtnText}>Search Hospitals ➔</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Filtering Controls Card (Matching Web App) */}
        <View style={styles.filterCard}>
          <Text style={styles.dropdownLabel}>FILTER HOSPITALS BY SPECIALITY / CATEGORY 🩺</Text>
          <TouchableOpacity style={styles.dropdownSelect} onPress={() => setPickerModalType('SPECIALITY')}>
            <Text style={styles.dropdownSelectText}>
              {specialityFilter === 'ALL'
                ? '🏥 All Hospitals'
                : specialityFilter === 'DIABETES'
                ? '🩺 Diabetes & Endocrine'
                : specialityFilter === 'CARDIOLOGY'
                ? '❤️ Cardiology & Heart'
                : specialityFilter === 'HEPATOLOGY'
                ? '🥗 Hepatology & GI'
                : specialityFilter === 'NEPHROLOGY'
                ? '🩺 Nephrology & Dialysis'
                : specialityFilter === 'EMERGENCY'
                ? '🚨 24/7 Emergency Care'
                : specialityFilter === 'GOVERNMENT'
                ? '🏛️ Government Hospitals'
                : specialityFilter}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </TouchableOpacity>

          <View style={styles.filterDualRow}>
            <View style={[styles.dropdownBox, { flex: 1 }]}>
              <Text style={styles.dropdownLabel}>SEARCH DISTANCE 🎯</Text>
              <TouchableOpacity style={styles.dropdownSelect} onPress={() => setPickerModalType('RADIUS')}>
                <Text style={styles.dropdownSelectText}>📍 Within {radiusKm} km</Text>
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={[styles.dropdownBox, { flex: 1 }]}>
              <Text style={styles.dropdownLabel}>SORT BY 📊</Text>
              <TouchableOpacity style={styles.dropdownSelect} onPress={() => setPickerModalType('SORT')}>
                <Text style={styles.dropdownSelectText}>
                  {sortBy === 'nearest' ? '⚡ Nearest First' : '⭐ Highest Rated'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 3. Section Results Title Header */}
        <View style={styles.resultsHeaderRow}>
          <Text style={styles.resultsTitleText}>
            🏥 Nearby Hospitals around {activeCityName} ({filteredCenters.length})
          </Text>
          {isFetching && <ActivityIndicator size="small" color="#1E88E5" />}
        </View>

        {/* 4. Hospitals Cards List */}
        <View style={styles.hospitalsList}>
          {isFetching ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#1E88E5" />
              <Text style={styles.loadingText}>Searching nearby medical centers around {activeCityName}...</Text>
            </View>
          ) : filteredCenters.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🏥</Text>
              <Text style={styles.emptyTitle}>No Hospitals Found</Text>
              <Text style={styles.emptySub}>Try increasing search radius or changing location hierarchy filters.</Text>
            </View>
          ) : (
            filteredCenters.map((center) => (
              <View key={center.id} style={styles.hospitalCard}>
                {/* Header Badges & Distance Chip */}
                <View style={styles.cardHeaderBadgesRow}>
                  <View style={styles.badgesGroup}>
                    <View style={center.category === 'GOVERNMENT' ? styles.badgeGov : styles.badgePrivate}>
                      <Text style={center.category === 'GOVERNMENT' ? styles.badgeGovText : styles.badgePrivateText}>
                        {center.category}
                      </Text>
                    </View>
                    <View style={styles.badgeGeneral}>
                      <Text style={styles.badgeGeneralText}>🩺 {center.specialization}</Text>
                    </View>
                    {center.isEmergency && (
                      <View style={styles.badgeEmergency}>
                        <Text style={styles.badgeEmergencyText}>🚨 24/7 Emergency Care</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.distanceChip}>
                    <Text style={styles.distanceChipText}>📍 {center.distance}</Text>
                  </View>
                </View>

                {/* Hospital Name & Address */}
                <Text style={styles.hospitalNameText}>{center.name}</Text>
                <Text style={styles.hospitalAddressText}>📍 {center.address}</Text>

                {/* Contact Number */}
                <View style={styles.contactRow}>
                  <Text style={styles.contactText}>📞 Contact: <Text style={{ fontWeight: '800', color: '#1E293B' }}>{center.contact}</Text></Text>
                </View>

                {/* Action Buttons Row */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtnRoute}
                    onPress={() => handleViewRoute(center)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="car-outline" size={15} color="#1E88E5" />
                    <Text style={styles.actionBtnRouteText}>View Driving Route</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnMap}
                    onPress={() => handleNavigateGoogleMaps(center)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="map-outline" size={15} color="#0EA5E9" />
                    <Text style={styles.actionBtnMapText}>View on Map</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnNav}
                    onPress={() => handleNavigateGoogleMaps(center)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate" size={15} color="#FFFFFF" />
                    <Text style={styles.actionBtnNavText}>Navigate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Selector Pickers Modal */}
      <Modal visible={pickerModalType !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {pickerModalType === 'COUNTRY'
                  ? 'Select Country'
                  : pickerModalType === 'STATE'
                  ? 'Select State / Province'
                  : pickerModalType === 'DISTRICT'
                  ? 'Select District / City'
                  : pickerModalType === 'SPECIALITY'
                  ? 'Filter by Speciality'
                  : pickerModalType === 'RADIUS'
                  ? 'Select Search Distance'
                  : 'Select Sort Order'}
              </Text>
              <TouchableOpacity onPress={() => setPickerModalType(null)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {pickerModalType === 'COUNTRY' &&
                COUNTRIES.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.pickerItem}
                    onPress={() => {
                      setSelectedCountryId(c.id);
                      setSelectedStateId(STATES[c.id]?.[0]?.id || '');
                      setSelectedDistrictId(DISTRICTS[STATES[c.id]?.[0]?.id]?.[0]?.id || '');
                      setPickerModalType(null);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{c.flag} {c.name}</Text>
                    {selectedCountryId === c.id && <Ionicons name="checkmark" size={18} color="#1E88E5" />}
                  </TouchableOpacity>
                ))}

              {pickerModalType === 'STATE' &&
                currentStatesList.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.pickerItem}
                    onPress={() => {
                      setSelectedStateId(s.id);
                      setSelectedDistrictId(DISTRICTS[s.id]?.[0]?.id || '');
                      setPickerModalType(null);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{s.name}</Text>
                    {selectedStateId === s.id && <Ionicons name="checkmark" size={18} color="#1E88E5" />}
                  </TouchableOpacity>
                ))}

              {pickerModalType === 'DISTRICT' &&
                currentDistrictsList.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={styles.pickerItem}
                    onPress={() => {
                      setSelectedDistrictId(d.id);
                      setPickerModalType(null);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{d.name}</Text>
                    {selectedDistrictId === d.id && <Ionicons name="checkmark" size={18} color="#1E88E5" />}
                  </TouchableOpacity>
                ))}

              {pickerModalType === 'SPECIALITY' &&
                [
                  { key: 'ALL', label: '🏥 All Hospitals' },
                  { key: 'DIABETES', label: '🩺 Diabetes & Endocrine' },
                  { key: 'CARDIOLOGY', label: '❤️ Cardiology & Heart' },
                  { key: 'HEPATOLOGY', label: '🥗 Hepatology & GI' },
                  { key: 'NEPHROLOGY', label: '🩺 Nephrology & Dialysis' },
                  { key: 'EMERGENCY', label: '🚨 24/7 Emergency Care' },
                  { key: 'GOVERNMENT', label: '🏛️ Government Hospitals' },
                ].map((spec) => (
                  <TouchableOpacity
                    key={spec.key}
                    style={styles.pickerItem}
                    onPress={() => {
                      setSpecialityFilter(spec.key);
                      setPickerModalType(null);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{spec.label}</Text>
                    {specialityFilter === spec.key && <Ionicons name="checkmark" size={18} color="#1E88E5" />}
                  </TouchableOpacity>
                ))}

              {pickerModalType === 'RADIUS' &&
                [2, 5, 10, 20, 50].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={styles.pickerItem}
                    onPress={() => {
                      setRadiusKm(r);
                      setPickerModalType(null);
                    }}
                  >
                    <Text style={styles.pickerItemText}>📍 Within {r} km</Text>
                    {radiusKm === r && <Ionicons name="checkmark" size={18} color="#1E88E5" />}
                  </TouchableOpacity>
                ))}

              {pickerModalType === 'SORT' &&
                [
                  { key: 'nearest', label: '⚡ Nearest First' },
                  { key: 'rating', label: '⭐ Highest Rated' },
                ].map((sortItem) => (
                  <TouchableOpacity
                    key={sortItem.key}
                    style={styles.pickerItem}
                    onPress={() => {
                      setSortBy(sortItem.key as any);
                      setPickerModalType(null);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{sortItem.label}</Text>
                    {sortBy === sortItem.key && <Ionicons name="checkmark" size={18} color="#1E88E5" />}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  menuIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topAppTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E293B',
  },
  locateNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  hierarchyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    gap: 14,
  },
  hierarchyCardHeaderRow: {
    gap: 10,
  },
  hierarchyCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  hierarchyCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  gpsActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 136, 229, 0.08)',
    borderWidth: 1,
    borderColor: '#90CAF9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  gpsActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E88E5',
  },
  dropdownsGrid: {
    gap: 10,
  },
  dropdownBox: {
    gap: 4,
  },
  dropdownLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  dropdownSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownSelectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchHospitalsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  searchHospitalsBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  filterDualRow: {
    flexDirection: 'row',
    gap: 10,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  resultsTitleText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1E293B',
  },
  hospitalsList: {
    gap: 14,
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  hospitalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  badgesGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  badgePrivate: {
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePrivateText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E88E5',
  },
  badgeGov: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeGovText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8B5CF6',
  },
  badgeGeneral: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeGeneralText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  badgeEmergency: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeEmergencyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
  },
  distanceChip: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  distanceChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0EA5E9',
  },
  hospitalNameText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  hospitalAddressText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    fontWeight: '500',
  },
  contactRow: {
    paddingTop: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#64748B',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtnRoute: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(30, 136, 229, 0.08)',
    borderWidth: 1,
    borderColor: '#90CAF9',
    borderRadius: 10,
    paddingVertical: 8,
  },
  actionBtnRouteText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E88E5',
  },
  actionBtnMap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    borderWidth: 1,
    borderColor: '#7DD3FC',
    borderRadius: 10,
    paddingVertical: 8,
  },
  actionBtnMapText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0EA5E9',
  },
  actionBtnNav: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#1E88E5',
    borderRadius: 10,
    paddingVertical: 8,
  },
  actionBtnNavText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
});
