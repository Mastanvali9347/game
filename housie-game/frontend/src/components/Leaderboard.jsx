import React from 'react';
import { Trophy, Medal, Coins } from 'lucide-react';
import './Leaderboard.css';

const Leaderboard = ({ winners = [] }) => {
  const prizeConfig = [
    { type: 'early5', title: 'Early 5', amount: 500, icon: Medal, color: 'text-blue-400' },
    { type: 'line1', title: 'Top Row', amount: 1000, icon: Medal, color: 'text-emerald-400' },
    { type: 'line2', title: 'Mid Row', amount: 1000, icon: Medal, color: 'text-amber-600' },
    { type: 'line3', title: 'Bottom Row', amount: 1000, icon: Medal, color: 'text-rose-400' },
    { type: 'fullhouse', title: 'Full House', amount: 5000, icon: Trophy, color: 'text-amber-500' },
  ];

  return (
    <div className="leaderboard-container">
      
      {/* Header */}
      <div className="leaderboard-header">
        <Trophy size={18} className="text-amber-500" />
        <h3 className="leaderboard-title">
          Prizes & Winners
        </h3>
      </div>

      {/* Prize List */}
      <div className="prize-list">
        {prizeConfig.map((prize, i) => {
          const Icon = prize.icon;
          const winner = winners.find(w => w.claim_type === prize.type);

          return (
            <div
              key={i}
              className={`prize-item ${winner ? 'has-winner' : ''}`}
            >
              
              {/* Left */}
              <div className="prize-left">
                <div className={`prize-icon-box ${prize.color}`}>
                  <Icon size={20} />
                </div>

                <div className="prize-info">
                  <p className="prize-title">
                    {prize.title}
                  </p>

                  <div className="prize-amount">
                    <Coins size={12} />
                    <span>
                      {prize.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="prize-right">
                {winner ? (
                  <p className="winner-name">
                    {winner.name || 'Player'}
                  </p>
                ) : (
                  <p className="waiting-text">
                    Waiting...
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;