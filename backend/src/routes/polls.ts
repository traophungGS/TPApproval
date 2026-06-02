import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/db';

const router = Router();

interface AuthRequest extends Request {
    body: {
        pollId: string;
        vote: string;
        ipAddress: string;
    };
}

// Get all active polls
router.get('/all', async (req: Request, res: Response) => {
    try {
        const db = getDatabase();
        const today = new Date().toISOString().split('T')[0];

        const polls = await db.all(
            'SELECT * FROM polls ORDER BY id ASC'
        );

        const pollsWithVotes = await Promise.all(
            polls.map(async (poll: any) => {
                const votes = await db.all(
                    'SELECT vote, COUNT(*) as count FROM votes WHERE poll_id = ? AND DATE(created_at) = ? GROUP BY vote',
                    [poll.id, today]
                );

                const voteCounts: { [key: string]: number } = {
                    'highly_approve': 0,
                    'approve': 0,
                    'okay': 0,
                    'disapprove': 0,
                    'extremely_disapprove': 0
                };

                votes.forEach((v: { vote: string; count: number }) => {
                    voteCounts[v.vote] = v.count;
                });

                const total = Object.values(voteCounts).reduce((a: number, b: number) => a + b, 0);

                return {
                    ...poll,
                    votes: voteCounts,
                    total,
                };
            })
        );

        res.json(pollsWithVotes);
    } catch (error) {
        console.error('Error fetching polls:', error);
        res.status(500).json({ error: 'Failed to fetch polls' });
    }
});

// Get single poll with today's votes
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const db = getDatabase();
        const { id } = req.params;
        const today = new Date().toISOString().split('T')[0];

        const poll = await db.get('SELECT * FROM polls WHERE id = ?', [id]);

        if (!poll) {
            return res.status(404).json({ error: 'Poll not found' });
        }

        const votes = await db.all(
            'SELECT vote, COUNT(*) as count FROM votes WHERE poll_id = ? AND DATE(created_at) = ? GROUP BY vote',
            [id, today]
        );

        const voteCounts: { [key: string]: number } = {
            'highly_approve': 0,
            'approve': 0,
            'okay': 0,
            'disapprove': 0,
            'extremely_disapprove': 0
        };

        votes.forEach((v: { vote: string; count: number }) => {
            voteCounts[v.vote] = v.count;
        });

        const total = Object.values(voteCounts).reduce((a: number, b: number) => a + b, 0);

        res.json({
            ...poll,
            votes: voteCounts,
            total,
            date: today,
        });
    } catch (error) {
        console.error('Error fetching poll:', error);
        res.status(500).json({ error: 'Failed to fetch poll' });
    }
});

// Cast vote
router.post('/:id/vote', async (req: AuthRequest, res: Response) => {
    const { pollId, vote, ipAddress } = req.body;
    const { id } = req.params;

    if (!['highly_approve', 'approve', 'okay', 'disapprove', 'extremely_disapprove'].includes(vote)) {
        return res.status(400).json({ error: 'Invalid vote' });
    }

    if (!ipAddress) {
        return res.status(400).json({ error: 'IP address required' });
    }

    try {
        const db = getDatabase();
        const today = new Date().toISOString().split('T')[0];

        // Check if this IP has already voted in this poll today
        const existingVote = await db.get(
            `SELECT * FROM votes 
             WHERE poll_id = ? AND ip_address = ? AND DATE(created_at) = ?`,
            [id, ipAddress, today]
        );

        if (existingVote) {
            return res.status(403).json({
                error: 'You have already voted in this poll today. Please try again tomorrow.',
            });
        }

        // Insert vote
        await db.run(
            'INSERT INTO votes (poll_id, ip_address, vote) VALUES (?, ?, ?)',
            [id, ipAddress, vote]
        );

        res.json({ success: true, message: 'Vote recorded successfully' });
    } catch (error) {
        console.error('Error casting vote:', error);
        res.status(500).json({ error: 'Failed to cast vote' });
    }
});

// Get user's vote for a specific poll today
router.get('/:id/my-vote', async (req: Request, res: Response) => {
    const { ipAddress } = req.query;
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];

    if (!ipAddress) {
        return res.json({ vote: null });
    }

    try {
        const db = getDatabase();

        const vote = await db.get(
            `SELECT vote FROM votes 
             WHERE poll_id = ? AND ip_address = ? AND DATE(created_at) = ?`,
            [id, ipAddress, today]
        );

        res.json({ vote: vote?.vote || null });
    } catch (error) {
        console.error('Error fetching user vote:', error);
        res.status(500).json({ error: 'Failed to fetch vote' });
    }
});

export default router;
