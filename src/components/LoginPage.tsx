import React, { useState } from 'react';
import { login } from '../utils/api';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await login(password);
    setLoading(false);
    if (ok) {
      onLogin();
    } else {
      setError('密码错误，请重试');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-dark)',
      padding: '20px',
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '380px',
        padding: '40px 32px',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          width: '64px', height: '64px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', margin: '0 auto 20px',
          boxShadow: '0 8px 24px rgba(5, 150, 105, 0.25)',
        }}>🏠</div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-main)' }}>
          居安择时
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '32px' }}>
          个人买房决策工具
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
              访问密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入访问密码"
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                border: error ? '1.5px solid var(--danger)' : '1.5px solid var(--border-color)',
                borderRadius: '10px',
                fontSize: '16px',
                outline: 'none',
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
                transition: 'border-color 0.15s',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'var(--danger-bg)', color: 'var(--danger)',
              padding: '10px 14px', borderRadius: '8px',
              fontSize: '0.875rem', marginBottom: '16px', textAlign: 'left',
            }}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="btn"
            style={{
              width: '100%',
              padding: '13px',
              background: 'var(--primary)',
              color: '#fff',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: 700,
              opacity: loading || !password ? 0.6 : 1,
              cursor: loading || !password ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '验证中...' : '进入系统 →'}
          </button>
        </form>
      </div>
    </div>
  );
};
