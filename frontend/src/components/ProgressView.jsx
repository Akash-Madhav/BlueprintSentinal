import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, Layers, Cpu, ShieldCheck, WifiOff, HardDrive, Clock } from 'lucide-react';

const PIPELINE_STEPS = [
  { id: 1, title: 'Layer 1: Document Classification', desc: 'Identifies blueprint typology & routes to applicable standard rule libraries', icon: Layers },
  { id: 2, title: 'Layer 2: Structural Extraction', desc: 'Converts floor plans & schematics into normalized graphs with bounding boxes', icon: Cpu },
  { id: 3, title: 'Layer 3: Deterministic Rule Audit', desc: 'Zero-model codified egress (NFPA/IBC) & electrical redundancy (NEC) verification', icon: ShieldCheck },
  { id: 4, title: 'Layer 4: AI Reasoning & Adversarial Red-Team', desc: 'Contextual risk analysis, choke point sabotage modeling & cross-plan conflict detection', icon: Sparkles },
  { id: 5, title: 'Layer 5: Cross-Verification & Resilience Grading', desc: 'Consolidates findings, grounds graph elements & generates composite safety grade', icon: CheckCircle2 },
];

export default function ProgressView() {
  const [currentStep, setCurrentStep] = useState(1);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < 5 ? prev + 1 : 5));
    }, 1100);

    return () => {
      clearInterval(timer);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Autonomous Audit In Progress
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Executing five-layer verification pipeline on local hardware. Zero external network telemetry.
        </p>

        {/* Live Execution Telemetry Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          marginTop: '16px',
          flexWrap: 'wrap'
        }}>
          <div className="mono" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            padding: '4px 12px',
            borderRadius: '9999px',
            background: 'rgba(56, 189, 248, 0.1)',
            color: 'var(--accent-cyan)',
            border: '1px solid rgba(56, 189, 248, 0.25)'
          }}>
            <Clock size={13} />
            <span>ELAPSED: {elapsed}s</span>
          </div>

          <div className="mono" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            padding: '4px 12px',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.1)',
            color: 'var(--accent-emerald)',
            border: '1px solid rgba(16, 185, 129, 0.25)'
          }}>
            <WifiOff size={13} />
            <span>AIR-GAPPED: STRICT LOCAL</span>
          </div>

          <div className="mono" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            padding: '4px 12px',
            borderRadius: '9999px',
            background: 'rgba(99, 102, 241, 0.1)',
            color: '#818cf8',
            border: '1px solid rgba(99, 102, 241, 0.25)'
          }}>
            <HardDrive size={13} />
            <span>MODEL STORAGE: ./models/</span>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '28px', textAlign: 'left' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {PIPELINE_STEPS.map((step) => {
            const Icon = step.icon;
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isPending = currentStep < step.id;

            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '18px',
                  padding: '16px 20px',
                  borderRadius: '10px',
                  background: isCurrent ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: isCurrent ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isDone
                    ? 'rgba(16, 185, 129, 0.15)'
                    : isCurrent
                    ? 'rgba(56, 189, 248, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                  color: isDone
                    ? 'var(--accent-emerald)'
                    : isCurrent
                    ? 'var(--accent-cyan)'
                    : 'var(--text-muted)'
                }}>
                  {isDone ? <CheckCircle2 size={22} /> : isCurrent ? <Loader2 size={22} className="animate-spin" /> : <Icon size={20} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: isDone ? 'var(--text-primary)' : isCurrent ? 'var(--accent-cyan)' : 'var(--text-muted)'
                  }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {step.desc}
                  </div>
                </div>

                <div className="mono" style={{ fontSize: '0.75rem' }}>
                  {isDone && <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>COMPLETED</span>}
                  {isCurrent && <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>IN PROGRESS...</span>}
                  {isPending && <span style={{ color: 'var(--text-muted)' }}>QUEUED</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
