import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Shield, MapPin, Building2, Stethoscope } from 'lucide-react';

export const RoleBanner = ({ role, selectedState, selectedDistrict, selectedPhcName }) => {
  const { t } = useLanguage();

  const getRoleConfig = () => {
    switch (role) {
      case 'secretary':
        return {
          icon: <Building2 size={18} style={{ color: '#2563eb' }} />,
          title: t('roleSecretary'),
          desc: t('roleSecretaryDesc'),
          bg: '#eff6ff',
          border: '#bfdbfe',
          badge: '#1d4ed8',
          scope: selectedState === 'ALL' ? 'National Coordination (All States)' : `State Coordination (${selectedState})`,
        };
      case 'cmo':
        return {
          icon: <MapPin size={18} style={{ color: '#059669' }} />,
          title: t('roleCMO'),
          desc: t('roleCMODesc'),
          bg: '#ecfdf5',
          border: '#a7f3d0',
          badge: '#047857',
          scope: selectedDistrict ? `District: ${selectedDistrict} (${selectedState})` : `District Health Office (${selectedState})`,
        };
      case 'pharmacist':
      default:
        return {
          icon: <Stethoscope size={18} style={{ color: '#9333ea' }} />,
          title: t('rolePharmacist'),
          desc: t('rolePharmacistDesc'),
          bg: '#faf5ff',
          border: '#e9d5ff',
          badge: '#7e22ce',
          scope: selectedPhcName ? `Facility: ${selectedPhcName}` : 'Facility Dispensary & Paper Register',
        };
    }
  };

  const config = getRoleConfig();

  return (
    <div
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: '8px',
        padding: '8px 14px',
        margin: '10px 16px 4px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {config.icon}
          <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
            {config.title}
          </span>
        </div>
        <span style={{ fontSize: '12px', color: '#475569' }}>
          {config.desc}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            backgroundColor: '#ffffff',
            border: `1px solid ${config.border}`,
            color: config.badge,
            padding: '2px 8px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: '600',
          }}
        >
          {config.scope}
        </span>
      </div>
    </div>
  );
};
