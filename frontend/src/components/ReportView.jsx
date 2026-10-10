import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Terminal,
  RotateCcw,
  ShieldCheck,
  Download,
  FileCode,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  ExternalLink,
  Zap,
  Activity,
  FileText
} from 'lucide-react';

export default function ReportView({ report, onReset, onShowYourWork }) {
  const [expandedId, setExpandedId] = useState(null);
  const [selectedFindingId, setSelectedFindingId] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [activePlanTab, setActivePlanTab] = useState('primary'); // 'primary' | 'secondary'
  const [overlayFilter, setOverlayFilter] = useState('violations'); // 'violations' | 'all' | 'rooms' | 'exits'
  const [zoomLevel, setZoomLevel] = useState(1);
  const findingsRef = useRef({});

  const findings = report?.findings || [];
  const metrics = report?.resilience_metrics || {
    overall_score: 80,
    grade: 'B',
    discipline_scores: { architectural: 75, electrical: 70, cyber_physical: 95 },
    risk_matrix: { critical: 1, high: 2, medium: 1, low: 0 },
    executive_summary: 'Infrastructure audit completed with itemized findings.',
  };

  const filteredFindings = filterSeverity === 'all'
    ? findings
    : findings.filter((f) => f.severity === filterSeverity);

  const selectedFinding = findings.find((f) => f.finding_id === selectedFindingId);

  // Auto-select first critical or high finding initially
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
    const element = findingsRef.current[findingId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return <span className="badge badge-critical"><ShieldAlert size={12} /> CRITICAL</span>;
      case 'high':
        return <span className="badge badge-high"><AlertTriangle size={12} /> HIGH</span>;
      case 'medium':
        return <span className="badge badge-medium"><Info size={12} /> MEDIUM</span>;
      default:
        return <span className="badge badge-low">LOW</span>;
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A': return 'var(--accent-emerald)';
      case 'B': return 'var(--accent-cyan)';
      case 'C': return 'var(--accent-amber)';
      default: return 'var(--accent-rose)';
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `blueprint_sentinel_audit_${report.session_id.slice(0, 8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportMarkdown = () => {
    const lines = [
      `# BluePrint Sentinel — Critical Infrastructure Audit Report`,
      `**Session ID:** \`${report.session_id}\``,
      `**Plan Typologies Audited:** ${report.plan_types?.join(' + ')}`,
      `**Engine:** Google Gemini Multimodal Vision & Client-Side Verification`,
      ``,
      `---`,
      ``,
      `## Executive Summary & Resilience Grade`,
      `- **Overall Resilience Score:** ${metrics.overall_score} / 100`,
      `- **Safety & Compliance Grade:** **Grade ${metrics.grade}**`,
      `- **Architectural Life Safety:** ${metrics.discipline_scores?.architectural}%`,
      `- **Electrical Redundancy:** ${metrics.discipline_scores?.electrical}%`,
      `- **Cyber-Physical Isolation:** ${metrics.discipline_scores?.cyber_physical}%`,
      ``,
      `> ${metrics.executive_summary}`,
      ``,
      `---`,
      ``,
      `## Itemized Audit Findings (${findings.length} Total)`,
      ``,
    ];

    findings.forEach((f, i) => {
      lines.push(
        `### ${i + 1}. [${f.severity.toUpperCase()}] ${f.title}`,
        `- **Confidence:** ${Math.round(f.confidence * 100)}% | **Contributing Layers:** ${f.contributing_layers?.join(' + ')}`,
        `- **Regulatory Standard:** \`${f.regulatory_code || 'N/A'}\``,
        `- **Grounded Assets:** ${f.element_ids?.map((id) => '#' + id).join(', ')}`,
        `- **Explanation:** ${f.explanation}`,
        `- **Recommended Remediation:** *${f.remediation || 'N/A'}*`,
        ``
      );
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blueprint_sentinel_report_${report.session_id.slice(0, 8)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Determine current active plan image and manifest
  const primaryImgUrl = report.primary_image_url || '/samples/demo_floor_plan_office.png';
  const secondaryImgUrl = report.secondary_image_url || '/samples/demo_electrical_diagram.png';
  const hasSecondary = report.plan_types?.length > 1;
  const currentPlanImage = activePlanTab === 'primary' ? primaryImgUrl : secondaryImgUrl;


  // Collect bounding box overlays for current view
  const elementsManifest = report.elements_manifest || [];
  const selectedElements = new Set(selectedFinding?.element_ids || []);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Report Header Bar */}
      <div className="glass-panel" style={{
        padding: '24px 32px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} color="var(--accent-emerald)" />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Autonomous Verification Audit Report
            </h2>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Audit ID: <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{report.session_id}</span> •
            Evaluated Typologies: <span className="mono" style={{ color: 'var(--text-primary)' }}>{report.plan_types.join(' + ')}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={handleExportMarkdown}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.1)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            <Download size={15} /> Export Audit (MD)
          </button>
          <button
            onClick={handleExportJSON}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            <FileCode size={15} /> JSON
          </button>
          <button
            onClick={onShowYourWork}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.1)',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            <Terminal size={15} /> Show Your Work
          </button>
          <button
            onClick={onReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            <RotateCcw size={15} /> New Audit
          </button>
        </div>
      </div>

      {/* Resilience Scorecard & Executive Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Overall Grade Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: `2px solid ${getGradeColor(metrics.grade)}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 25px ${getGradeColor(metrics.grade)}22`
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: getGradeColor(metrics.grade), lineHeight: 1 }}>
              {metrics.grade}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>
              RESILIENCE
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Infrastructure Resilience Score
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {metrics.overall_score} <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>/ 100</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Deterministic & contextual composite rating
            </div>
          </div>
        </div>

        {/* Discipline Sub-Scores */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Life Safety & Egress (NFPA/IBC)</span>
              <span className="mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{metrics.discipline_scores?.architectural ?? 75}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${metrics.discipline_scores?.architectural ?? 75}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: '3px' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Electrical Redundancy (NEC/IEEE)</span>
              <span className="mono" style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>{metrics.discipline_scores?.electrical ?? 70}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${metrics.discipline_scores?.electrical ?? 70}%`, height: '100%', background: 'var(--accent-amber)', borderRadius: '3px' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Cyber-Physical Isolation (IEC 62443)</span>
              <span className="mono" style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{metrics.discipline_scores?.cyber_physical ?? 95}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${metrics.discipline_scores?.cyber_physical ?? 95}%`, height: '100%', background: 'var(--accent-emerald)', borderRadius: '3px' }} />
            </div>
          </div>
        </div>

        {/* Risk Distribution Matrix */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Vulnerability Severity Distribution
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
              <div style={{ fontSize: '0.75rem', color: '#fb7185' }}>CRITICAL</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fb7185' }}>{metrics.risk_matrix?.critical ?? 0}</div>
            </div>
            <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
              <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>HIGH</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fbbf24' }}>{metrics.risk_matrix?.high ?? 0}</div>
            </div>
            <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>MEDIUM</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8' }}>{metrics.risk_matrix?.medium ?? 0}</div>
            </div>
            <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(148, 163, 184, 0.1)', border: '1px solid rgba(148, 163, 184, 0.25)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>LOW</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#94a3b8' }}>{metrics.risk_matrix?.low ?? 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary Advisory Alert */}
      {metrics.executive_summary && (
        <div className="glass-panel" style={{
          padding: '16px 24px',
          borderLeft: `4px solid ${getGradeColor(metrics.grade)}`,
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          color: 'var(--text-secondary)'
        }}>
          <Activity size={22} color={getGradeColor(metrics.grade)} style={{ flexShrink: 0 }} />
          <div>{metrics.executive_summary}</div>
        </div>
      )}

      {/* Main Split View: Left = Interactive Visual Plan Inspector, Right = Findings List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.1fr) minmax(360px, 1fr)', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Interactive Visual Blueprint Inspector */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Plan Canvas Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            {/* Plan Switcher Tabs */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setActivePlanTab('primary')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background: activePlanTab === 'primary' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: activePlanTab === 'primary' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  border: activePlanTab === 'primary' ? '1px solid var(--accent-cyan)' : '1px solid transparent'
                }}
              >
                Architectural Floor Plan
              </button>

              {hasSecondary && (
                <button
                  onClick={() => setActivePlanTab('secondary')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background: activePlanTab === 'secondary' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: activePlanTab === 'secondary' ? '#818cf8' : 'var(--text-secondary)',
                    border: activePlanTab === 'secondary' ? '1px solid #818cf8' : '1px solid transparent'
                  }}
                >
                  Electrical Schematic
                </button>
              )}
            </div>

            {/* Overlay View Filters */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {['violations', 'all'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setOverlayFilter(opt)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    background: overlayFilter === opt ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: overlayFilter === opt ? 'var(--text-primary)' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {opt === 'violations' ? 'Violations Only' : 'All Elements'}
                </button>
              ))}
            </div>
          </div>

          {/* Blueprint Image Viewport with SVG Bounding Box Overlays */}
          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4 / 3',
            background: '#02040a',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
          }}>
            {/* Background Blueprint Image */}
            <img
              src={currentPlanImage}
              alt="Audited Blueprint Plan"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                opacity: 0.85,
                filter: 'contrast(1.05) brightness(0.95)',
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.2s ease',
                display: 'block'
              }}
            />

            {/* Interactive SVG Bounding Box Overlay Layer */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease'
              }}
              viewBox="0 0 1000 750"
              preserveAspectRatio="xMidYMid meet"
            >
              {elementsManifest.map((elem) => {
                if (!elem.normalized_bbox) return null;
                const [ymin, xmin, ymax, xmax] = elem.normalized_bbox;
                const bx = xmin * 1000;
                const by = ymin * 750;
                const bw = (xmax - xmin) * 1000;
                const bh = (ymax - ymin) * 750;

                const isSelected = selectedElements.has(elem.id);
                const hasViolation = findings.some((f) => f.element_ids.includes(elem.id));

                if (overlayFilter === 'violations' && !hasViolation && !isSelected) {
                  return null;
                }

                // Severity-based stroke and fill
                let stroke = 'rgba(56, 189, 248, 0.4)';
                let fill = 'rgba(56, 189, 248, 0.05)';
                let isCritical = false;

                if (hasViolation) {
                  const maxSev = findings
                    .filter((f) => f.element_ids.includes(elem.id))
                    .map((f) => f.severity)[0];

                  if (maxSev === 'critical') {
                    stroke = isSelected ? '#f43f5e' : 'rgba(244, 63, 94, 0.7)';
                    fill = isSelected ? 'rgba(244, 63, 94, 0.25)' : 'rgba(244, 63, 94, 0.12)';
                    isCritical = true;
                  } else if (maxSev === 'high') {
                    stroke = isSelected ? '#fbbf24' : 'rgba(245, 158, 11, 0.7)';
                    fill = isSelected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.12)';
                  }
                } else if (isSelected) {
                  stroke = '#38bdf8';
                  fill = 'rgba(56, 189, 248, 0.2)';
                }

                return (
                  <g
                    key={elem.id}
                    onClick={() => {
                      const related = findings.find((f) => f.element_ids.includes(elem.id));
                      if (related) handleSelectFinding(related.finding_id);
                    }}
                    style={{ cursor: hasViolation ? 'pointer' : 'default' }}
                  >
                    <rect
                      x={bx}
                      y={by}
                      width={bw}
                      height={bh}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isSelected ? 3 : 1.5}
                      strokeDasharray={isSelected ? '6 3' : 'none'}
                      rx={4}
                    />
                    {/* Bounding box label pill */}
                    {(isSelected || hasViolation) && (
                      <g>
                        <rect
                          x={bx + 2}
                          y={by + 2}
                          width={Math.min(bw - 4, (elem.label || elem.id).length * 7 + 10)}
                          height={16}
                          fill="rgba(4, 7, 17, 0.85)"
                          rx={3}
                        />
                        <text
                          x={bx + 6}
                          y={by + 13}
                          fill={isCritical ? '#fb7185' : '#38bdf8'}
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {elem.label ? elem.label.slice(0, 18) : elem.id}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Zoom Controls */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              display: 'flex',
              gap: '6px',
              background: 'rgba(7, 9, 14, 0.75)',
              backdropFilter: 'blur(8px)',
              padding: '4px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2, z + 0.2))}
                style={{ padding: '6px', background: 'transparent', color: 'var(--text-primary)' }}
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(1, z - 0.2))}
                style={{ padding: '6px', background: 'transparent', color: 'var(--text-primary)' }}
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                style={{ padding: '6px', background: 'transparent', color: 'var(--text-muted)' }}
                title="Reset View"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>

          {/* Active Finding Spatial Context Box */}
          {selectedFinding && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>SPATIAL ANCHORS ON BLUEPRINT:</span>
                <span className="mono" style={{ color: 'var(--text-muted)' }}>{selectedFinding.element_ids.length} Assets Linked</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedFinding.element_ids.map((eid) => (
                  <span
                    key={eid}
                    className="mono"
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.75rem'
                    }}
                  >
                    #{eid}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Severity Filter Tabs & Itemized Findings List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Severity Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['all', 'critical', 'high', 'medium', 'low'].map((sev) => {
              const count = sev === 'all' ? findings.length : findings.filter((f) => f.severity === sev).length;
              return (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: filterSeverity === sev ? 700 : 500,
                    background: filterSeverity === sev ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: filterSeverity === sev ? 'var(--text-primary)' : 'var(--text-secondary)',
                    border: filterSeverity === sev ? '1px solid var(--border-subtle)' : '1px solid transparent'
                  }}
                >
                  {sev.toUpperCase()} ({count})
                </button>
              );
            })}
          </div>

          {/* Findings List */}
          {filteredFindings.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No findings matching the selected filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '780px', overflowY: 'auto', paddingRight: '4px' }}>
              {filteredFindings.map((finding) => {
                const isExpanded = expandedId === finding.finding_id;
                const isSelected = selectedFindingId === finding.finding_id;

                return (
                  <div
                    key={finding.finding_id}
                    ref={(el) => (findingsRef.current[finding.finding_id] = el)}
                    className="glass-panel"
                    style={{
                      border: isSelected ? '1px solid var(--border-glow)' : '1px solid var(--border-subtle)',
                      boxShadow: isSelected ? '0 0 15px rgba(56, 189, 248, 0.15)' : undefined,
                      transition: 'all 0.2s ease',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Finding Header Item */}
                    <div
                      onClick={() => toggleExpand(finding.finding_id)}
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        {getSeverityBadge(finding.severity)}
                        <h3 style={{ fontSize: '0.98rem', fontWeight: 600 }}>{finding.title}</h3>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {(finding.confidence * 100).toFixed(0)}% Conf
                        </div>
                        {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                      </div>
                    </div>

                    {/* Regulatory Standard Citation Tag */}
                    {finding.regulatory_code && (
                      <div style={{ padding: '0 20px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Standard:</span>
                        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', background: 'rgba(245, 158, 11, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>
                          {finding.regulatory_code}
                        </span>
                      </div>
                    )}

                    {/* Plain-Language Explanation */}
                    <div style={{ padding: '0 20px 12px', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                      {finding.explanation}
                    </div>

                    {/* Actionable Engineering Remediation */}
                    {finding.remediation && (
                      <div style={{
                        margin: '0 20px 14px',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.06)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        fontSize: '0.82rem',
                        lineHeight: 1.5,
                        color: 'var(--accent-emerald)'
                      }}>
                        <strong style={{ color: '#34d399' }}>Actionable Remediation: </strong>
                        {finding.remediation}
                      </div>
                    )}

                    {/* Grounded Graph Elements Tags */}
                    <div style={{ padding: '0 20px 14px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Assets:</span>
                      {finding.element_ids.map((eid) => (
                        <span
                          key={eid}
                          className="mono"
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--accent-cyan)'
                          }}
                        >
                          #{eid}
                        </span>
                      ))}
                    </div>

                    {/* Expandable Reasoning Trace */}
                    {isExpanded && (
                      <div style={{
                        padding: '14px 20px',
                        backgroundColor: '#040711',
                        borderTop: '1px solid var(--border-subtle)'
                      }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '6px' }}>
                          FIVE-LAYER VERIFICATION EVIDENCE TRACE:
                        </div>
                        <pre className="mono" style={{ fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
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
