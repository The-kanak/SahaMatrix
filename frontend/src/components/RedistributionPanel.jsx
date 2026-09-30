import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, CheckCheck, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import { api } from '../services/api';

export const RedistributionPanel = ({
  recommendations,
  onApplySingle,
  onApplyAll,
  isApplying,
}) => {
  const { t } = useLanguage();
  const [appliedIds, setAppliedIds] = useState(new Set());

  const handleApplyOne = async (recId) => {
    try {
      await onApplySingle(recId);
      setAppliedIds((prev) => new Set(prev).add(recId));
    } catch (err) {
      alert('Failed to apply recommendation: ' + err.message);
    }
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#16a34a',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #bbf7d0',
        }}
      >
        <ShieldCheck size={36} style={{ margin: '0 auto 10px auto', color: '#16a34a' }} />
        <div style={{ fontSize: '14px', fontWeight: '700' }}>Network Inventory Balanced</div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
          No surplus-to-deficit reallocations required at this time.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Top Banner / Batch Button */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
            Algorithmic Greedy Proximity Rebalancing
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {recommendations.length} transfers generated (prioritizing same-district & same-state corridors)
          </div>
        </div>

        <button
          onClick={onApplyAll}
          disabled={isApplying}
          style={{
            backgroundColor: '#16a34a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '7px 14px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: isApplying ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          <CheckCheck size={15} />
          {isApplying ? 'Applying...' : t('applyAllTransfers')}
        </button>
      </div>

      {/* List of Transfer Cards */}
      {recommendations.map((rec) => {
        const isApplied = appliedIds.has(rec.id);

        return (
          <div
            key={rec.id}
            style={{
              backgroundColor: isApplied ? '#f8fafc' : '#ffffff',
              borderRadius: '8px',
              border: isApplied ? '1px solid #e2e8f0' : '1px solid #cbd5e1',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              opacity: isApplied ? 0.7 : 1,
            }}
          >
            {/* Source & Destination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* From PHC */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '700' }}>[SURPLUS]</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>
                    {rec.from.name} ({rec.from.state})
                  </span>
                </div>

                <ArrowRight size={14} style={{ color: '#94a3b8' }} />

                {/* To PHC */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#b91c1c', fontWeight: '700' }}>[DEFICIT]</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>
                    {rec.to.name} ({rec.to.state})
                  </span>
                </div>
              </div>

              {/* Cross State Badge */}
              {rec.crossState && (
                <span
                  style={{
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  Inter-State Transfer ({rec.from.state} → {rec.to.state})
                </span>
              )}
            </div>

            {/* Bottom details: Medicine, Qty, Distance, Apply Button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '6px',
                borderTop: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
                <span style={{ fontWeight: '700', color: '#0284c7' }}>
                  {rec.medicine}: {Math.round(rec.quantity)} units
                </span>
                <span style={{ color: '#64748b' }}>
                  Distance: <strong>{rec.distanceKm.toFixed(1)} km</strong>
                </span>
              </div>

              <button
                onClick={() => handleApplyOne(rec.id)}
                disabled={isApplied || isApplying}
                style={{
                  backgroundColor: isApplied ? '#e2e8f0' : '#0284c7',
                  color: isApplied ? '#64748b' : '#ffffff',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: isApplied || isApplying ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {isApplied ? (
                  <>
                    <CheckCircle2 size={12} /> Applied
                  </>
                ) : (
                  t('applyTransfer')
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
