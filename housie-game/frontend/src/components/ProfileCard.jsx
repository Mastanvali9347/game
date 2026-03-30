import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Coins, LogOut } from 'lucide-react';
import useAuthStore from '../context/useAuthStore';
import './ProfileCard.css';

const ProfileCard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const displayName =
    user?.user_metadata?.full_name ||
    user?.name ||
    'Player';

  const coins = user?.coins ?? 0;
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="profile-card">
      
      {/* Left */}
      <div className="profile-left">
        
        {/* Avatar */}
        <div className="avatar-wrapper">
          <div className="avatar-glow"></div>

          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="avatar-img"
            />
          ) : (
            <div className="avatar-placeholder">
              <User className="text-slate-500" size={32} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="profile-info">
          <div className="flex items-center gap-2">
            <h2 className="profile-name">
              {displayName}
            </h2>
            <button 
              onClick={() => navigate('/profile/edit')} 
              className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
              title="Edit Profile"
            >
              <User size={14} />
            </button>
          </div>

          <div className="coin-badge">
            <Coins size={16} />
            <span>
              {coins.toLocaleString()} Coins
            </span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={signOut}
        className="logout-btn"
      >
        <LogOut size={18} />
        Log Out
      </button>
    </div>
  );
};

export default ProfileCard;