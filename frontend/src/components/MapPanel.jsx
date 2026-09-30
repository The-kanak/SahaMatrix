import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  Polyline,
  useMap,
} from 'react-leaflet';
import { useLanguage } from '../contexts/LanguageContext';
import { Filter, Search, X, MapPin } from 'lucide-react';

const STATE_BOUNDS = {
  ALL: [
    [8.0, 72.0],
    [30.5, 85.0],
  ],
  MH: [
    [18.0, 72.5],
    [21.8, 80.0],
  ],
  UP: [
    [25.5, 80.0],
    [28.0, 84.0],
  ],
  TN: [
    [9.5, 76.5],
    [13.5, 80.5],
  ],
};

function MapBoundsController({ stateFilter, districtFilter, selectedPhcId, selectedPhc, phcs }) {
  const map = useMap();
  const prevPhcIdRef = React.useRef(null);
  const prevStateFilterRef = React.useRef(stateFilter);
  const prevDistrictFilterRef = React.useRef(districtFilter);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    // 1. If user switched district / city in dropdown
    if (districtFilter && districtFilter !== prevDistrictFilterRef.current) {
      prevDistrictFilterRef.current = districtFilter;
      const districtPhcs = (phcs || []).filter((p) => p.district === districtFilter);
      if (districtPhcs.length > 0) {
        const lats = districtPhcs.map((p) => p.lat).filter((l) => typeof l === 'number');
        const lngs = districtPhcs.map((p) => p.lng).filter((l) => typeof l === 'number');
        if (lats.length > 0) {
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          map.flyToBounds(
            [
              [minLat - 0.06, minLng - 0.06],
              [maxLat + 0.06, maxLng + 0.06],
            ],
            { padding: [30, 30], duration: 1 }
          );
          return;
        }
      }
    }

    // 2. If a specific PHC was selected, zoom in on it
    if (selectedPhcId && selectedPhcId !== prevPhcIdRef.current && selectedPhc?.lat && selectedPhc?.lng) {
      prevPhcIdRef.current = selectedPhcId;
      map.flyTo([selectedPhc.lat, selectedPhc.lng], 11, { duration: 1 });
    }
    // 3. If state filter changed, fit bounds to that state
    else if (stateFilter !== prevStateFilterRef.current && STATE_BOUNDS[stateFilter]) {
      prevStateFilterRef.current = stateFilter;
      prevDistrictFilterRef.current = districtFilter;
      map.flyToBounds(STATE_BOUNDS[stateFilter], { padding: [30, 30], duration: 1 });
    }
  }, [stateFilter, districtFilter, selectedPhcId, selectedPhc, phcs, map]);
  return null;
}

const getRiskColor = (risk) => {
  switch (risk) {
    case 'CRITICAL':
      return '#dc2626';
    case 'HIGH':
      return '#ea580c';
    case 'MEDIUM':
      return '#eab308';
    case 'LOW':
    default:
      return '#16a34a';
  }
};

export const MapPanel = ({
  phcs,
  selectedState,
  setSelectedState,
  selectedDistrict,
  setSelectedDistrict,
  districts,
  selectedPhcId,
  onSelectPhc,
  selectedPhc,
  activeTransfer,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !phcs) return [];
    const q = searchQuery.toLowerCase().trim();
    return phcs
      .filter((p) => {
        return (
          p.name?.toLowerCase().includes(q) ||
          p.district?.toLowerCase().includes(q) ||
          p.state?.toLowerCase().includes(q) ||
          p.id?.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [searchQuery, phcs]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #cbd5e1',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {/* Filters & Direct Search Bar */}
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          position: 'relative',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Direct Facility Search Input */}
          <div ref={searchContainerRef} style={{ position: 'relative', width: '210px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '3px 8px',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <Search size={13} style={{ color: '#64748b', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search PHC / City..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '11px',
                  width: '100%',
                  color: '#0f172a',
                  backgroundColor: 'transparent',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown List */}
            {isSearchOpen && searchQuery.trim().length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  width: '270px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                  zIndex: 9999,
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
              >
                {searchResults.length === 0 ? (
                  <div style={{ padding: '10px 12px', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                    No facilities found matching "{searchQuery}"
                  </div>
                ) : (
                  searchResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectPhc(p.id);
                        setIsSearchOpen(false);
                        setSearchQuery(p.name);
                      }}
                      style={{
                        padding: '8px 10px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: p.id === selectedPhcId ? '#e0f2fe' : '#ffffff',
                        transition: 'background-color 0.12s',
                      }}
                      onMouseEnter={(e) => {
                        if (p.id !== selectedPhcId) e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        if (p.id !== selectedPhcId) e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          {p.district}, {p.state} • {p.id}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: getRiskColor(p.risk),
                          }}
                        />
                        <span style={{ fontSize: '10px', fontWeight: '700', color: getRiskColor(p.risk) }}>
                          {p.risk}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <span style={{ color: '#cbd5e1' }}>|</span>

          {/* State Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', color: '#475569' }}>
            <Filter size={12} />
            <span>{t('filterState')}:</span>
          </div>
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedDistrict('');
            }}
            style={{
              padding: '3px 6px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '11px',
              fontWeight: '500',
              color: '#1e293b',
            }}
          >
            <option value="ALL">{t('allStates')}</option>
            <option value="MH">Maharashtra (MH)</option>
            <option value="UP">Uttar Pradesh (UP)</option>
            <option value="TN">Tamil Nadu (TN)</option>
          </select>

          {/* District Filter */}
          {districts && districts.length > 0 && (
            <>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                style={{
                  padding: '3px 6px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: '#1e293b',
                }}
              >
                <option value="">{t('allDistricts')}</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* Quick Hub Focus Shortcuts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '2px' }}>
            <button
              onClick={() => {
                setSelectedState('MH');
                setSelectedDistrict('Nagpur');
              }}
              style={{
                padding: '3px 7px',
                borderRadius: '6px',
                border: selectedDistrict === 'Nagpur' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                backgroundColor: selectedDistrict === 'Nagpur' ? '#e0f2fe' : '#ffffff',
                color: selectedDistrict === 'Nagpur' ? '#0369a1' : '#475569',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
              title="Focus view on Nagpur City Hub"
            >
              🎯 Nagpur
            </button>

            <button
              onClick={() => {
                setSelectedState('ALL');
                setSelectedDistrict('');
              }}
              style={{
                padding: '3px 7px',
                borderRadius: '6px',
                border: selectedState === 'ALL' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                backgroundColor: selectedState === 'ALL' ? '#e0f2fe' : '#ffffff',
                color: selectedState === 'ALL' ? '#0369a1' : '#475569',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
              title="View nationwide network across all states"
            >
              🌐 All India
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
            <span>&lt;3d Critical</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ea580c' }} />
            <span>&lt;7d Deficit</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
            <span>Safe</span>
          </div>
        </div>
      </div>

      {/* Leaflet Map */}
      <div style={{ flex: 1, minHeight: '400px', position: 'relative' }}>
        <MapContainer
          center={[21.1458, 79.0882]}
          zoom={11}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, METI, TomTom'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
            keepBuffer={12}
            updateWhenIdle={true}
            updateWhenZooming={false}
          />

          <MapBoundsController
            stateFilter={selectedState}
            districtFilter={selectedDistrict}
            selectedPhcId={selectedPhcId}
            selectedPhc={selectedPhc}
            phcs={phcs}
          />

          {/* Render PHC CircleMarkers */}
          {(phcs || []).filter((p) => p && typeof p.lat === 'number' && typeof p.lng === 'number').map((phc) => {
            const isSelected = phc.id === selectedPhcId;
            const matchesFilter =
              (selectedState === 'ALL' || phc.state === selectedState) &&
              (!selectedDistrict || phc.district === selectedDistrict);

            return (
              <CircleMarker
                key={phc.id}
                center={[phc.lat, phc.lng]}
                radius={isSelected ? 11 : matchesFilter ? 8 : 5}
                pathOptions={{
                  color: isSelected ? '#0f172a' : '#ffffff',
                  weight: isSelected ? 3 : matchesFilter ? 1.5 : 1,
                  fillColor: getRiskColor(phc.risk),
                  fillOpacity: isSelected ? 1.0 : matchesFilter ? 0.95 : 0.45,
                }}
                eventHandlers={{
                  click: (e) => {
                    onSelectPhc(phc.id);
                    const mapInstance = e.target._map;
                    if (mapInstance && typeof phc.lat === 'number' && typeof phc.lng === 'number') {
                      mapInstance.flyTo([phc.lat, phc.lng], 11, { duration: 0.8 });
                    }
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                  <div style={{ fontSize: '12px', lineHeight: 1.3 }}>
                    <strong>{phc.name}</strong>
                    <div>{phc.district}, {phc.state}</div>
                    <div style={{ marginTop: '2px', fontWeight: 'bold' }}>
                      Status: {phc.risk} ({phc.minDaysOfStock ? phc.minDaysOfStock.toFixed(1) : 0}d left)
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}

          {/* Active Transfer Polyline */}
          {activeTransfer &&
           activeTransfer.from && activeTransfer.to &&
           typeof activeTransfer.from.lat === 'number' && typeof activeTransfer.from.lng === 'number' &&
           typeof activeTransfer.to.lat === 'number' && typeof activeTransfer.to.lng === 'number' && (
            <Polyline
              positions={[
                [activeTransfer.from.lat, activeTransfer.from.lng],
                [activeTransfer.to.lat, activeTransfer.to.lng],
              ]}
              pathOptions={{
                color: activeTransfer.crossState ? '#ea580c' : '#0284c7',
                weight: 4,
                dashArray: '6, 6',
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};
