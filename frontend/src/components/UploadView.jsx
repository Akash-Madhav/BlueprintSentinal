import React, { useState, useRef } from 'react';
import { Upload, FileText, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function UploadView({ onStartAudit }) {
  const [primaryFile, setPrimaryFile] = useState(null);
  const [secondaryFile, setSecondaryFile] = useState(null);
  const [mode, setMode] = useState('inspector'); // 'inspector' | 'adversarial'

  const primaryInputRef = useRef(null);
  const secondaryInputRef = useRef(null);

  const handlePrimaryDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setPrimaryFile(e.dataTransfer.files[0]);
  };

  const handleSecondaryDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setSecondaryFile(e.dataTransfer.files[0]);
  };

  const loadDemoSet = async () => {
    // Generate synthetic dummy files for instant testing if user clicks demo
    const pBlob = new Blob(["demo floor plan"], { type: "image/png" });
    const pFile = new File([pBlob], "demo_floor_plan_office.png", { type: "image/png" });
    
    const sBlob = new Blob(["demo electrical diagram"], { type: "image/png" });
    const sFile = new File([sBlob], "demo_electrical_diagram.png", { type: "image/png" });

    setPrimaryFile(pFile);
    setSecondaryFile(sFile);
    setMode('adversarial');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!primaryFile) return;
    onStartAudit({
      primaryFile,
      secondaryFile,
      mode,
    });
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h1 style={{
          fontSize: '2.4rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #f8fafc 0%, #38bdf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '10px'
        }}>
          Autonomous Infrastructure Plan Audit
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto' }}>
          Five-layer multi-discipline verification pipeline running 100% offline on local hardware.
          Detects safety violations, redundancy failures, and multi-plan cross-discipline conflicts.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Upload Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Primary Upload (Required) */}
          <div
            className="glass-panel"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handlePrimaryDrop}
            onClick={() => primaryInputRef.current?.click()}
            style={{
              padding: '32px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              border: primaryFile ? '1px solid var(--accent-cyan)' : '1px dashed var(--border-subtle)',
              transition: 'all 0.2s ease',
              background: primaryFile ? 'rgba(56, 189, 248, 0.05)' : undefined
            }}
          >
            <input
              type="file"
              ref={primaryInputRef}
              style={{ display: 'none' }}
              accept="image/*,.pdf"
              onChange={(e) => e.target.files?.[0] && setPrimaryFile(e.target.files[0])}
            />
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              {primaryFile ? <CheckCircle2 size={28} color="var(--accent-cyan)" /> : <Upload size={28} color="var(--accent-cyan)" />}
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>
              Primary Plan <span style={{ color: 'var(--accent-rose)', fontSize: '0.8rem' }}>*Required</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
              Architectural Floor Plan (PNG, JPG, or PDF)
            </p>
            {primaryFile ? (
              <div className="badge badge-medium mono">{primaryFile.name}</div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Click or drop file here</div>
            )}
          </div>

          {/* Secondary Upload (Optional for Cross-Referencing) */}
          <div
            className="glass-panel"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleSecondaryDrop}
            onClick={() => secondaryInputRef.current?.click()}
            style={{
              padding: '32px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              border: secondaryFile ? '1px solid var(--accent-indigo)' : '1px dashed var(--border-subtle)',
              transition: 'all 0.2s ease',
              background: secondaryFile ? 'rgba(99, 102, 241, 0.05)' : undefined
            }}
          >
            <input
              type="file"
              ref={secondaryInputRef}
              style={{ display: 'none' }}
              accept="image/*,.pdf"
              onChange={(e) => e.target.files?.[0] && setSecondaryFile(e.target.files[0])}
            />
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              {secondaryFile ? <CheckCircle2 size={28} color="var(--accent-indigo)" /> : <Zap size={28} color="var(--accent-indigo)" />}
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>
              Secondary Plan <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Cross-Reference)</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
              Electrical Schematic or Network Diagram
            </p>
            {secondaryFile ? (
              <div className="badge mono" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                {secondaryFile.name}
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Click or drop file for cross-audit</div>
            )}
          </div>
        </div>

        {/* Mode Selector & Demo Action */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
              AI Audit Reasoning Mode
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setMode('inspector')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: mode === 'inspector' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.04)',
                  color: mode === 'inspector' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  border: mode === 'inspector' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)'
                }}
              >
                <FileText size={16} /> Compliance Inspector
              </button>
              <button
                type="button"
                onClick={() => setMode('adversarial')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: mode === 'adversarial' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255,255,255,0.04)',
                  color: mode === 'adversarial' ? 'var(--accent-rose)' : 'var(--text-secondary)',
                  border: mode === 'adversarial' ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-subtle)'
                }}
              >
                <ShieldAlert size={16} /> Adversarial Red-Team
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={loadDemoSet}
              style={{
                padding: '12px 18px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              Load Demo Sample Plans
            </button>
            <button
              type="submit"
              disabled={!primaryFile}
              style={{
                padding: '12px 28px',
                borderRadius: '8px',
                background: primaryFile ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' : 'rgba(255,255,255,0.1)',
                color: primaryFile ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: primaryFile ? 'pointer' : 'not-allowed',
                boxShadow: primaryFile ? '0 10px 20px -5px rgba(37, 99, 235, 0.4)' : 'none'
              }}
            >
              Execute Autonomous Audit
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
