import React, { useState, useEffect } from 'react';
import CustomDropdown from '../CustomDropdown';
import { 
  fetchCountries, 
  fetchStates, 
  fetchDistricts, 
  Country, 
  State, 
  District 
} from '../../services/locationService';

interface LocationSearchProps {
  onSearch: (country: string, state: string, district: string, lat?: number, lon?: number) => void;
  onUseCurrentLocation: () => void;
  isSearching?: boolean;
}

export default function LocationSearch({
  onSearch,
  onUseCurrentLocation,
  isSearching = false,
}: LocationSearchProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [selectedCountryId, setSelectedCountryId] = useState<string>('IN');
  const [selectedStateId, setSelectedStateId] = useState<string>('AP');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('AP_TPT');

  const [loadingCountries, setLoadingCountries] = useState<boolean>(false);
  const [loadingStates, setLoadingStates] = useState<boolean>(false);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Load countries on mount
  useEffect(() => {
    async function loadCountriesData() {
      setLoadingCountries(true);
      const data = await fetchCountries();
      setCountries(data);
      setLoadingCountries(false);
    }
    loadCountriesData();
  }, []);

  // Load states when selectedCountryId changes
  useEffect(() => {
    if (!selectedCountryId) {
      setStates([]);
      setDistricts([]);
      setSelectedStateId('');
      setSelectedDistrictId('');
      return;
    }

    async function loadStatesData() {
      setLoadingStates(true);
      const data = await fetchStates(selectedCountryId);
      setStates(data);
      setLoadingStates(false);
    }
    loadStatesData();
  }, [selectedCountryId]);

  // Load districts when selectedStateId changes
  useEffect(() => {
    if (!selectedStateId) {
      setDistricts([]);
      setSelectedDistrictId('');
      return;
    }

    async function loadDistrictsData() {
      setLoadingDistricts(true);
      const data = await fetchDistricts(selectedStateId);
      setDistricts(data);
      setLoadingDistricts(false);
    }
    loadDistrictsData();
  }, [selectedStateId]);

  const handleSearchClick = () => {
    setErrorMsg('');
    if (!selectedCountryId) {
      setErrorMsg('Please select a Country.');
      return;
    }
    if (!selectedStateId) {
      setErrorMsg('Please select a State.');
      return;
    }
    if (!selectedDistrictId) {
      setErrorMsg('Please select a District.');
      return;
    }

    const countryObj = countries.find((c) => c.id === selectedCountryId);
    const stateObj = states.find((s) => s.id === selectedStateId);
    const distObj = districts.find((d) => d.id === selectedDistrictId);

    const countryName = countryObj?.name || 'India';
    const stateName = stateObj?.name || '';
    const districtName = distObj?.name || '';
    const lat = distObj?.latitude;
    const lon = distObj?.longitude;

    onSearch(countryName, stateName, districtName, lat, lon);
  };

  return (
    <div
      className="card-3d"
      style={{
        position: 'relative',
        zIndex: 50,
        padding: '24px',
        borderRadius: '20px',
        background: '#FFFFFF',
        border: '1px solid #1E88E5',
        boxShadow: '0 10px 30px rgba(30, 136, 229, 0.08)',
        marginBottom: '28px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
            📍 Select Healthcare Location Hierarchy
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0' }}>
            Choose Country, State, and District or use GPS to locate nearest hospitals.
          </p>
        </div>

        <button
          onClick={onUseCurrentLocation}
          className="btn-3d-secondary"
          style={{
            padding: '10px 16px',
            fontSize: '0.82rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📡 Use Current Location
        </button>
      </div>

      {errorMsg && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#DC2626',
          fontSize: '0.82rem',
          borderRadius: '10px',
          marginBottom: '16px'
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Cascading 3 Dropdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'end' }}>
        {/* Country */}
        <CustomDropdown
          options={countries.map((c) => ({
            value: c.id,
            label: `${c.flag} ${c.name}`
          }))}
          value={selectedCountryId}
          onChange={(val) => {
            setSelectedCountryId(val);
            setSelectedStateId('');
            setSelectedDistrictId('');
          }}
          label="Country 🌐"
          placeholder={loadingCountries ? 'Loading...' : 'Select Country'}
        />

        {/* State */}
        <CustomDropdown
          options={states.map((s) => ({
            value: s.id,
            label: s.name
          }))}
          value={selectedStateId}
          onChange={(val) => {
            setSelectedStateId(val);
            setSelectedDistrictId('');
          }}
          label="State / Province 🗺️"
          placeholder={!selectedCountryId ? 'Select Country First' : loadingStates ? 'Loading...' : 'Select State'}
          disabled={!selectedCountryId || loadingStates}
        />

        {/* District */}
        <CustomDropdown
          options={districts.map((d) => ({
            value: d.id,
            label: d.name
          }))}
          value={selectedDistrictId}
          onChange={(val) => setSelectedDistrictId(val)}
          label="District / City 📍"
          placeholder={!selectedStateId ? 'Select State First' : loadingDistricts ? 'Loading...' : 'Select District'}
          disabled={!selectedStateId || loadingDistricts}
        />

        {/* Search Button */}
        <button
          onClick={handleSearchClick}
          disabled={isSearching}
          className="btn-3d"
          style={{
            padding: '13px 20px',
            fontSize: '0.9rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            height: '46px'
          }}
        >
          {isSearching ? (
            <>
              <span className="spinner-icon" /> Searching...
            </>
          ) : (
            <>🔍 Search Hospitals ➔</>
          )}
        </button>
      </div>
    </div>
  );
}
