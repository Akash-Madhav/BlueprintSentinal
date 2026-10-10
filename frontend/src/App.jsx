import React, { useState, useEffect } from 'react';
import { Shield, Key, Activity, Cpu, AlertCircle } from 'lucide-react';
import UploadView from './components/UploadView.jsx';
import ProgressView from './components/ProgressView.jsx';
import ReportView from './components/ReportView.jsx';
import ShowYourWorkModal from './components/ShowYourWorkModal.jsx';
import ApiKeyModal from './components/ApiKeyModal.jsx';
import { runClientPipeline } from './pipeline/orchestrator.js';
import { getGeminiApiKey } from './services/geminiService.js';

export default function App() {
  const [viewState, setViewState] = useState('upload');
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
        onProgress: (step, name) => setPipelineProgress({ step, name }),
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

  const breadcrumbs = {
    upload: 'Upload & Configure',
    progress: 'Executing Pipeline',
    report: 'Audit Report',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

      {/* Top Navigation Bar */}
      <header style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(4, 7, 17, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '60px',
      }}>
        {/* Left: Logo */}
        <div
          onClick={handleReset}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{ position: 'relative', width: '34px', height: '34px' }}>
            {/* Orbit ring */}
            <div style={{
              position: 'absolute',
              inset: '-5px',
              borderRadius: '50%',
              border: '1.5px dashed rgba(56,189,248,0.35)',
              animation: 'orbitRing 8s linear infinite',
            }} />
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 18px rgba(56,189,248,0.4)',
            }}>
              <Shield size={19} color="#fff" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1.05rem',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}>
              Blueprint<span style={{ color: 'var(--accent-cyan)' }}>Sentinel</span>
            </div>
            <div style={{
              fontSize: '0.62rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'var(--font-mono)',
            }}>
              Infrastructure Audit AI
            </div>
          </div>
        </div>

        {/* Center: Breadcrumb path */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          {['upload', 'progress', 'report'].map((v, i) => (
            <React.Fragment key={v}>
              {i > 0 && <span style={{ color: 'var(--text-dim)' }}>›</span>}
              <span style={{
                color: viewState === v ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontWeight: viewState === v ? 700 : 400,
                transition: 'color 0.2s',
              }}>
                {breadcrumbs[v]}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Right: Status indicators + API key */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Live model indicator */}
          <div className="data-chip data-chip-violet" style={{ gap: '6px', display: 'none' }}>
            <Cpu size={11} />
            <span>GEMINI</span>
          </div>

          {/* API Key button */}
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="btn"
            style={{
              padding: '6px 13px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.73rem',
              letterSpacing: '0.04em',
              background: hasApiKey ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.1)',
              border: hasApiKey ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(245,158,11,0.35)',
              color: hasApiKey ? 'var(--accent-emerald)' : '#fbbf24',
            }}
          >
            <Key size={12} />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {hasApiKey ? '● CONNECTED' : '● SET API KEY'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '36px 24px 60px' }}>
        {/* Error Banner */}
        {errorMsg && (
          <div className="glass-panel animate-fade-up" style={{
            maxWidth: '820px',
            margin: '0 auto 24px',
            padding: '14px 20px',
            border: '1px solid var(--border-glow-rose)',
            background: 'rgba(244,63,94,0.08)',
            color: '#fb7185',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'var(--glow-rose)',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.88rem' }}>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              style={{ marginLeft: 'auto', background: 'transparent', color: '#fb7185', padding: '2px' }}
            >✕</button>
          </div>
        )}

        {viewState === 'upload' && (
          <UploadView
            onStartAudit={handleStartAudit}
            hasApiKey={hasApiKey}
            onOpenApiKeyModal={() => setShowApiKeyModal(true)}
          />
        )}
        {viewState === 'progress' && <ProgressView progress={pipelineProgress} />}
        {viewState === 'report' && reportData && (
          <ReportView
            report={reportData}
            onReset={handleReset}
            onShowYourWork={() => setShowWorkModal(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '14px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '0.73rem',
        color: 'var(--text-dim)',
        fontFamily: 'var(--font-mono)',
        background: 'rgba(4,7,17,0.6)',
      }}>
        <span>BLUEPRINT SENTINEL v2.0 — AUTONOMOUS INFRASTRUCTURE AUDIT ENGINE</span>
        <span style={{ color: 'var(--text-muted)' }}>POWERED BY GOOGLE GEMINI MULTIMODAL AI · 100% CLIENT-SIDE · ZERO DATA RETENTION</span>
      </footer>

      {/* Modals */}
      {showWorkModal && reportData && (
        <ShowYourWorkModal
          sessionId={reportData.session_id}
          onClose={() => setShowWorkModal(false)}
        />
      )}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onKeySaved={(key) => setHasApiKey(Boolean(key && key.trim()))}
      />
    </div>
  );
}
