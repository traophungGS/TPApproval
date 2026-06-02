# Trao Phung Approval Rating Website

A modern web-based daily approval rating poll system with Discord authentication.

## Features

### For Users
- 🔐 **Discord OAuth Login** - Secure authentication via Discord
- 📊 **Daily Polls** - Vote on daily approval ratings
- 📈 **Statistics Dashboard** - View historical approval ratings with visual charts
- 🗂️ **Archive Section** - Browse ended polls and their statistics
- 🎨 **Modern Dark UI** - Discord-themed interface with responsive design

### For Data
- One poll per day
- Three voting options: Approve, Disapprove, Neutral
- Real-time vote counts
- Historical statistics tracking
- Percentage calculations

## Project Structure

```
├── index.html       # Main website page
├── app.js          # Frontend JavaScript logic
├── styles.css      # Website styling (Discord theme)
├── backend/        # Backend API server
├── docs/           # Documentation
└── README.md       # This file
```

## Quick Start

### Prerequisites
- Node.js 18+
- A Discord application (for OAuth)
- Modern web browser

### Setup

1. **Create a Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Get your Client ID
   - Add OAuth2 redirect URI: `http://localhost:3001/auth/discord/callback`

2. **Configure Environment**
   - Update `app.js` with your Discord Client ID
   - Create `backend/.env` file:
   ```
   DISCORD_CLIENT_ID=your_client_id
   DISCORD_CLIENT_SECRET=your_client_secret
   DISCORD_REDIRECT_URI=http://localhost:3001/auth/discord/callback
   JWT_SECRET=your_jwt_secret
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   ```

3. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

5. **Open Website**
   - Open `index.html` in your browser
   - Or serve it with a local server: `npx serve`

## API Endpoints

### Authentication
- `GET /auth/discord/callback` - Discord OAuth callback
- `POST /auth/verify` - Verify JWT token

### Polls
- `GET /polls/current` - Get today's poll and votes
- `POST /polls/vote` - Cast a vote (requires auth)
- `GET /polls/my-vote` - Get user's current vote (requires auth)

### Statistics
- `GET /stats/all` - Get all statistics
- `GET /stats/range` - Get stats for date range
- `GET /stats/archived` - Get archived polls

## Database Schema

### Users Table
- `id` - Primary key
- `discord_id` - Discord user ID
- `username` - Discord username
- `avatar_url` - User avatar URL
- `created_at` - Account creation timestamp

### Polls Table
- `id` - Primary key
- `date` - Poll date (unique per day)
- `status` - active/archived
- `created_at` - Poll creation time
- `ended_at` - Poll end time (for archived polls)

### Votes Table
- `id` - Primary key
- `poll_id` - Reference to poll
- `user_id` - Reference to user
- `vote` - approve/disapprove/neutral
- `created_at` - Vote timestamp

## Customization

### Change Colors
Edit `styles.css` CSS variables:
```css
:root {
    --primary-color: #5865f2;
    --success-color: #57f287;
    --danger-color: #ed4245;
    /* ... more colors ... */
}
```

### Change Poll Question
Edit `app.js` in `renderPoll()` function

### Adjust Auto-Refresh Rate
Edit the `setInterval` at the bottom of `app.js`

## Deployment

### Frontend
- Deploy `index.html`, `app.js`, and `styles.css` to any static hosting (Netlify, Vercel, GitHub Pages)
- Update `API_URL` and `DISCORD_CLIENT_ID` in `app.js` for production

### Backend
- Deploy to Node.js hosting (Heroku, Railway, DigitalOcean)
- Set environment variables on hosting platform
- Use persistent database solution (PostgreSQL, MongoDB, etc.)

## License

MIT
