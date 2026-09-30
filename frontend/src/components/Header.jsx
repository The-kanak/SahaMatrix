import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Activity,
  Flame,
  FastForward,
  RotateCcw,
  FileSpreadsheet,
  Globe,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export const Header = ({
  role,
  setRole,
  onOpenOutbreakModal,
  onAdvanceDays,
  onResetSim,
  onOpenCsvModal,
  isAdvancing,
  isResetting,
  geminiConfigured,
}) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header
      style={{
        backgroundColor: '#0f172a',
        color: '#ffffff',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '1px solid #1e293b',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      }}
    >
      {/* Brand & Tagline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img
          src="/logo.png"
          alt="SahaMatrix Logo"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            objectFit: 'contain',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em' }}>
              {t('appTitle')}
            </span>
            <span
              style={{
                backgroundColor: geminiConfigured ? '#14532d' : '#334155',
                color: geminiConfigured ? '#86efac' : '#cbd5e1',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '10px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={11} />
              {geminiConfigured ? t('poweredByGemini') : t('fallbackMode')}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            {t('tagline')}
          </div>
        </div>
      </div>

      {/* Center: Simulation Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={onOpenOutbreakModal}
          style={{
            backgroundColor: '#b91c1c',
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
            transition: 'background-color 0.15s',
          }}
          title="Simulate epidemic surge in a state"
        >
          <Flame size={14} />
          {t('simulateOutbreak')}
        </button>

        <button
          onClick={onAdvanceDays}
          disabled={isAdvancing}
          style={{
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: isAdvancing ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: isAdvancing ? 0.7 : 1,
          }}
          title="Step time forward by 3 days with real daily consumption"
        >
          <FastForward size={14} />
          {isAdvancing ? 'Advancing...' : t('advance3d')}
        </button>

        <button
          onClick={onResetSim}
          disabled={isResetting}
          style={{
            backgroundColor: '#334155',
            color: '#f8fafc',
            border: '1px solid #475569',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: isResetting ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="Reset simulation to initial baseline state"
        >
          <RotateCcw size={13} />
          {t('resetSim')}
        </button>

        <button
          onClick={onOpenCsvModal}
          style={{
            backgroundColor: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="Upload bulk stock updates from CSV"
        >
          <FileSpreadsheet size={13} />
          {t('importCsv')}
        </button>
      </div>

      {/* Right: Role Switcher & Language Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Role Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <UserCheck size={14} style={{ color: '#94a3b8' }} />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '5px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            <option value="secretary">{t('roleSecretary')}</option>
            <option value="cmo">{t('roleCMO')}</option>
            <option value="pharmacist">{t('rolePharmacist')}</option>
          </select>
        </div>

        {/* Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Globe size={14} style={{ color: '#94a3b8' }} />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '5px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="mr">मराठी</option>
            <option value="ta">தமிழ்</option>
          </select>
        </div>
      </div>
    </header>
  );
};
