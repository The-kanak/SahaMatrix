import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { AlertTriangle, Sparkles, ChevronRight, ChevronLeft, Activity, ShieldAlert, Filter } from 'lucide-react';
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
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;
  const prevLangRef = React.useRef(language);

  React.useEffect(() => {
    if (prevLangRef.current !== language) {
      prevLangRef.current = language;
      setAiInsights({});
    }
  }, [language]);

  const criticalCount = useMemo(
    () => (alerts || []).filter((a) => a.severity === 'CRITICAL' || a.daysOfStock < 3.0).length,
    [alerts]
  );
  const deficitCount = useMemo(
    () => (alerts || []).filter((a) => !(a.severity === 'CRITICAL' || a.daysOfStock < 3.0)).length,
    [alerts]
  );

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    if (severityFilter === 'CRITICAL') {
      return alerts.filter((a) => a.severity === 'CRITICAL' || a.daysOfStock < 3.0);
    }
    if (severityFilter === 'DEFICIT') {
      return alerts.filter((a) => !(a.severity === 'CRITICAL' || a.daysOfStock < 3.0));
    }
    return alerts;
  }, [alerts, severityFilter]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [severityFilter, alerts?.length]);

  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedAlerts = filteredAlerts.slice(startIndex, startIndex + pageSize);

  const handleExplainAlert = async (alertItem) => {
    const key = `${alertItem.phcId}-${alertItem.medicine}`;
    setLoadingInsights((prev) => ({ ...prev, [key]: true }));

    try {
      const response = await api.explainAlert(alertItem.phcId, alertItem.medicine, language);
      setAiInsights((prev) => ({ ...prev, [key]: response }));
      if (onExplainPhc) onExplainPhc(alertItem.phcId);
    } catch (err) {
      console.error('Failed to get AI insight:', err);
      setAiInsights((prev) => ({
        ...prev,
        [key]: {
          summary: 'Unable to load clinical insight: ' + (err.message || 'Network error'),
          likelyCause: 'API connectivity or timeout.',
          recommendedAction: 'Please retry the analysis.',
          urgency: 'HIGH',
          source: 'error',
        },
      }));
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Header Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={15} style={{ color: '#dc2626' }} />
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
            Queue ({filteredAlerts.length})
          </span>
        </div>

        {/* Severity Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setSeverityFilter('ALL')}
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              border: severityFilter === 'ALL' ? '1px solid #0284c7' : '1px solid #cbd5e1',
              backgroundColor: severityFilter === 'ALL' ? '#e0f2fe' : '#ffffff',
              color: severityFilter === 'ALL' ? '#0369a1' : '#64748b',
              cursor: 'pointer',
            }}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setSeverityFilter('CRITICAL')}
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              border: severityFilter === 'CRITICAL' ? '1px solid #dc2626' : '1px solid #cbd5e1',
              backgroundColor: severityFilter === 'CRITICAL' ? '#fee2e2' : '#ffffff',
              color: severityFilter === 'CRITICAL' ? '#dc2626' : '#64748b',
              cursor: 'pointer',
            }}
          >
            &lt;3d ({criticalCount})
          </button>
          <button
            onClick={() => setSeverityFilter('DEFICIT')}
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              border: severityFilter === 'DEFICIT' ? '1px solid #ea580c' : '1px solid #cbd5e1',
              backgroundColor: severityFilter === 'DEFICIT' ? '#ffedd5' : '#ffffff',
              color: severityFilter === 'DEFICIT' ? '#c2410c' : '#64748b',
              cursor: 'pointer',
            }}
          >
            &lt;7d ({deficitCount})
          </button>
        </div>
      </div>

      {/* Paginated Alert Cards */}
      {paginatedAlerts.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
          No alerts in this severity category.
        </div>
      ) : (
        paginatedAlerts.map((a) => {
          const key = `${a.phcId}-${a.medicine}`;
          const insight = aiInsights[key];
          const isLoading = loadingInsights[key];
          const isCritical = a.severity === 'CRITICAL' || a.daysOfStock < 3.0;
          const isSelected = a.phcId === selectedPhcId;

          return (
            <div
              key={key}
              style={{
                backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                borderRadius: '8px',
                border: isSelected ? '2px solid #0284c7' : isCritical ? '1px solid #fecaca' : '1px solid #fed7aa',
                padding: '10px 12px',
                boxShadow: isSelected ? '0 2px 8px rgba(2,132,199,0.15)' : '0 1px 3px rgba(0,0,0,0.03)',
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
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '800',
                      }}
                    >
                      {isCritical ? t('severityCritical') : t('severityHigh')}
                    </span>
                    <span
                      onClick={() => onSelectPhc && onSelectPhc(a.phcId)}
                      style={{
                        fontWeight: '700',
                        fontSize: '12px',
                        color: isSelected ? '#0284c7' : '#0f172a',
                        cursor: 'pointer',
                        textDecoration: isSelected ? 'underline' : 'none',
                      }}
                    >
                      {a.phcName}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {a.state} • {a.district} {a.currentStock != null ? `• Stock: ${Math.round(a.currentStock)} units` : ''}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: isCritical ? '#dc2626' : '#d97706' }}>
                    {a.daysOfStock != null ? a.daysOfStock.toFixed(1) : '0.0'} {t('daysLeft')}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {a.avgDailyDemand != null ? `Avg: ${a.avgDailyDemand.toFixed(1)}/day` : (a.message || '')}
                  </div>
                </div>
              </div>

              {/* Middle row: Action buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '8px',
                  paddingTop: '6px',
                  borderTop: '1px solid #f8fafc',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#334155' }}>
                  Medicine: <span style={{ color: '#0284c7' }}>{a.medicine}</span>
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => onSelectPhc && onSelectPhc(a.phcId)}
                    style={{
                      backgroundColor: isSelected ? '#0284c7' : '#ffffff',
                      border: isSelected ? '1px solid #0284c7' : '1px solid #cbd5e1',
                      color: isSelected ? '#ffffff' : '#334155',
                      borderRadius: '5px',
                      padding: '3px 7px',
                      fontSize: '10px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Center map on this facility"
                  >
                    📍 Locate Map
                  </button>

                  <button
                    onClick={() => handleExplainAlert(a)}
                    disabled={isLoading}
                    style={{
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      color: '#0369a1',
                      borderRadius: '5px',
                      padding: '3px 8px',
                      fontSize: '10px',
                      fontWeight: '600',
                      cursor: isLoading ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Sparkles size={11} style={{ color: '#0284c7' }} />
                    {isLoading ? 'Consulting Gemini...' : t('aiInsightExplainBtn')}
                  </button>
                </div>
              </div>

              {/* AI Explanation Card (when requested) */}
              {insight && (
                <div
                  style={{
                    marginTop: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700', color: '#0f172a' }}>
                      <Sparkles size={12} style={{ color: '#0284c7' }} />
                      {t('aiInsightTitle')}
                    </div>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: insight.source === 'gemini' ? '#dcfce7' : '#f1f5f9',
                        color: insight.source === 'gemini' ? '#15803d' : '#64748b',
                        fontWeight: '600',
                      }}
                    >
                      {insight.source === 'gemini' ? t('poweredByGemini') : t('fallbackMode')}
                    </span>
                  </div>

                  <div style={{ color: '#1e293b', marginBottom: '3px', lineHeight: 1.3 }}>
                    <strong>Summary:</strong> {insight.summary}
                  </div>
                  <div style={{ color: '#475569', marginBottom: '3px', lineHeight: 1.3 }}>
                    <strong>{t('likelyCause')}:</strong> {insight.likelyCause}
                  </div>
                  <div style={{ color: '#15803d', lineHeight: 1.3 }}>
                    <strong>{t('recommendedAction')}:</strong> {insight.recommendedAction}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Pagination Controls Footer */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '8px',
            borderTop: '1px solid #e2e8f0',
            marginTop: '4px',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <span>
            Showing {startIndex + 1}–{Math.min(startIndex + pageSize, filteredAlerts.length)} of {filteredAlerts.length}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '3px 8px',
                borderRadius: '5px',
                border: '1px solid #cbd5e1',
                backgroundColor: safePage === 1 ? '#f8fafc' : '#ffffff',
                color: safePage === 1 ? '#cbd5e1' : '#1e293b',
                cursor: safePage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: '600',
              }}
            >
              <ChevronLeft size={13} /> Prev
            </button>

            <span style={{ fontWeight: '600', color: '#0f172a' }}>
              {safePage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '3px 8px',
                borderRadius: '5px',
                border: '1px solid #cbd5e1',
                backgroundColor: safePage === totalPages ? '#f8fafc' : '#ffffff',
                color: safePage === totalPages ? '#cbd5e1' : '#1e293b',
                cursor: safePage === totalPages ? 'not-allowed' : 'pointer',
                fontWeight: '600',
              }}
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
