import React from 'react';
import { User, ShieldCheck } from 'lucide-react';
import './PlayerList.css';

const PlayerList = ({ players = [], currentUserId, hostId }) => {
  return (
    <div className="player-list-container">
      
      {/* Header */}
      <div className="player-header">
        <User size={18} className="text-indigo-400" />
        <h3 className="player-title">Players</h3>
        <span className="player-count">
          {players.length}
        </span>
      </div>

      {/* Player List */}
      <div className="player-scroll-area">
        {players.map((player) => {
          const isMe = player.id === currentUserId;

          return (
            <div
              key={player.id}
              className={`player-item ${isMe ? 'is-me' : ''}`}
            >
              
              {/* Avatar */}
              <div className="avatar-container">
                <div className={`avatar ${isMe ? 'is-me' : ''}`}>
                  {player.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>

                <div className="online-indicator">
                  <div className="online-dot"></div>
                </div>
              </div>

              {/* Info */}
              <div className="player-info">
                <p className={`player-name ${isMe ? 'is-me' : ''}`}>
                  {player.name || 'User'} {isMe && '(You)'}
                </p>
                <p className="player-status">
                  Online
                </p>
              </div>

              {/* Host Icon */}
              {player.id === hostId && (
                <ShieldCheck size={16} className="text-indigo-400" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerList;