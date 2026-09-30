import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { FileSpreadsheet, X, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export const CsvImportModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUseSample = async () => {
    try {
      const response = await fetch('/sample-stock.csv');
      const blob = await response.blob();
      const sampleFile = new File([blob], 'sample-stock.csv', { type: 'text/csv' });
      setFile(sampleFile);
      setResult(null);
    } catch (err) {
      alert('Could not load sample CSV: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await api.importStockCsv(file);
      setResult(res);
      if (onSuccess) onSuccess();
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setIsUploading(false);
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
          maxWidth: '500px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
      >
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
            <FileSpreadsheet size={18} />
            {t('importCsv')}
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
            Upload warehouse bulk shipments or physical inventory updates in standard CSV format:
            <code style={{ backgroundColor: '#f1f5f9', padding: '2px 5px', borderRadius: '4px', marginLeft: '4px' }}>
              phcId,medicine,quantity
            </code>
          </p>

          <div
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              marginBottom: '14px',
            }}
          >
            <input
              type="file"
              accept=".csv"
              id="csv-file-input"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label
              htmlFor="csv-file-input"
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Upload size={28} style={{ color: '#0284c7' }} />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                {file ? file.name : 'Click to select CSV file'}
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Supports standard comma-separated values
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={handleUseSample}
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
              Use Sample CSV (sample-stock.csv)
            </button>
            {file && (
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {(file.size / 1024).toFixed(1)} KB
              </span>
            )}
          </div>

          {result && (
            <div
              style={{
                backgroundColor: result.error ? '#fee2e2' : '#f0fdf4',
                border: result.error ? '1px solid #fecaca' : '1px solid #bbf7d0',
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '14px',
                fontSize: '12px',
              }}
            >
              {result.error ? (
                <div style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={15} />
                  <span>Import failed: {result.error}</span>
                </div>
              ) : (
                <div>
                  <div style={{ color: '#16a34a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <CheckCircle2 size={15} />
                    <span>Successfully imported {result.accepted} inventory rows!</span>
                  </div>
                  {result.rejected && result.rejected.length > 0 && (
                    <div style={{ color: '#b45309', fontSize: '11px' }}>
                      {result.rejected.length} rows were skipped due to formatting.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
              Close
            </button>
            <button
              type="submit"
              disabled={!file || isUploading}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: !file || isUploading ? 'not-allowed' : 'pointer',
                opacity: !file || isUploading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Upload size={15} />
              {isUploading ? 'Importing...' : 'Upload & Commit to MySQL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
