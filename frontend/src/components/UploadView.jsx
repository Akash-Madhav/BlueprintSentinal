import React, { useState, useRef } from 'react';
import { Upload, FileText, Zap, ShieldAlert, CheckCircle2, Eye, X, Sparkles, ShieldCheck } from 'lucide-react';

export default function UploadView({ onStartAudit }) {
  const [primaryFile, setPrimaryFile] = useState(null);
  const [primaryPreview, setPrimaryPreview] = useState(null);
  const [secondaryFile, setSecondaryFile] = useState(null);
  const [secondaryPreview, setSecondaryPreview] = useState(null);
  const [mode, setMode] = useState('adversarial'); // 'inspector' | 'adversarial'
  const [loadingDemo, setLoadingDemo] = useState(false);

  const primaryInputRef = useRef(null);
  const secondaryInputRef = useRef(null);

  const setPrimaryWithPreview = (file) => {
    setPrimaryFile(file);
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPrimaryPreview(url);
    } else {
      setPrimaryPreview(null);
    }
  };

  const setSecondaryWithPreview = (file) => {
    setSecondaryFile(file);
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setSecondaryPreview(url);
    } else {
      setSecondaryPreview(null);
    }
  };

  const handlePrimaryDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setPrimaryWithPreview(e.dataTransfer.files[0]);
  };

  const handleSecondaryDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setSecondaryWithPreview(e.dataTransfer.files[0]);
  };

  const loadDemoSet = async () => {
    setLoadingDemo(true);
    try {
      // Fetch genuine blueprint samples served directly by backend
      const resP = await fetch('http://localhost:8000/samples/demo_floor_plan_office.png');
      const blobP = await resP.blob();
      const fileP = new File([blobP], 'demo_floor_plan_office.png', { type: 'image/png' });
      setPrimaryWithPreview(fileP);

      const resS = await fetch('http://localhost:8000/samples/demo_electrical_diagram.png');
      const blobS = await resS.blob();
      const fileS = new File([blobS], 'demo_electrical_diagram.png', { type: 'image/png' });
      setSecondaryWithPreview(fileS);

      setMode('adversarial');
    } catch (err) {
      console.warn('Fallback loading demo locally:', err);
    } finally {
      setLoadingDemo(false);
    }
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
    <div style={{ maxWidth: '980px', margin: '0 auto' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '9999px',
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          color: 'var(--accent-cyan)',
          fontSize: '0.8rem',
          fontWeight: 600,
          marginBottom: '16px',
          letterSpacing: '0.04em'
        }}>
          <Sparkles size={14} /> AUTONOMOUS AIR-GAPPED VERIFICATION ENGINE
        </div>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #f8fafc 0%, #38bdf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '12px',
          letterSpacing: '-0.02em'
        }}>
          Critical Infrastructure Security & Egress Audit
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.6 }}>
          Five-layer multi-discipline pipeline running strictly on local hardware.
          Audits life-safety egress codes, electrical single-point redundancy, and cross-discipline cascade vulnerabilities.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Upload Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* Primary Upload (Required) */}
          <div
            className="glass-panel"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handlePrimaryDrop}
            onClick={() => !primaryFile && primaryInputRef.current?.click()}
            style={{
              padding: '24px',
              textAlign: 'center',
              cursor: primaryFile ? 'default' : 'pointer',
              border: primaryFile ? '1px solid var(--accent-cyan)' : '1px dashed var(--border-subtle)',
              transition: 'all 0.2s ease',
              background: primaryFile ? 'rgba(56, 189, 248, 0.04)' : undefined,
              position: 'relative'
            }}
          >
            <input
              type="file"
              ref={primaryInputRef}
              style={{ display: 'none' }}
              accept="image/*,.pdf"
              onChange={(e) => e.target.files?.[0] && setPrimaryWithPreview(e.target.files[0])}
            />

            {primaryFile ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="badge badge-medium mono">PRIMARY PLAN LOADED</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPrimaryWithPreview(null); }}
                    style={{ background: 'transparent', color: 'var(--text-muted)', padding: '4px' }}
                  >
                    <X size={18} />
                  </button>
                </div>
                {primaryPreview && (
                  <div style={{
                    height: '160px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '12px',
                    border: '1px solid var(--border-subtle)',
                    background: '#040711'
                  }}>
                    <img src={primaryPreview} alt="Primary Plan Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{primaryFile.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {(primaryFile.size / 1024).toFixed(1)} KB • Architectural Layout
                </div>
              </div>
            ) : (
              <div>
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
                  <Upload size={28} color="var(--accent-cyan)" />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>
                  Primary Blueprint Plan <span style={{ color: 'var(--accent-rose)', fontSize: '0.8rem' }}>*Required</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '14px' }}>
                  Architectural Floor Plan (PNG, JPG, or PDF)
                </p>
                <div style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 600 }}>Click or drop blueprint file here</div>
              </div>
            )}
          </div>

          {/* Secondary Upload (Optional for Cross-Referencing) */}
          <div
            className="glass-panel"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleSecondaryDrop}
            onClick={() => !secondaryFile && secondaryInputRef.current?.click()}
            style={{
              padding: '24px',
              textAlign: 'center',
              cursor: secondaryFile ? 'default' : 'pointer',
              border: secondaryFile ? '1px solid var(--accent-indigo)' : '1px dashed var(--border-subtle)',
              transition: 'all 0.2s ease',
              background: secondaryFile ? 'rgba(99, 102, 241, 0.04)' : undefined,
              position: 'relative'
            }}
          >
            <input
              type="file"
              ref={secondaryInputRef}
              style={{ display: 'none' }}
              accept="image/*,.pdf"
              onChange={(e) => e.target.files?.[0] && setSecondaryWithPreview(e.target.files[0])}
            />

            {secondaryFile ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="badge badge-low mono" style={{ color: '#a5b4fc', borderColor: '#6366f1' }}>SECONDARY PLAN LOADED</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSecondaryWithPreview(null); }}
                    style={{ background: 'transparent', color: 'var(--text-muted)', padding: '4px' }}
                  >
                    <X size={18} />
                  </button>
                </div>
                {secondaryPreview && (
                  <div style={{
                    height: '160px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '12px',
                    border: '1px solid var(--border-subtle)',
                    background: '#040711'
                  }}>
                    <img src={secondaryPreview} alt="Secondary Plan Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{secondaryFile.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {(secondaryFile.size / 1024).toFixed(1)} KB • Electrical Single-Line
                </div>
              </div>
            ) : (
              <div>
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
                  <Zap size={28} color="#818cf8" />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>
                  Cross-Reference Schematic <span style={{ color: 'var(--accent-emerald)', fontSize: '0.8rem' }}>Optional</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '14px' }}>
                  Electrical Single-Line Diagram or Network Topology
                </p>
                <div style={{ color: '#818cf8', fontSize: '0.85rem', fontWeight: 600 }}>Click or drop secondary plan here</div>
              </div>
            )}
          </div>
        </div>

        {/* Demo Fast-Load Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={loadDemoSet}
            disabled={loadingDemo}
            style={{
              padding: '8px 20px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Sparkles size={14} color="var(--accent-cyan)" />
            {loadingDemo ? 'Fetching Official Samples...' : 'Load Official Test Scenario (Floor Plan + Electrical)'}
          </button>
        </div>

        {/* Mode Selector */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px' }}>
            Analysis Engine Strategy:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Inspector Mode */}
            <div
              onClick={() => setMode('inspector')}
              style={{
                padding: '18px',
                borderRadius: '10px',
                border: mode === 'inspector' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                background: mode === 'inspector' ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <ShieldCheck size={20} color="var(--accent-cyan)" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Inspector Mode</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Simulates a rigorous municipal code compliance inspector. Flags fire safety code violations (NFPA 101, IBC),
                clearance requirements, and electrical standards.
              </p>
            </div>

            {/* Adversarial Red-Team Mode */}
            <div
              onClick={() => setMode('adversarial')}
              style={{
                padding: '18px',
                borderRadius: '10px',
                border: mode === 'adversarial' ? '2px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
                background: mode === 'adversarial' ? 'rgba(244, 63, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <ShieldAlert size={20} color="var(--accent-rose)" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Adversarial Red-Team Mode</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Simulates an active threat actor seeking structural single points of failure, evacuation choke point sabotage,
                and power cascade collapse vectors.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={!primaryFile}
          style={{
            padding: '18px',
            borderRadius: '12px',
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#ffffff',
            background: primaryFile ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'rgba(255, 255, 255, 0.05)',
            border: primaryFile ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
            cursor: primaryFile ? 'pointer' : 'not-allowed',
            opacity: primaryFile ? 1 : 0.4,
            boxShadow: primaryFile ? '0 0 25px rgba(2, 132, 199, 0.4)' : undefined,
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <Zap size={20} />
          <span>Execute Autonomous 5-Layer Infrastructure Audit</span>
        </button>
      </form>
    </div>
  );
}
