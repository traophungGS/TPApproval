import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pollRoutes from './routes/polls';
import statsRoutes from './routes/stats';
import { initializeDatabase } from './database/db';

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

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
