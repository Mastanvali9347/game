import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, Mic, MicOff, LogOut, User as UserIcon, Users } from 'lucide-react';
import useAuthStore from '../context/useAuthStore';
import { getSocket } from '../services/socket';
import './Header.css';


const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuthStore();
  const [isMicMuted, setIsMicMuted] = useState(true);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check socket connection status periodically
    const checkSocket = () => {
      const s = getSocket();
      setIsConnected(s?.connected || false);
    };

    const interval = setInterval(checkSocket, 2000);
    return () => clearInterval(interval);
  }, []);

  if (location.pathname.startsWith('/game/')) return null;

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const getLinkClass = (path) =>
    `nav-link ${location.pathname === path ? 'active' : ''}`;

  return (
    <header className="app-header">
      
      <div 
        onClick={() => navigate('/')}
        className="logo-container"
      >
        <div className="logo-icon">
          H
        </div>
        <h1 className="logo-text">
          Housie Multiplayer
        </h1>
        <div className={`connection-status-dot ${isConnected ? 'online' : 'offline'}`} title={isConnected ? "Server Connected" : "Connecting..."}></div>
      </div>


      <nav className="nav-menu">
        <span onClick={() => navigate('/')} className={getLinkClass('/')}>
          Home
        </span>

        <span onClick={() => navigate('/lobby')} className={getLinkClass('/lobby')}>
          Lobby
        </span>

        <div className="nav-divider"></div>

        {user && (
          <>
            <div className="user-profile">
              <UserIcon size={18} />
              <span className="username-display">{user.name}</span>
            </div>

            <button 
              onClick={() => setIsMicMuted(!isMicMuted)}
              className={`mic-toggle ${isMicMuted ? 'muted' : ''}`}
            >
              {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <button 
              onClick={handleLogout}
              className="logout-btn-header"
              title="Logout"
            >
              <LogOut size={18} />
              <span className="logout-text">Logout</span>
            </button>
          </>
        )}

      </nav>
    </header>
  );
};

export default Header;