import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { pool, init } from './db.js';
import { customAlphabet } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for dev/testing
        methods: ["GET", "POST"]
    }
});

app.use(cors()); // Allow all origins
app.use(express.json());

// Basic health check route
app.get('/', (req, res) => {
    res.send('Poll System Server is Running');
});

// Serve static files from the React client (Optional if using split deployment)
app.use(express.static(path.join(__dirname, '../client/dist')));

// Initialize DB
init();

interface PollRequest {
    question: string;
    options: string[];
}

interface Option {
    id: number;
    poll_id: string;
    text: string;
    votes?: number;
}

interface VoteCount {
    option_id: number;
    count: string; // Postgres COUNT returns string (bigint)
}

// API Routes
app.post('/api/polls', async (req: Request, res: Response) => {
    const { question, options } = req.body as PollRequest;
    if (!question || !options || options.length < 2) {
        res.status(400).json({ error: 'Invalid poll data' });
        return;
    }

    const pollId = nanoid();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query('INSERT INTO polls (id, question) VALUES ($1, $2)', [pollId, question]);

        for (const optionUserText of options) {
            await client.query('INSERT INTO options (poll_id, text) VALUES ($1, $2)', [pollId, optionUserText]);
        }

        await client.query('COMMIT');
        res.json({ id: pollId });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Failed to create poll' });
    } finally {
        client.release();
    }
});

app.get('/api/polls/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const pollResult = await pool.query('SELECT * FROM polls WHERE id = $1', [id]);
        const poll = pollResult.rows[0];

        if (!poll) {
            res.status(404).json({ error: 'Poll not found' });
            return;
        }

        const optionsResult = await pool.query('SELECT * FROM options WHERE poll_id = $1', [id]);
        const options = optionsResult.rows as Option[];

        // Calculate results
        const votesResult = await pool.query('SELECT option_id, COUNT(*) as count FROM votes WHERE poll_id = $1 GROUP BY option_id', [id]);
        const voteCounts = votesResult.rows as VoteCount[];

        // Map counts to options
        const optionsWithVotes = options.map((opt) => {
            const vote = voteCounts.find((v) => v.option_id === opt.id);
            return { ...opt, votes: vote ? parseInt(vote.count) : 0 };
        });

        res.json({ ...poll, options: optionsWithVotes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch poll' });
    }
});

// Catch-all handler for any request that doesn't match the above
app.get(/.*/, (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Socket.io Logic
io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_poll', (pollId: string) => {
        socket.join(pollId);
    });

    interface VotePayload {
        pollId: string;
        optionId: number;
        deviceId?: string;
        voterId: string; // New required field
    }

    socket.on('vote', async ({ pollId, optionId, voterId }: VotePayload) => {
        const clientIp = socket.handshake.address; // Now used for restriction

        // Check if voterId is present
        if (!voterId) {
            socket.emit('error', 'Voter ID is missing.');
            return;
        }

        // Check fairness
        if (process.env.ALLOW_LOCAL_VOTING !== 'true') {
            try {
                // Mechanism 1: Voter ID (Device-based)
                const checkVoteId = await pool.query('SELECT id FROM votes WHERE poll_id = $1 AND voter_id = $2', [pollId, voterId]);
                if (checkVoteId.rows.length > 0) {
                    socket.emit('error', 'You have already voted on this device.');
                    return;
                }

                // Mechanism 2: Rate Limiting (Anti-abuse)
                // Prevents rapid-fire bot voting from the same IP, but allows multiple users on same WiFi
                const currentTime = Date.now();
                const windowStart = currentTime - 60000; // 1 minute window

                // Clean up old entries (simplistic approach)
                // ideally use a proper rate limit library, but keeping it simple for "no constraints"

                const recentVotes = await pool.query(
                    'SELECT COUNT(*) FROM votes WHERE ip_address = $1 AND created_at > to_timestamp($2 / 1000.0)',
                    [clientIp, windowStart]
                );

                const voteCount = parseInt(recentVotes.rows[0].count);
                if (voteCount >= 10) { // Limit to 10 votes per minute per IP
                    socket.emit('error', 'Rate limit exceeded. Too many votes from this network.');
                    return;
                }

            } catch (err) {
                console.error("Error checking vote:", err);
            }
        }

        try {
            // Updated INSERT to include voterId
            await pool.query('INSERT INTO votes (poll_id, option_id, voter_id) VALUES ($1, $2, $3)', [pollId, optionId, voterId]);

            // Broadcast update
            const votesResult = await pool.query('SELECT option_id, COUNT(*) as count FROM votes WHERE poll_id = $1 GROUP BY option_id', [pollId]);
            const voteCounts = votesResult.rows as VoteCount[];

            const results: Record<number, number> = {};
            voteCounts.forEach((v) => results[v.option_id] = parseInt(v.count));

            io.to(pollId).emit('update_results', results);

        } catch (err) {
            console.error("Vote error:", err);
            socket.emit('error', 'Failed to record vote.');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

