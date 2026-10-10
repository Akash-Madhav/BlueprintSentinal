import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert, AlertTriangle, Info, ChevronDown, ChevronUp,
  Terminal, RotateCcw, ShieldCheck, Download, FileCode,
  ZoomIn, ZoomOut, Maximize2, CheckCircle2, Zap, Activity,
  BookOpen, Layers, Target
} from 'lucide-react';

/* ── Severity helpers ────────────────────────────────────────── */
const SEV_CONFIG = {
  critical: { color: '#fb7185', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.3)', label: 'CRITICAL', icon: ShieldAlert },
  high:     { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'HIGH',     icon: AlertTriangle },
  medium:   { color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.25)', label: 'MEDIUM', icon: Info },
  low:      { color: '#a5b4fc', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', label: 'LOW',     icon: Info },
};

function SeverityBadge({ severity }) {
  const cfg = SEV_CONFIG[severity] || SEV_CONFIG.low;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 9px', borderRadius: '9999px',
      fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.07em',
      fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

/* ── Animated score arc ──────────────────────────────────────── */
function ScoreArc({ score, grade, size = 120 }) {
  const gradeColors = {
    'A+': '#10b981', A: '#10b981', B: '#38bdf8',
    C: '#f59e0b', D: '#f43f5e', F: '#f43f5e',
  };
  const color = gradeColors[grade] || '#38bdf8';
  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circ * (1 - pct / 100);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: '1.9rem', fontWeight: 900, color, lineHeight: 1, fontFamily: 'var(--font-display)' }}>
          {grade}
        </div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Grade
        </div>
      </div>
    </div>
  );
}

/* ── Discipline bar ──────────────────────────────────────────── */
function DisciplineBar({ label, value, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '5px' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="mono" style={{ color, fontWeight: 700 }}>{value}%</span>
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 8px ${color}50`,
          }}
        />
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function ReportView({ report, onReset, onShowYourWork }) {
  const [expandedId, setExpandedId] = useState(null);
  const [selectedFindingId, setSelectedFindingId] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [activePlanTab, setActivePlanTab] = useState('primary');
  const [overlayFilter, setOverlayFilter] = useState('violations');
  const [zoomLevel, setZoomLevel] = useState(1);
  const findingsRef = useRef({});

  const findings = report?.findings || [];
  const metrics = report?.resilience_metrics || {
    overall_score: 80, grade: 'B',
    discipline_scores: { architectural: 75, electrical: 70, cyber_physical: 95 },
    risk_matrix: { critical: 1, high: 2, medium: 1, low: 0 },
    executive_summary: 'Infrastructure audit completed with itemized findings.',
  };

  const filteredFindings = filterSeverity === 'all'
    ? findings
    : findings.filter((f) => f.severity === filterSeverity);

  const selectedFinding = findings.find((f) => f.finding_id === selectedFindingId);

  useEffect(() => {
    if (findings.length > 0 && !selectedFindingId) {
      setSelectedFindingId(findings[0].finding_id);
      setExpandedId(findings[0].finding_id);
    }
  }, [findings]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
    setSelectedFindingId(id);
  };

  const handleSelectFinding = (findingId) => {
    setSelectedFindingId(findingId);
    setExpandedId(findingId);
    findingsRef.current[findingId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  /* Export JSON */
  const handleExportJSON = () => {
    const url = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const a = document.createElement('a');
    a.href = url;
    a.download = `blueprint_sentinel_${report.session_id.slice(0, 8)}.json`;
    a.click();
  };

  /* Export Markdown */
  const handleExportMarkdown = () => {
    const lines = [
      `# BluePrint Sentinel — Infrastructure Audit Report`,
      `**Session ID:** \`${report.session_id}\``,
      `**Typologies:** ${report.plan_types?.join(' + ')}`,
      `**Engine:** Google Gemini Multimodal Vision`,
      ``,
      `## Resilience Summary`,
      `- **Score:** ${metrics.overall_score}/100 — **Grade: ${metrics.grade}**`,
      `- Life Safety: ${metrics.discipline_scores?.architectural}%`,
      `- Electrical Redundancy: ${metrics.discipline_scores?.electrical}%`,
      `- Cyber-Physical: ${metrics.discipline_scores?.cyber_physical}%`,
      ``,
      `> ${metrics.executive_summary}`,
      ``,
      `## Findings (${findings.length})`,
      ``,
    ];
    findings.forEach((f, i) => {
      lines.push(
        `### ${i + 1}. [${f.severity.toUpperCase()}] ${f.title}`,
        `- Confidence: ${Math.round(f.confidence * 100)}% | Layers: ${f.contributing_layers?.join(', ')}`,
        `- Standard: \`${f.regulatory_code || 'N/A'}\``,
        `- ${f.explanation}`,
        `- **Remediation:** ${f.remediation || 'N/A'}`,
        ``,
      );
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `blueprint_sentinel_report_${report.session_id.slice(0, 8)}.md`;
    a.click();
  };

  const primaryImgUrl = report.primary_image_url || '/samples/demo_floor_plan_office.png';
  const secondaryImgUrl = report.secondary_image_url;
  const hasSecondary = report.plan_types?.length > 1 && secondaryImgUrl;
  const currentPlanImage = activePlanTab === 'primary' ? primaryImgUrl : secondaryImgUrl;
  const elementsManifest = report.elements_manifest || [];
  const selectedElements = new Set(selectedFinding?.element_ids || []);

  const riskCounts = {
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
  };

  return (
    <div style={{ maxWidth: '1340px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">

      {/* ── REPORT HEADER ──────────────────────────────────────── */}
      <div className="glass-panel" style={{
        padding: '22px 28px',
        borderTop: '2px solid rgba(16,185,129,0.35)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        boxShadow: 'var(--glow-emerald)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldCheck size={18} color="var(--accent-emerald)" />
            </div>
            <h2 className="font-display tracking-tight" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              Autonomous Verification Report
            </h2>
            <span className="badge badge-success">COMPLETE</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Audit ID: <span style={{ color: 'var(--accent-cyan)' }}>{report.session_id}</span>
            {' · '}Typologies:{' '}
            <span style={{ color: 'var(--text-secondary)' }}>{report.plan_types?.join(' + ')}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button onClick={handleExportMarkdown} className="btn btn-cyan-ghost" style={{ fontSize: '0.8rem' }}>
            <Download size={14} /> Export (MD)
          </button>
          <button onClick={handleExportJSON} className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
            <FileCode size={14} /> JSON
          </button>
          <button onClick={onShowYourWork} className="btn btn-ghost" style={{ fontSize: '0.8rem', color: '#c4b5fd', borderColor: 'rgba(139,92,246,0.3)' }}>
            <Terminal size={14} /> Show Your Work
          </button>
          <button onClick={onReset} className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
            <RotateCcw size={14} /> New Audit
          </button>
        </div>
      </div>

      {/* ── SCORECARD ROW ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '16px', alignItems: 'stretch' }}>

        {/* Score Arc Card */}
        <div className="glass-panel" style={{
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: '22px',
          minWidth: '260px',
        }}>
          <ScoreArc score={metrics.overall_score} grade={metrics.grade} size={110} />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
              Resilience Score
            </div>
            <div className="font-display" style={{ fontSize: '2.6rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {metrics.overall_score}
              <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/100</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Deterministic + contextual composite
            </div>
          </div>
        </div>

        {/* Discipline Scores */}
        <div className="glass-panel" style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
            Discipline Scores
          </div>
          <DisciplineBar label="Life Safety & Egress (NFPA/IBC)" value={metrics.discipline_scores?.architectural ?? 75} color="var(--accent-cyan)" />
          <DisciplineBar label="Electrical Redundancy (NEC/IEEE)" value={metrics.discipline_scores?.electrical ?? 70} color="var(--accent-amber)" />
          <DisciplineBar label="Cyber-Physical Isolation (IEC 62443)" value={metrics.discipline_scores?.cyber_physical ?? 95} color="var(--accent-emerald)" />
        </div>

        {/* Risk Matrix */}
        <div className="glass-panel" style={{ padding: '22px 24px', minWidth: '200px' }}>
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            Vulnerability Distribution
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { sev: 'critical', color: '#fb7185', count: riskCounts.critical },
              { sev: 'high',     color: '#fbbf24', count: riskCounts.high },
              { sev: 'medium',   color: '#38bdf8', count: riskCounts.medium },
              { sev: 'low',      color: '#a5b4fc', count: riskCounts.low },
            ].map(({ sev, color, count }) => (
              <div
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: `${color}0d`,
                  border: `1px solid ${color}30`,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  opacity: filterSeverity !== 'all' && filterSeverity !== sev ? 0.5 : 1,
                }}
              >
                <div style={{ fontSize: '0.65rem', color, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{sev}</div>
                <div className="font-display" style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1.1, marginTop: '2px' }}>{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── EXECUTIVE SUMMARY ──────────────────────────────────── */}
      {metrics.executive_summary && (
        <div className="glass-panel" style={{
          padding: '16px 22px',
          borderLeft: `3px solid var(--accent-emerald)`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
        }}>
          <BookOpen size={18} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '4px' }}>
              Executive Summary
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {metrics.executive_summary}
            </p>
          </div>
        </div>
      )}

      {/* ── SPLIT VIEW: Blueprint Inspector + Findings ─────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.1fr) minmax(360px, 1fr)', gap: '16px', alignItems: 'start' }}>

        {/* Blueprint Inspector Panel */}
        <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Plan tabs + overlay toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setActivePlanTab('primary')}
                style={{
                  padding: '5px 13px', borderRadius: '7px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  background: activePlanTab === 'primary' ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
                  color: activePlanTab === 'primary' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  border: activePlanTab === 'primary' ? '1px solid rgba(56,189,248,0.4)' : '1px solid var(--border-subtle)',
                  transition: 'all 0.15s',
                }}
              >
                <Layers size={12} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                Floor Plan
              </button>
              {hasSecondary && (
                <button
                  onClick={() => setActivePlanTab('secondary')}
                  style={{
                    padding: '5px 13px', borderRadius: '7px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                    background: activePlanTab === 'secondary' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                    color: activePlanTab === 'secondary' ? '#818cf8' : 'var(--text-secondary)',
                    border: activePlanTab === 'secondary' ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--border-subtle)',
                    transition: 'all 0.15s',
                  }}
                >
                  <Zap size={12} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                  Electrical
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '5px' }}>
              {['violations', 'all'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setOverlayFilter(opt)}
                  style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '0.71rem', fontWeight: 600, cursor: 'pointer',
                    background: overlayFilter === opt ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: overlayFilter === opt ? 'var(--text-primary)' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all 0.15s',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {opt === 'violations' ? '🔴 Violations' : '📐 All'}
                </button>
              ))}
            </div>
          </div>

          {/* Blueprint Canvas */}
          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4 / 3',
            background: '#010306',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9)',
          }}>
            <img
              src={currentPlanImage}
              alt="Audited Blueprint"
              style={{
                width: '100%', height: '100%', objectFit: 'contain',
                opacity: 0.88, filter: 'contrast(1.06) brightness(0.9)',
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.25s ease',
              }}
            />

            {/* SVG overlay */}
            <svg
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                transform: `scale(${zoomLevel})`, transformOrigin: 'center center',
                transition: 'transform 0.25s ease',
              }}
              viewBox="0 0 1000 750"
              preserveAspectRatio="xMidYMid meet"
            >
              {elementsManifest.map((elem) => {
                if (!elem.normalized_bbox) return null;
                const [ymin, xmin, ymax, xmax] = elem.normalized_bbox;
                const bx = xmin * 1000, by = ymin * 750;
                const bw = (xmax - xmin) * 1000, bh = (ymax - ymin) * 750;
                const isSelected = selectedElements.has(elem.id);
                const hasViolation = findings.some((f) => f.element_ids.includes(elem.id));

                if (overlayFilter === 'violations' && !hasViolation && !isSelected) return null;

                let stroke = 'rgba(56,189,248,0.35)';
                let fill = 'rgba(56,189,248,0.04)';
                let isCritical = false;

                if (hasViolation) {
                  const maxSev = findings.filter((f) => f.element_ids.includes(elem.id))[0]?.severity;
                  if (maxSev === 'critical') {
                    stroke = isSelected ? '#f43f5e' : 'rgba(244,63,94,0.75)';
                    fill = isSelected ? 'rgba(244,63,94,0.2)' : 'rgba(244,63,94,0.1)';
                    isCritical = true;
                  } else if (maxSev === 'high') {
                    stroke = isSelected ? '#fbbf24' : 'rgba(245,158,11,0.75)';
                    fill = isSelected ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.1)';
                  }
                } else if (isSelected) {
                  stroke = '#38bdf8'; fill = 'rgba(56,189,248,0.15)';
                }

                return (
                  <g key={elem.id}
                    onClick={() => {
                      const related = findings.find((f) => f.element_ids.includes(elem.id));
                      if (related) handleSelectFinding(related.finding_id);
                    }}
                    style={{ cursor: hasViolation ? 'pointer' : 'default' }}
                  >
                    <rect x={bx} y={by} width={bw} height={bh}
                      fill={fill} stroke={stroke}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      strokeDasharray={isSelected ? '5 3' : 'none'}
                      rx={3}
                    />
                    {(isSelected || hasViolation) && (
                      <g>
                        <rect x={bx + 2} y={by + 2}
                          width={Math.min(bw - 4, ((elem.label || elem.id).length) * 7 + 8)}
                          height={15} fill="rgba(4,7,17,0.88)" rx={2}
                        />
                        <text x={bx + 5} y={by + 12}
                          fill={isCritical ? '#fb7185' : '#38bdf8'}
                          fontSize="9" fontFamily="monospace" fontWeight="bold"
                        >
                          {(elem.label || elem.id).slice(0, 18)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Zoom controls */}
            <div style={{
              position: 'absolute', bottom: '10px', right: '10px',
              display: 'flex', gap: '4px',
              background: 'rgba(4,7,17,0.8)', backdropFilter: 'blur(8px)',
              padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)',
            }}>
              {[
                { icon: ZoomIn, action: () => setZoomLevel((z) => Math.min(2.5, z + 0.25)) },
                { icon: ZoomOut, action: () => setZoomLevel((z) => Math.max(0.5, z - 0.25)) },
                { icon: Maximize2, action: () => setZoomLevel(1) },
              ].map(({ icon: Icon, action }, i) => (
                <button key={i} onClick={action} style={{
                  padding: '6px', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', border: 'none',
                  borderRadius: '5px', display: 'flex', alignItems: 'center', transition: 'color 0.15s',
                }}>
                  <Icon size={15} />
                </button>
              ))}
            </div>

            {/* Zoom level chip */}
            <div style={{
              position: 'absolute', bottom: '10px', left: '10px',
              fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)',
              background: 'rgba(4,7,17,0.7)', padding: '3px 8px', borderRadius: '5px',
            }}>
              {Math.round(zoomLevel * 100)}%
            </div>
          </div>

          {/* Selected finding spatial anchors */}
          {selectedFinding && selectedFinding.element_ids.length > 0 && (
            <div style={{
              padding: '12px 14px', borderRadius: 'var(--radius-md)',
              background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)',
              fontSize: '0.78rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  <Target size={10} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                  Spatial Anchors
                </span>
                <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                  {selectedFinding.element_ids.length} Assets
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {selectedFinding.element_ids.map((eid) => (
                  <span key={eid} className="mono" style={{
                    fontSize: '0.7rem', padding: '2px 7px', borderRadius: '4px',
                    background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)',
                    color: 'var(--accent-cyan)',
                  }}>
                    #{eid}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Findings Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Severity filter chips */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {['all', 'critical', 'high', 'medium', 'low'].map((sev) => {
              const count = sev === 'all' ? findings.length : findings.filter((f) => f.severity === sev).length;
              const cfg = SEV_CONFIG[sev];
              const isActive = filterSeverity === sev;
              return (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  style={{
                    padding: '6px 13px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                    fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: isActive
                      ? sev === 'all' ? 'rgba(255,255,255,0.1)' : cfg.bg
                      : 'rgba(255,255,255,0.03)',
                    color: isActive
                      ? sev === 'all' ? 'var(--text-primary)' : cfg.color
                      : 'var(--text-muted)',
                    border: isActive
                      ? sev === 'all' ? '1px solid var(--border-medium)' : `1px solid ${cfg.border}`
                      : '1px solid transparent',
                  }}
                >
                  {sev === 'all' ? 'ALL' : sev.toUpperCase()} · {count}
                </button>
              );
            })}
          </div>

          {/* Findings list */}
          {filteredFindings.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <CheckCircle2 size={32} color="var(--accent-emerald)" style={{ margin: '0 auto 12px', display: 'block' }} />
              No {filterSeverity !== 'all' ? filterSeverity + '-severity ' : ''}findings detected.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '700px', overflowY: 'auto', paddingRight: '3px' }}>
              {filteredFindings.map((finding) => {
                const isExpanded = expandedId === finding.finding_id;
                const isSelected = selectedFindingId === finding.finding_id;
                const cfg = SEV_CONFIG[finding.severity] || SEV_CONFIG.low;

                return (
                  <div
                    key={finding.finding_id}
                    ref={(el) => (findingsRef.current[finding.finding_id] = el)}
                    style={{
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? `1px solid ${cfg.border}` : '1px solid var(--border-subtle)',
                      background: isSelected ? `${cfg.color}06` : 'rgba(255,255,255,0.02)',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    {/* Severity left bar */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
                      background: cfg.color,
                      boxShadow: isSelected ? `0 0 8px ${cfg.color}` : 'none',
                      transition: 'box-shadow 0.2s',
                    }} />

                    {/* Header */}
                    <div
                      onClick={() => toggleExpand(finding.finding_id)}
                      style={{ padding: '13px 16px 13px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                      <SeverityBadge severity={finding.severity} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {finding.title}
                        </div>
                        {finding.regulatory_code && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                            {finding.regulatory_code}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {(finding.confidence * 100).toFixed(0)}%
                        </span>
                        {isExpanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                      </div>
                    </div>

                    {/* Explanation always visible */}
                    <div style={{ padding: '0 18px 10px', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
                      {finding.explanation}
                    </div>

                    {/* Remediation */}
                    {finding.remediation && (
                      <div style={{
                        margin: '0 14px 12px',
                        padding: '9px 13px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(16,185,129,0.07)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        fontSize: '0.78rem',
                        lineHeight: 1.5,
                        color: '#34d399',
                      }}>
                        <strong style={{ display: 'block', marginBottom: '2px', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Remediation
                        </strong>
                        {finding.remediation}
                      </div>
                    )}

                    {/* Element IDs */}
                    {finding.element_ids?.length > 0 && (
                      <div style={{ padding: '0 14px 12px', display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Assets:</span>
                        {finding.element_ids.map((eid) => (
                          <span key={eid} className="mono" style={{
                            fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--accent-cyan)',
                          }}>
                            #{eid}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expanded reasoning trace */}
                    {isExpanded && finding.raw_reasoning && (
                      <div style={{
                        padding: '14px 18px',
                        background: 'rgba(2,4,11,0.8)',
                        borderTop: '1px solid var(--border-subtle)',
                      }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '8px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Five-Layer Verification Evidence Trace
                        </div>
                        <pre className="mono" style={{
                          fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap',
                          lineHeight: 1.55, maxHeight: '200px', overflowY: 'auto',
                        }}>
                          {finding.raw_reasoning}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
