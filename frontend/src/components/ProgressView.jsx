import React, { useEffect, useState, useRef } from 'react';
import {
  CheckCircle2, Loader2, Layers, Cpu, ShieldCheck,
  Sparkles, Clock, Globe, Activity, Terminal
} from 'lucide-react';

const PIPELINE_STEPS = [
  {
    id: 1,
    title: 'Layer 1 — Document Classification',
    desc: 'Identifies blueprint typology & routes to applicable standard rule libraries (NFPA/IBC/NEC)',
    icon: Layers,
    color: '#38bdf8',
    tag: 'VISION',
  },
  {
    id: 2,
    title: 'Layer 2 — Structural Graph Extraction',
    desc: 'Converts floor plans & schematics into normalized spatial graphs with element bounding boxes',
    icon: Cpu,
    color: '#818cf8',
    tag: 'MULTIMODAL',
  },
  {
    id: 3,
    title: 'Layer 3 — Deterministic Rule Audit',
    desc: 'Zero-model codified verification: NFPA 101 egress, NEC electrical redundancy, IBC occupancy',
    icon: ShieldCheck,
    color: '#10b981',
    tag: 'CODIFIED',
  },
  {
    id: 4,
    title: 'Layer 4 — AI Reasoning & Adversarial Red-Team',
    desc: 'Contextual risk analysis, choke-point sabotage modeling & cross-plan cascade conflict detection',
    icon: Sparkles,
    color: '#f43f5e',
    tag: 'AI REASONING',
  },
  {
    id: 5,
    title: 'Layer 5 — Cross-Verification & Resilience Grading',
    desc: 'Consolidates findings, grounds graph elements & computes composite safety grade',
    icon: CheckCircle2,
    color: '#fbbf24',
    tag: 'VERIFICATION',
  },
];

// Simulated log messages for terminal feel
const LOG_MESSAGES = [
  '> Initializing blueprint analysis engine...',
  '> Loading codified rule library (v2.3.1)...',
  '> Reading NFPA 101-2021 egress requirements...',
  '> Loading NEC 2023 branch circuit tables...',
  '> IBC 2021 occupancy classification loaded...',
  '> Running spatial graph parser...',
  '> Extracting room connectivity matrix...',
  '> Computing egress path topology...',
  '> Analyzing electrical single-line topology...',
  '> Cross-referencing plan elements...',
  '> Grounding findings to spatial coordinates...',
  '> Computing resilience score vectors...',
  '> Synthesizing executive summary...',
  '> Audit pipeline complete.',
];

export default function ProgressView({ progress }) {
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState([LOG_MESSAGES[0]]);
  const [pulse, setPulse] = useState(false);
  const logsEndRef = useRef(null);

  const currentStep = progress?.step || 1;

  useEffect(() => {
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Add log lines periodically
  useEffect(() => {
    const logTimer = setInterval(() => {
      setLogs((prev) => {
        if (prev.length >= LOG_MESSAGES.length) return prev;
        return [...prev, LOG_MESSAGES[prev.length]];
      });
    }, 1800);
    return () => clearInterval(logTimer);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Pulse flash on step change
  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(t);
  }, [currentStep]);

  const completedCount = currentStep - 1;
  const progressPct = Math.round((completedCount / PIPELINE_STEPS.length) * 100);

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }} className="animate-fade-in">

      {/* Top Section */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        {/* Animated scanner icon */}
        <div style={{ position: 'relative', display: 'inline-flex', marginBottom: '20px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '18px',
            background: 'rgba(56,189,248,0.1)',
            border: '1px solid rgba(56,189,248,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Activity size={34} color="var(--accent-cyan)" strokeWidth={1.5} />
          </div>
          {/* Orbit rings */}
          <div style={{
            position: 'absolute',
            inset: '-12px',
            borderRadius: '50%',
            border: '1.5px dashed rgba(56,189,248,0.2)',
            animation: 'spinSlow 6s linear infinite',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            inset: '-22px',
            borderRadius: '50%',
            border: '1px dashed rgba(56,189,248,0.1)',
            animation: 'spinSlow 12s linear infinite reverse',
            pointerEvents: 'none',
          }} />
        </div>

        <h2 className="font-display tracking-tight" style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '8px' }}>
          Autonomous Audit{' '}
          <span style={{ color: 'var(--accent-cyan)' }}>In Progress</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Executing five-layer verification pipeline with Google Gemini Multimodal AI.
        </p>

        {/* Telemetry chips */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginTop: '18px',
        }}>
          <span className="data-chip data-chip-cyan">
            <Clock size={12} />
            ELAPSED: {elapsed}s
          </span>
          <span className="data-chip data-chip-emerald">
            <Globe size={12} />
            STEP: {currentStep} / {PIPELINE_STEPS.length}
          </span>
          <span className="data-chip data-chip-violet" style={{ background: 'rgba(139,92,246,0.07)', color: '#c4b5fd', borderColor: 'rgba(139,92,246,0.2)' }}>
            <Cpu size={12} />
            GEMINI MULTIMODAL
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          <span>PIPELINE PROGRESS</span>
          <span style={{ color: 'var(--accent-cyan)' }}>{progressPct}%</span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #0369a1, #38bdf8, #2dd4bf)',
              boxShadow: '0 0 10px rgba(56,189,248,0.5)',
            }}
          />
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isPending = currentStep < step.id;

            return (
              <div key={step.id}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: isCurrent ? `${step.color}09` : 'transparent',
                    border: isCurrent ? `1px solid ${step.color}30` : '1px solid transparent',
                    transition: 'all 0.35s ease',
                    animation: isCurrent && pulse ? 'fadeIn 0.3s ease' : 'none',
                  }}
                >
                  {/* Step icon */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isDone
                      ? 'rgba(16,185,129,0.12)'
                      : isCurrent
                        ? `${step.color}15`
                        : 'rgba(255,255,255,0.04)',
                    border: isDone
                      ? '1px solid rgba(16,185,129,0.3)'
                      : isCurrent
                        ? `1px solid ${step.color}40`
                        : '1px solid transparent',
                    transition: 'all 0.3s ease',
                  }}>
                    {isDone
                      ? <CheckCircle2 size={20} color="var(--accent-emerald)" />
                      : isCurrent
                        ? <Loader2 size={20} color={step.color} className="animate-spin" />
                        : <Icon size={18} color="var(--text-dim)" />
                    }
                  </div>

                  {/* Step info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        color: isDone ? 'var(--text-secondary)' : isCurrent ? 'var(--text-primary)' : 'var(--text-dim)',
                        transition: 'color 0.3s',
                      }}>
                        {step.title}
                      </span>
                      <span className="badge badge-neutral mono" style={{ fontSize: '0.58rem', letterSpacing: '0.08em' }}>
                        {step.tag}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {step.desc}
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700 }}>
                    {isDone && <span style={{ color: 'var(--accent-emerald)' }}>✓ DONE</span>}
                    {isCurrent && (
                      <span style={{ color: step.color, animation: 'blinkCursor 1.2s ease infinite' }}>
                        RUNNING_
                      </span>
                    )}
                    {isPending && <span style={{ color: 'var(--text-dim)' }}>QUEUED</span>}
                  </div>
                </div>

                {/* Connector line */}
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div style={{
                    marginLeft: '36px',
                    width: '2px',
                    height: '8px',
                    background: isDone
                      ? 'rgba(16,185,129,0.3)'
                      : 'rgba(255,255,255,0.05)',
                    transition: 'background 0.5s',
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal Log */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <Terminal size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Execution Log
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px' }}>
            {['#f87171','#fbbf24','#34d399'].map(c => (
              <div key={c} style={{ width: '8px', height: '8px', borderRadius: '50%', background: c, opacity: 0.5 }} />
            ))}
          </div>
        </div>
        <div style={{
          padding: '14px 16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          lineHeight: 1.7,
          color: 'var(--text-muted)',
          maxHeight: '160px',
          overflowY: 'auto',
        }}>
          {logs.map((line, i) => (
            <div key={i} style={{
              color: i === logs.length - 1 ? 'var(--accent-cyan)' : 'var(--text-muted)',
              opacity: i === logs.length - 1 ? 1 : 0.7,
            }}>
              <span style={{ color: 'var(--text-dim)', userSelect: 'none' }}>
                [{String(i + 1).padStart(2, '0')}]
              </span>{' '}
              {line}
              {i === logs.length - 1 && (
                <span style={{ animation: 'blinkCursor 0.8s ease infinite', marginLeft: '2px' }}>▌</span>
              )}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
