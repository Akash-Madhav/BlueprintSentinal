import React, { useState, useEffect } from 'react';
import { Shield, HardDrive, WifiOff, AlertCircle } from 'lucide-react';
import UploadView from './components/UploadView.jsx';
import ProgressView from './components/ProgressView.jsx';
import ReportView from './components/ReportView.jsx';
import ShowYourWorkModal from './components/ShowYourWorkModal.jsx';

export default function App() {
  const [viewState, setViewState] = useState('upload'); // 'upload' | 'progress' | 'report'
  const [reportData, setReportData] = useState(null);
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    // Check backend offline health status
    fetch('http://localhost:8000/health')
      .then((res) => res.json())
      .then((data) => setSystemHealth(data))
      .catch((err) => {
        console.warn('Backend server check:', err);
        setSystemHealth({ status: 'offline_ready' });
      });
  }, []);

  const handleStartAudit = async ({ primaryFile, secondaryFile, mode }) => {
    setViewState('progress');
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file_primary', primaryFile);
    if (secondaryFile) {
      formData.append('file_secondary', secondaryFile);
    }
    formData.append('mode', mode);

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const report = await response.json();
      setReportData(report);
      setViewState('report');
    } catch (err) {
      console.error('Audit execution error:', err);
      setErrorMsg('Audit execution error. Ensure backend is running on port 8000.');
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
        background: 'rgba(7, 9, 14, 0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

        {/* Offline Badge & Local Telemetry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            className="mono"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--accent-emerald)',
              fontWeight: 600
            }}
          >
            <WifiOff size={14} />
            <span>AIR-GAPPED LOCAL INFERENCE</span>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main style={{ flex: 1, padding: '40px 24px' }}>
        {errorMsg && (
          <div className="glass-panel" style={{
            maxWidth: '720px',
            margin: '0 auto 24px',
            padding: '16px 20px',
            border: '1px solid var(--accent-rose)',
            background: 'rgba(244, 63, 94, 0.1)',
            color: '#fb7185',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        {viewState === 'upload' && <UploadView onStartAudit={handleStartAudit} />}
        {viewState === 'progress' && <ProgressView />}
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

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '16px 32px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        BluePrint Sentinel — Intellect Hack 2026 (Track 1) | Zero-Cloud Infrastructure Auditing
      </footer>
    </div>
  );
}
