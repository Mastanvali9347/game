import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mic, MicOff, LogOut, Copy, Check, Users, Trophy
} from 'lucide-react';
import useAuthStore from '../context/useAuthStore';
import { connectSocket, getSocket } from '../services/socket';
import api from '../services/api';
import useWebRTC from '../hooks/useWebRTC';

import Ticket from '../components/Ticket';
import NumberBoard from '../components/NumberBoard';
import PlayerList from '../components/PlayerList';
import Leaderboard from '../components/Leaderboard';
import ChatBox from '../components/ChatBox';
import './GameRoomPage.css';

const GameRoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, updateCoins, signOut } = useAuthStore();

  const { micEnabled, toggleMic, remoteStreams } = useWebRTC(roomId, user?.id);

  const [gameStatus, setGameStatus] = useState('waiting');
  const [hostId, setHostId] = useState(null);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [ticket, setTicket] = useState([]);
  const [markedNumbers, setMarkedNumbers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [winners, setWinners] = useState([]);
  const [messages, setMessages] = useState([]);
  const [claimedBy, setClaimedBy] = useState({});
  const [copyFeedback, setCopyFeedback] = useState(false);

  const fetchTicket = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/api/rooms/${roomId}/ticket/${user.id}`);
      setTicket(res.data.ticket || []);
      setMarkedNumbers(res.data.marked || []);
    } catch {}
  }, [roomId, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const socket = connectSocket();
    if (!socket) return;

    socket.connect();

    // REGISTER LISTENERS FIRST
    socket.off('room_state');
    socket.on('room_state', (state) => {
      if (!state) return;

      setGameStatus(state.status || 'waiting');
      setHostId(state.host_id || null);
      setCalledNumbers(state.called_numbers || []);
      setCurrentNumber(state.current_number || null);
      setPlayers(state.players || []);
      setWinners(state.leaderboard || []);
      setClaimedBy(state.claimed || {});

      if (state.my_ticket) setTicket(state.my_ticket);
      if (state.my_marked) setMarkedNumbers(state.my_marked);
    });

    socket.off('game_started');
    socket.on('game_started', async () => {
      setGameStatus('playing');
      await fetchTicket();
    });

    socket.off('number_called');
    socket.on('number_called', (num) => {
      setCurrentNumber(num);
      setCalledNumbers(prev => prev.includes(num) ? prev : [...prev, num]);
    });

    socket.off('number_marked');
    socket.on('number_marked', ({ user_id, number }) => {
      if (user_id === user.id) {
        setMarkedNumbers(prev =>
          prev.includes(number) ? prev : [...prev, number]
        );
      }
    });

    socket.off('player_joined');
    socket.on('player_joined', (data) => {
      setPlayers(prev => prev.some(p => p.id === data.id) ? prev : [...prev, data]);
    });

    socket.on('players_list', (data) => {
      console.log("Full Players List Received:", data);
      setPlayers(data);
    });

    socket.off('player_left');
    socket.on('player_left', (data) => {
      setPlayers(prev => prev.filter(p => p.id !== data.id));
    });

    socket.off('winner_declared');
    socket.on('winner_declared', (data) => {
      console.log("Winner Declared Event:", data);

      setWinners(prev =>
        prev.some(w => w.claim_type === data.claim_type) ? prev : [...prev, data]
      );

      setClaimedBy(prev => ({ ...prev, [data.claim_type]: data.name }));

      if (data.user_id === user.id) {
        if (data.new_coins) {
          updateCoins(data.new_coins);
          alert(`Congratulations! You won the ${data.claim_type} prize! +${data.reward} coins. New balance: ${data.new_coins}`);
        } else {
          console.warn("User won but new_coins field is missing in event data");
        }
      }
    });

    socket.off('chat_message');
    socket.on('chat_message', (msg) => {
      setMessages(prev => {
        // Prevent duplicate messages if any
        const exists = prev.some(m => m.text === msg.text && m.user_id === msg.user_id && m.time === msg.time);
        if (exists) return prev;
        return [...prev, msg].slice(-100);
      });
    });

    socket.off('game_ended');
    socket.on('game_ended', () => {
      setGameStatus('ended');
    });

    // EMIT JOIN AFTER LISTENERS
    socket.emit('join_room_socket', {
      room_id: roomId,
      user_id: user.id,
      username: user.name,
      coins: user.coins
    });

    return () => {
      socket.off('room_state');
      socket.off('game_started');
      socket.off('number_called');
      socket.off('number_marked');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('winner_declared');
      socket.off('chat_message');
      socket.off('game_ended');
    };
  }, [roomId, user?.id, fetchTicket, updateCoins]);

  const handleStartGame = () => {
    const socket = getSocket();
    if (!socket || user.id !== hostId) return;

    socket.emit('start_game', { room_id: roomId, user_id: user.id });
  };

  const handleMarkNumber = (val) => {
    const socket = getSocket();
    if (!socket || gameStatus !== 'playing') return;

    if (calledNumbers.includes(val) && !markedNumbers.includes(val)) {
      socket.emit('mark_number', {
        room_id: roomId,
        user_id: user.id,
        number: val
      });
    }
  };

  const handleClaimWin = (type) => {
    const socket = getSocket();
    if (!socket || gameStatus !== 'playing') return;

    // Prevent double claim
    if (claimedBy[type]) return;

    socket.emit('claim_win', {
      room_id: roomId,
      user_id: user.id,
      username: user.name,
      type
    });
  };

  const sendMessage = (data) => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('chat_message_socket', {
      room_id: roomId,
      ...data
    });
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleDrawNumber = () => {
    const socket = getSocket();
    if (!socket || user.id !== hostId || gameStatus !== 'playing') return;

    socket.emit('draw_next_number', {
      room_id: roomId,
      user_id: user.id
    });
  };

  const isHost = user?.id === hostId;

  return (
    <div className="game-room-root">

      <header className="game-header">
        <div className="header-left">
          <button onClick={() => navigate('/lobby')} className="header-btn">
            <ArrowLeft size={18} />
          </button>

          <div>
            <h2 className="text-sm text-slate-400">GAME ROOM</h2>
            <div className="flex items-center gap-2">
              <span className="room-id-badge">{roomId}</span>
              <button onClick={copyRoomLink} className="header-btn">
                {copyFeedback ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isHost && gameStatus === 'waiting' && (
            <button onClick={handleStartGame} className="start-game-btn">
              <Users size={16} /> Start ({players.length})
            </button>
          )}

          {isHost && gameStatus === 'playing' && (
            <button onClick={handleDrawNumber} className="draw-btn">
              Roll Dice
            </button>
          )}

          <div className={`badge ${gameStatus}`}>
            {gameStatus}
          </div>

          <button onClick={toggleMic} className="header-btn">
            {micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          <button onClick={() => navigate('/lobby')} className="header-btn" title="Leave Room">
            <ArrowLeft size={16} />
          </button>

          <button onClick={signOut} className="header-btn logout-btn-game" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="game-main">

        <div className="side-panel">
          <Ticket
            ticket={ticket}
            markedNumbers={markedNumbers}
            onMarkNumber={handleMarkNumber}
          />

          <div className="claim-controls">
            <h3 className="claim-label text-slate-400 text-xs mb-3 font-semibold uppercase tracking-wider">Claims</h3>
            <div className="claim-grid">
              <button
                onClick={() => handleClaimWin('early5')}
                className={`claim-btn-small ${claimedBy['early5'] ? 'is-claimed' : ''}`}
                disabled={gameStatus !== 'playing' || !!claimedBy['early5']}
              >
                Early 5
              </button>
              <button
                onClick={() => handleClaimWin('line1')}
                className={`claim-btn-small ${claimedBy['line1'] ? 'is-claimed' : ''}`}
                disabled={gameStatus !== 'playing' || !!claimedBy['line1']}
              >
                Top Row
              </button>
              <button
                onClick={() => handleClaimWin('line2')}
                className={`claim-btn-small ${claimedBy['line2'] ? 'is-claimed' : ''}`}
                disabled={gameStatus !== 'playing' || !!claimedBy['line2']}
              >
                Mid Row
              </button>
              <button
                onClick={() => handleClaimWin('line3')}
                className={`claim-btn-small ${claimedBy['line3'] ? 'is-claimed' : ''}`}
                disabled={gameStatus !== 'playing' || !!claimedBy['line3']}
              >
                Bottom Row
              </button>
            </div>
            
            <button
              onClick={() => handleClaimWin('fullhouse')}
              className={`claim-btn fullhouse-btn mt-3 ${claimedBy['fullhouse'] ? 'is-claimed' : ''}`}
              disabled={gameStatus !== 'playing' || !!claimedBy['fullhouse']}
            >
              <Trophy size={16} className="inline-block mr-2" />
              Claim Full House
            </button>
          </div>

          <Leaderboard winners={winners} />
        </div>

        <div className="board-container">
          <NumberBoard
            calledNumbers={calledNumbers}
            currentNumber={currentNumber}
          />
        </div>

        <div className="social-panel">
          {gameStatus === 'ended' && (
            <div className="game-over-overlay">
              <div className="game-over-content">
                <Trophy size={48} className="text-amber-500 mb-4" />
                <h2 className="text-3xl font-black mb-2">GAME OVER</h2>
                <p className="text-slate-400 mb-6">The round has finished!</p>
                <button onClick={() => navigate('/lobby')} className="header-btn px-8 py-3 bg-indigo-600 text-white border-none hover:bg-indigo-700">
                  Back to Lobby
                </button>
              </div>
            </div>
          )}
          
          <PlayerList players={players} currentUserId={user?.id} hostId={hostId} />
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
    </div>
  );
};

export default GameRoomPage;