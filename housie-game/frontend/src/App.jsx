import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
const LoginPage = lazy(() => import('./pages/LoginPage'));
const LobbyPage = lazy(() => import('./pages/LobbyPage'));
const GameRoomPage = lazy(() => import('./pages/GameRoomPage'));
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
            element={user ? <Navigate to="/lobby" replace /> : <LoginPage />}
          />

          {/* Lobby */}
          <Route
            path="/lobby"
            element={user ? <LobbyPage /> : <Navigate to="/" replace />}
          />

          {/* Join via link */}
          <Route
            path="/room/:roomId"
            element={<RoomJoinPage />}
          />

          {/* Game */}
          <Route
            path="/game/:roomId"
            element={user ? <GameRoomPage /> : <Navigate to="/" replace />}
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