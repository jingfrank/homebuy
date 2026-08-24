import React, { useState } from 'react';
import { login } from '../utils/api';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setError('');
    
    try {
      const ok = await login(password);
      if (ok) {
        onLogin();
      } else {
        setError('密码错误，请重试');
      }
    } catch {
      setError('网络连接异常，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-dark)',
        padding: '24px 16px',
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-card-hover)',
          borderRadius: '16px',
        }}
      >
        {/* Brand Logo & Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(5, 150, 105, 0.25)',
          }}
          aria-hidden="true"
        >
          🏠
        </div>

        <h1
          style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            marginBottom: '6px',
            color: 'var(--text-main)',
            letterSpacing: '-0.02em',
          }}
        >
          居安择时
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            marginBottom: '32px',
          }}
        >
          个人与家庭买房决策智能助手
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label
              htmlFor="access-password"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                marginBottom: '8px',
                color: 'var(--text-main)',
              }}
            >
              访问密码
            </label>
            <input
              id="access-password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入共享访问密码…"
              autoComplete="current-password"
              spellCheck={false}
              autoFocus
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'password-error' : undefined}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: error ? '1.5px solid var(--danger)' : '1px solid var(--border-color)',
                borderRadius: '10px',
                fontSize: '16px',
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
              }}
            />
          </div>

          {error && (
            <div
              id="password-error"
              role="alert"
              aria-live="polite"
              style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '20px',
                textAlign: 'left',
                border: '1px solid rgba(220, 38, 38, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span aria-hidden="true">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: 700,
              minHeight: '48px',
              opacity: loading || !password.trim() ? 0.6 : 1,
              cursor: loading || !password.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '验证中…' : '进入系统 →'}
          </button>
        </form>
      </div>
    </div>
  );
};
