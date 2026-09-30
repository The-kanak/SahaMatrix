import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Network, RotateCcw, ShieldCheck, CheckCircle2, TrendingDown } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { api } from '../services/api';

export const FederationPanel = ({ flMetrics, onRetrain, isRetraining }) => {
  const { t } = useLanguage();

  const states = flMetrics?.states || [
    { state: 'MH', samples: 46, localMae: 4.8, federatedMae: 4.1 },
    { state: 'UP', samples: 14, localMae: 12.4, federatedMae: 6.8 },
    { state: 'TN', samples: 46, localMae: 5.1, federatedMae: 4.3 },
  ];

  const roundLog = flMetrics?.roundLog
    ? flMetrics.roundLog.map((r) => ({
        round: r.round,
        loss: r.globalLoss !== undefined ? r.globalLoss : (r.loss !== undefined ? r.loss : 0),
      }))
    : [
        { round: 1, loss: 14.2 },
        { round: 2, loss: 11.8 },
        { round: 3, loss: 9.6 },
        { round: 4, loss: 8.1 },
        { round: 5, loss: 7.2 },
        { round: 6, loss: 6.5 },
        { round: 7, loss: 5.9 },
        { round: 8, loss: 5.4 },
      ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Overview & Disclaimer */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                backgroundColor: '#f3e8ff',
                color: '#9333ea',
                width: '34px',
                height: '34px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Network size={20} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                {t('tabFederation')} — FedAvg Multi-State Coordination
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Privacy-preserving decentralized learning across Maharashtra, Uttar Pradesh, and Tamil Nadu
              </div>
            </div>
          </div>

          <button
            onClick={onRetrain}
            disabled={isRetraining}
            style={{
              backgroundColor: '#9333ea',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: isRetraining ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RotateCcw size={13} />
            {isRetraining ? 'Simulating 8 Rounds...' : t('retrainFederation')}
          </button>
        </div>

        {/* Technical Transparency Note */}
        <div
          style={{
            marginTop: '12px',
            backgroundColor: '#faf5ff',
            border: '1px solid #e9d5ff',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '11px',
            color: '#581c87',
            lineHeight: 1.5,
          }}
        >
          <strong>Hackathon Transparency Note:</strong> This is an in-process federated learning simulation utilizing
          standard FedAvg weight aggregation over 8 iterations. Each Indian state trains isolated local linear
          weights on held-out telemetry without pooling raw patient or consumption logs centrally. Uttar Pradesh
          (having noisy short-window telemetry) demonstrates a dramatic <strong>~45% error reduction</strong> by
          collaboratively aggregating weights with MH and TN.
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
        {/* BarChart: Local vs Federated MAE */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            padding: '14px',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
            Forecast Accuracy: Local Model vs Federated Model
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
            Mean Absolute Error (MAE in units) on 14-day test horizon (Lower is better)
          </div>

          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={states} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="state" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip formatter={(val) => [`${val} MAE`, '']} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="localMae" name="Local Model MAE (Isolated)" fill="#f87171" radius={[4, 4, 0, 0]} />
                <Bar dataKey="federatedMae" name="Federated Model MAE (FedAvg)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LineChart: 8-Round Loss Convergence */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            padding: '14px',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
            FedAvg Convergence Across 8 Communication Rounds
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
            Network-wide average loss declining steadily round-by-round
          </div>

          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={roundLog} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="round" tick={{ fontSize: 11, fill: '#475569' }} label={{ value: 'Round', position: 'insideBottomRight', offset: -5 }} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip formatter={(val) => [`${val}`, 'Loss']} />
                <Line
                  type="monotone"
                  dataKey="loss"
                  name="Global Loss"
                  stroke="#9333ea"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#9333ea' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
