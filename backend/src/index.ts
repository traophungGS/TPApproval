import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pollRoutes from './routes/polls';
import statsRoutes from './routes/stats';
import { initializeDatabase } from './database/db';
import { getDatabase } from './database/db';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Trust proxy to get real IP address
app.set('trust proxy', 1);

// Middleware to extract real IP
app.use((req: Request, res: Response, next: Function) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip =
        (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0] : forwardedFor?.[0]) ||
        req.socket.remoteAddress ||
        'unknown';
    (req as any).clientIP = ip;
    next();
});

// Initialize database
initializeDatabase().catch(console.error);

// Routes
app.use('/polls', pollRoutes);
app.use('/stats', statsRoutes);

// Archive votes at end of day (move to history)
app.post('/admin/archive-votes', async (req: Request, res: Response) => {
    try {
        const db = getDatabase();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split('T')[0];

        const polls = await db.all('SELECT id FROM polls');

        for (const poll of polls) {
            const votes = await db.all(
                `SELECT vote, COUNT(*) as count FROM votes 
                 WHERE poll_id = ? AND DATE(created_at) = ?
                 GROUP BY vote`,
                [poll.id, yesterdayDate]
            );

            const counts: any = {
                highly_approve: 0,
                approve: 0,
                okay: 0,
                disapprove: 0,
                extremely_disapprove: 0,
            };

            votes.forEach((v: any) => {
                counts[v.vote] = v.count;
            });

            await db.run(
                `INSERT INTO vote_history 
                 (poll_id, vote_date, highly_approve, approve, okay, disapprove, extremely_disapprove)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(poll_id, vote_date) DO UPDATE SET
                 highly_approve=excluded.highly_approve,
                 approve=excluded.approve,
                 okay=excluded.okay,
                 disapprove=excluded.disapprove,
                 extremely_disapprove=excluded.extremely_disapprove`,
                [
                    poll.id,
                    yesterdayDate,
                    counts.highly_approve,
                    counts.approve,
                    counts.okay,
                    counts.disapprove,
                    counts.extremely_disapprove,
                ]
            );
        }

        res.json({ success: true, message: `Archived votes for ${yesterdayDate}` });
    } catch (error) {
        console.error('Error archiving votes:', error);
        res.status(500).json({ error: 'Failed to archive votes' });
    }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
