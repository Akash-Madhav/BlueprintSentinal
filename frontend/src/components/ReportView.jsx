import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, ChevronDown, ChevronUp, Terminal, RotateCcw, ShieldCheck } from 'lucide-react';

export default function ReportView({ report, onReset, onShowYourWork }) {
  const [expandedId, setExpandedId] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const findings = report?.findings || [];
  const filteredFindings = filterSeverity === 'all'
    ? findings
    : findings.filter((f) => f.severity === filterSeverity);

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

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Report Header Bar */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <ShieldCheck size={24} color="var(--accent-emerald)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Autonomous Verification Audit Report</h2>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Session: <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{report.session_id}</span> |
            Audited Typologies: <span className="mono" style={{ color: 'var(--text-primary)' }}>{report.plan_types.join(', ')}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onShowYourWork}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.12)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            <Terminal size={16} /> Show Your Work (JSON)
          </button>
          <button
            onClick={onReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            <RotateCcw size={16} /> New Audit
          </button>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto' }}>
        {['all', 'critical', 'high', 'medium', 'low'].map((sev) => {
          const count = sev === 'all' ? findings.length : findings.filter((f) => f.severity === sev).length;
          return (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredFindings.map((finding) => {
            const isExpanded = expandedId === finding.finding_id;

            return (
              <div
                key={finding.finding_id}
                className="glass-panel"
                style={{
                  border: isExpanded ? '1px solid var(--border-glow)' : '1px solid var(--border-subtle)',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden'
                }}
              >
                {/* Finding Header Item */}
                <div
                  onClick={() => toggleExpand(finding.finding_id)}
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                    {getSeverityBadge(finding.severity)}
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{finding.title}</h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Layers: <span style={{ color: 'var(--accent-cyan)' }}>{finding.contributing_layers.join(' + ')}</span>
                    </div>
                    <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Confidence: <span style={{ color: 'var(--accent-emerald)' }}>{(finding.confidence * 100).toFixed(0)}%</span>
                    </div>
                    {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Plain-Language Explanation */}
                <div style={{ padding: '0 24px 16px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {finding.explanation}
                </div>

                {/* Grounded Elements Tags */}
                <div style={{ padding: '0 24px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Grounded Graph Assets:</span>
                  {finding.element_ids.map((eid) => (
                    <span
                      key={eid}
                      className="mono"
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.05)',
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
                    padding: '16px 24px',
                    backgroundColor: '#040711',
                    borderTop: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                      RAW REASONING TRACE (LAYER VERIFICATION CHAIN):
                    </div>
                    <pre className="mono" style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
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
  );
}
