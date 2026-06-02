# Updated Setup Instructions - IP-Based Voting with Referral Tracking

## How It Works Now

### ✅ No Discord Login Required
- Users access the site from the Discord server link
- The site verifies they came from Discord
- Only one vote per IP address per poll per day
- Users can vote in multiple polls but not twice in the same poll

### 🔗 Referral Tracking
- Share this link in your Discord server: 
```
https://yourusername.github.io/TPApproval?ref=discord
```
- The site blocks access if users don't come from Discord server
- Prevents voting from outside sources

### 🛡️ IP-Based Voting Protection
- One vote per IP per poll per day
- Prevents duplicate votes from same device
- Users can vote in multiple different polls

## Setup Steps

### 1. Update Backend Configuration

**Create `backend/.env`:**
```
JWT_SECRET=your_random_secret_key
PORT=3001
NODE_ENV=development
```

### 2. Install & Run Backend

```bash
cd backend
npm install
npm run dev
```

Server runs on `http://localhost:3001`

### 3. Deploy Website

Deploy `index.html`, `app.js`, `styles.css` to GitHub Pages or any static hosting.

### 4. Get Your Website URL

If using GitHub Pages: `https://yourusername.github.io/TPApproval`

### 5. Share Discord Link

Post this in your Discord server:
```
Vote in today's approval rating poll:
https://yourusername.github.io/TPApproval?ref=discord
```

## Features

| Feature | How It Works |
|---------|-------------|
| **Referral Tracking** | Must access from Discord (checks `document.referrer`) |
| **IP Verification** | Gets user's public IP address |
| **Vote Limit** | One vote per IP per poll per day |
| **Multiple Polls** | Can vote in different polls daily |
| **No Login** | Just vote directly after accessing link |

## Database Schema

### Polls Table
```
id, date (unique), status, created_at, ended_at
```

### Votes Table
```
id, poll_id, ip_address, vote, created_at
Unique constraint: (poll_id, ip_address, DATE(created_at))
```

## API Endpoints

### Get Current Poll
```
GET /polls/current
```

### Cast Vote
```
POST /polls/vote
Headers:
  Content-Type: application/json

Body:
{
  "vote": "approve|disapprove|neutral",
  "ipAddress": "user_ip_address"
}

Response:
{
  "success": true,
  "message": "Vote recorded successfully"
}

Errors:
- "Invalid vote" - vote not in valid options
- "IP address required" - missing IP
- "You have already voted in today's poll..." - duplicate vote
```

### Get Statistics
```
GET /stats/range?startDate=2026-01-01&endDate=2026-01-31
```

### Get Archived Polls
```
GET /stats/archived
```

## Security Features

✅ **Referral Verification** - Must come from Discord server
✅ **IP-Based Rate Limiting** - One vote per IP per poll daily
✅ **Database Indexes** - Fast IP lookups
✅ **Unique Constraints** - Prevents duplicate votes in DB

## Customization

### Change Discord Server
Edit `app.js` line 2:
```javascript
const DISCORD_SERVER_INVITE = 'https://discord.gg/fnDYaTEzSt';
```

### Change API URL
Edit `app.js` line 1:
```javascript
const API_URL = 'http://localhost:3001';
```

### Change Poll Question
Edit `app.js` in `renderPoll()` function around line 150

## Troubleshooting

**"Access Denied" message?**
- Make sure you're accessing from Discord server link
- Or directly access with: `?ref=discord` parameter

**"Already voted" error?**
- This IP already voted in today's poll
- Try again tomorrow or use different device/IP

**IP not detected?**
- Fallback to user agent hash
- Should still work but less accurate

## Deployment Options

### Frontend (GitHub Pages)
1. Push `index.html`, `app.js`, `styles.css` to GitHub repo
2. Enable GitHub Pages in repo settings
3. Site available at: `https://yourusername.github.io/TPApproval`

### Backend (Heroku/Railway/Render)
1. Push backend folder to hosting platform
2. Set environment variables
3. Database persists with SQLite or upgrade to PostgreSQL
