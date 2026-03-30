import React from 'react';
import { Users, PlayCircle } from 'lucide-react';
import './RoomCard.css';

const RoomCard = ({ room, onJoin }) => {
  const isPlaying = room?.status === 'playing';
  const playerCount = room?.players?.length || 0;

  return (
    <div className="room-card">
      
      {/* Top */}
      <div className="room-top">
        
        {/* Status */}
        <div className={`room-status ${isPlaying ? 'playing' : 'waiting'}`}>
          <div className={`status-dot ${isPlaying ? 'playing' : 'waiting'}`}></div>
          {room?.status || 'waiting'}
        </div>

        {/* Room ID */}
        <span className="room-id">
          #{room?.id || '----'}
        </span>
      </div>

      {/* Info */}
      <div className="room-info">
        <h3 className="room-title">
          Housie Room
        </h3>
        <p className="room-host">
          Host: {room?.players?.[0]?.name || 'Unknown'}
        </p>

        <div className="room-meta">
          <div className="meta-item">
            <Users size={16} />
            <span>
              {playerCount}/20 Players
            </span>
          </div>
        </div>
      </div>

      {/* Button */}
      <button
        onClick={() => onJoin?.(room?.id)}
        disabled={isPlaying || !room?.id}
        className={`join-btn ${isPlaying ? 'disabled' : 'enabled'}`}
      >
        <PlayCircle size={18} />
        {isPlaying ? 'Game in Progress' : 'Join Game'}
      </button>
    </div>
  );
};

export default RoomCard;