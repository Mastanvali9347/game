import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Gamepad2, ArrowRight, Loader2, Play } from 'lucide-react';
import useAuthStore from '../context/useAuthStore';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp, guestLogin, loading, error, setError } = useAuthStore();

  const [isGuestJoining, setIsGuestJoining] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  useEffect(() => {
    if (user?.id) {
      navigate('/lobby');
    }
  }, [user?.id, navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Username and password are required');
      return;
    }

    await signIn(formData.username, formData.password);
  };

  const handleGuestLogin = async () => {
    if (isGuestJoining) return;
    setIsGuestJoining(true);

    try {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const res = await guestLogin(`Player${randomId}`);
      if (res?.id) navigate('/lobby');
    } catch {
      setError('Guest login failed');
    } finally {
      setIsGuestJoining(false);
    }
  };

  return (
    <div className="login-page">
      
      {/* Dynamic Background */}
      <div className="galaxy-bg">
        <div className="stars"></div>
        <div className="twinkling"></div>
        <div className="nebulas">
          <div className="nebula-1"></div>
          <div className="nebula-2"></div>
        </div>
      </div>

      <div className="login-wrapper animate-page-entry">
        
        {/* Floating Icons for Aesthetic */}
        <div className="floating-elements">
          <div className="float-icon icon-1"><Gamepad2 /></div>
          <div className="float-icon icon-2"><Play /></div>
        </div>

        <div className="login-hero-section">
          <div className="game-logo-box">
            <Gamepad2 size={48} className="logo-icon" />
          </div>
          <h1 className="game-title">HOUSIE</h1>
          <div className="game-status-pill">
            <span className="status-dot"></span>
            1,248 Online
          </div>
        </div>

        <div className="auth-card-main animate-box-entry">
          <form onSubmit={handleAuth} className="auth-form-body">
            <div className="input-group-enhanced">
              <label>Username</label>
              <div className="input-with-icon">
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  placeholder="e.g. MasterGamer"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="input-group-enhanced">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock className="input-icon" size={20} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="auth-error-alert animate-shake">
                <p>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-auth-primary">
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="separator-enhanced">
            <div className="sep-line"></div>
            <span>OR</span>
            <div className="sep-line"></div>
          </div>

          <button
            onClick={handleGuestLogin}
            disabled={isGuestJoining}
            className="btn-guest-enhanced"
          >
            {isGuestJoining ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <div className="play-icon-bg">
                  <Play size={16} fill="currentColor" />
                </div>
                <span>Play as Guest</span>
              </>
            )}
          </button>
        </div>

        <div className="login-footer-meta">
          <p>© 2024 Housie Multiplayer • v2.4.0</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;