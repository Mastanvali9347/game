import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, Target } from 'lucide-react';
import './GameSelectionPage.css';

const GameSelectionPage = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: 'housie',
      title: 'Housie Game',
      description: 'Classic 90-ball Tambola. Eye the full house!',
      image: '/housie_game_card_logo.png',
      color: 'from-indigo-600 to-purple-600',
      glow: 'shadow-indigo-500/50',
      route: '/lobby/housie'
    },
    {
      id: 'bingo',
      title: 'Bingo 25',
      description: '5x5 Battle! Be the first to line up 5 numbers.',
      image: '/bingo_game_card_logo.png',
      color: 'from-amber-500 to-orange-600',
      glow: 'shadow-orange-500/50',
      route: '/lobby/bingo'
    }
  ];

  return (
    <div className="selection-container">
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight 
            }}
            animate={{
              y: [null, -100, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="selection-content"
      >
        <h1 className="selection-title">Select Your Game</h1>
        <p className="selection-subtitle">Choose a mode and start winning coins!</p>

        <div className="games-grid">
          {games.map((game, idx) => (
            <motion.div
              key={game.id}
              whileHover={{ scale: 1.05, y: -10 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => navigate(game.route)}
              className={`game-card bg-gradient-to-br ${game.color} ${game.glow}`}
            >
              <div className="card-glass">
                <div className="card-image-wrap">
                  <img src={game.image} alt={game.title} className="card-img" />
                </div>
                <h3 className="card-title">{game.title}</h3>
                <p className="card-desc">{game.description}</p>
                
                <div className="card-action-wrap">
                  <img src="/play_now_logo.png" alt="Play Now" className="play-now-img" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default GameSelectionPage;
