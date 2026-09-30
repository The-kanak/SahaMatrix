import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  Polyline,
  useMap,
} from 'react-leaflet';
import { useLanguage } from '../contexts/LanguageContext';
import { MapPin, Filter } from 'lucide-react';

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

function MapBoundsController({ stateFilter, selectedPhc }) {
  const map = useMap();
  useEffect(() => {
    if (selectedPhc && selectedPhc.lat && selectedPhc.lng) {
      map.flyTo([selectedPhc.lat, selectedPhc.lng], 9, { duration: 1 });
    } else if (stateFilter && STATE_BOUNDS[stateFilter]) {
      map.flyToBounds(STATE_BOUNDS[stateFilter], { padding: [30, 30], duration: 1 });
    }
  }, [stateFilter, selectedPhc, map]);
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
      {/* Filters Bar */}
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
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
            <Filter size={13} />
            <span>{t('filterState')}:</span>
          </div>
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedDistrict('');
            }}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: '500',
              color: '#1e293b',
            }}
          >
            <option value="ALL">{t('allStates')}</option>
            <option value="MH">Maharashtra (MH)</option>
            <option value="UP">Uttar Pradesh (UP)</option>
            <option value="TN">Tamil Nadu (TN)</option>
          </select>

          {districts && districts.length > 0 && (
            <>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
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
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
            <span>&lt;3d Critical</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ea580c' }} />
            <span>&lt;7d Deficit</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
            <span>Safe Buffer</span>
          </div>
        </div>
      </div>

      {/* Leaflet Map */}
      <div style={{ flex: 1, minHeight: '400px', position: 'relative' }}>
        <MapContainer
          center={[22.5, 79.0]}
          zoom={5}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBoundsController stateFilter={selectedState} selectedPhc={selectedPhc} />

          {/* Render PHC CircleMarkers */}
          {(phcs || []).filter((p) => p && typeof p.lat === 'number' && typeof p.lng === 'number').map((phc) => {
            const isSelected = phc.id === selectedPhcId;
            return (
              <CircleMarker
                key={phc.id}
                center={[phc.lat, phc.lng]}
                radius={isSelected ? 10 : 7}
                pathOptions={{
                  color: isSelected ? '#0f172a' : '#ffffff',
                  weight: isSelected ? 3 : 1.5,
                  fillColor: getRiskColor(phc.risk),
                  fillOpacity: 0.9,
                }}
                eventHandlers={{
                  click: () => onSelectPhc(phc.id),
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
