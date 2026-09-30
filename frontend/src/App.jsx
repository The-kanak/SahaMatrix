import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  Polyline,
  useMap,
} from 'react-leaflet';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardCopy,
  FileSpreadsheet,
  HelpCircle,
  Mic,
  MicOff,
  Network,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Upload,
  Volume2,
  Zap,
} from 'lucide-react';

const MEDICINES = [
  'Paracetamol',
  'ORS',
  'Amoxicillin',
  'Insulin',
  'Artemisinin ACT',
];

const STATE_BOUNDS = {
  ALL: [
    [8.0, 68.0],
    [32.0, 89.0],
  ],
  MH: [
    [17.0, 72.5],
    [22.0, 80.5],
  ],
  UP: [
    [24.0, 77.0],
    [28.5, 84.5],
  ],
  TN: [
    [8.0, 76.0],
    [13.5, 80.5],
  ],
};

function MapBoundsController({ stateFilter, selectedPhc }) {
  const map = useMap();
  useEffect(() => {
    if (selectedPhc && selectedPhc.lat && selectedPhc.lng) {
      map.flyTo([selectedPhc.lat, selectedPhc.lng], 10, { duration: 1 });
    } else if (stateFilter && STATE_BOUNDS[stateFilter]) {
      map.flyToBounds(STATE_BOUNDS[stateFilter], { padding: [20, 20], duration: 1 });
    }
  }, [stateFilter, selectedPhc, map]);
  return null;
}

export default function App() {
  // Navigation & Filters
  const [activeTab, setActiveTab] = useState('alerts');
  const [selectedState, setSelectedState] = useState('ALL');
  const [language, setLanguage] = useState('en');
  const [selectedPhcId, setSelectedPhcId] = useState('phc-up-01');
  const [selectedMedicine, setSelectedMedicine] = useState('Paracetamol');
  const [activeTransfer, setActiveTransfer] = useState(null);

  // Live Data State
  const [summary, setSummary] = useState(null);
  const [phcs, setPhcs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [impact, setImpact] = useState(null);
  const [selectedPhcDetail, setSelectedPhcDetail] = useState(null);
  const [forecastData, setForecastData] = useState({ history: [], forecast: [] });
  const [flMetrics, setFlMetrics] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showOutbreakModal, setShowOutbreakModal] = useState(false);
  const [outbreakState, setOutbreakState] = useState('UP');
  const [outbreakMed, setOutbreakMed] = useState('Paracetamol');
  const [outbreakMultiplier, setOutbreakMultiplier] = useState(3.0);

  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvResult, setCsvResult] = useState(null);

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [extractedRows, setExtractedRows] = useState([]);
  const [photoUploading, setPhotoUploading] = useState(false);

  // AI Insights Cache
  const [aiInsights, setAiInsights] = useState({});
  const [loadingInsight, setLoadingInsight] = useState({});

  // Situation Brief
  const [briefState, setBriefState] = useState('ALL');
  const [briefData, setBriefData] = useState(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);

  // Ask SahaMatrix
  const [askQuestion, setAskQuestion] = useState('');
  const [askHistory, setAskHistory] = useState([
    {
      q: 'Which districts in Uttar Pradesh will run out of insulin this week?',
      a: 'The districts in Uttar Pradesh projected to face insulin stock-outs this week are: Kanpur, where stock is under 7 days.',
      source: 'gemini',
    },
  ]);
  const [askingAi, setAskingAi] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Scale Assumptions
  const [scaleAssumptions, setScaleAssumptions] = useState({
    phcs: 30000,
    peoplePerPhc: 30000,
    states: 36,
  });
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [benchmarking, setBenchmarking] = useState(false);

  // Fetch core periodic data
  const fetchPeriodicData = async () => {
    try {
      const [sumRes, phcRes, alertRes, recRes, impRes] = await Promise.all([
        fetch('/api/summary'),
        fetch('/api/phcs'),
        fetch('/api/alerts'),
        fetch('/api/recommendations'),
        fetch('/api/impact'),
      ]);

      if (!sumRes.ok) throw new Error('Backend HTTP ' + sumRes.status);

      const sumJson = await sumRes.json();
      const phcJson = await phcRes.json();
      const alertJson = await alertRes.json();
      const recJson = await recRes.json();
      const impJson = await impRes.json();

      setSummary(sumJson);
      setPhcs(Array.isArray(phcJson) ? phcJson : []);
      setAlerts(Array.isArray(alertJson) ? alertJson : []);
      setRecommendations(Array.isArray(recJson) ? recJson : []);
      setImpact(impJson);
      setBackendError(null);
    } catch (err) {
      setBackendError('Backend unreachable: ' + err.message);
    }
  };

  // Fetch selected PHC detail & forecast
  const fetchPhcDetail = async (id, med) => {
    if (!id) return;
    try {
      const [detailRes, fcRes] = await Promise.all([
        fetch(`/api/phcs/${id}`),
        fetch(`/api/phcs/${id}/forecast?medicine=${encodeURIComponent(med || selectedMedicine)}`),
      ]);
      if (detailRes.ok) {
        const detailJson = await detailRes.json();
        setSelectedPhcDetail(detailJson);
      }
      if (fcRes.ok) {
        const fcJson = await fcRes.json();
        setForecastData(fcJson);
      }
    } catch (err) {
      console.error('Error fetching PHC detail:', err);
    }
  };

  // Fetch FL Metrics
  const fetchFlMetrics = async () => {
    try {
      const res = await fetch('/api/fl/metrics');
      if (res.ok) {
        const json = await res.json();
        setFlMetrics(json);
      }
    } catch (err) {
      console.error('Error fetching FL metrics:', err);
    }
  };

  // Initial and periodic fetch
  useEffect(() => {
    fetchPeriodicData();
    fetchFlMetrics();
    const interval = setInterval(fetchPeriodicData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchPhcDetail(selectedPhcId, selectedMedicine);
  }, [selectedPhcId, selectedMedicine]);

  // Actions
  const handleTriggerOutbreak = async () => {
    setLoading(true);
    try {
      await fetch('/api/simulate/outbreak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: outbreakState,
          medicine: outbreakMed,
          multiplier: parseFloat(outbreakMultiplier),
        }),
      });
      setShowOutbreakModal(false);
      await fetchPeriodicData();
      if (selectedPhcId) fetchPhcDetail(selectedPhcId, selectedMedicine);
    } catch (err) {
      alert('Error triggering outbreak: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvance = async (days = 3) => {
    setLoading(true);
    try {
      await fetch(`/api/simulate/advance?days=${days}`, { method: 'POST' });
      await fetchPeriodicData();
      if (selectedPhcId) fetchPhcDetail(selectedPhcId, selectedMedicine);
    } catch (err) {
      alert('Error advancing simulation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await fetch('/api/simulate/reset', { method: 'POST' });
      await fetchPeriodicData();
      await fetchFlMetrics();
      if (selectedPhcId) fetchPhcDetail(selectedPhcId, selectedMedicine);
      setAiInsights({});
    } catch (err) {
      alert('Error resetting demo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTransfer = async (ids = []) => {
    setLoading(true);
    try {
      await fetch('/api/recommendations/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      await fetchPeriodicData();
      if (selectedPhcId) fetchPhcDetail(selectedPhcId, selectedMedicine);
      setActiveTransfer(null);
    } catch (err) {
      alert('Error applying transfer: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExplainAlert = async (alertItem) => {
    const key = `${alertItem.phcId}-${alertItem.medicine}-${language}`;
    if (aiInsights[key]) return;

    setLoadingInsight((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch('/api/ai/explain-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phcId: alertItem.phcId,
          medicine: alertItem.medicine,
          lang: language,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiInsights((prev) => ({ ...prev, [key]: json }));
      }
    } catch (err) {
      console.error('Error getting AI insight:', err);
    } finally {
      setLoadingInsight((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleFetchBrief = async () => {
    setLoadingBrief(true);
    try {
      const res = await fetch('/api/ai/situation-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: briefState === 'ALL' ? '' : briefState,
          lang: language,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setBriefData(json);
      }
    } catch (err) {
      console.error('Error fetching situation brief:', err);
    } finally {
      setLoadingBrief(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'brief') {
      handleFetchBrief();
    }
  }, [activeTab, briefState, language]);

  const handleAskQuestion = async (customQ) => {
    const qText = customQ || askQuestion;
    if (!qText.trim()) return;

    setAskingAi(true);
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: qText,
          state: selectedState === 'ALL' ? '' : selectedState,
          lang: language,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAskHistory((prev) => [
          { q: qText, a: json.answer, source: json.source },
          ...prev,
        ]);
        setAskQuestion('');
      }
    } catch (err) {
      console.error('Error asking AI:', err);
    } finally {
      setAskingAi(false);
    }
  };

  // Voice Web Speech API
  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Web Speech API is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang =
      language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : language === 'ta' ? 'ta-IN' : 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setAskQuestion(transcript);
      handleAskQuestion(transcript);
    };
    recognition.start();
  };

  const handleSpeak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang =
      language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : language === 'ta' ? 'ta-IN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('phcId', selectedPhcId);

    try {
      const res = await fetch('/api/ai/ingest-register', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const rows = await res.json();
        setExtractedRows(rows);
      }
    } catch (err) {
      alert('Error parsing register image: ' + err.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleConfirmRegister = async () => {
    try {
      await fetch('/api/ai/ingest-register/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phcId: selectedPhcId,
          rows: extractedRows.map((r) => ({
            medicine: r.medicine,
            quantity: parseFloat(r.quantity),
          })),
        }),
      });
      setShowPhotoModal(false);
      setExtractedRows([]);
      setPhotoFile(null);
      await fetchPeriodicData();
      if (selectedPhcId) fetchPhcDetail(selectedPhcId, selectedMedicine);
    } catch (err) {
      alert('Error confirming stock update: ' + err.message);
    }
  };

  const handleUploadCsv = async () => {
    if (!csvFile) return;
    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const res = await fetch('/api/import/stock-csv', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const json = await res.json();
        setCsvResult(json);
        await fetchPeriodicData();
        if (selectedPhcId) fetchPhcDetail(selectedPhcId, selectedMedicine);
      }
    } catch (err) {
      alert('Error importing CSV: ' + err.message);
    }
  };

  const handleRunBenchmark = async () => {
    setBenchmarking(true);
    try {
      const res = await fetch('/api/scale-test?phcs=5000');
      if (res.ok) {
        const json = await res.json();
        setBenchmarkResult(json);
      }
    } catch (err) {
      alert('Benchmark error: ' + err.message);
    } finally {
      setBenchmarking(false);
    }
  };

  const handleRetrainFl = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fl/train', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setFlMetrics(json);
      }
    } catch (err) {
      alert('Error retraining FL: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtered PHCs & Alerts
  const filteredPhcs = (phcs || []).filter(
    (p) => selectedState === 'ALL' || p.state === selectedState,
  );
  const filteredAlerts = (alerts || []).filter(
    (a) => selectedState === 'ALL' || a.state === selectedState,
  );

  const selectedPhcObj = (phcs || []).find((p) => p.id === selectedPhcId);

  // Chart data formatting (30-day history + 14-day forecast)
  const chartData = [];
  const hist = forecastData?.history || [];
  const fc = forecastData?.forecast || [];

  (hist || []).forEach((item) => {
    chartData.push({
      date: item.date.slice(5),
      history: item.units,
      forecast: null,
    });
  });

  if (hist.length > 0 && fc.length > 0) {
    chartData.push({
      date: hist[hist.length - 1].date.slice(5),
      history: hist[hist.length - 1].units,
      forecast: hist[hist.length - 1].units,
    });
  }

  (fc || []).forEach((item) => {
    chartData.push({
      date: item.date.slice(5),
      history: null,
      forecast: item.units,
    });
  });

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'CRITICAL':
        return '#ef4444';
      case 'HIGH':
        return '#f97316';
      case 'MEDIUM':
        return '#eab308';
      default:
        return '#10b981';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 'bold',
            }}
          >
            <TrendingUp size={22} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#0f172a',
                lineHeight: 1.2,
              }}
            >
              SahaMatrix
            </h1>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              Together, no stock-out. &bull; India Federated PHC Supply Resilience
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
            }}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="ta">தமிழ் (Tamil)</option>
          </select>

          <button
            onClick={() => setShowOutbreakModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fca5a5',
              padding: '7px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            <AlertTriangle size={15} /> Trigger Outbreak
          </button>

          <button
            onClick={() => handleAdvance(3)}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '7px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Advance 3 Days
          </button>

          <button
            onClick={handleReset}
            disabled={loading}
            style={{
              backgroundColor: '#ffffff',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              padding: '7px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            Reset Demo
          </button>

          <button
            onClick={() => setShowCsvModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '7px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            <FileSpreadsheet size={15} /> Import CSV
          </button>
        </div>
      </header>

      {/* Backend Error Banner */}
      {backendError && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            padding: '8px 20px',
            fontSize: '13px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} />
          {backendError} (Ensure backend server is running on port 8081/8080)
        </div>
      )}

      {/* KPI Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          padding: '12px 20px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px',
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            border: '1px solid #f1f5f9',
          }}
        >
          <Activity size={22} color="#0284c7" />
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
              PHCS MONITORED
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              {summary?.totals?.phcs || 72}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px',
            backgroundColor: '#fff5f5',
            borderRadius: '6px',
            border: '1px solid #fee2e2',
          }}
        >
          <AlertTriangle size={22} color="#ef4444" />
          <div>
            <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: '500' }}>
              CRITICAL ALERTS (&lt;3D)
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626' }}>
              {summary?.totals?.criticalAlerts || 0}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px',
            backgroundColor: '#f0fdf4',
            borderRadius: '6px',
            border: '1px solid #dcfce7',
          }}
        >
          <ArrowRightLeft size={22} color="#16a34a" />
          <div>
            <div style={{ fontSize: '11px', color: '#15803d', fontWeight: '500' }}>
              RECOMMENDED TRANSFERS
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#16a34a' }}>
              {summary?.totals?.recommendations || 0}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px',
            backgroundColor: '#eff6ff',
            borderRadius: '6px',
            border: '1px solid #dbeafe',
          }}
        >
          <CheckCircle2 size={22} color="#2563eb" />
          <div>
            <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: '500' }}>
              STOCK-OUTS PREVENTED
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>
              {impact?.prevented ?? 26}
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          backgroundColor: '#f1f5f9',
        }}
      >
        {/* Left Column (60%): Interactive Map */}
        <div
          style={{
            flex: '0 0 60%',
            display: 'flex',
            flexDirection: 'column',
            padding: '12px',
            gap: '8px',
          }}
        >
          {/* State Filter Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
              State View:
            </span>
            {[
              { id: 'ALL', name: 'All States (72)' },
              { id: 'MH', name: 'Maharashtra (24)' },
              { id: 'UP', name: 'Uttar Pradesh (24)' },
              { id: 'TN', name: 'Tamil Nadu (24)' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setSelectedState(st.id);
                  setSelectedPhcId(null);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor:
                    selectedState === st.id ? '#0284c7' : '#f1f5f9',
                  color: selectedState === st.id ? '#ffffff' : '#475569',
                }}
              >
                {st.name}
              </button>
            ))}

            {/* Map Legend */}
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                color: '#64748b',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                  }}
                />{' '}
                Critical
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#f97316',
                  }}
                />{' '}
                High
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#eab308',
                  }}
                />{' '}
                Medium
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                  }}
                />{' '}
                OK
              </span>
            </div>
          </div>

          {/* Leaflet Map */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #cbd5e1',
            }}
          >
            <MapContainer
              center={[22.5, 79.0]}
              zoom={5}
              scrollWheelZoom={true}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapBoundsController
                stateFilter={selectedState}
                selectedPhc={selectedPhcObj}
              />

              {/* Render PHCs as CircleMarkers */}
              {(filteredPhcs || []).map((phc) => {
                const isSelected = phc.id === selectedPhcId;
                return (
                  <CircleMarker
                    key={phc.id}
                    center={[phc.lat, phc.lng]}
                    radius={isSelected ? 10 : 7}
                    pathOptions={{
                      color: isSelected ? '#000000' : '#ffffff',
                      weight: isSelected ? 3 : 1.5,
                      fillColor: getRiskColor(phc.risk),
                      fillOpacity: 0.9,
                    }}
                    eventHandlers={{
                      click: () => {
                        setSelectedPhcId(phc.id);
                        setActiveTab('phc');
                      },
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                      <div style={{ fontSize: '12px', lineHeight: 1.3 }}>
                        <strong>{phc.name}</strong>
                        <div>
                          {phc.district}, {phc.state}
                        </div>
                        <div style={{ marginTop: '2px', fontWeight: 'bold' }}>
                          Risk: {phc.risk} ({phc.minDaysOfStock}d)
                        </div>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}

              {/* Polyline for active transfer hover/select */}
              {activeTransfer && activeTransfer.from && activeTransfer.to && (
                <Polyline
                  positions={[
                    [activeTransfer.from.lat, activeTransfer.from.lng],
                    [activeTransfer.to.lat, activeTransfer.to.lng],
                  ]}
                  pathOptions={{
                    color: '#0284c7',
                    weight: 4,
                    dashArray: '6, 6',
                  }}
                />
              )}
            </MapContainer>
          </div>
        </div>

        {/* Right Column (40%): Tab Navigation & Panels */}
        <div
          style={{
            flex: '0 0 40%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            borderLeft: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          {/* Tab Headers */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              overflowX: 'auto',
              backgroundColor: '#f8fafc',
            }}
          >
            {[
              { id: 'alerts', label: 'Alerts', count: filteredAlerts.length },
              { id: 'transfers', label: 'Transfers', count: recommendations.length },
              { id: 'phc', label: 'PHC View' },
              { id: 'brief', label: 'Situation Brief' },
              { id: 'ask', label: 'Ask AI' },
              { id: 'fl', label: 'Federation' },
              { id: 'scale', label: 'Scale' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 14px',
                  fontSize: '12px',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  color: activeTab === tab.id ? '#0284c7' : '#64748b',
                  border: 'none',
                  borderBottom:
                    activeTab === tab.id ? '2px solid #0284c7' : 'none',
                  backgroundColor: 'transparent',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    style={{
                      fontSize: '10px',
                      backgroundColor:
                        activeTab === tab.id ? '#e0f2fe' : '#e2e8f0',
                      color: activeTab === tab.id ? '#0369a1' : '#475569',
                      padding: '1px 5px',
                      borderRadius: '10px',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {/* TAB 1: ALERTS */}
            {activeTab === 'alerts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                  }}
                >
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                    Ranked Supply Alerts ({filteredAlerts.length})
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Sorted by lowest days of stock
                  </span>
                </div>

                {(filteredAlerts || []).length === 0 ? (
                  <div
                    style={{
                      padding: '30px',
                      textAlign: 'center',
                      color: '#64748b',
                      fontSize: '13px',
                    }}
                  >
                    No critical or high-risk alerts in this view.
                  </div>
                ) : (
                  (filteredAlerts || []).map((alertItem, idx) => {
                    const insightKey = `${alertItem.phcId}-${alertItem.medicine}-${language}`;
                    const insight = aiInsights[insightKey];
                    const isInsightLoading = loadingInsight[insightKey];

                    return (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: '#ffffff',
                          border:
                            alertItem.severity === 'CRITICAL'
                              ? '1px solid #fecaca'
                              : '1px solid #fed7aa',
                          borderRadius: '8px',
                          padding: '12px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: '700',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor:
                                  alertItem.severity === 'CRITICAL'
                                    ? '#fee2e2'
                                    : '#ffedd5',
                                color:
                                  alertItem.severity === 'CRITICAL'
                                    ? '#dc2626'
                                    : '#ea580c',
                                marginRight: '6px',
                              }}
                            >
                              {alertItem.severity}
                            </span>
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#0f172a',
                              }}
                            >
                              {alertItem.medicine}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color:
                                alertItem.severity === 'CRITICAL'
                                  ? '#dc2626'
                                  : '#ea580c',
                            }}
                          >
                            ~{alertItem.daysOfStock}d left
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: '12px',
                            color: '#475569',
                            marginTop: '6px',
                          }}
                        >
                          {alertItem.message}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '10px',
                            paddingTop: '8px',
                            borderTop: '1px solid #f1f5f9',
                          }}
                        >
                          <button
                            onClick={() => {
                              setSelectedPhcId(alertItem.phcId);
                              setSelectedMedicine(alertItem.medicine);
                              setActiveTab('phc');
                            }}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: '#0284c7',
                              fontSize: '12px',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            Focus PHC <ChevronRight size={14} />
                          </button>

                          <button
                            onClick={() => handleExplainAlert(alertItem)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor: '#f0f9ff',
                              color: '#0369a1',
                              border: '1px solid #bae6fd',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500',
                            }}
                          >
                            <Sparkles size={12} />
                            {isInsightLoading
                              ? 'Analyzing...'
                              : insight
                              ? 'AI Insight Active'
                              : 'Get AI Insight'}
                          </button>
                        </div>

                        {/* AI Insight Card */}
                        {insight && (
                          <div
                            style={{
                              marginTop: '10px',
                              padding: '10px',
                              backgroundColor: '#f8fafc',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              fontSize: '12px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '6px',
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: '600',
                                  color: '#0284c7',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Sparkles size={13} /> AI Clinical Insight
                              </span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  backgroundColor:
                                    insight.source === 'gemini'
                                      ? '#dcfce7'
                                      : '#f1f5f9',
                                  color:
                                    insight.source === 'gemini'
                                      ? '#15803d'
                                      : '#64748b',
                                  fontWeight: '500',
                                }}
                              >
                                {insight.source === 'gemini'
                                  ? 'Powered by Google Gemini'
                                  : 'Fallback mode'}
                              </span>
                            </div>
                            <p style={{ color: '#1e293b', marginBottom: '4px' }}>
                              <strong>Summary:</strong> {insight.summary}
                            </p>
                            <p style={{ color: '#475569', marginBottom: '4px' }}>
                              <strong>Likely Cause:</strong> {insight.likelyCause}
                            </p>
                            <p style={{ color: '#15803d' }}>
                              <strong>Action:</strong> {insight.recommendedAction}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: TRANSFERS */}
            {activeTab === 'transfers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                  }}
                >
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                    Peer Redistribution ({recommendations.length})
                  </h3>
                  <button
                    onClick={() => handleApplyTransfer([])}
                    disabled={recommendations.length === 0}
                    style={{
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle2 size={14} /> Apply All
                  </button>
                </div>

                {(recommendations || []).length === 0 ? (
                  <div
                    style={{
                      padding: '30px',
                      textAlign: 'center',
                      color: '#64748b',
                      fontSize: '13px',
                    }}
                  >
                    No transfers needed. All monitored stock is balanced.
                  </div>
                ) : (
                  (recommendations || []).map((rec) => (
                    <div
                      key={rec.id}
                      onMouseEnter={() => setActiveTransfer(rec)}
                      onMouseLeave={() => setActiveTransfer(null)}
                      style={{
                        backgroundColor: '#ffffff',
                        border:
                          activeTransfer?.id === rec.id
                            ? '1.5px solid #0284c7'
                            : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#0f172a',
                          }}
                        >
                          Transfer {rec.quantity} units of {rec.medicine}
                        </span>
                        {rec.crossState && (
                          <span
                            style={{
                              fontSize: '10px',
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: '600',
                            }}
                          >
                            Cross-State
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: '12px',
                          color: '#475569',
                          margin: '8px 0',
                          lineHeight: 1.4,
                        }}
                      >
                        <div>
                          <strong>From:</strong> {rec.from.name} ({rec.from.state})
                        </div>
                        <div>
                          <strong>To:</strong> {rec.to.name} ({rec.to.state})
                        </div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          Distance: {rec.distanceKm} km
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleApplyTransfer([rec.id])}
                          style={{
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                          }}
                        >
                          Apply Transfer
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: PHC DETAIL */}
            {activeTab === 'phc' && selectedPhcDetail && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* PHC Info Header */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                        {selectedPhcDetail.name}
                      </h3>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>
                        District: {selectedPhcDetail.district} &bull; State:{' '}
                        {selectedPhcDetail.state}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontWeight: '700',
                        fontSize: '11px',
                        backgroundColor: getRiskColor(selectedPhcDetail.risk) + '20',
                        color: getRiskColor(selectedPhcDetail.risk),
                      }}
                    >
                      {selectedPhcDetail.risk} ({selectedPhcDetail.minDaysOfStock}d)
                    </span>
                  </div>

                  {/* Beds & Staff Capacity Bars */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      marginTop: '12px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '11px',
                          color: '#475569',
                          marginBottom: '3px',
                        }}
                      >
                        <span>Beds Occupancy</span>
                        <span>
                          {selectedPhcDetail.bedsOccupied}/{selectedPhcDetail.bedsTotal}
                        </span>
                      </div>
                      <div
                        style={{
                          height: '6px',
                          backgroundColor: '#e2e8f0',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${(selectedPhcDetail.bedsOccupied / selectedPhcDetail.bedsTotal) * 100}%`,
                            backgroundColor: '#0284c7',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '11px',
                          color: '#475569',
                          marginBottom: '3px',
                        }}
                      >
                        <span>Staff Attendance</span>
                        <span>
                          {selectedPhcDetail.staffPresent}/{selectedPhcDetail.staffTotal}
                        </span>
                      </div>
                      <div
                        style={{
                          height: '6px',
                          backgroundColor: '#e2e8f0',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${(selectedPhcDetail.staffPresent / selectedPhcDetail.staffTotal) * 100}%`,
                            backgroundColor: '#16a34a',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stock Register Update Button */}
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setShowPhotoModal(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#0284c7',
                      }}
                    >
                      <Upload size={14} /> Update Stock from Photo
                    </button>
                  </div>
                </div>

                {/* Stock Table */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                    Inventory Status
                  </h4>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '12px',
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          color: '#64748b',
                          textAlign: 'left',
                        }}
                      >
                        <th style={{ padding: '6px 4px' }}>Medicine</th>
                        <th style={{ padding: '6px 4px' }}>Stock</th>
                        <th style={{ padding: '6px 4px' }}>Avg Demand</th>
                        <th style={{ padding: '6px 4px' }}>Days</th>
                        <th style={{ padding: '6px 4px' }}>Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedPhcDetail.stock || []).map((st) => (
                        <tr
                          key={st.medicine}
                          onClick={() => setSelectedMedicine(st.medicine)}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            backgroundColor:
                              selectedMedicine === st.medicine
                                ? '#f0f9ff'
                                : 'transparent',
                          }}
                        >
                          <td style={{ padding: '7px 4px', fontWeight: '500' }}>
                            {st.medicine}
                          </td>
                          <td style={{ padding: '7px 4px' }}>{st.quantity}</td>
                          <td style={{ padding: '7px 4px' }}>{st.avgDailyDemand}/d</td>
                          <td style={{ padding: '7px 4px' }}>~{st.daysOfStock}d</td>
                          <td style={{ padding: '7px 4px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: '700',
                                padding: '2px 5px',
                                borderRadius: '3px',
                                backgroundColor: getRiskColor(st.risk) + '20',
                                color: getRiskColor(st.risk),
                              }}
                            >
                              {st.risk}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 30-Day History + 14-Day Forecast Recharts LineChart */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}
                  >
                    <h4 style={{ fontSize: '13px', fontWeight: '600' }}>
                      Consumption History &amp; 14-Day Forecast ({selectedMedicine})
                    </h4>
                    <select
                      value={selectedMedicine}
                      onChange={(e) => setSelectedMedicine(e.target.value)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      {MEDICINES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    style={{
                      height: '200px',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <ChartTooltip />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Line
                          type="monotone"
                          dataKey="history"
                          stroke="#0284c7"
                          strokeWidth={2}
                          dot={false}
                          name="30d History"
                        />
                        <Line
                          type="monotone"
                          dataKey="forecast"
                          stroke="#f97316"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                          name="14d Forecast"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SITUATION BRIEF */}
            {activeTab === 'brief' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                    Executive Situation Briefing
                  </h3>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      value={briefState}
                      onChange={(e) => setBriefState(e.target.value)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      <option value="ALL">All States</option>
                      <option value="MH">Maharashtra</option>
                      <option value="UP">Uttar Pradesh</option>
                      <option value="TN">Tamil Nadu</option>
                    </select>

                    <button
                      onClick={handleFetchBrief}
                      style={{
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      backgroundColor:
                        briefData?.source === 'gemini' ? '#dcfce7' : '#f1f5f9',
                      color:
                        briefData?.source === 'gemini' ? '#15803d' : '#64748b',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '500',
                    }}
                  >
                    {briefData?.source === 'gemini'
                      ? 'Powered by Google Gemini'
                      : 'Fallback mode'}
                  </span>

                  <button
                    onClick={() => {
                      if (briefData?.brief) {
                        navigator.clipboard.writeText(briefData.brief.join('\n'));
                        setCopiedBrief(true);
                        setTimeout(() => setCopiedBrief(false), 2000);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      color: '#0284c7',
                      backgroundColor: 'transparent',
                      border: 'none',
                    }}
                  >
                    <ClipboardCopy size={13} />
                    {copiedBrief ? 'Copied!' : 'Copy Brief'}
                  </button>
                </div>

                {loadingBrief ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Synthesizing intelligence brief...
                  </div>
                ) : (
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      padding: '14px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: '18px',
                        fontSize: '13px',
                        lineHeight: 1.6,
                        color: '#334155',
                      }}
                    >
                      {(briefData?.brief || []).map((bullet, idx) => (
                        <li key={idx} style={{ marginBottom: '8px' }}>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: ASK SAHAMATRIX */}
            {activeTab === 'ask' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                    Ask SahaMatrix AI (Grounded Q&amp;A)
                  </h3>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      fontWeight: '500',
                    }}
                  >
                    Grounded in PHC telemetry
                  </span>
                </div>

                {/* Example prompt chips */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Suggested queries:
                  </span>
                  {[
                    'Which districts in Uttar Pradesh will run out of insulin this week?',
                    'What is the overall stock status across all states?',
                    'How many transfers are recommended to prevent stockouts?',
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAskQuestion(chip)}
                      style={{
                        textAlign: 'left',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '11px',
                        color: '#334155',
                      }}
                    >
                      &bull; {chip}
                    </button>
                  ))}
                </div>

                {/* Input with Voice mic */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <input
                    type="text"
                    value={askQuestion}
                    onChange={(e) => setAskQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAskQuestion();
                    }}
                    placeholder="Ask a question about supplies, alerts, or PHCs..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                    }}
                  />

                  {/* Browser-native speech mic */}
                  {(window.SpeechRecognition ||
                    window.webkitSpeechRecognition) && (
                    <button
                      onClick={handleVoiceInput}
                      style={{
                        backgroundColor: isListening ? '#fee2e2' : '#f1f5f9',
                        color: isListening ? '#dc2626' : '#475569',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '0 10px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Dictate question"
                    >
                      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                  )}

                  <button
                    onClick={() => handleAskQuestion()}
                    disabled={askingAi || !askQuestion.trim()}
                    style={{
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0 14px',
                      fontSize: '13px',
                      fontWeight: '500',
                    }}
                  >
                    {askingAi ? 'Querying...' : 'Ask'}
                  </button>
                </div>

                {/* Chat History */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    marginTop: '8px',
                  }}
                >
                  {(askHistory || []).map((chat, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 12px',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: '600',
                          fontSize: '12px',
                          color: '#0f172a',
                          marginBottom: '4px',
                        }}
                      >
                        Q: {chat.q}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#334155',
                          lineHeight: 1.5,
                        }}
                      >
                        {chat.a}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '6px',
                          fontSize: '10px',
                          color: '#94a3b8',
                        }}
                      >
                        <span>
                          Source: {chat.source === 'gemini' ? 'Google Gemini' : 'Fallback'}
                        </span>
                        {window.speechSynthesis && (
                          <button
                            onClick={() => handleSpeak(chat.a)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: '#0284c7',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            <Volume2 size={13} /> Read Aloud
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: FEDERATION */}
            {activeTab === 'fl' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                      Federated Learning Architecture
                    </h3>
                    <p style={{ fontSize: '11px', color: '#64748b' }}>
                      Simulated multi-state FedAvg ridge regression model
                    </p>
                  </div>
                  <button
                    onClick={handleRetrainFl}
                    disabled={loading}
                    style={{
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      fontWeight: '500',
                    }}
                  >
                    Retrain Model
                  </button>
                </div>

                {/* Honesty note */}
                <div
                  style={{
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    padding: '10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#0369a1',
                    lineHeight: 1.4,
                  }}
                >
                  <strong>Privacy Architecture:</strong> Each state trains on its own
                  PHC data. Only model weights are shared with the national coordinator.
                  Raw stock and patient data never leaves a state.
                  <div style={{ fontSize: '11px', marginTop: '4px', color: '#0284c7' }}>
                    Note: The demo simulates state nodes in-process; production deploys
                    each state as a separate Cloud Run node.
                  </div>
                </div>

                {/* State MAE Comparison BarChart */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                    Held-Out 14-Day MAE: Local-Only vs Federated Model
                  </h4>
                  <div
                    style={{
                      height: '180px',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={flMetrics?.states || []}
                        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="state" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <ChartTooltip />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar
                          dataKey="localMae"
                          name="Local Only MAE"
                          fill="#f87171"
                          radius={[3, 3, 0, 0]}
                        />
                        <Bar
                          dataKey="federatedMae"
                          name="Federated Global MAE"
                          fill="#38bdf8"
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* FedAvg Loss LineChart */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                    Global Convergence Loss across 8 Rounds
                  </h4>
                  <div
                    style={{
                      height: '150px',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={flMetrics?.roundLog || []}
                        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="round" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <ChartTooltip />
                        <Line
                          type="monotone"
                          dataKey="globalLoss"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Loss"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: SCALE */}
            {activeTab === 'scale' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                  Deployability &amp; Pan-India Scaling
                </h3>

                {/* Live vs Estimate Panel */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>
                      DEMO TELEMETRY
                    </span>
                    <div style={{ marginTop: '6px', fontSize: '13px' }}>
                      <div>States: <strong>3</strong> (MH, UP, TN)</div>
                      <div>Districts: <strong>12</strong></div>
                      <div>PHCs: <strong>72</strong></div>
                      <div>Total Inventory Pairs: <strong>360</strong></div>
                      <div>Prevented: <strong>{impact?.prevented ?? 26}</strong></div>
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#eff6ff',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#1d4ed8' }}>
                      PAN-INDIA ESTIMATE
                    </span>
                    <div style={{ marginTop: '6px', fontSize: '13px' }}>
                      <div>
                        People Covered:{' '}
                        <strong>
                          {(
                            (scaleAssumptions.phcs * scaleAssumptions.peoplePerPhc) /
                            10000000
                          ).toFixed(1)}{' '}
                          Crore (
                          {(
                            (scaleAssumptions.phcs * scaleAssumptions.peoplePerPhc) /
                            1000000000
                          ).toFixed(2)}{' '}
                          Billion)
                        </strong>
                      </div>
                      <div>
                        Stockouts Prevented:{' '}
                        <strong>
                          {Math.round(
                            ((impact?.prevented || 26) / 360) *
                              scaleAssumptions.phcs *
                              5,
                          ).toLocaleString()}
                        </strong>
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                        * Estimate, editable assumptions
                      </div>
                    </div>
                  </div>
                </div>

                {/* Editable Assumptions */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <h4 style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                    Editable Assumptions (Estimate Panel)
                  </h4>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '10px', color: '#64748b' }}>Total PHCs</label>
                      <input
                        type="number"
                        value={scaleAssumptions.phcs}
                        onChange={(e) =>
                          setScaleAssumptions((p) => ({
                            ...p,
                            phcs: parseInt(e.target.value) || 0,
                          }))
                        }
                        style={{
                          width: '100%',
                          padding: '4px',
                          fontSize: '12px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#64748b' }}>Pop. per PHC</label>
                      <input
                        type="number"
                        value={scaleAssumptions.peoplePerPhc}
                        onChange={(e) =>
                          setScaleAssumptions((p) => ({
                            ...p,
                            peoplePerPhc: parseInt(e.target.value) || 0,
                          }))
                        }
                        style={{
                          width: '100%',
                          padding: '4px',
                          fontSize: '12px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#64748b' }}>States/UTs</label>
                      <input
                        type="number"
                        value={scaleAssumptions.states}
                        onChange={(e) =>
                          setScaleAssumptions((p) => ({
                            ...p,
                            states: parseInt(e.target.value) || 0,
                          }))
                        }
                        style={{
                          width: '100%',
                          padding: '4px',
                          fontSize: '12px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Live Benchmark Tester */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: '600' }}>
                        In-Memory Compute Benchmark (5,000 PHCs)
                      </h4>
                      <p style={{ fontSize: '11px', color: '#64748b' }}>
                        Generates 5,000 synthetic PHCs on copies, runs full forecast and
                        greedy transfers
                      </p>
                    </div>
                    <button
                      onClick={handleRunBenchmark}
                      disabled={benchmarking}
                      style={{
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      {benchmarking ? 'Running...' : 'Run Benchmark'}
                    </button>
                  </div>

                  {benchmarkResult && (
                    <div
                      style={{
                        marginTop: '10px',
                        padding: '8px',
                        backgroundColor: '#f0fdf4',
                        borderRadius: '6px',
                        border: '1px solid #bbf7d0',
                        fontSize: '12px',
                        color: '#15803d',
                      }}
                    >
                      Measured on this machine: <strong>{benchmarkResult.computeMs} ms</strong>{' '}
                      for {benchmarkResult.phcs.toLocaleString()} PHCs without memory exhaustion.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Outbreak Trigger Modal */}
      {showOutbreakModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '20px',
              width: '360px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>
              Simulate Disease Outbreak
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Target State</label>
                <select
                  value={outbreakState}
                  onChange={(e) => setOutbreakState(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    fontSize: '13px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                  }}
                >
                  <option value="MH">Maharashtra (MH)</option>
                  <option value="UP">Uttar Pradesh (UP)</option>
                  <option value="TN">Tamil Nadu (TN)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Surging Medicine</label>
                <select
                  value={outbreakMed}
                  onChange={(e) => setOutbreakMed(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    fontSize: '13px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                  }}
                >
                  {MEDICINES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Demand Multiplier</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                  value={outbreakMultiplier}
                  onChange={(e) => setOutbreakMultiplier(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    fontSize: '13px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  marginTop: '10px',
                }}
              >
                <button
                  onClick={() => setShowOutbreakModal(false)}
                  style={{
                    backgroundColor: '#f1f5f9',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleTriggerOutbreak}
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  Apply Outbreak
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '20px',
              width: '420px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>
              Import Stock CSV (e-Aushadhi / HMIS)
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
              Upload CSV formatted as <code>phcId,medicine,quantity</code>.{' '}
              <a
                href="/sample-stock.csv"
                download
                style={{ color: '#0284c7', textDecoration: 'underline' }}
              >
                Download Sample CSV
              </a>
            </p>

            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files[0])}
              style={{ fontSize: '12px', marginBottom: '12px' }}
            />

            {csvResult && (
              <div
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  marginBottom: '12px',
                }}
              >
                <div style={{ color: '#16a34a', fontWeight: '600' }}>
                  Accepted rows: {csvResult.accepted}
                </div>
                {csvResult.rejected && csvResult.rejected.length > 0 && (
                  <div style={{ marginTop: '4px', color: '#dc2626' }}>
                    Rejected ({csvResult.rejected.length}):
                    <ul style={{ paddingLeft: '16px', margin: '4px 0' }}>
                      {csvResult.rejected.map((r, i) => (
                        <li key={i}>
                          Row {r.row}: {r.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => {
                  setShowCsvModal(false);
                  setCsvResult(null);
                  setCsvFile(null);
                }}
                style={{
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                Close
              </button>
              <button
                onClick={handleUploadCsv}
                disabled={!csvFile}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Register Photo Modal */}
      {showPhotoModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '20px',
              width: '480px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>
              Multimodal Register Photo Digitization
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
              Snap or upload a photo of the paper stock register. Gemini extracts
              quantities and maps medicine synonyms.{' '}
              <a
                href="/sample-register.jpg"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#0284c7', textDecoration: 'underline' }}
              >
                View Sample Image
              </a>
            </p>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleUploadPhoto}
              style={{ fontSize: '12px', marginBottom: '12px' }}
            />

            {photoUploading && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '16px',
                  color: '#0284c7',
                  fontSize: '13px',
                }}
              >
                Analyzing register photo with Google Gemini Vision...
              </div>
            )}

            {extractedRows.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                  Review Extracted Stock Values:
                </h4>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px',
                    marginBottom: '12px',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        color: '#64748b',
                        textAlign: 'left',
                      }}
                    >
                      <th style={{ padding: '6px 4px' }}>Medicine</th>
                      <th style={{ padding: '6px 4px' }}>Extracted Count</th>
                      <th style={{ padding: '6px 4px' }}>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractedRows.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 4px', fontWeight: '500' }}>
                          {row.medicine}
                        </td>
                        <td style={{ padding: '6px 4px' }}>
                          <input
                            type="number"
                            value={row.quantity}
                            onChange={(e) => {
                              const val = e.target.value;
                              setExtractedRows((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, quantity: val } : r,
                                ),
                              );
                            }}
                            style={{
                              width: '80px',
                              padding: '2px 6px',
                              fontSize: '12px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 4px', color: '#16a34a' }}>
                          {(row.confidence * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => {
                  setShowPhotoModal(false);
                  setExtractedRows([]);
                  setPhotoFile(null);
                }}
                style={{
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRegister}
                disabled={extractedRows.length === 0}
                style={{
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                Confirm Stock Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
