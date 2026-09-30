import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { FileText, Sparkles, Copy, Check, Volume2, RotateCcw } from 'lucide-react';

export const SituationBriefPanel = ({
  briefData,
  briefState,
  setBriefState,
  onRefreshBrief,
  isLoading,
  onSpeak,
}) => {
  const { language, t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (briefData?.brief && Array.isArray(briefData.brief)) {
      navigator.clipboard.writeText(briefData.brief.join('\n\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSpeakAll = () => {
    if (briefData?.brief && onSpeak) {
      const fullText = briefData.brief.join('. ');
      onSpeak(fullText);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Top Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="/logo.png"
            alt="SM Logo"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              objectFit: 'contain',
              border: '1px solid #e2e8f0',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                {t('tabBrief')}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: briefData?.source === 'gemini' ? '#dcfce7' : '#f1f5f9',
                  color: briefData?.source === 'gemini' ? '#15803d' : '#64748b',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Sparkles size={10} />
                {briefData?.source === 'gemini' ? t('poweredByGemini') : t('fallbackMode')}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Daily executive synthesis for Health Secretaries and CMOs
            </div>
          </div>
        </div>

        {/* State filter & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={briefState}
            onChange={(e) => setBriefState(e.target.value)}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              color: '#334155',
              fontWeight: '500',
            }}
          >
            <option value="ALL">{t('allStates')}</option>
            <option value="MH">Maharashtra (MH)</option>
            <option value="UP">Uttar Pradesh (UP)</option>
            <option value="TN">Tamil Nadu (TN)</option>
          </select>

          <button
            onClick={onRefreshBrief}
            disabled={isLoading}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              color: '#334155',
              fontSize: '11px',
              cursor: isLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RotateCcw size={12} />
            {t('refreshBrief')}
          </button>

          <button
            onClick={handleCopy}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              color: copied ? '#16a34a' : '#334155',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? t('copied') : t('copyBrief')}
          </button>

          {window.speechSynthesis && (
            <button
              onClick={handleSpeakAll}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#0284c7',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Volume2 size={12} />
              {t('readAloud')}
            </button>
          )}
        </div>
      </div>

      {/* 5-Bullet Executive Brief */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '14px 18px',
        }}
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px' }}>
            Consulting Gemini for fresh executive synthesis...
          </div>
        ) : briefData?.brief && briefData.brief.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {briefData.brief.map((bullet, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: '13px',
                  color: '#1e293b',
                  lineHeight: 1.5,
                }}
              >
                {bullet}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
            No brief available. Click "Refresh Brief" to generate.
          </div>
        )}
      </div>
    </div>
  );
};
