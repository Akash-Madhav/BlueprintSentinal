import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Terminal, ChevronRight } from 'lucide-react';
import { getClientLayerTrace } from '../pipeline/orchestrator';

const LAYERS = [
  { num: 1, name: 'Classification',  tag: 'L1' },
  { num: 2, name: 'Graph Extraction', tag: 'L2' },
  { num: 3, name: 'Rule Engine',      tag: 'L3' },
  { num: 4, name: 'AI Reasoning',     tag: 'L4' },
  { num: 5, name: 'Final Report',     tag: 'L5' },
];

export default function ShowYourWorkModal({ sessionId, onClose }) {
  const [activeLayer, setActiveLayer] = useState(1);
  const [layerData, setLayerData] = useState(null);
  const [copied, setCopied] = useState(false);

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
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(2,5,14,0.9)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: '24px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-panel animate-fade-up"
        style={{
          width: '100%', maxWidth: '900px', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid rgba(99,102,241,0.25)',
          boxShadow: '0 0 40px rgba(99,102,241,0.1)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(0,0,0,0.2)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Terminal size={17} color="#a5b4fc" />
            </div>
            <div>
              <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Five-Layer Intermediate Contracts
              </h3>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Session: {sessionId}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)', borderRadius: '8px',
              width: '30px', height: '30px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Layer tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(0,0,0,0.15)',
          overflowX: 'auto',
          flexShrink: 0,
        }}>
          {LAYERS.map((l) => {
            const isActive = activeLayer === l.num;
            return (
              <button
                key={l.num}
                onClick={() => setActiveLayer(l.num)}
                style={{
                  padding: '11px 20px', fontSize: '0.8rem', fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#c4b5fd' : 'var(--text-muted)',
                  borderBottom: isActive ? '2px solid #a5b4fc' : '2px solid transparent',
                  background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: '7px',
                  transition: 'color 0.15s',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span style={{
                  fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.05em',
                  padding: '1px 5px', borderRadius: '4px',
                  background: isActive ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#c4b5fd' : 'var(--text-dim)',
                }}>
                  {l.tag}
                </span>
                {l.name}
                {isActive && <ChevronRight size={12} />}
              </button>
            );
          })}
        </div>

        {/* JSON viewer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#020408' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(0,0,0,0.2)',
          }}>
            <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              PAYLOAD: LAYER_{activeLayer}_CONTRACT.JSON
            </span>
            <button
              onClick={handleCopy}
              className="btn btn-ghost"
              style={{ padding: '5px 11px', fontSize: '0.74rem', gap: '6px' }}
            >
              {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
            <pre
              className="mono"
              style={{
                fontSize: '0.78rem', color: '#7dd3fc',
                lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              }}
            >
              {JSON.stringify(layerData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
