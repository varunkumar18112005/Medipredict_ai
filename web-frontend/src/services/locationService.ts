import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8085';

export interface Country {
  id: string;
  name: string;
  flag: string;
}

export interface State {
  id: string;
  name: string;
  countryId: string;
}

export interface District {
  id: string;
  name: string;
  stateId: string;
  latitude: number;
  longitude: number;
}

// Baseline fallbacks if backend connection is initializing
const BASELINE_COUNTRIES: Country[] = [
  { id: 'IN', name: 'India', flag: '🇮🇳' },
  { id: 'US', name: 'United States', flag: '🇺🇸' },
  { id: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { id: 'AU', name: 'Australia', flag: '🇦🇺' },
  { id: 'CA', name: 'Canada', flag: '🇨🇦' },
  { id: 'JP', name: 'Japan', flag: '🇯🇵' },
  { id: 'DE', name: 'Germany', flag: '🇩🇪' },
  { id: 'FR', name: 'France', flag: '🇫🇷' },
];

const BASELINE_STATES: Record<string, State[]> = {
  IN: [
    { id: 'AP', name: 'Andhra Pradesh', countryId: 'IN' },
    { id: 'TS', name: 'Telangana', countryId: 'IN' },
    { id: 'TN', name: 'Tamil Nadu', countryId: 'IN' },
    { id: 'KA', name: 'Karnataka', countryId: 'IN' },
    { id: 'KL', name: 'Kerala', countryId: 'IN' },
    { id: 'MH', name: 'Maharashtra', countryId: 'IN' },
    { id: 'GJ', name: 'Gujarat', countryId: 'IN' },
    { id: 'PB', name: 'Punjab', countryId: 'IN' },
    { id: 'DL', name: 'Delhi NCR', countryId: 'IN' },
    { id: 'WB', name: 'West Bengal', countryId: 'IN' },
  ],
  US: [
    { id: 'CA_US', name: 'California', countryId: 'US' },
    { id: 'NY_US', name: 'New York', countryId: 'US' },
    { id: 'TX_US', name: 'Texas', countryId: 'US' },
  ],
};

const BASELINE_DISTRICTS: Record<string, District[]> = {
  AP: [
    { id: 'AP_TPT', name: 'Tirupati', stateId: 'AP', latitude: 13.6288, longitude: 79.4192 },
    { id: 'AP_VSKP', name: 'Visakhapatnam', stateId: 'AP', latitude: 17.6868, longitude: 83.2185 },
    { id: 'AP_NTR', name: 'NTR / Vijayawada', stateId: 'AP', latitude: 16.5062, longitude: 80.6480 },
    { id: 'AP_GNT', name: 'Guntur', stateId: 'AP', latitude: 16.3067, longitude: 80.4365 },
    { id: 'AP_ATP', name: 'Anantapur', stateId: 'AP', latitude: 14.6819, longitude: 77.6006 },
    { id: 'AP_CTR', name: 'Chittoor', stateId: 'AP', latitude: 13.2172, longitude: 79.1003 },
    { id: 'AP_EG', name: 'East Godavari', stateId: 'AP', latitude: 16.9891, longitude: 82.2475 },
    { id: 'AP_KDP', name: 'Kadapa / YSR Kadapa', stateId: 'AP', latitude: 14.4673, longitude: 78.8242 },
    { id: 'AP_KKD', name: 'Kakinada', stateId: 'AP', latitude: 16.9891, longitude: 82.2475 },
    { id: 'AP_KRN', name: 'Kurnool', stateId: 'AP', latitude: 15.8281, longitude: 78.0373 },
    { id: 'AP_PLN', name: 'Palnadu', stateId: 'AP', latitude: 16.2345, longitude: 79.9876 },
    { id: 'AP_PVM', name: 'Parvathipuram Manyam', stateId: 'AP', latitude: 18.7833, longitude: 83.4333 },
    { id: 'AP_PRK', name: 'Prakasam', stateId: 'AP', latitude: 15.5057, longitude: 80.0499 },
    { id: 'AP_SKL', name: 'Srikakulam', stateId: 'AP', latitude: 18.2949, longitude: 83.8938 },
    { id: 'AP_SSS', name: 'Sri Sathya Sai', stateId: 'AP', latitude: 14.1663, longitude: 77.8114 },
    { id: 'AP_VZM', name: 'Vizianagaram', stateId: 'AP', latitude: 18.1066, longitude: 83.3956 },
    { id: 'AP_WG', name: 'West Godavari', stateId: 'AP', latitude: 16.7107, longitude: 81.0952 },
  ],
  TS: [
    { id: 'TS_HYD', name: 'Hyderabad', stateId: 'TS', latitude: 17.3850, longitude: 78.4867 },
    { id: 'TS_WGL', name: 'Warangal', stateId: 'TS', latitude: 17.9689, longitude: 79.5941 },
    { id: 'TS_KRM', name: 'Karimnagar', stateId: 'TS', latitude: 18.4386, longitude: 79.1288 },
    { id: 'TS_NZB', name: 'Nizamabad', stateId: 'TS', latitude: 18.6725, longitude: 78.0941 },
    { id: 'TS_KMM', name: 'Khammam', stateId: 'TS', latitude: 17.2473, longitude: 80.1514 },
    { id: 'TS_NLG', name: 'Nalgonda', stateId: 'TS', latitude: 17.0577, longitude: 79.2684 },
    { id: 'TS_MBN', name: 'Mahabubnagar', stateId: 'TS', latitude: 16.7488, longitude: 78.0035 },
    { id: 'TS_SRD', name: 'Sangareddy', stateId: 'TS', latitude: 17.6191, longitude: 78.0827 },
    { id: 'TS_ADB', name: 'Adilabad', stateId: 'TS', latitude: 19.6641, longitude: 78.5320 },
  ],
  TN: [
    { id: 'TN_MAA', name: 'Chennai', stateId: 'TN', latitude: 13.0827, longitude: 80.2707 },
    { id: 'TN_CBE', name: 'Coimbatore', stateId: 'TN', latitude: 11.0168, longitude: 76.9558 },
    { id: 'TN_IXM', name: 'Madurai', stateId: 'TN', latitude: 9.9252, longitude: 78.1198 },
    { id: 'TN_KCH', name: 'Kanchipuram / Saveetha', stateId: 'TN', latitude: 13.0284, longitude: 80.0152 },
  ],
  KA: [
    { id: 'KA_BLR', name: 'Bengaluru', stateId: 'KA', latitude: 12.9716, longitude: 77.5946 },
    { id: 'KA_MYS', name: 'Mysuru', stateId: 'KA', latitude: 12.2958, longitude: 76.6394 },
    { id: 'KA_IXE', name: 'Mangaluru', stateId: 'KA', latitude: 12.9141, longitude: 74.8560 },
  ],
  MH: [
    { id: 'MH_BOM', name: 'Mumbai', stateId: 'MH', latitude: 19.0760, longitude: 72.8777 },
    { id: 'MH_PNQ', name: 'Pune', stateId: 'MH', latitude: 18.5204, longitude: 73.8567 },
    { id: 'MH_NAG', name: 'Nagpur', stateId: 'MH', latitude: 21.1458, longitude: 79.0882 },
  ],
};

export async function fetchCountries(): Promise<Country[]> {
  try {
    const res = await axios.get(`${API_BASE}/api/v1/locations/countries`, { timeout: 4000 });
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch {
    // Fallback
  }
  return BASELINE_COUNTRIES;
}

export async function fetchStates(countryId: string): Promise<State[]> {
  try {
    const res = await axios.get(`${API_BASE}/api/v1/locations/states`, {
      params: { countryId },
      timeout: 4000,
    });
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch {
    // Fallback
  }
  return BASELINE_STATES[countryId] || [];
}

export async function fetchDistricts(stateId: string): Promise<District[]> {
  try {
    const res = await axios.get(`${API_BASE}/api/v1/locations/districts`, {
      params: { stateId },
      timeout: 4000,
    });
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch {
    // Fallback
  }
  return BASELINE_DISTRICTS[stateId] || [];
}
