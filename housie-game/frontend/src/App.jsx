import { useEffect, useRef, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
const LoginPage = lazy(() => import('./pages/LoginPage'));
const GameSelectionPage = lazy(() => import('./pages/GameSelectionPage'));
const LobbyPage = lazy(() => import('./pages/LobbyPage'));
const GameRoomPage = lazy(() => import('./pages/GameRoomPage'));
const BingoGamePage = lazy(() => import('./pages/BingoGamePage'));
const RoomJoinPage = lazy(() => import('./pages/RoomJoinPage'));
const ProfileEditPage = lazy(() => import('./pages/ProfileEditPage'));
import useAuthStore from './context/useAuthStore';

function App() {

  const { initAuth, user, loading } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Layout>
      <Suspense fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      }>
        <Routes>

          {/* Login */}
          <Route
            path="/"
            element={user ? <Navigate to="/selection" replace /> : <LoginPage />}
          />

          {/* Selection */}
          <Route
            path="/selection"
            element={user ? <GameSelectionPage /> : <Navigate to="/" replace />}
          />

          {/* Lobby */}
          <Route
            path="/lobby/:gameType"
            element={user ? <LobbyPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/lobby"
            element={user ? <Navigate to="/selection" replace /> : <Navigate to="/" replace />}
          />

          {/* Join via link */}
          <Route
            path="/room/:roomId"
            element={<RoomJoinPage />}
          />

          {/* Games */}
          <Route
            path="/game/:roomId"
            element={user ? <GameRoomPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/bingo/:roomId"
            element={user ? <BingoGamePage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/bingo"
            element={user ? <Navigate to="/lobby/bingo" replace /> : <Navigate to="/" replace />}
          />

          {/* Profile Edit */}
          <Route
            path="/profile/edit"
            element={
              user ? <ProfileEditPage /> : <Navigate to="/" replace />
            }
          />

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;