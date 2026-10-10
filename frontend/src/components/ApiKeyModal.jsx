import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, AlertCircle, X, Shield, ExternalLink, Lock, Eye, EyeOff } from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey, testGeminiApiKey } from '../services/geminiService';

export default function ApiKeyModal({ isOpen, onClose, onKeySaved }) {
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getGeminiApiKey());
      setTestResult(null);
      setShowKey(false);
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

  const keyIsValid = apiKey.trim().length > 20;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 5, 14, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '24px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-panel animate-fade-up"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '32px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
          border: '1px solid rgba(56,189,248,0.2)',
          boxShadow: 'var(--glow-cyan)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            borderRadius: '8px',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '13px',
            background: 'rgba(56,189,248,0.1)',
            border: '1px solid rgba(56,189,248,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(56,189,248,0.15)',
          }}>
            <Key size={22} color="var(--accent-cyan)" />
          </div>
          <div>
            <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '3px' }}>
              Google Gemini API Configuration
            </h3>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Direct multimodal vision inference
            </div>
          </div>
        </div>

        {/* Privacy notice */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(16,185,129,0.07)',
          border: '1px solid rgba(16,185,129,0.2)',
        }}>
          <Lock size={15} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            BluePrint Sentinel connects <strong style={{ color: 'var(--text-primary)' }}>directly from your browser</strong> to the Google Gemini API.
            Your API key and blueprints are stored locally and{' '}
            <strong style={{ color: 'var(--accent-emerald)' }}>never sent to any third-party server</strong>.
          </p>
        </div>

        {/* API Key input */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.76rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: 'var(--font-mono)',
            marginBottom: '8px',
          }}>
            Gemini API Key
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
              className="mono"
              style={{
                width: '100%',
                padding: '12px 44px 12px 14px',
                borderRadius: 'var(--radius-md)',
                border: testResult?.valid
                  ? '1px solid rgba(16,185,129,0.5)'
                  : testResult
                    ? '1px solid rgba(244,63,94,0.5)'
                    : keyIsValid
                      ? '1px solid rgba(56,189,248,0.3)'
                      : '1px solid var(--border-subtle)',
                background: '#040711',
                color: 'var(--text-primary)',
                fontSize: '0.87rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                border: 'none',
              }}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {keyIsValid && !testResult && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '5px', fontFamily: 'var(--font-mono)' }}>
              Key format looks valid. Click "Test Connection" to verify.
            </div>
          )}
        </div>

        {/* Test result banner */}
        {testResult && (
          <div className="animate-fade-up" style={{
            padding: '11px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: testResult.valid ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
            border: testResult.valid ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(244,63,94,0.3)',
            color: testResult.valid ? 'var(--accent-emerald)' : '#fb7185',
          }}>
            {testResult.valid
              ? <CheckCircle2 size={16} />
              : <AlertCircle size={16} />
            }
            <span>
              {testResult.valid
                ? 'API Key validated successfully! Gemini is ready.'
                : `Validation failed: ${testResult.message}`
              }
            </span>
          </div>
        )}

        {/* Action row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.77rem',
              color: 'var(--accent-cyan)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              opacity: 0.8,
              transition: 'opacity 0.15s',
            }}
          >
            <Shield size={12} />
            <span>Get API Key from Google AI Studio</span>
            <ExternalLink size={11} />
          </a>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleTest}
              disabled={testing || !keyIsValid}
              className="btn btn-ghost"
              style={{ fontSize: '0.83rem', opacity: !keyIsValid ? 0.4 : 1 }}
            >
              {testing ? (
                <>
                  <div style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.15)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spinSlow 0.8s linear infinite' }} />
                  Testing...
                </>
              ) : 'Test Connection'}
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
              style={{ fontSize: '0.83rem' }}
            >
              <Key size={14} />
              Save & Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
