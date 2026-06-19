import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(username, password);
      login(response.data.user);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role) => {
    const credentials = {
      sales: { username: 'sales@packages.com', password: '123456' },
      customer: { username: 'customer@packages.com', password: '123456' },
      design: { username: 'design@packages.com', password: '123456' },
      production: { username: 'production@packages.com', password: '123456' },
      costing: { username: 'costing@packages.com', password: '123456' },
      admin: { username: 'admin@packages.com', password: '123456' },
    };
    
    setUsername(credentials[role].username);
    setPassword(credentials[role].password);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="app-brand">
            <div className="app-brand__mark">P</div>
            <div>
              <h1>Prepress Approval Portal</h1>
              <p className="app-brand__tagline">Artwork review, approvals, and production feedback</p>
            </div>
          </div>
        </div>

        <div className="login-card">
          <h2>Sign In</h2>
          <p className="login-subtitle">Enter your credentials to access the portal</p>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-divider">
            <span>Quick Login (Test Users)</span>
          </div>

          <div className="quick-login-buttons">
            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={() => handleQuickLogin('sales')}
            >
              Sales
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={() => handleQuickLogin('customer')}
            >
              Customer 
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={() => handleQuickLogin('design')}
            >
              Design 
            </button>

          
          </div>

          <div className="login-credentials">
            <p><strong>Test Credentials:</strong></p>
            <div className="credentials-list">
              <div><span>Sales:</span> sales@packages.com / 123456</div>
              <div><span>Customer:</span> customer@packages.com / 123456</div>
              <div><span>Design:</span> design@packages.com / 123456</div>
              <div><span>Admin:</span> admin@packages.com / 123456</div>
              <div><span>Production:</span> production@packages.com / 123456</div>
              <div><span>Costing:</span> costing@packages.com / 123456</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
