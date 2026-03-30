import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, RefreshCcw, Shapes } from 'lucide-react';
import useAuthStore from '../context/useAuthStore';
import ProfileCard from '../components/ProfileCard';
import RoomCard from '../components/RoomCard';
import api from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import './LobbyPage.css';

const LobbyPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthStore();

  const [rooms, setRooms] = useState([]);
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  const username = user?.name || user?.user_metadata?.full_name || "Player";

  const fetchRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    try {
      const res = await api.get('/api/rooms/');
      setRooms(res.data.rooms || []);
    } catch {
      setRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    refreshUser();
    fetchRooms();

    const socket = connectSocket();

    if (!socket.connected) {
      socket.connect();
    }

    socket.on('new_room_created', (room) => {
      setRooms(prev => [...prev, room]);
    });

    socket.on('room_updated', (room) => {
      setRooms(prev => prev.map(r => r.id === room.id ? room : r));
    });

    return () => {
      socket.off('new_room_created');
      socket.off('room_updated');
    };
  }, [fetchRooms, user?.id]);

  const handleCreateRoom = async () => {
    if (!user?.id) return;

    setIsCreating(true);
    try {
      const res = await api.post('/api/rooms/create', {
        user_id: user.id,
        username: username
      });

      const room = res.data;
      const socket = getSocket();

      socket.emit('join_room_socket', {
        room_id: room.id,
        user_id: user.id,
        username: username
      });

      navigate(`/game/${room.id}`);
    } catch {
      alert('Create room failed');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!roomCode.trim() || !user?.id) return;

    setIsJoining(true);
    try {
      const res = await api.post('/api/rooms/join', {
        room_id: roomCode.trim(),
        user_id: user.id,
        username: username
      });

      const room = res.data;
      const socket = getSocket();

      socket.emit('join_room_socket', {
        room_id: room.id,
        user_id: user.id,
        username: username
      });

      navigate(`/game/${room.id}`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Join failed');
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinRoom = async (id) => {
    if (!user?.id) return;

    try {
      const res = await api.post('/api/rooms/join', {
        room_id: id,
        user_id: user.id,
        username: username
      });

      const room = res.data;
      const socket = getSocket();

      socket.emit('join_room_socket', {
        room_id: room.id,
        user_id: user.id,
        username: username
      });

      navigate(`/game/${room.id}`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Join failed');
    }
  };

  return (
    <div className="lobby-container">

      <ProfileCard />

      <div className="lobby-actions">

        <div className="action-card">
          <Plus size={32} className="action-icon create" />
          <h3 className="action-title">Create Room</h3>
          <p className="text-slate-400 text-sm">Start your own game with friends</p>
          <button 
            onClick={handleCreateRoom} 
            disabled={isCreating}
            className="action-btn"
          >
            {isCreating ? 'Creating...' : 'Create Room'}
          </button>
        </div>

        <div className="action-card">
          <Search size={32} className="action-icon search" />
          <h3 className="action-title">Join Room</h3>
          
          <form onSubmit={handleJoinByCode} className="join-form">
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ENTER ROOM ID"
              className="room-input"
            />

            <button disabled={isJoining} className="action-btn">
              {isJoining ? 'Joining...' : 'Join Now'}
            </button>
          </form>
        </div>

      </div>

      <div className="rooms-section">
        <div className="rooms-header">
          <h3 className="rooms-title">
            <Shapes className="text-indigo-400" />
            Live Rooms
          </h3>
          <button onClick={fetchRooms} className="refresh-btn">
            <RefreshCcw size={18} className={isLoadingRooms ? 'animate-spin' : ''} />
          </button>
        </div>

        {isLoadingRooms ? (
          <div className="loading-rooms">
             <div className="loader-spin"></div>
             <p>Syncing rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="no-rooms">
             <Shapes size={48} className="mx-auto mb-4 opacity-20" />
             <p>No active rooms found. Why not create one?</p>
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map(room => (
              <RoomCard key={room.id} room={room} onJoin={handleJoinRoom} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default LobbyPage;