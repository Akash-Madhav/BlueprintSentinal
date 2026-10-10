import React, { useState, useRef } from 'react';
import {
  Upload, Zap, ShieldAlert, ShieldCheck, Key, Cpu, X, Sparkles,
  GitBranch, Lock, Eye, Activity, FileText, Layers, CheckCircle2
} from 'lucide-react';
import { AVAILABLE_MODELS, getActiveModel, setActiveModel } from '../services/geminiService';

/* ----------------------------------------------------------
   Feature pill definitions shown under the hero
---------------------------------------------------------- */
const FEATURE_PILLS = [
  { icon: ShieldCheck, label: 'NFPA 101', sub: 'Egress Codes', color: 'var(--accent-emerald)' },
  { icon: Activity,    label: 'IBC 2021',  sub: 'Life Safety',  color: 'var(--accent-cyan)' },
  { icon: Zap,         label: 'NEC 2023',  sub: 'Electrical',   color: 'var(--accent-amber)' },
  { icon: GitBranch,   label: '5-Layer AI', sub: 'Verification', color: 'var(--accent-violet)' },
  { icon: Lock,        label: 'Zero Backend', sub: 'Client-Side', color: '#34d399' },
  { icon: Eye,         label: 'Red-Team Mode', sub: 'Adversarial', color: '#fb7185' },
];

/* ----------------------------------------------------------
   Stat counter items shown in hero
---------------------------------------------------------- */
const STAT_ITEMS = [
  { value: '127+', label: 'Codified Rules' },
  { value: '5',    label: 'Verification Layers' },
  { value: '100%', label: 'Client-Side' },
  { value: '<45s', label: 'Avg. Runtime' },
];

/* ----------------------------------------------------------
   Drop zone component
---------------------------------------------------------- */
function DropZone({ file, preview, onFile, onClear, inputRef, accept, color, accentClass, label, sublabel, Icon, optional }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) onFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        border: file
          ? `1.5px solid ${color}`
          : dragActive
            ? `1.5px solid ${color}`
            : '1.5px dashed var(--border-subtle)',
        background: file
          ? `${color}08`
          : dragActive
            ? `${color}06`
            : 'rgba(255,255,255,0.02)',
        cursor: file ? 'default' : 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        overflow: 'hidden',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: dragActive ? `0 0 24px ${color}20` : file ? `0 0 18px ${color}14` : 'none',
        animation: dragActive ? 'borderPulse 0.8s ease infinite' : 'none',
      }}
    >
      <input
        type="file"
        ref={inputRef}
        style={{ display: 'none' }}
        accept={accept}
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />

      {file ? (
        /* File loaded state */
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className={`badge ${accentClass}`}>
              <CheckCircle2 size={10} />
              {label.toUpperCase()} LOADED
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                borderRadius: '6px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              <X size={12} /> Clear
            </button>
          </div>

          {preview && (
            <div style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              height: '130px',
              border: '1px solid var(--border-subtle)',
              background: '#020407',
              position: 'relative',
            }}>
              <img
                src={preview}
                alt="Plan preview"
                style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.92 }}
              />
              {/* scan overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(180deg, transparent 40%, ${color}08 100%)`,
                pointerEvents: 'none',
              }} />
            </div>
          )}

          <div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {(file.size / 1024).toFixed(1)} KB · {file.type || 'Unknown type'}
            </div>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div style={{ padding: '32px 24px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', textAlign: 'center' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: `${color}12`,
            border: `1px solid ${color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}>
            <Icon size={26} color={color} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>
              {label}
              {optional && (
                <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>Optional</span>
              )}
              {!optional && (
                <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#fb7185', fontWeight: 600 }}>Required</span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sublabel}</div>
          </div>
          <div style={{
            fontSize: '0.78rem',
            color: color,
            fontWeight: 600,
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: `${color}10`,
            border: `1px solid ${color}25`,
          }}>
            Drop file or click to browse
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------
   Main Upload View
---------------------------------------------------------- */
export default function UploadView({ onStartAudit, hasApiKey, onOpenApiKeyModal }) {
  const [primaryFile, setPrimaryFile] = useState(null);
  const [primaryPreview, setPrimaryPreview] = useState(null);
  const [secondaryFile, setSecondaryFile] = useState(null);
  const [secondaryPreview, setSecondaryPreview] = useState(null);
  const [mode, setMode] = useState('adversarial');
  const [selectedModel, setSelectedModelState] = useState(getActiveModel());
  const [loadingDemo, setLoadingDemo] = useState(false);

  const primaryInputRef = useRef(null);
  const secondaryInputRef = useRef(null);

  const setFileWithPreview = (file, setFile, setPreview) => {
    setFile(file);
    if (file && file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const handleModelChange = (modelId) => {
    setSelectedModelState(modelId);
    setActiveModel(modelId);
  };

  const loadDemoSet = async () => {
    setLoadingDemo(true);
    try {
      const [resP, resS] = await Promise.all([
        fetch('/samples/demo_floor_plan_office.png'),
        fetch('/samples/demo_electrical_diagram.png'),
      ]);
      const [bP, bS] = await Promise.all([resP.blob(), resS.blob()]);
      setFileWithPreview(new File([bP], 'demo_floor_plan_office.png', { type: 'image/png' }), setPrimaryFile, setPrimaryPreview);
      setFileWithPreview(new File([bS], 'demo_electrical_diagram.png', { type: 'image/png' }), setSecondaryFile, setSecondaryPreview);
      setMode('adversarial');
    } catch (err) {
      console.warn('Demo load failed:', err);
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!primaryFile) return;
    onStartAudit({ primaryFile, secondaryFile, mode });
  };

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto' }} className="animate-fade-in">

      {/* ── HERO SECTION ─────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '44px', paddingTop: '8px' }}>

        {/* Chip label */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <span className="data-chip data-chip-cyan" style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}>
            <Sparkles size={11} />
            MULTIMODAL · FIVE-LAYER · AUTONOMOUS
          </span>
        </div>

        {/* Main headline */}
        <h1 className="font-display tracking-tighter" style={{
          fontSize: 'clamp(2rem, 5vw, 3.3rem)',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: '16px',
        }}>
          <span className="gradient-text-cyan">Autonomous Audit</span>
          <br />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.72em' }}>
            for Critical Infrastructure Plans
          </span>
        </h1>

        {/* Sub description */}
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          maxWidth: '620px',
          margin: '0 auto 28px',
          lineHeight: 1.65,
        }}>
          Upload floor plans and electrical schematics. Our client-side AI pipeline evaluates life-safety egress codes,
          electrical redundancy standards, and adversarial threat vectors — powered directly by Google Gemini.
        </p>

        {/* Stat chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginBottom: '28px' }}>
          {STAT_ITEMS.map((s) => (
            <div key={s.label} className="glass-panel-light" style={{
              padding: '10px 18px',
              textAlign: 'center',
              minWidth: '100px',
            }}>
              <div className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '-0.02em' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '2px' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
          {FEATURE_PILLS.map(({ icon: Icon, label, sub, color }) => (
            <div key={label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '6px 13px',
              borderRadius: 'var(--radius-full)',
              background: `${color}09`,
              border: `1px solid ${color}25`,
              fontSize: '0.77rem',
              color: 'var(--text-secondary)',
            }}>
              <Icon size={13} color={color} />
              <span style={{ fontWeight: 700, color }}>{label}</span>
              <span style={{ color: 'var(--text-muted)' }}>· {sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── API KEY WARNING ──────────────────────────────────── */}
      {!hasApiKey && (
        <div
          onClick={onOpenApiKeyModal}
          className="glass-panel animate-fade-up"
          style={{
            padding: '14px 20px',
            marginBottom: '24px',
            border: '1px solid var(--border-glow-amber)',
            background: 'rgba(245,158,11,0.07)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: 'var(--glow-amber)',
          }}
        >
          <div style={{
            width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
            background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Key size={18} color="#fbbf24" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fbbf24', marginBottom: '2px' }}>
              Google Gemini API Key Required
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Connect your API key to enable direct multimodal blueprint analysis. Your blueprints never leave your browser.
            </div>
          </div>
          <button className="btn btn-ghost" style={{ flexShrink: 0, background: '#f59e0b', color: '#030712', border: 'none', fontWeight: 700, fontSize: '0.78rem' }}>
            Configure Key →
          </button>
        </div>
      )}

      {/* ── MAIN FORM ─────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Upload Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <DropZone
            file={primaryFile}
            preview={primaryPreview}
            onFile={(f) => setFileWithPreview(f, setPrimaryFile, setPrimaryPreview)}
            onClear={() => setFileWithPreview(null, setPrimaryFile, setPrimaryPreview)}
            inputRef={primaryInputRef}
            accept="image/*,.pdf"
            color="var(--accent-cyan)"
            accentClass="badge-medium"
            label="Primary Blueprint"
            sublabel="Architectural Floor Plan (PNG, JPG, PDF)"
            Icon={Layers}
            optional={false}
          />
          <DropZone
            file={secondaryFile}
            preview={secondaryPreview}
            onFile={(f) => setFileWithPreview(f, setSecondaryFile, setSecondaryPreview)}
            onClear={() => setFileWithPreview(null, setSecondaryFile, setSecondaryPreview)}
            inputRef={secondaryInputRef}
            accept="image/*,.pdf"
            color="#818cf8"
            accentClass="badge-low"
            label="Cross-Reference Schematic"
            sublabel="Electrical Single-Line or Network Topology"
            Icon={Zap}
            optional={true}
          />
        </div>

        {/* Demo loader */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={loadDemoSet}
            disabled={loadingDemo}
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem', gap: '7px' }}
          >
            {loadingDemo ? (
              <>
                <div style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spinSlow 0.8s linear infinite' }} />
                Loading Demo Files...
              </>
            ) : (
              <>
                <Sparkles size={13} color="var(--accent-cyan)" />
                Load Official Test Scenario — Floor Plan + Electrical Diagram
              </>
            )}
          </button>
        </div>

        {/* Configuration Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>

          {/* Analysis Strategy */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '14px',
            }}>Analysis Strategy</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Inspector Mode */}
              <div
                onClick={() => setMode('inspector')}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: mode === 'inspector' ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  background: mode === 'inspector' ? 'rgba(56,189,248,0.07)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: mode === 'inspector' ? '0 0 16px rgba(56,189,248,0.1)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '5px' }}>
                  <ShieldCheck size={17} color={mode === 'inspector' ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: mode === 'inspector' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    Inspector Mode
                  </span>
                  {mode === 'inspector' && <span className="badge badge-medium" style={{ marginLeft: 'auto', fontSize: '0.6rem' }}>SELECTED</span>}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Codified municipal inspector. Evaluates NFPA 101, IBC egress codes, NEC branch circuit rules.
                </div>
              </div>

              {/* Adversarial Mode */}
              <div
                onClick={() => setMode('adversarial')}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: mode === 'adversarial' ? '1.5px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
                  background: mode === 'adversarial' ? 'rgba(244,63,94,0.07)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: mode === 'adversarial' ? '0 0 16px rgba(244,63,94,0.1)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '5px' }}>
                  <ShieldAlert size={17} color={mode === 'adversarial' ? '#fb7185' : 'var(--text-muted)'} />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: mode === 'adversarial' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    Adversarial Red-Team
                  </span>
                  {mode === 'adversarial' && <span className="badge badge-critical" style={{ marginLeft: 'auto', fontSize: '0.6rem' }}>SELECTED</span>}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Simulates threat actors: evacuation choke points, entrapment scenarios, and power cascade collapse.
                </div>
              </div>
            </div>
          </div>

          {/* Model Selector */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px',
            }}>
              <Cpu size={15} color="var(--accent-cyan)" />
              <span style={{
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>Google Gemini Model</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {AVAILABLE_MODELS.map((m) => {
                const active = selectedModel === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleModelChange(m.id)}
                    style={{
                      padding: '11px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: active ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                      background: active ? 'rgba(56,189,248,0.07)' : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="mono" style={{
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        color: active ? 'var(--accent-cyan)' : 'var(--text-primary)',
                      }}>
                        {m.name}
                      </span>
                      {active && <span className="badge badge-success" style={{ fontSize: '0.58rem' }}>ACTIVE</span>}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Launch Button */}
        <button
          type="submit"
          disabled={!primaryFile}
          className="btn"
          style={{
            padding: '18px 24px',
            borderRadius: 'var(--radius-lg)',
            fontSize: '1rem',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.01em',
            fontFamily: 'var(--font-display)',
            background: primaryFile
              ? 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #06b6d4 100%)'
              : 'rgba(255,255,255,0.04)',
            border: primaryFile
              ? '1px solid rgba(56,189,248,0.5)'
              : '1px solid var(--border-subtle)',
            cursor: primaryFile ? 'pointer' : 'not-allowed',
            opacity: primaryFile ? 1 : 0.35,
            boxShadow: primaryFile
              ? '0 4px 30px rgba(2,132,199,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
              : 'none',
            transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
            gap: '12px',
          }}
        >
          <Zap size={20} />
          Execute Autonomous 5-Layer Infrastructure Audit
          {primaryFile && secondaryFile && (
            <span style={{ opacity: 0.7, fontWeight: 500, fontSize: '0.85rem' }}>
              · Floor Plan + Electrical
            </span>
          )}
        </button>

        {/* Bottom disclaimer */}
        <div style={{ textAlign: 'center', fontSize: '0.73rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          ALL PROCESSING OCCURS IN YOUR BROWSER · NO FILES ARE UPLOADED TO ANY SERVER · ZERO DATA RETENTION
        </div>
      </form>
    </div>
  );
}
