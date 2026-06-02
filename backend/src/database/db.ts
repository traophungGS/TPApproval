import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

const POLLS = [
    { id: 1, title: 'How do you feel about the way Orthodoron is handling their job as Semblæ Majority Leader?' },
    { id: 2, title: 'How do you feel about the way Orthodoron is handling their job as General Secretary?' },
    { id: 3, title: 'How do you feel about the way Fevga is handling their job as Semblæ Minority Leader?' },
    { id: 4, title: 'How do you feel about the way Ffsgje is handling their job as Semblæ Majority Whip?' },
    { id: 5, title: 'How do you feel about the way Meadowie is handling their job as Semblæ Minority Whip?' },
    { id: 6, title: 'How do you feel about the way Easternfed is handling their job as leader of Eastern Federation?' },
];

export async function initializeDatabase(): Promise<void> {
    db = await open({
        filename: path.join(process.cwd(), 'data.db'),
        driver: sqlite3.Database,
    });

    await createTables();
    await seedPolls();
    console.log('Database initialized');
}

async function createTables(): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    // Polls table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS polls (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Votes table (IP-based, tracks by date)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            poll_id INTEGER NOT NULL,
            ip_address TEXT NOT NULL,
            vote TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (poll_id) REFERENCES polls(id),
            UNIQUE(poll_id, ip_address, DATE(created_at))
        )
    `);

    // Historical votes table (for statistics)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS vote_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            poll_id INTEGER NOT NULL,
            vote_date DATE NOT NULL,
            highly_approve INTEGER DEFAULT 0,
            approve INTEGER DEFAULT 0,
            okay INTEGER DEFAULT 0,
            disapprove INTEGER DEFAULT 0,
            extremely_disapprove INTEGER DEFAULT 0,
            FOREIGN KEY (poll_id) REFERENCES polls(id),
            UNIQUE(poll_id, vote_date)
        )
    `);

    // Create indexes for faster lookups
    await db.exec(`
        CREATE INDEX IF NOT EXISTS idx_votes_poll_ip_date 
        ON votes(poll_id, ip_address, DATE(created_at))
    `);

    await db.exec(`
        CREATE INDEX IF NOT EXISTS idx_votes_poll_date 
        ON votes(poll_id, DATE(created_at))
    `);

    console.log('Tables created successfully');
}

async function seedPolls(): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    for (const poll of POLLS) {
        try {
            await db.run(
                'INSERT OR IGNORE INTO polls (id, title) VALUES (?, ?)',
                [poll.id, poll.title]
            );
        } catch (err) {
            console.log(`Poll ${poll.id} already exists`);
        }
    }

    console.log('Polls seeded successfully');
}

export function getDatabase(): Database {
    if (!db) throw new Error('Database not initialized');
    return db;
}
