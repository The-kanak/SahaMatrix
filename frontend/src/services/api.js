// SahaMatrix Centralized API Client

const jsonHeaders = {
  'Content-Type': 'application/json',
};

export const api = {
  // Health
  async getHealth() {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // Summary
  async getSummary() {
    const res = await fetch('/api/summary');
    if (!res.ok) throw new Error('Failed to load summary');
    return res.json();
  },

  // PHCs
  async getPhcs(state = '') {
    const url = state && state !== 'ALL' ? `/api/phcs?state=${state}` : '/api/phcs';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load PHCs');
    return res.json();
  },

  async getPhcDetail(id) {
    const res = await fetch(`/api/phcs/${id}`);
    if (!res.ok) throw new Error(`Failed to load PHC ${id}`);
    return res.json();
  },

  async getForecast(id, medicine) {
    const res = await fetch(`/api/phcs/${id}/forecast?medicine=${encodeURIComponent(medicine)}`);
    if (!res.ok) throw new Error(`Failed to load forecast for ${medicine}`);
    return res.json();
  },

  // Alerts & Recommendations
  async getAlerts(state = '') {
    const url = state && state !== 'ALL' ? `/api/alerts?state=${state}` : '/api/alerts';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load alerts');
    return res.json();
  },

  async getRecommendations() {
    const res = await fetch('/api/recommendations');
    if (!res.ok) throw new Error('Failed to load recommendations');
    return res.json();
  },

  async applyRecommendations(acceptedRecommendationIds = []) {
    const res = await fetch('/api/recommendations/apply', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ ids: acceptedRecommendationIds }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(errText || 'Failed to apply recommendations');
    }
    return res.json();
  },

  // Simulation
  async simulateOutbreak(state, medicine, multiplier) {
    const res = await fetch('/api/simulate/outbreak', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ state, medicine, multiplier }),
    });
    if (!res.ok) throw new Error('Failed to trigger outbreak');
    return res.json();
  },

  async simulateAdvance(days = 3) {
    const res = await fetch(`/api/simulate/advance?days=${days}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to advance simulation');
    return res.json();
  },

  async simulateReset() {
    const res = await fetch('/api/simulate/reset', {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset simulation');
    return res.json();
  },

  // Counterfactual Impact
  async getImpact() {
    const res = await fetch('/api/impact');
    if (!res.ok) throw new Error('Failed to load impact metrics');
    return res.json();
  },

  // Federated Learning
  async getFlMetrics() {
    const res = await fetch('/api/fl/metrics');
    if (!res.ok) throw new Error('Failed to load FL metrics');
    return res.json();
  },

  async trainFederation() {
    const res = await fetch('/api/fl/train', {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to train federation');
    return res.json();
  },

  // Google Gemini AI endpoints
  async explainAlert(phcId, medicine, lang = 'en') {
    const res = await fetch('/api/ai/explain-alert', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ phcId, medicine, lang }),
    });
    if (!res.ok) throw new Error('Failed to explain alert');
    return res.json();
  },

  async getSituationBrief(state = '', lang = 'en') {
    const res = await fetch('/api/ai/situation-brief', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ state: state === 'ALL' ? '' : state, lang }),
    });
    if (!res.ok) throw new Error('Failed to get situation brief');
    return res.json();
  },

  async askAI(question, state = '', lang = 'en') {
    const res = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ question, state: state === 'ALL' ? '' : state, lang }),
    });
    if (!res.ok) throw new Error('Failed to query AI');
    return res.json();
  },

  // Register Vision OCR
  async uploadRegisterPhoto(file, phcId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('phcId', phcId);
    const res = await fetch('/api/ai/ingest-register', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to parse register photo');
    return res.json();
  },

  async confirmRegisterStock(phcId, rows) {
    const res = await fetch('/api/ai/ingest-register/confirm', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ phcId, rows }),
    });
    if (!res.ok) throw new Error('Failed to confirm register');
    return res.json();
  },

  // CSV Bulk Import
  async importStockCsv(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/import/stock-csv', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to import stock CSV');
    return res.json();
  },

  // Scale Test
  async runScaleTest(phcs = 100) {
    const res = await fetch(`/api/scale-test?phcs=${phcs}`);
    if (!res.ok) throw new Error('Scale benchmark failed');
    return res.json();
  },
};
