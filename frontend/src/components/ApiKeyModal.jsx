import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, AlertCircle, X, Shield, ExternalLink, Sparkles } from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey, testGeminiApiKey } from '../services/geminiService';

export default function ApiKeyModal({ isOpen, onClose, onKeySaved }) {
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getGeminiApiKey());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setGeminiApiKey(apiKey);
    if (onKeySaved) onKeySaved(apiKey);
    onClose();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testGeminiApiKey(apiKey.trim());
    setTestResult(result);
    setTesting(false);
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
      zIndex: 60,
      padding: '24px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '540px',
        padding: '28px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)'
          }}>
            <Key size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Google Gemini API Configuration</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Direct multimodal vision & reasoning inference
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          BluePrint Sentinel connects directly from your browser to the Google Gemini API using your API key.
          Your blueprints never touch any third-party intermediary backend server.
        </p>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Gemini API Key
          </label>
          <input
            type="password"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="mono"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              background: '#040711',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
        </div>

        {testResult && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: testResult.valid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            border: testResult.valid ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
            color: testResult.valid ? 'var(--accent-emerald)' : '#fb7185'
          }}>
            {testResult.valid ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{testResult.valid ? 'API Key validated successfully!' : `Validation failed: ${testResult.message}`}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.78rem',
              color: 'var(--accent-cyan)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>Get an API Key from Google AI Studio</span>
            <ExternalLink size={12} />
          </a>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleTest}
              disabled={testing || !apiKey.trim()}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                background: 'var(--accent-cyan)',
                color: '#040711',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
