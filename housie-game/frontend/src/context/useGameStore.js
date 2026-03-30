import { create } from 'zustand';

const useGameStore = create((set) => ({
  user: null,
  currentRoom: null,
  gameState: 'idle', // idle | lobby | playing | finished
  ticket: null,
  marked: [],

  // ✅ Setters
  setUser: (user) => set({ user }),
  setRoom: (room) => set({ currentRoom: room }),
  setGameState: (state) => set({ gameState: state }),

  setTicket: (ticket) => set({ ticket }),
  setMarked: (marked) => set({ marked }),

  // ✅ Reset game state
  resetGame: () =>
    set({
      currentRoom: null,
      gameState: 'idle',
      ticket: null,
      marked: [],
    }),

  // ✅ Full logout
  logout: () =>
    set({
      user: null,
      currentRoom: null,
      gameState: 'idle',
      ticket: null,
      marked: [],
    }),
}));

export default useGameStore;