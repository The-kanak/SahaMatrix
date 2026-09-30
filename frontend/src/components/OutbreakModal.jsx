import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Flame, X } from 'lucide-react';

export const OutbreakModal = ({ isOpen, onClose, onApplyOutbreak }) => {
  const { t } = useLanguage();
  const [state, setState] = useState('UP');
  const [medicine, setMedicine] = useState('Paracetamol');
  const [multiplier, setMultiplier] = useState(2.5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onApplyOutbreak(state, medicine, multiplier);
      onClose();
    } catch (err) {
      alert('Outbreak simulation failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            backgroundColor: '#991b1b',
            color: '#ffffff',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '15px' }}>
            <Flame size={18} />
            {t('simulateOutbreak')}
          </div>
          <button
            onClick={onClose}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '18px' }}>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px', lineHeight: 1.5 }}>
            Simulate a sudden regional epidemic surge (e.g. viral fever, malaria, or diarrheal outbreak).
            The local consumption rate will instantly multiply for all PHCs across the selected state.
          </p>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
              Affected Indian State
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
              }}
            >
              <option value="MH">Maharashtra (MH - 24 PHCs)</option>
              <option value="UP">Uttar Pradesh (UP - 24 PHCs)</option>
              <option value="TN">Tamil Nadu (TN - 24 PHCs)</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
              Surge Medicine
            </label>
            <select
              value={medicine}
              onChange={(e) => setMedicine(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
              }}
            >
              <option value="Paracetamol">Paracetamol (Antipyretic/Analgesic)</option>
              <option value="ORS">ORS (Oral Rehydration Salts)</option>
              <option value="Amoxicillin">Amoxicillin (Antibiotic)</option>
              <option value="Insulin">Insulin (Antidiabetic)</option>
              <option value="Artemisinin ACT">Artemisinin ACT (Antimalarial)</option>
            </select>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
              <span>Demand Surge Multiplier</span>
              <span style={{ color: '#b91c1c', fontWeight: '700' }}>{multiplier}x Normal Demand</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="4.0"
              step="0.5"
              value={multiplier}
              onChange={(e) => setMultiplier(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
              <span>1.5x (Moderate)</span>
              <span>2.5x (Severe)</span>
              <span>4.0x (Emergency)</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#b91c1c',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: isSubmitting ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Flame size={15} />
              {isSubmitting ? 'Simulating...' : 'Trigger Surge Outbreak'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
