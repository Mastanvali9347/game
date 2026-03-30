# Housie (Tambola) Multiplayer Game

A production-ready full-stack multiplayer Housie (Tambola) web application.

## Prerequisites

- Node.js (v18 or higher)
- Python (v3.10 or higher)
- Supabase account (for PostgreSQL)

## Setup Instructions

### Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env` with your Supabase credentials.
5. Run the server:
   ```bash
   python app/main.py
   ```

### Frontend Setup

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env` with your backend URL.
4. Run the development server:
   ```bash
   npm run dev
   ```

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Socket.IO Client, Zustand, Axios
- **Backend:** FastAPI, python-socketio (ASGI), Supabase (PostgreSQL)
- **Realtime:** WebSockets via Socket.IO
