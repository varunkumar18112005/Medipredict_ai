import React from 'react';
import CustomDropdown from '../CustomDropdown';

export type CategoryFilter =
  | 'ALL'
  | 'Cardiology'
  | 'Neurology'
  | 'Oncology'
  | 'Pediatrics'
  | 'Orthopedics'
  | 'Nephrology'
  | 'Gastroenterology'
  | 'Pulmonology'
  | 'Government'
  | 'EMERGENCY';

export type RadiusFilter = 2000 | 5000 | 10000 | 20000;
export type SortOption = 'nearest' | 'highest_rated';

interface HospitalFiltersProps {
  selectedCategory: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  radiusMeters?: number;
  onRadiusChange?: (radius: number) => void;
  sortBy?: SortOption;
  onSortByChange?: (sortBy: SortOption) => void;
}

const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: 'ALL', label: '🏥 All Hospitals' },
  { value: 'Cardiology', label: '❤️ Cardiology (Heart Care)' },
  { value: 'Neurology', label: '🧠 Neurology (Brain & Spine)' },
  { value: 'Oncology', label: '🎗️ Oncology (Cancer Care)' },
  { value: 'Pediatrics', label: '👶 Pediatrics (Children Care)' },
  { value: 'Orthopedics', label: '🦴 Orthopedics (Bone & Joint)' },
  { value: 'Nephrology', label: '🩺 Nephrology & Dialysis' },
  { value: 'Gastroenterology', label: '🧪 Gastroenterology' },
  { value: 'Pulmonology', label: '🫁 Pulmonology (Lungs)' },
  { value: 'Government', label: '🏛️ Government Hospitals' },
  { value: 'EMERGENCY', label: '🚨 24/7 Emergency Care' },
];

const RADIUS_OPTIONS = [
  { value: '2000', label: '📍 Within 2 km' },
  { value: '5000', label: '📍 Within 5 km' },
  { value: '10000', label: '📍 Within 10 km' },
  { value: '20000', label: '📍 Within 20 km' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'nearest', label: '⚡ Nearest First' },
  { value: 'highest_rated', label: '⭐ Highest Rated' },
];

export default function HospitalFilters({
  selectedCategory,
  onCategoryChange,
  radiusMeters = 20000,
  onRadiusChange,
  sortBy = 'nearest',
  onSortByChange,
}: HospitalFiltersProps) {
  return (
    <div
      className="card-3d"
      style={{
        position: 'relative',
        zIndex: 40,
        padding: '20px 24px',
        marginBottom: '24px',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <CustomDropdown
        options={CATEGORY_OPTIONS}
        value={selectedCategory}
        onChange={(val) => onCategoryChange(val as CategoryFilter)}
        label="Filter Hospitals by Speciality / Category 🩸"
        placeholder="Select Speciality"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {onRadiusChange && (
          <CustomDropdown
            options={RADIUS_OPTIONS}
            value={String(radiusMeters)}
            onChange={(val) => onRadiusChange(Number(val))}
            label="Search Distance 🎯"
            placeholder="Select Distance"
          />
        )}

        {onSortByChange && (
          <CustomDropdown
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={(val) => onSortByChange(val as SortOption)}
            label="Sort By 🔀"
            placeholder="Sort Hospitals"
          />
        )}
      </div>
    </div>
  );
}
