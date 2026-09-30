import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Camera, X, Upload, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export const RegisterUploadModal = ({ isOpen, onClose, phcId, phcName, onSuccess }) => {
  const { t } = useLanguage();
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [extractedRows, setExtractedRows] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setExtractedRows([]);
      setErrorMsg(null);
    }
  };

  const handleUseSamplePhoto = async () => {
    try {
      setErrorMsg(null);
      const res = await fetch('/sample-register.jpg');
      const blob = await res.blob();
      const file = new File([blob], 'sample-register.jpg', { type: 'image/jpeg' });
      setPhotoFile(file);
      setPhotoPreview('/sample-register.jpg');
      setExtractedRows([]);
    } catch (err) {
      setErrorMsg('Could not load sample register image: ' + err.message);
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!photoFile) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const rows = await api.uploadRegisterPhoto(photoFile, phcId);
      setExtractedRows(rows || []);
    } catch (err) {
      setErrorMsg('Gemini Vision analysis failed: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuantityChange = (index, newQty) => {
    const updated = [...extractedRows];
    updated[index].quantity = parseFloat(newQty) || 0;
    setExtractedRows(updated);
  };

  const handleConfirmUpdate = async () => {
    if (!extractedRows || extractedRows.length === 0) return;
    setIsConfirming(true);
    setErrorMsg(null);
    try {
      await api.confirmRegisterStock(
        phcId,
        extractedRows.map((r) => ({
          medicine: r.medicine,
          quantity: parseFloat(r.quantity),
        }))
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg('Confirmation failed: ' + err.message);
    } finally {
      setIsConfirming(false);
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
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '15px' }}>
            <Camera size={18} style={{ color: '#38bdf8' }} />
            {t('ocrTitle')}
          </div>
          <button
            onClick={onClose}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px', overflowY: 'auto', flex: 1 }}>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Target Facility:</span>{' '}
            <strong style={{ fontSize: '13px', color: '#0f172a' }}>{phcName}</strong>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px', lineHeight: 1.5 }}>
            {t('ocrSubtitle')}
          </p>

          {/* Photo Drop Zone */}
          <div
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              marginBottom: '12px',
            }}
          >
            <input
              type="file"
              accept="image/*"
              id="register-photo-input"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label
              htmlFor="register-photo-input"
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Camera size={26} style={{ color: '#0284c7' }} />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                {photoFile ? photoFile.name : 'Take Photo or Select Register Image'}
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Supports JPG, PNG handwritten or printed physical registers
              </span>
            </label>
          </div>

          {/* Sample quick button & preview */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={handleUseSamplePhoto}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#0284c7',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Use Realistic Sample Paper Register
            </button>
            {photoFile && !extractedRows.length && (
              <button
                type="button"
                onClick={handleAnalyzePhoto}
                disabled={isAnalyzing}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: isAnalyzing ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={14} />
                {isAnalyzing ? t('ocrAnalyzing') : t('ocrUploadBtn')}
              </button>
            )}
          </div>

          {/* Image Thumbnail preview if selected */}
          {photoPreview && (
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <img
                src={photoPreview}
                alt="Register Preview"
                style={{
                  maxHeight: '120px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  objectFit: 'contain',
                }}
              />
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#dc2626',
                fontSize: '12px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertCircle size={15} />
              {errorMsg}
            </div>
          )}

          {/* Extracted Stock Table (Editable) */}
          {extractedRows.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                  {t('ocrReviewTitle')}
                </span>
                <span style={{ fontSize: '11px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> Extracted via Gemini Vision
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                {t('ocrReviewDesc')}
              </p>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: '600' }}>{t('ocrColMedicine')}</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: '600' }}>{t('ocrColQuantity')}</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: '600' }}>{t('ocrColConfidence')}</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 8px', fontWeight: '500', color: '#1e293b' }}>
                        {row.medicine}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => handleQuantityChange(idx, e.target.value)}
                          style={{
                            width: '80px',
                            textAlign: 'right',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#059669', fontWeight: '600' }}>
                        {(row.confidence * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            padding: '12px 18px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            {t('ocrCancelBtn')}
          </button>
          <button
            type="button"
            onClick={handleConfirmUpdate}
            disabled={extractedRows.length === 0 || isConfirming}
            style={{
              padding: '7px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              cursor: extractedRows.length === 0 || isConfirming ? 'not-allowed' : 'pointer',
              opacity: extractedRows.length === 0 || isConfirming ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle2 size={15} />
            {isConfirming ? 'Persisting...' : t('ocrConfirmBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};
