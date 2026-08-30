import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Terminal } from 'lucide-react';

export default function ShowYourWorkModal({ sessionId, onClose }) {
  const [activeLayer, setActiveLayer] = useState(1);
  const [layerData, setLayerData] = useState(null);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    fetch(`http://localhost:8000/analyze/${sessionId}/layer/${activeLayer}`)
      .then((res) => {
        if (!res.ok) throw new Error('Layer data not found');
        return res.json();
      })
      .then((data) => {
        setLayerData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLayerData({ error: 'Failed to retrieve intermediate contract payload.' });
        setLoading(false);
      });
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
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        border: '1px solid rgba(56, 189, 248, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Inspection Sandbox: Show Your Work</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Layer Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 24px',
          background: 'rgba(0,0,0,0.2)',
          borderBottom: '1px solid var(--border-subtle)',
          overflowX: 'auto'
        }}>
          {layers.map((l) => (
            <button
              key={l.num}
              onClick={() => setActiveLayer(l.num)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: activeLayer === l.num ? 600 : 400,
                background: activeLayer === l.num ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                color: activeLayer === l.num ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                border: activeLayer === l.num ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                whiteSpace: 'nowrap'
              }}
            >
              Layer {l.num}: {l.name}
            </button>
          ))}
        </div>

        {/* JSON Viewer */}
        <div style={{
          flex: 1,
          padding: '20px 24px',
          overflowY: 'auto',
          backgroundColor: '#050811',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: '16px', right: '24px' }}>
            <button
              onClick={handleCopy}
              className="mono"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem'
              }}
            >
              {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
              Fetching Layer {activeLayer} payload...
            </div>
          ) : (
            <pre className="mono" style={{ fontSize: '0.85rem', color: '#38bdf8', lineHeight: 1.6 }}>
              {JSON.stringify(layerData, null, 2)}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <span>Session: <span className="mono">{sessionId}</span></span>
          <span>Zero cloud calls — verified locally</span>
        </div>
      </div>
    </div>
  );
}
