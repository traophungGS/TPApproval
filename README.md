# Trao Phung Approval Rating

A web application for Discord users to vote on daily approval ratings. Features include:
- Daily polls for Discord users to vote on approval rating
- Discord OAuth login requirement
- Statistics tab showing historical approval ratings
- Archive section for ended polls and their statistics

## Features

- 🔐 Discord OAuth Authentication
- 📊 Daily approval rating polls
- 📈 Statistics dashboard with historical data
- 🗂️ Archive section for closed polls
- 🎨 Modern responsive UI

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite
- **Authentication**: Discord OAuth 2.0

## Project Structure

```
├── frontend/          # React application
├── backend/           # Express server
├── database/          # Database files and migrations
└── docs/              # Documentation
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Discord Application (for OAuth)

### Environment Variables

Create `.env` files in both frontend and backend directories.

**Backend `.env`:**
```
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:3001/auth/discord/callback
JWT_SECRET=your_jwt_secret
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:3001
VITE_DISCORD_CLIENT_ID=your_discord_client_id
```

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` in your browser.

## API Documentation

See `docs/API.md` for detailed API endpoints.

## License

MIT
