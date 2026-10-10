import React, { useState, useRef } from 'react';
import { Upload, FileText, Zap, ShieldAlert, CheckCircle2, Eye, X, Sparkles, ShieldCheck, Key, Cpu } from 'lucide-react';
import { AVAILABLE_MODELS, getActiveModel, setActiveModel } from '../services/geminiService';

export default function UploadView({ onStartAudit, hasApiKey, onOpenApiKeyModal }) {
  const [primaryFile, setPrimaryFile] = useState(null);
  const [primaryPreview, setPrimaryPreview] = useState(null);
  const [secondaryFile, setSecondaryFile] = useState(null);
  const [secondaryPreview, setSecondaryPreview] = useState(null);
  const [mode, setMode] = useState('adversarial'); // 'inspector' | 'adversarial'
  const [selectedModel, setSelectedModelState] = useState(getActiveModel());
  const [loadingDemo, setLoadingDemo] = useState(false);

  const primaryInputRef = useRef(null);
  const secondaryInputRef = useRef(null);

  const handleModelChange = (modelId) => {
    setSelectedModelState(modelId);
    setActiveModel(modelId);
  };

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
      const resP = await fetch('/samples/demo_floor_plan_office.png');
      const blobP = await resP.blob();
      const fileP = new File([blobP], 'demo_floor_plan_office.png', { type: 'image/png' });
      setPrimaryWithPreview(fileP);

      const resS = await fetch('/samples/demo_electrical_diagram.png');
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
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
          <Sparkles size={14} /> MULTIMODAL INFRASTRUCTURE VERIFICATION PIPELINE
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
          Autonomous Infrastructure Plan Audit
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.6 }}>
          Direct client-to-model five-layer verification powered by Google Gemini Multimodal AI.
          Evaluates life-safety egress codes, electrical single-point redundancy, and cross-discipline cascade vulnerabilities.
        </p>
      </div>

      {/* API Key Setup Warning Banner if Key Missing */}
      {!hasApiKey && (
        <div
          onClick={onOpenApiKeyModal}
          className="glass-panel"
          style={{
            padding: '16px 20px',
            marginBottom: '24px',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            background: 'rgba(245, 158, 11, 0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            borderRadius: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Key size={22} color="#fbbf24" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fbbf24' }}>
                Google Gemini API Key Required
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Click here to connect your Google API key to enable direct multimodal blueprint analysis.
              </div>
            </div>
          </div>
          <button
            type="button"
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: '#f59e0b',
              color: '#040711',
              fontWeight: 700,
              fontSize: '0.8rem',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Configure Key
          </button>
        </div>
      )}

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
            {loadingDemo ? 'Loading Official Samples...' : 'Load Official Test Scenario (Floor Plan + Electrical)'}
          </button>
        </div>

        {/* Configuration: Mode & Model Selector Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Analysis Strategy Selector */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>
              Analysis Engine Strategy:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                onClick={() => setMode('inspector')}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: mode === 'inspector' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  background: mode === 'inspector' ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShieldCheck size={18} color="var(--accent-cyan)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Inspector Mode</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Codified municipal inspector. Evaluates fire safety (NFPA 101, IBC) and branch circuit regulations.
                </div>
              </div>

              <div
                onClick={() => setMode('adversarial')}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: mode === 'adversarial' ? '2px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
                  background: mode === 'adversarial' ? 'rgba(244, 63, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShieldAlert size={18} color="var(--accent-rose)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Adversarial Red-Team Mode</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Simulates threat actors searching for evacuation choke points, entrapment, and power cascade collapse.
                </div>
              </div>
            </div>
          </div>

          {/* Google Gemini Model Selection */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Cpu size={18} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Google Gemini Model:</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {AVAILABLE_MODELS.map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleModelChange(m.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="mono" style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                        {m.name}
                      </span>
                      {isSelected && <span className="badge badge-medium" style={{ fontSize: '0.65rem' }}>ACTIVE</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {m.desc}
                    </div>
                  </div>
                );
              })}
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
