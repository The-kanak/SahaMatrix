import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Building2, AlertTriangle, ArrowRightLeft, ShieldCheck, Users } from 'lucide-react';

export const KPIBar = ({ summaryData, impactData }) => {
  const { t } = useLanguage();

  const totalPhcs = summaryData?.totals?.phcs || 72;
  const criticalAlerts = summaryData?.totals?.criticalAlerts || 0;
  const highAlerts = summaryData?.totals?.highAlerts || 0;
  const recommendationsCount = summaryData?.totals?.recommendations || 0;
  const preventedStockouts = impactData?.stockoutsPrevented || 0;
  // Estimated patients served based on prevented stockouts (~45 patients per prevented stockout day)
  const patientsProtected = preventedStockouts * 45;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        padding: '10px 16px 6px 16px',
      }}
    >
      {/* 1. Monitored PHCs */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            backgroundColor: '#e0f2fe',
            color: '#0284c7',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Building2 size={20} />
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
            {t('kpiPhcs')}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
            {totalPhcs}{' '}
            <span style={{ fontSize: '11px', fontWeight: '400', color: '#94a3b8' }}>
              across 3 States
            </span>
          </div>
        </div>
      </div>

      {/* 2. Critical Shortages */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: criticalAlerts > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            backgroundColor: criticalAlerts > 0 ? '#fee2e2' : '#f1f5f9',
            color: criticalAlerts > 0 ? '#dc2626' : '#64748b',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertTriangle size={20} />
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
            {t('kpiCritical')}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: criticalAlerts > 0 ? '#dc2626' : '#0f172a' }}>
            {criticalAlerts}{' '}
            <span style={{ fontSize: '11px', fontWeight: '400', color: '#94a3b8' }}>
              (+{highAlerts} high)
            </span>
          </div>
        </div>
      </div>

      {/* 3. Recommended Transfers */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            backgroundColor: '#fef3c7',
            color: '#d97706',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowRightLeft size={20} />
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
            {t('kpiRecommendations')}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
            {recommendationsCount}{' '}
            <span style={{ fontSize: '11px', fontWeight: '400', color: '#94a3b8' }}>
              ready to balance
            </span>
          </div>
        </div>
      </div>

      {/* 4. Stockouts Prevented */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            backgroundColor: '#dcfce7',
            color: '#16a34a',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldCheck size={20} />
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
            {t('kpiStockoutsPrevented')}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#16a34a' }}>
            {preventedStockouts}{' '}
            <span style={{ fontSize: '11px', fontWeight: '400', color: '#94a3b8' }}>
              facility-days
            </span>
          </div>
        </div>
      </div>

      {/* 5. Patients Protected */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            backgroundColor: '#f3e8ff',
            color: '#9333ea',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Users size={20} />
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
            {t('kpiCoverage')}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#7e22ce' }}>
            {patientsProtected.toLocaleString()}{' '}
            <span style={{ fontSize: '11px', fontWeight: '400', color: '#94a3b8' }}>
              estimated
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
