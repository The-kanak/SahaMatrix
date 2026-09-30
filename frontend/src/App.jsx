import React, { useState, useEffect, useCallback } from 'react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { api } from './services/api';
import { Header } from './components/Header';
import { RoleBanner } from './components/RoleBanner';
import { KPIBar } from './components/KPIBar';
import { MapPanel } from './components/MapPanel';
import { FacilityPanel } from './components/FacilityPanel';
import { AlertsPanel } from './components/AlertsPanel';
import { RedistributionPanel } from './components/RedistributionPanel';
import { SituationBriefPanel } from './components/SituationBriefPanel';
import { AskAIPanel } from './components/AskAIPanel';
import { FederationPanel } from './components/FederationPanel';
import { ScalePanel } from './components/ScalePanel';
import { OutbreakModal } from './components/OutbreakModal';
import { CsvImportModal } from './components/CsvImportModal';
import { RegisterUploadModal } from './components/RegisterUploadModal';
import {
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  FileText,
  MessageSquare,
  Network,
  Gauge,
} from 'lucide-react';

function SahaMatrixDashboard() {
  const { language, t } = useLanguage();

  // Navigation & Role State
  const [activeTab, setActiveTab] = useState('alerts');
  const [role, setRole] = useState('secretary'); // 'secretary' | 'cmo' | 'pharmacist'

  // Filters & Selected Facility
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedPhcId, setSelectedPhcId] = useState('phc-up-01');
  const [selectedMedicine, setSelectedMedicine] = useState('Paracetamol');
  const [activeTransfer, setActiveTransfer] = useState(null);

  // Live Telemetry State
  const [summaryData, setSummaryData] = useState(null);
  const [phcs, setPhcs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [impactData, setImpactData] = useState(null);
  const [selectedPhcDetail, setSelectedPhcDetail] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [briefData, setBriefData] = useState(null);
  const [flMetrics, setFlMetrics] = useState(null);
  const [geminiConfigured, setGeminiConfigured] = useState(false);

  // UI Loaders
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isLoadingBrief, setIsLoadingBrief] = useState(false);
  const [isRetrainingFl, setIsRetrainingFl] = useState(false);

  // Modals
  const [showOutbreakModal, setShowOutbreakModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Load Base Network Data
  const loadNetworkData = useCallback(async () => {
    try {
      const [sumRes, phcList, alertList, recList, impactRes, healthRes] = await Promise.all([
        api.getSummary().catch(() => null),
        api.getPhcs(selectedState).catch(() => []),
        api.getAlerts(selectedState).catch(() => []),
        api.getRecommendations().catch(() => []),
        api.getImpact().catch(() => null),
        api.getHealth().catch(() => null),
      ]);

      if (sumRes) setSummaryData(sumRes);
      if (phcList) setPhcs(phcList);
      if (alertList) setAlerts(alertList);
      if (recList) setRecommendations(recList);
      if (impactRes) setImpactData(impactRes);
      if (healthRes) setGeminiConfigured(!!healthRes.geminiConfigured);
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    }
  }, [selectedState]);

  // Load PHC Detail & Forecast
  const loadPhcDetail = useCallback(async (phcId, medicine) => {
    if (!phcId) return;
    try {
      const detail = await api.getPhcDetail(phcId);
      setSelectedPhcDetail(detail);

      const medToFetch = medicine || selectedMedicine;
      const forecast = await api.getForecast(phcId, medToFetch);
      setForecastData(forecast || []);
    } catch (err) {
      console.error(`Failed to load PHC ${phcId}:`, err);
    }
  }, [selectedMedicine]);

  // Load Executive Brief
  const loadSituationBrief = useCallback(async () => {
    setIsLoadingBrief(true);
    try {
      const brief = await api.getSituationBrief(selectedState, language);
      setBriefData(brief);
    } catch (err) {
      console.error('Failed to load brief:', err);
    } finally {
      setIsLoadingBrief(false);
    }
  }, [selectedState, language]);

  // Load Federated Learning Metrics
  const loadFlMetrics = useCallback(async () => {
    try {
      const metrics = await api.getFlMetrics();
      setFlMetrics(metrics);
    } catch (err) {
      console.error('Failed to load FL metrics:', err);
    }
  }, []);

  // Initial Boot
  useEffect(() => {
    loadNetworkData();
    loadSituationBrief();
    loadFlMetrics();
  }, [loadNetworkData, loadSituationBrief, loadFlMetrics]);

  // When selected PHC or medicine changes
  useEffect(() => {
    if (selectedPhcId) {
      loadPhcDetail(selectedPhcId, selectedMedicine);
    }
  }, [selectedPhcId, selectedMedicine, loadPhcDetail]);

  // When switching to Brief tab
  useEffect(() => {
    if (activeTab === 'brief' && !briefData) {
      loadSituationBrief();
    }
  }, [activeTab, briefData, loadSituationBrief]);

  // Simulation Handlers
  const handleAdvanceDays = async () => {
    setIsAdvancing(true);
    try {
      await api.simulateAdvance(3);
      await loadNetworkData();
      if (selectedPhcId) await loadPhcDetail(selectedPhcId, selectedMedicine);
      await loadSituationBrief();
    } catch (err) {
      alert('Failed to advance days: ' + err.message);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleResetSim = async () => {
    setIsResetting(true);
    try {
      await api.simulateReset();
      await loadNetworkData();
      if (selectedPhcId) await loadPhcDetail(selectedPhcId, selectedMedicine);
      await loadSituationBrief();
    } catch (err) {
      alert('Failed to reset simulation: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleApplyOutbreak = async (st, med, mult) => {
    await api.simulateOutbreak(st, med, mult);
    setSelectedState(st);
    await loadNetworkData();
    await loadSituationBrief();
    setActiveTab('alerts');
  };

  const handleApplySingleTransfer = async (recId) => {
    await api.applyRecommendations([recId]);
    await loadNetworkData();
    if (selectedPhcId) await loadPhcDetail(selectedPhcId, selectedMedicine);
  };

  const handleApplyAllTransfers = async () => {
    setIsApplying(true);
    try {
      const allIds = recommendations.map((r) => r.id);
      await api.applyRecommendations(allIds);
      await loadNetworkData();
      if (selectedPhcId) await loadPhcDetail(selectedPhcId, selectedMedicine);
      await loadSituationBrief();
    } catch (err) {
      alert('Failed to apply all transfers: ' + err.message);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRetrainFederation = async () => {
    setIsRetrainingFl(true);
    try {
      const updated = await api.trainFederation();
      setFlMetrics(updated);
    } catch (err) {
      alert('Retraining failed: ' + err.message);
    } finally {
      setIsRetrainingFl(false);
    }
  };

  // Derive available districts for selected state
  const availableDistricts = React.useMemo(() => {
    const list = phcs.filter((p) => selectedState === 'ALL' || p.state === selectedState);
    const distSet = new Set(list.map((p) => p.district));
    return Array.from(distSet).sort();
  }, [phcs, selectedState]);

  // Filtered PHC list for map and details
  const filteredPhcs = React.useMemo(() => {
    return phcs.filter((p) => {
      if (selectedState !== 'ALL' && p.state !== selectedState) return false;
      if (selectedDistrict && p.district !== selectedDistrict) return false;
      return true;
    });
  }, [phcs, selectedState, selectedDistrict]);

  const selectedPhcObj = phcs.find((p) => p.id === selectedPhcId);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9' }}>
      {/* 1. Global Header */}
      <Header
        role={role}
        setRole={(newRole) => {
          setRole(newRole);
          if (newRole === 'pharmacist' && !selectedPhcId) {
            setSelectedPhcId('phc-up-01');
            setActiveTab('phc');
          }
        }}
        onOpenOutbreakModal={() => setShowOutbreakModal(true)}
        onAdvanceDays={handleAdvanceDays}
        onResetSim={handleResetSim}
        onOpenCsvModal={() => setShowCsvModal(true)}
        isAdvancing={isAdvancing}
        isResetting={isResetting}
        geminiConfigured={geminiConfigured}
      />

      {/* 2. Persona Role Context Banner */}
      <RoleBanner
        role={role}
        selectedState={selectedState}
        selectedDistrict={selectedDistrict}
        selectedPhcName={selectedPhcObj?.name}
      />

      {/* 3. National KPI Bar */}
      <KPIBar summaryData={summaryData} impactData={impactData} />

      {/* 4. Main Two-Column Layout */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          padding: '8px 16px 16px 16px',
          gap: '14px',
          minHeight: 0,
        }}
      >
        {/* Left Column (58%): Interactive GIS Network Map */}
        <div style={{ flex: '0 0 58%', display: 'flex', flexDirection: 'column' }}>
          <MapPanel
            phcs={filteredPhcs}
            selectedState={selectedState}
            setSelectedState={setSelectedState}
            selectedDistrict={selectedDistrict}
            setSelectedDistrict={setSelectedDistrict}
            districts={availableDistricts}
            selectedPhcId={selectedPhcId}
            onSelectPhc={(id) => {
              setSelectedPhcId(id);
              if (role === 'pharmacist') setActiveTab('phc');
            }}
            selectedPhc={selectedPhcObj}
            activeTransfer={activeTransfer}
          />
        </div>

        {/* Right Column (42%): Tabbed Intelligence Console */}
        <div
          style={{
            flex: '0 0 42%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}
        >
          {/* Tabs Navigation Header */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              overflowX: 'auto',
            }}
          >
            <button
              onClick={() => setActiveTab('alerts')}
              style={{
                flex: 1,
                padding: '10px 8px',
                border: 'none',
                borderBottom: activeTab === 'alerts' ? '2px solid #dc2626' : '2px solid transparent',
                backgroundColor: activeTab === 'alerts' ? '#ffffff' : 'transparent',
                fontWeight: activeTab === 'alerts' ? '700' : '500',
                color: activeTab === 'alerts' ? '#dc2626' : '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
              }}
            >
              <AlertTriangle size={14} />
              <span>{t('tabAlerts')}</span>
              {alerts.length > 0 && (
                <span style={{ backgroundColor: '#dc2626', color: '#fff', padding: '1px 5px', borderRadius: '10px', fontSize: '10px' }}>
                  {alerts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('transfers')}
              style={{
                flex: 1,
                padding: '10px 8px',
                border: 'none',
                borderBottom: activeTab === 'transfers' ? '2px solid #0284c7' : '2px solid transparent',
                backgroundColor: activeTab === 'transfers' ? '#ffffff' : 'transparent',
                fontWeight: activeTab === 'transfers' ? '700' : '500',
                color: activeTab === 'transfers' ? '#0284c7' : '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
              }}
            >
              <ArrowRightLeft size={14} />
              <span>{t('tabTransfers')}</span>
              {recommendations.length > 0 && (
                <span style={{ backgroundColor: '#0284c7', color: '#fff', padding: '1px 5px', borderRadius: '10px', fontSize: '10px' }}>
                  {recommendations.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('phc')}
              style={{
                flex: 1,
                padding: '10px 8px',
                border: 'none',
                borderBottom: activeTab === 'phc' ? '2px solid #7c3aed' : '2px solid transparent',
                backgroundColor: activeTab === 'phc' ? '#ffffff' : 'transparent',
                fontWeight: activeTab === 'phc' ? '700' : '500',
                color: activeTab === 'phc' ? '#7c3aed' : '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
              }}
            >
              <Building2 size={14} />
              <span>{t('tabFacility')}</span>
            </button>

            <button
              onClick={() => setActiveTab('brief')}
              style={{
                flex: 1,
                padding: '10px 8px',
                border: 'none',
                borderBottom: activeTab === 'brief' ? '2px solid #059669' : '2px solid transparent',
                backgroundColor: activeTab === 'brief' ? '#ffffff' : 'transparent',
                fontWeight: activeTab === 'brief' ? '700' : '500',
                color: activeTab === 'brief' ? '#059669' : '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
              }}
            >
              <FileText size={14} />
              <span>{t('tabBrief')}</span>
            </button>

            <button
              onClick={() => setActiveTab('ask')}
              style={{
                flex: 1,
                padding: '10px 8px',
                border: 'none',
                borderBottom: activeTab === 'ask' ? '2px solid #0891b2' : '2px solid transparent',
                backgroundColor: activeTab === 'ask' ? '#ffffff' : 'transparent',
                fontWeight: activeTab === 'ask' ? '700' : '500',
                color: activeTab === 'ask' ? '#0891b2' : '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
              }}
            >
              <MessageSquare size={14} />
              <span>{t('tabAsk')}</span>
            </button>

            <button
              onClick={() => setActiveTab('federation')}
              style={{
                flex: 1,
                padding: '10px 8px',
                border: 'none',
                borderBottom: activeTab === 'federation' ? '2px solid #9333ea' : '2px solid transparent',
                backgroundColor: activeTab === 'federation' ? '#ffffff' : 'transparent',
                fontWeight: activeTab === 'federation' ? '700' : '500',
                color: activeTab === 'federation' ? '#9333ea' : '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
              }}
            >
              <Network size={14} />
              <span>{t('tabFederation')}</span>
            </button>

            <button
              onClick={() => setActiveTab('scale')}
              style={{
                flex: 1,
                padding: '10px 8px',
                border: 'none',
                borderBottom: activeTab === 'scale' ? '2px solid #ea580c' : '2px solid transparent',
                backgroundColor: activeTab === 'scale' ? '#ffffff' : 'transparent',
                fontWeight: activeTab === 'scale' ? '700' : '500',
                color: activeTab === 'scale' ? '#ea580c' : '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
              }}
            >
              <Gauge size={14} />
              <span>{t('tabScale')}</span>
            </button>
          </div>

          {/* Active Tab Panel Content */}
          <div style={{ flex: 1, padding: '14px', overflowY: 'auto' }}>
            {activeTab === 'alerts' && (
              <AlertsPanel
                alerts={alerts}
                selectedPhcId={selectedPhcId}
                onSelectPhc={(id) => {
                  setSelectedPhcId(id);
                  loadPhcDetail(id, selectedMedicine);
                }}
                onExplainPhc={(id) => {
                  setSelectedPhcId(id);
                }}
              />
            )}

            {activeTab === 'transfers' && (
              <RedistributionPanel
                recommendations={recommendations}
                onApplySingle={handleApplySingleTransfer}
                onApplyAll={handleApplyAllTransfers}
                isApplying={isApplying}
              />
            )}

            {activeTab === 'phc' && (
              <FacilityPanel
                selectedPhc={selectedPhcDetail}
                selectedMedicine={selectedMedicine}
                setSelectedMedicine={setSelectedMedicine}
                forecastData={forecastData}
                onOpenPhotoModal={() => setShowPhotoModal(true)}
              />
            )}

            {activeTab === 'brief' && (
              <SituationBriefPanel
                briefData={briefData}
                briefState={selectedState}
                setBriefState={(st) => {
                  setSelectedState(st);
                  loadSituationBrief();
                }}
                onRefreshBrief={loadSituationBrief}
                isLoading={isLoadingBrief}
                onSpeak={(txt) => {
                  if (!window.speechSynthesis) return;
                  window.speechSynthesis.cancel();
                  const u = new SpeechSynthesisUtterance(txt);
                  u.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : language === 'ta' ? 'ta-IN' : 'en-US';
                  window.speechSynthesis.speak(u);
                }}
              />
            )}

            {activeTab === 'ask' && (
              <AskAIPanel selectedState={selectedState} />
            )}

            {activeTab === 'federation' && (
              <FederationPanel
                flMetrics={flMetrics}
                onRetrain={handleRetrainFederation}
                isRetraining={isRetrainingFl}
              />
            )}

            {activeTab === 'scale' && (
              <ScalePanel />
            )}
          </div>
        </div>
      </main>

      {/* 5. Interactive Modals */}
      <OutbreakModal
        isOpen={showOutbreakModal}
        onClose={() => setShowOutbreakModal(false)}
        onApplyOutbreak={handleApplyOutbreak}
      />

      <CsvImportModal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onSuccess={() => {
          loadNetworkData();
          if (selectedPhcId) loadPhcDetail(selectedPhcId, selectedMedicine);
        }}
      />

      <RegisterUploadModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        phcId={selectedPhcId}
        phcName={selectedPhcObj?.name || selectedPhcId}
        onSuccess={() => {
          loadNetworkData();
          loadPhcDetail(selectedPhcId, selectedMedicine);
          loadSituationBrief();
        }}
      />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SahaMatrix ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '640px', margin: '40px auto', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #fecaca', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#dc2626', margin: '0 0 10px 0' }}>SahaMatrix Display Error</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>An unexpected error occurred while rendering the dashboard:</p>
          <pre style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#991b1b', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.stack || this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '16px', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Reload Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <SahaMatrixDashboard />
      </LanguageProvider>
    </ErrorBoundary>
  );
}
