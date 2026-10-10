import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Terminal } from 'lucide-react';
import { getClientLayerTrace } from '../pipeline/orchestrator';

export default function ShowYourWorkModal({ sessionId, onClose }) {
  const [activeLayer, setActiveLayer] = useState(1);
  const [layerData, setLayerData] = useState(null);
  const [copied, setCopied] = useState(false);

  const layers = [
    { num: 1, name: 'Classification' },
    { num: 2, name: 'Structural Graph' },
    { num: 3, name: 'Rule Engine' },
    { num: 4, name: 'AI Reasoning' },
    { num: 5, name: 'Final Report' },
  ];

  useEffect(() => {
    if (!sessionId) return;
    const data = getClientLayerTrace(sessionId, activeLayer);
    setLayerData(data || { status: 'No intermediate payload cached for this layer.' });
  }, [sessionId, activeLayer]);

  const handleCopy = () => {
    if (!layerData) return;
    navigator.clipboard.writeText(JSON.stringify(layerData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '24px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '850px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Five-Layer Intermediate Data Contracts ("Show Your Work")
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Layer Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(255, 255, 255, 0.02)',
          overflowX: 'auto'
        }}>
          {layers.map((l) => (
            <button
              key={l.num}
              onClick={() => setActiveLayer(l.num)}
              style={{
                padding: '12px 20px',
                fontSize: '0.85rem',
                fontWeight: activeLayer === l.num ? 700 : 500,
                color: activeLayer === l.num ? 'var(--accent-cyan)' : 'var(--text-muted)',
                borderBottom: activeLayer === l.num ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                background: 'transparent',
                whiteSpace: 'nowrap'
              }}
            >
              Layer {l.num}: {l.name}
            </button>
          ))}
        </div>

        {/* Modal Body / JSON Viewer */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#03050c' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              PAYLOAD: LAYER_{activeLayer}_CONTRACT.JSON
            </div>
            <button
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          <pre
            className="mono"
            style={{
              fontSize: '0.8rem',
              color: '#38bdf8',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}
          >
            {JSON.stringify(layerData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
