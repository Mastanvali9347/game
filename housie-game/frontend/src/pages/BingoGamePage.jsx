import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Mic, MicOff, LogOut, Copy, Check, Users, Trophy, 
  RotateCcw, Sparkles, Volume2, VolumeX, Coins
} from 'lucide-react';
import useAuthStore from '../context/useAuthStore';
import { connectSocket, getSocket } from '../services/socket';
import api from '../services/api';
import confetti from 'canvas-confetti';
import useSound from 'use-sound';
import useWebRTC from '../hooks/useWebRTC';
import ChatBox from '../components/ChatBox';

// Placeholder sounds (In real app, you'd have assets)
const DICE_ROLL_SFX = 'https://www.soundjay.com/misc/sounds/dice-throw-1.mp3';
const MARK_SFX = 'https://www.soundjay.com/buttons/sounds/button-16.mp3';
const WIN_SFX = 'https://www.soundjay.com/misc/sounds/bell-ring-01.mp3';
const MATCH_SFX = 'https://www.soundjay.com/communication/sounds/beep-07.mp3';

import './BingoGamePage.css';

const BingoGamePage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, updateCoins, signOut } = useAuthStore();
  
  const [gameStatus, setGameStatus] = useState('waiting');
  const [hostId, setHostId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [board, setBoard] = useState([]);
  const [markedNumbers, setMarkedNumbers] = useState([]);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [winners, setWinners] = useState([]);
  const [turnQueue, setTurnQueue] = useState([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  
  const { micEnabled, toggleMic, remoteStreams } = useWebRTC(roomId, user?.id);
  const [messages, setMessages] = useState([]);

  const fetchBoard = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/api/rooms/${roomId}/board/${user.id}`);
      setBoard(res.data.board || []);
      setMarkedNumbers(res.data.marked || []);
    } catch (err) {
      console.error("Board fetch failed", err);
    }
  }, [roomId, user?.id]);

  const [playDice] = useSound(DICE_ROLL_SFX, { volume: 0.5, html5: true });
  const [playMark] = useSound(MARK_SFX, { volume: 0.4, html5: true });
  const [playWin] = useSound(WIN_SFX, { volume: 0.6, html5: true });
  const [playMatch] = useSound(MATCH_SFX, { volume: 0.5, html5: true });

  const diceRef = useRef(null);

  useEffect(() => {
    document.title = "Bingo 25 Multiplayer Game";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Play Bingo 25 online with friends and win coins.");
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const socket = connectSocket();
    if (!socket) return;
    socket.connect();

    const emitJoin = () => {
      socket.emit('join_room_socket', {
        room_id: roomId,
        user_id: user.id,
        username: user.name,
        coins: user.coins
      });
    };

    socket.on('connect', emitJoin);
    if (socket.connected) emitJoin();

    socket.on('room_state', (state) => {
      if (!state) return;
      setGameStatus(state.status);
      setHostId(state.host_id);
      setPlayers(state.players);
      setCalledNumbers(state.called_numbers);
      setCurrentNumber(state.current_number);
      setWinners(state.leaderboard);
      setTurnQueue(state.turn_queue);
      setCurrentTurnIndex(state.current_turn_index);
      if (state.my_board) setBoard(state.my_board);
      if (state.my_marked) setMarkedNumbers(state.my_marked);
    });

    socket.on('game_started', async (data) => {
      setGameStatus('playing');
      await fetchBoard();
    });

    socket.on('number_called', (num) => {
      setIsRolling(true);
      if (soundEnabled) playDice();
      
      setTimeout(() => {
        setIsRolling(false);
        setCurrentNumber(num);
        setCalledNumbers(prev => [...prev, num]);
        if (soundEnabled) playMark();
      }, 1500);
    });

    socket.on('turn_updated', (data) => {
       setCurrentTurnIndex(data.current_turn_index);
    });

    socket.on('players_list', (data) => setPlayers(data));
    socket.on('new_host', (data) => setHostId(data.host_id));
    
    socket.on('winner_declared', (data) => {
      setWinners(prev => [...prev, data]);
      if (soundEnabled) playWin();
      
      if (data.user_id === user.id) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
        if (data.new_coins) updateCoins(data.new_coins);
      }
    });

    socket.on('game_ended', () => setGameStatus('ended'));

    socket.on('chat_message', (msg) => {
      setMessages(prev => {
        const exists = prev.some(m => m.text === msg.text && m.user_id === msg.user_id && m.time === msg.time);
        if (exists) return prev;
        return [...prev, msg].slice(-100);
      });
    });

    return () => {
      socket.off('room_state');
      socket.off('game_started');
      socket.off('number_called');
      socket.off('turn_updated');
      socket.off('players_list');
      socket.off('new_host');
      socket.off('winner_declared');
      socket.off('game_ended');
      socket.off('connect', emitJoin);
    };
  }, [roomId, user, soundEnabled]);

  // Sync marked numbers locally for UI feedback
  useEffect(() => {
    if (board.length > 0) {
      const marked = board.filter(n => calledNumbers.includes(n));
      setMarkedNumbers(marked);
      
      // Line detection
      const matrix = [];
      for (let i = 0; i < 5; i++) matrix.push(board.slice(i * 5, (i + 1) * 5));
      
      let newLines = 0;
      // Rows
      for (let r = 0; r < 5; r++) if (matrix[r].every(n => calledNumbers.includes(n))) newLines++;
      // Cols
      for (let c = 0; c < 5; c++) {
        let colFilled = true;
        for (let r = 0; r < 5; r++) if (!calledNumbers.includes(matrix[r][c])) colFilled = false;
        if (colFilled) newLines++;
      }
      // Diagonals
      let d1 = true, d2 = true;
      for (let i = 0; i < 5; i++) {
        if (!calledNumbers.includes(matrix[i][i])) d1 = false;
        if (!calledNumbers.includes(matrix[i][4 - i])) d2 = false;
      }
      if (d1) newLines++;
      if (d2) newLines++;

      if (newLines > lineCount) {
        if (soundEnabled) playMatch();
        setLineCount(newLines);
      }
    }
  }, [board, calledNumbers, lineCount, soundEnabled, playMatch]);

  const handleStartGame = () => {
    const socket = getSocket();
    if (socket && user.id === hostId) {
      socket.emit('start_game', { room_id: roomId, user_id: user.id });
    }
  };

  const handleRollDice = () => {
    const socket = getSocket();
    const currentPlayerId = turnQueue[currentTurnIndex];
    if (socket && user.id === currentPlayerId && !isRolling && gameStatus === 'playing') {
      socket.emit('draw_next_number', { room_id: roomId, user_id: user.id });
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const isMyTurn = turnQueue[currentTurnIndex] === user?.id;

  return (
    <div className="bingo-root">
      {/* Header */}
      <header className="bingo-header">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/selection')} className="icon-btn">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <img src="/bingo_25_logo.png" alt="Bingo 25" className="h-10 w-auto" />
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-mono">{roomId}</span>
                <button onClick={copyRoomId} className="hover:text-white transition-colors">
                  {copyFeedback ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="coins-badge">
            <Coins size={14} className="text-amber-400" />
            <span>{user?.coins || 0}</span>
          </div>
          <button onClick={toggleMic} className="icon-btn">
            {micEnabled ? <Mic size={20} /> : <MicOff size={20} className="text-rose-500" />}
          </button>
          <button onClick={() => setSocialOpen(!socialOpen)} className="icon-btn lg:hidden ml-1 chat-toggle-btn">
            <Users size={20} className={socialOpen ? "text-indigo-400" : ""} />
          </button>
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="icon-btn">
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
      </header>

      <main className="bingo-main">
        {/* Left Side: Game Info */}
        <div className="game-info-panel">
          <div className="status-card">
            <div className={`status-dot ${gameStatus}`} />
            <span className="uppercase tracking-widest font-bold text-xs">{gameStatus}</span>
          </div>

          <div className="turn-display">
            <h3 className="section-label">Turn Order</h3>
            <div className="turn-list">
              {turnQueue.map((pid, idx) => {
                const p = players.find(player => player.id === pid);
                const isActive = idx === currentTurnIndex;
                return (
                  <motion.div 
                    key={pid}
                    animate={isActive ? { scale: 1.05, x: 5 } : { scale: 1, x: 0 }}
                    className={`turn-item ${isActive ? 'active' : ''}`}
                  >
                    <div className="turn-bullet">{idx + 1}</div>
                    <span className="player-name truncate">{p?.name || 'Unknown'}</span>
                    {isActive && <div className="now-playing-tag">Now</div>}
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="prizes-card">
             <h3 className="section-label">Prize Pool</h3>
             <div className="prize-grid-enhanced">
               <motion.div 
                 whileHover={{ scale: 1.05 }}
                 className="prize-box-neon gold"
               >
                  <Trophy size={20} className="prize-icon" />
                  <div className="prize-details">
                    <span className="prize-rank">1st Winner</span>
                    <span className="prize-val">2000 <Coins size={10} className="inline"/></span>
                  </div>
                  <Sparkles size={14} className="sparkle-abs" />
               </motion.div>
               
               <motion.div 
                 whileHover={{ scale: 1.05 }}
                 className="prize-box-neon silver"
               >
                  <Trophy size={20} className="prize-icon" />
                  <div className="prize-details">
                    <span className="prize-rank">2nd Winner</span>
                    <span className="prize-val">1000 <Coins size={10} className="inline"/></span>
                  </div>
               </motion.div>

               <motion.div 
                 whileHover={{ scale: 1.05 }}
                 className="prize-box-neon bronze"
               >
                  <Trophy size={20} className="prize-icon" />
                  <div className="prize-details">
                    <span className="prize-rank">3rd Winner</span>
                    <span className="prize-val">450 <Coins size={10} className="inline"/></span>
                  </div>
               </motion.div>
             </div>
          </div>
        </div>

        {/* Center: Board */}
        <div className="board-section">
          {gameStatus === 'waiting' ? (
            <div className="waiting-lobby">
              <div className="waiting-content">
                <div className="spinner-large" />
                <h2 className="text-2xl font-bold mt-6 mb-2">Waiting for Players</h2>
                <p className="text-slate-400 mb-8">Share the room ID with your friends to start!</p>
                
                {user?.id === hostId ? (
                  <button 
                    onClick={() => {
                      console.log("🚀 START BUTTON CLICKED");
                      handleStartGame();
                    }}
                    disabled={players.length < 1}
                    className="start-btn"
                  >
                    <Sparkles size={20} />
                    Start Match ({players.length})
                  </button>
                ) : (
                  <div className="host-notice">Only the host can start the game</div>
                )}
              </div>
            </div>
          ) : (
            <div className="gameplay-area">
              <div className="bingo-board-container">
                <div className="bingo-grid">
                  {board.map((num, idx) => {
                    const isMarked = markedNumbers.includes(num);
                    const isLastCalled = currentNumber === num;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`bingo-cell ${isMarked ? 'marked' : ''} ${isLastCalled ? 'pulse' : ''}`}
                      >
                        <span className="cell-num">{num}</span>
                        {isMarked && (
                          <motion.div 
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="check-icon"
                          >
                            <Check size={24} />
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="controls-area">
                <div className="dice-container">
                  <div className={`dice-3d ${isRolling ? 'rolling' : ''}`} ref={diceRef}>
                    <div className="dice-face front">{currentNumber || '?'}</div>
                    <div className="dice-face back"></div>
                    <div className="dice-face top"></div>
                    <div className="dice-face bottom"></div>
                    <div className="dice-face left"></div>
                    <div className="dice-face right"></div>
                  </div>
                </div>

                <div className="action-buttons">
                  <button 
                    onClick={handleRollDice}
                    disabled={!isMyTurn || isRolling || gameStatus !== 'playing'}
                    className={`roll-btn ${isMyTurn ? 'can-roll' : ''}`}
                  >
                    {isRolling ? 'Rolling...' : (isMyTurn ? 'Your Turn: ROLL' : 'Waiting...')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Leaderboard & Winners */}
        <div className={`social-side ${socialOpen ? 'open' : ''}`}>
           <div className="winners-panel">
              <h3 className="section-label">Winners Board</h3>
              <div className="winners-list">
                <AnimatePresence>
                  {winners.map((w, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="winner-card"
                    >
                      <div className="rank-badge">#{w.rank}</div>
                      <div className="winner-info">
                        <span className="winner-name">{w.name}</span>
                        <span className="winner-prize">+{w.reward} Coins</span>
                      </div>
                      <Trophy size={16} className={`trophy-color-${w.rank}`} />
                    </motion.div>
                  ))}
                  {winners.length === 0 && (
                    <div className="no-winners">No winners yet</div>
                  )}
                </AnimatePresence>
              </div>
           </div>

           <ChatBox
             roomId={roomId}
             messages={messages}
             currentUserId={user?.id}
             currentUserName={user?.name}
             setMessages={setMessages}
           />

           {/* Remote Audio Streams */}
           {Object.entries(remoteStreams).map(([uid, stream]) => (
            <audio 
              key={uid} 
              autoPlay 
              ref={el => { if (el && el.srcObject !== stream) el.srcObject = stream; }}
            />
          ))}
        </div>
      </main>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameStatus === 'ended' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="game-over-modal"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="modal-content"
            >
              <Trophy size={80} className="text-amber-500 mx-auto mb-4" />
              <h2 className="text-4xl font-black text-white mb-2">MATCH ENDED</h2>
              <p className="text-slate-400 mb-8">Great game! Here's the final results.</p>
              
              <div className="final-leaderboard-premium">
                {winners.map((w, i) => (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className={`final-row-enhanced rank-${w.rank}`}
                  >
                    <div className="final-rank-circle">#{w.rank}</div>
                    <span className="final-name">{w.name}</span>
                    <div className="final-prize-tag">
                      <Coins size={14} />
                      {w.reward}
                    </div>
                  </motion.div>
                ))}
              </div>

              <button 
                onClick={() => navigate('/selection')}
                className="back-to-home-btn"
              >
                Back to Selection
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BingoGamePage;
