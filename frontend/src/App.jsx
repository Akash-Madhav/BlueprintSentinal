import React, { useState, useEffect } from 'react';
import { Shield, Key, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import UploadView from './components/UploadView.jsx';
import ProgressView from './components/ProgressView.jsx';
import ReportView from './components/ReportView.jsx';
import ShowYourWorkModal from './components/ShowYourWorkModal.jsx';
import ApiKeyModal from './components/ApiKeyModal.jsx';
import { runClientPipeline } from './pipeline/orchestrator.js';
import { getGeminiApiKey } from './services/geminiService.js';

export default function App() {
  const [viewState, setViewState] = useState('upload'); // 'upload' | 'progress' | 'report'
  const [reportData, setReportData] = useState(null);
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pipelineProgress, setPipelineProgress] = useState({ step: 1, name: '' });

  useEffect(() => {
    const key = getGeminiApiKey();
    setHasApiKey(Boolean(key && key.trim()));
  }, []);

  const handleStartAudit = async ({ primaryFile, secondaryFile, mode }) => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      setShowApiKeyModal(true);
      setErrorMsg('Please enter your Google Gemini API Key to run the autonomous audit pipeline.');
      return;
    }

    setViewState('progress');
    setErrorMsg(null);

    try {
      const report = await runClientPipeline({
        primaryFile,
        secondaryFile,
        mode,
        onProgress: (step, name) => {
          setPipelineProgress({ step, name });
        },
      });

      setReportData(report);
      setViewState('report');
    } catch (err) {
      console.error('Audit execution error:', err);
      setErrorMsg(err.message || 'Audit execution encountered an error. Please check your Gemini API key.');
      setViewState('upload');
    }
  };

  const handleReset = () => {
    setReportData(null);
    setViewState('upload');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(7, 9, 14, 0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={handleReset}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
          }}>
            <Shield size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>
              BluePrint <span style={{ color: 'var(--accent-cyan)' }}>Sentinel</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Autonomous AI for Critical Infrastructure
            </div>
          </div>
        </div>

        {/* API Key Status & Configuration Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => setShowApiKeyModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: hasApiKey ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.15)',
              border: hasApiKey ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.4)',
              color: hasApiKey ? 'var(--accent-emerald)' : '#fbbf24',
              transition: 'all 0.2s ease'
            }}
          >
            <Key size={14} />
            <span>{hasApiKey ? 'GEMINI API CONNECTED' : 'SET GEMINI API KEY'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main style={{ flex: 1, padding: '40px 24px' }}>
        {errorMsg && (
          <div className="glass-panel" style={{
            maxWidth: '780px',
            margin: '0 auto 24px',
            padding: '16px 20px',
            border: '1px solid var(--accent-rose)',
            background: 'rgba(244, 63, 94, 0.1)',
            color: '#fb7185',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {viewState === 'upload' && <UploadView onStartAudit={handleStartAudit} />}
        {viewState === 'progress' && <ProgressView progress={pipelineProgress} />}
        {viewState === 'report' && reportData && (
          <ReportView
            report={reportData}
            onReset={handleReset}
            onShowYourWork={() => setShowWorkModal(true)}
          />
        )}
      </main>

      {/* Show Your Work Modal */}
      {showWorkModal && reportData && (
        <ShowYourWorkModal
          sessionId={reportData.session_id}
          onClose={() => setShowWorkModal(false)}
        />
      )}

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onKeySaved={(key) => setHasApiKey(Boolean(key && key.trim()))}
      />

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '16px 32px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        BluePrint Sentinel • Powered by Google Gemini Multimodal AI • Client-Side Infrastructure Audit Engine
      </footer>
    </div>
  );
}
