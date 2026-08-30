import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, Layers, Cpu, ShieldCheck } from 'lucide-react';

const PIPELINE_STEPS = [
  { id: 1, title: 'Layer 1: Document Classification', desc: 'Identifies plan typology & routes to standard rulesets', icon: Layers },
  { id: 2, title: 'Layer 2: Structural Extraction', desc: 'Converts floor plans & schematics into normalized graphs', icon: Cpu },
  { id: 3, title: 'Layer 3: Deterministic Rule Audit', desc: 'Evaluates zero-model codified egress, electrical & network rules', icon: ShieldCheck },
  { id: 4, title: 'Layer 4: AI Reasoning & Adversarial Red-Team', desc: 'Contextual LLM analysis & multi-plan cross-discipline conflict detection', icon: Sparkles },
  { id: 5, title: 'Layer 5: Cross-Verification & Ranking', desc: 'Consolidates findings, drops low-confidence noise & prioritizes severity', icon: CheckCircle2 },
];

export default function ProgressView({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    // Simulated step progression matching typical local backend execution timing
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < 5) return prev + 1;
        clearInterval(interval);
        return 5;
      });
    }, 900);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>
          Autonomous Audit In Progress
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Processing multi-layer verification pipeline on local hardware. No remote calls.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '32px', textAlign: 'left' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                  padding: '16px',
                  borderRadius: '10px',
                  background: isCurrent ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: isCurrent ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
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
                  {isDone && <span style={{ color: 'var(--accent-emerald)' }}>DONE</span>}
                  {isCurrent && <span style={{ color: 'var(--accent-cyan)' }}>RUNNING...</span>}
                  {isPending && <span style={{ color: 'var(--text-muted)' }}>PENDING</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
