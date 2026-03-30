import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../context/useAuthStore';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import './RoomJoinPage.css';

const RoomJoinPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthStore();

  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.id) {
      sessionStorage.setItem('pending_room', roomId);
      navigate('/');
      return;
    }

    const joinRoom = async () => {
      setJoining(true);
      setError(null);

      try {
        await api.post('/api/rooms/join', {
          room_id: roomId,
          user_id: user.id,
          username: user.name || user.username
        });

        // 🔥 FIX: DO NOT navigate immediately, wait small delay
        setTimeout(() => {
          navigate(`/game/${roomId}`);
        }, 300);

      } catch (err) {
        console.error("JOIN ERROR:", err?.response || err);

        if (err.response?.status === 404) {
          setError('Room not found. Check code or create a new room.');
        } else if (err.response?.status === 400) {
          setError(err.response.data.detail || 'Cannot join room.');
        } else {
          setError('Server error. Try again.');
        }
      } finally {
        setJoining(false);
      }
    };

    joinRoom();
  }, [user?.id, authLoading, roomId, navigate]);

  return (
    <div className="join-page-root">

      {!error && (
        <div className="join-status-card">
          <div className="pulse-loader">
            <Loader2 size={40} className="animate-spin" />
          </div>
          <h2 className="join-title">
            {joining ? `Entering Room ${roomId}` : 'Getting things ready...'}
          </h2>
          <p className="join-subtitle">
            Preparing your Tambola ticket and joining the circle.
          </p>
        </div>
      )}

      {error && (
        <div className="error-card">
          <div className="error-icon-wrapper">
            <AlertCircle size={32} />
          </div>

          <div className="space-y-3">
            <h2 className="error-title">
              Access Denied
            </h2>
            <p className="error-description">
              {error}
            </p>
          </div>

          <button
            onClick={() => navigate('/lobby')}
            className="back-btn"
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowLeft size={18} />
              Return to Lobby
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default RoomJoinPage;