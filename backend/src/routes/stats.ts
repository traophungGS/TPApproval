import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/db';

const router = Router();

// Get statistics for a specific poll
router.get('/poll/:pollId', async (req: Request, res: Response) => {
    const { pollId } = req.params;
    const { startDate, endDate } = req.query;

    try {
        const db = getDatabase();

        if (startDate && endDate) {
            const history = await db.all(
                `SELECT * FROM vote_history 
                 WHERE poll_id = ? AND vote_date >= ? AND vote_date <= ?
                 ORDER BY vote_date ASC`,
                [pollId, startDate as string, endDate as string]
            );

            res.json(history);
        } else {
            const history = await db.all(
                `SELECT * FROM vote_history 
                 WHERE poll_id = ?
                 ORDER BY vote_date DESC
                 LIMIT 30`,
                [pollId]
            );

            res.json(history);
        }
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Get all polls statistics
router.get('/all-polls/:startDate/:endDate', async (req: Request, res: Response) => {
    const { startDate, endDate } = req.params;

    try {
        const db = getDatabase();

        const polls = await db.all('SELECT id, title FROM polls ORDER BY id ASC');

        const statsMap: any = {};

        for (const poll of polls) {
            const history = await db.all(
                `SELECT * FROM vote_history 
                 WHERE poll_id = ? AND vote_date >= ? AND vote_date <= ?
                 ORDER BY vote_date ASC`,
                [poll.id, startDate, endDate]
            );

            statsMap[poll.id] = {
                pollId: poll.id,
                title: poll.title,
                history,
            };
        }

        res.json(statsMap);
    } catch (error) {
        console.error('Error fetching all statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

export default router;
