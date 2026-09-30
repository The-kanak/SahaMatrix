import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Camera, Building2, Bed, Users, AlertCircle, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const FacilityPanel = ({
  selectedPhc,
  selectedMedicine,
  setSelectedMedicine,
  forecastData,
  onOpenPhotoModal,
}) => {
  const { t } = useLanguage();

  if (!selectedPhc) {
    return (
      <div
        style={{
          padding: '30px 20px',
          textAlign: 'center',
          color: '#64748b',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}
      >
        <Building2 size={36} style={{ color: '#94a3b8', margin: '0 auto 10px auto' }} />
        <p style={{ fontSize: '13px', fontWeight: '500' }}>
          {t('selectPhcPrompt')}
        </p>
      </div>
    );
  }

  const stocks = selectedPhc.stocks || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Info Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '14px 16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                {selectedPhc.name}
              </h3>
              <span
                style={{
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: '600',
                }}
              >
                {selectedPhc.state} • {selectedPhc.district}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              ID: <code>{selectedPhc.id}</code> • Lat: {typeof selectedPhc.lat === 'number' ? selectedPhc.lat.toFixed(4) : '—'}, Lng: {typeof selectedPhc.lng === 'number' ? selectedPhc.lng.toFixed(4) : '—'}
            </div>
          </div>

          <button
            onClick={onOpenPhotoModal}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            <Camera size={14} />
            {t('updateStockPhoto')}
          </button>
        </div>

        {/* Capacity Metrics */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
            <Bed size={15} style={{ color: '#0284c7' }} />
            <span>{selectedPhc.beds || 10} {t('beds')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
            <Users size={15} style={{ color: '#0284c7' }} />
            <span>{selectedPhc.staff || 6} {t('staff')}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            {t('resupplyLeadTime')}
          </div>
        </div>
      </div>

      {/* Stock Levels Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '12px 14px',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
          {t('stockLevels')}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Medicine</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Stock</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Avg Daily</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Days Left</th>
                <th style={{ textAlign: 'center', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => {
                const days = s.daysOfStock || 0;
                const isCritical = days < 3.0;
                const isHigh = days >= 3.0 && days < 7.0;
                const isSurplus = days > 30.0;
                const isSelected = s.medicine === selectedMedicine;

                return (
                  <tr
                    key={s.medicine}
                    onClick={() => setSelectedMedicine(s.medicine)}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#f0f9ff' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '8px', fontWeight: isSelected ? '700' : '500', color: '#0f172a' }}>
                      {s.medicine}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                      {Math.round(s.quantity)}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#64748b' }}>
                      {s.avgDailyDemand ? s.avgDailyDemand.toFixed(1) : '—'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700', color: isCritical ? '#dc2626' : isHigh ? '#d97706' : '#16a34a' }}>
                      {days > 0 ? days.toFixed(1) : '0.0'}d
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span
                        style={{
                          backgroundColor: isCritical ? '#fee2e2' : isHigh ? '#fef3c7' : isSurplus ? '#e0f2fe' : '#dcfce7',
                          color: isCritical ? '#dc2626' : isHigh ? '#d97706' : isSurplus ? '#0369a1' : '#16a34a',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '700',
                        }}
                      >
                        {isCritical ? 'CRITICAL' : isHigh ? 'DEFICIT' : isSurplus ? 'SURPLUS' : 'NORMAL'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 14-Day Demand Forecast Chart */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '12px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={15} style={{ color: '#0284c7' }} />
            {t('consumption14d')} — <span style={{ color: '#0284c7' }}>{selectedMedicine}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            DOW Moving Avg + State Trend
          </div>
        </div>

        {forecastData && forecastData.length > 0 ? (
          <div style={{ height: '180px', width: '100%', marginTop: '6px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => val ? val.slice(5) : ''}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val) => [`${val} units`, 'Projected Demand']}
                  labelFormatter={(lbl) => `Date: ${lbl}`}
                />
                <Line
                  type="monotone"
                  dataKey="units"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0284c7' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '12px' }}>
            Loading forecast curve...
          </div>
        )}
      </div>
    </div>
  );
};
