import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { AlertTriangle, Sparkles, ChevronRight, Activity, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

export const AlertsPanel = ({
  alerts,
  onSelectPhc,
  selectedPhcId,
  onExplainPhc,
}) => {
  const { language, t } = useLanguage();
  const [aiInsights, setAiInsights] = useState({});
  const [loadingInsights, setLoadingInsights] = useState({});

  const handleExplainAlert = async (alertItem) => {
    const key = `${alertItem.phcId}-${alertItem.medicine}`;
    setLoadingInsights((prev) => ({ ...prev, [key]: true }));

    try {
      const response = await api.explainAlert(alertItem.phcId, alertItem.medicine, language);
      setAiInsights((prev) => ({ ...prev, [key]: response }));
      if (onExplainPhc) onExplainPhc(alertItem.phcId);
    } catch (err) {
      console.error('Failed to get AI insight:', err);
    } finally {
      setLoadingInsights((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (!alerts || alerts.length === 0) {
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
        <ShieldAlert size={36} style={{ margin: '0 auto 10px auto', color: '#16a34a' }} />
        <div style={{ fontSize: '14px', fontWeight: '700' }}>No Active Stockout Alerts</div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
          All PHCs maintain safe inventory levels (&gt;7 days buffer).
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {alerts.map((a) => {
        const key = `${a.phcId}-${a.medicine}`;
        const insight = aiInsights[key];
        const isLoading = loadingInsights[key];
        const isCritical = a.severity === 'CRITICAL' || a.daysOfStock < 3.0;
        const isSelected = a.phcId === selectedPhcId;

        return (
          <div
            key={key}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: isCritical ? '1px solid #fecaca' : '1px solid #fed7aa',
              padding: '12px 14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
            }}
          >
            {/* Top row: PHC, Medicine, Days Left, Badges */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      backgroundColor: isCritical ? '#fee2e2' : '#fef3c7',
                      color: isCritical ? '#dc2626' : '#d97706',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '800',
                    }}
                  >
                    {isCritical ? t('severityCritical') : t('severityHigh')}
                  </span>
                  <span
                    onClick={() => onSelectPhc(a.phcId)}
                    style={{
                      fontWeight: '700',
                      fontSize: '13px',
                      color: isSelected ? '#0284c7' : '#0f172a',
                      cursor: 'pointer',
                      textDecoration: isSelected ? 'underline' : 'none',
                    }}
                  >
                    {a.phcName}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {a.state} • {a.district} • Current Stock: {Math.round(a.currentStock)} units
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: isCritical ? '#dc2626' : '#d97706' }}>
                  {a.daysOfStock.toFixed(1)} {t('daysLeft')}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Avg Demand: {a.avgDailyDemand.toFixed(1)}/day
                </div>
              </div>
            </div>

            {/* Middle row: Action buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid #f8fafc',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>
                Medicine: <span style={{ color: '#0284c7' }}>{a.medicine}</span>
              </span>

              <button
                onClick={() => handleExplainAlert(a)}
                disabled={isLoading}
                style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  color: '#0369a1',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: isLoading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={12} style={{ color: '#0284c7' }} />
                {isLoading ? 'Consulting Gemini...' : t('aiInsightExplainBtn')}
              </button>
            </div>

            {/* AI Explanation Card (when requested) */}
            {insight && (
              <div
                style={{
                  marginTop: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700', color: '#0f172a' }}>
                    <Sparkles size={13} style={{ color: '#0284c7' }} />
                    {t('aiInsightTitle')}
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: insight.source === 'gemini' ? '#dcfce7' : '#f1f5f9',
                      color: insight.source === 'gemini' ? '#15803d' : '#64748b',
                      fontWeight: '600',
                    }}
                  >
                    {insight.source === 'gemini' ? t('poweredByGemini') : t('fallbackMode')}
                  </span>
                </div>

                <div style={{ color: '#1e293b', marginBottom: '4px', lineHeight: 1.4 }}>
                  <strong>Summary:</strong> {insight.summary}
                </div>
                <div style={{ color: '#475569', marginBottom: '4px', lineHeight: 1.4 }}>
                  <strong>{t('likelyCause')}:</strong> {insight.likelyCause}
                </div>
                <div style={{ color: '#15803d', lineHeight: 1.4 }}>
                  <strong>{t('recommendedAction')}:</strong> {insight.recommendedAction}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
