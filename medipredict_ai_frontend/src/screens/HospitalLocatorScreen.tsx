import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import {
  fetchMobileHospitals,
  fetchMobileDrivingRoute,
  MobileHospital,
  MobileRouteResponse,
} from '../services/hospitalMobileApi';

export default function HospitalLocatorScreen() {
  const [centerLat, setCenterLat] = useState<number>(13.6288);
  const [centerLon, setCenterLon] = useState<number>(79.4192);
  const [cityName, setCityName] = useState<string>('Detecting Location...');

  const [hospitals, setHospitals] = useState<MobileHospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<MobileRouteResponse | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const categories = [
    { id: 'ALL', label: '🏥 All Hospitals' },
    { id: 'Cardiology', label: '❤️ Cardiology' },
    { id: 'Neurology', label: '🧠 Neurology' },
    { id: 'Oncology', label: '🎗️ Oncology' },
    { id: 'Pediatrics', label: '👶 Pediatrics' },
    { id: 'Orthopedics', label: '🦴 Orthopedics' },
    { id: 'Nephrology', label: '🩺 Nephrology' },
    { id: 'Government', label: '🏛️ Government' },
    { id: 'EMERGENCY', label: '🚨 24/7 Emergency' },
  ];

  const loadHospitals = async (lat: number, lon: number, name: string) => {
    setLoading(true);
    setErrorMsg(null);
    setSelectedHospitalId(null);
    setActiveRoute(null);

    const data = await fetchMobileHospitals(lat, lon, 25000);
    if (data && data.length > 0) {
      setHospitals(data);
    } else {
      setErrorMsg(`No hospitals found near ${name}.`);
    }
    setLoading(false);
  };

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (status === 'granted') {
        try {
          const lastKnown = await Location.getLastKnownPositionAsync({});
          if (lastKnown && lastKnown.coords) {
            latitude = lastKnown.coords.latitude;
            longitude = lastKnown.coords.longitude;
          }
        } catch (err) {}

        if (latitude === null || longitude === null) {
          try {
            const currentPos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            if (currentPos && currentPos.coords) {
              latitude = currentPos.coords.latitude;
              longitude = currentPos.coords.longitude;
            }
          } catch (err) {}
        }
      }

      if (latitude !== null && longitude !== null) {
        let locName = "Current Location";
        try {
          const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (geo && geo.length > 0) {
            const candidate = geo[0].city || geo[0].district || geo[0].subregion || geo[0].region;
            if (candidate) locName = candidate;
          }
        } catch (e) {}

        setCenterLat(latitude);
        setCenterLon(longitude);
        setCityName(locName);
        loadHospitals(latitude, longitude, locName);
        return;
      }

      // IP Fallback
      const res = await fetch("http://ip-api.com/json");
      const json = await res.json();
      if (json && json.status === "success" && json.lat && json.lon) {
        const city = json.city || json.regionName || "Current Location";
        setCenterLat(json.lat);
        setCenterLon(json.lon);
        setCityName(city);
        loadHospitals(json.lat, json.lon, city);
        return;
      }
    } catch (e) {}

    loadHospitals(centerLat, centerLon, cityName);
  };

  const handleSelectHospital = async (h: MobileHospital) => {
    setSelectedHospitalId(h.id);
    const route = await fetchMobileDrivingRoute(centerLat, centerLon, h.lat, h.lon, h.id);
    if (route) {
      setActiveRoute(route);
    }
  };

  const openNavigation = (lat: number, lon: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    Linking.openURL(url);
  };

  const filteredHospitals = hospitals.filter((h) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'EMERGENCY') return h.isEmergency;
    if (selectedCategory === 'Government') return h.category === 'Government';
    const q = selectedCategory.toLowerCase();
    return (
      h.name.toLowerCase().includes(q) ||
      (h.specialization && h.specialization.toLowerCase().includes(q))
    );
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍 Hospital Locator & Driving Routes</Text>
        <Text style={styles.headerSubtitle}>Location: {cityName}</Text>
      </View>

      {/* Disease Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {categories.map((c) => {
          const active = selectedCategory === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setSelectedCategory(c.id)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Active Driving Route Banner */}
      {activeRoute && (
        <View style={styles.routeBanner}>
          <View>
            <Text style={styles.routeTitle}>🚗 Driving Route Active</Text>
            <Text style={styles.routeDetails}>
              Distance: {activeRoute.distanceFormatted} | ETA: {activeRoute.durationFormatted}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => Linking.openURL(activeRoute.navigationUrl)}
          >
            <Text style={styles.navBtnText}>Navigate ➔</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Hospital Cards List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loaderText}>Searching hospitals near {cityName}...</Text>
        </View>
      ) : (
        <ScrollView style={styles.cardList}>
          {filteredHospitals.map((h) => {
            const isSelected = selectedHospitalId === h.id;
            return (
              <TouchableOpacity
                key={h.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => handleSelectHospital(h)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.badgeRow}>
                    <Text style={styles.badgeCategory}>{h.category}</Text>
                    {h.specialization && (
                      <Text style={styles.badgeSpec}>🩺 {h.specialization}</Text>
                    )}
                  </View>
                  <Text style={styles.distanceText}>📍 {h.distanceFormatted}</Text>
                </View>

                <Text style={styles.hospitalName}>{h.name}</Text>
                <Text style={styles.addressText}>📍 {h.address}</Text>
                <Text style={styles.ratingText}>⭐ {h.rating} / 5.0 | 📞 {h.phone}</Text>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionBtnSecondary}
                    onPress={() => handleSelectHospital(h)}
                  >
                    <Text style={styles.actionBtnSecondaryText}>🚗 View Route</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnPrimary}
                    onPress={() => openNavigation(h.lat, h.lon)}
                  >
                    <Text style={styles.actionBtnPrimaryText}>↗️ Navigate</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  filterScroll: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    maxHeight: 56,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1E88E5',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  routeBanner: {
    margin: 12,
    padding: 14,
    backgroundColor: '#1E88E5',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  routeDetails: {
    color: '#E3F2FD',
    fontSize: 12,
    marginTop: 2,
  },
  navBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  navBtnText: {
    color: '#1E88E5',
    fontWeight: '800',
    fontSize: 12,
  },
  loaderContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  cardList: {
    padding: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#1E88E5',
    borderWidth: 2,
    backgroundColor: '#F0F7FF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badgeCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E88E5',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeSpec: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E88E5',
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 8,
  },
  addressText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '700',
    marginTop: 6,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtnSecondary: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnSecondaryText: {
    color: '#1E88E5',
    fontSize: 12,
    fontWeight: '800',
  },
  actionBtnPrimary: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
