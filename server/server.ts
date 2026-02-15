import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { db, init } from './db.js';
import { customAlphabet } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174", "https://poll-system-sand-ten.vercel.app"],
        methods: ["GET", "POST"]
    }
});

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://poll-system-sand-ten.vercel.app"],
    methods: ["GET", "POST"]
}));
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
    count: number;
}

// API Routes
app.post('/api/polls', (req: Request, res: Response) => {
    const { question, options } = req.body as PollRequest;
    if (!question || !options || options.length < 2) {
        res.status(400).json({ error: 'Invalid poll data' });
        return;
    }

    const pollId = nanoid();
    const insertPoll = db.prepare('INSERT INTO polls (id, question) VALUES (?, ?)');
    const insertOption = db.prepare('INSERT INTO options (poll_id, text) VALUES (?, ?)');

    const transaction = db.transaction(() => {
        insertPoll.run(pollId, question);
        for (const optionUserText of options) {
            insertOption.run(pollId, optionUserText);
        }
    });

    try {
        transaction();
        res.json({ id: pollId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create poll' });
    }
});

app.get('/api/polls/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const getPoll = db.prepare('SELECT * FROM polls WHERE id = ?');
    const getOptions = db.prepare('SELECT * FROM options WHERE poll_id = ?');

    const poll = getPoll.get(id);
    if (!poll) {
        res.status(404).json({ error: 'Poll not found' });
        return;
    }

    const options = getOptions.all(id) as Option[];

    // Calculate results
    const getVotes = db.prepare('SELECT option_id, COUNT(*) as count FROM votes WHERE poll_id = ? GROUP BY option_id');
    const voteCounts = getVotes.all(id) as VoteCount[];

    // Map counts to options
    const optionsWithVotes = options.map((opt) => {
        const vote = voteCounts.find((v) => v.option_id === opt.id);
        return { ...opt, votes: vote ? vote.count : 0 };
    });

    res.json({ ...poll, options: optionsWithVotes });
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
    }

    socket.on('vote', ({ pollId, optionId, deviceId }: VotePayload) => {
        const clientIp = socket.handshake.address;

        // Check IP fairness
        const checkIp = db.prepare('SELECT id FROM votes WHERE poll_id = ? AND ip_address = ?');
        const existingVoteIp = checkIp.get(pollId, clientIp);

        if (existingVoteIp) {
            socket.emit('error', 'You have already voted from this IP address.');
            return;
        }

        try {
            const insertVote = db.prepare('INSERT INTO votes (poll_id, option_id, ip_address) VALUES (?, ?, ?)');
            insertVote.run(pollId, optionId, clientIp);

            // Broadcast update
            const getVotes = db.prepare('SELECT option_id, COUNT(*) as count FROM votes WHERE poll_id = ? GROUP BY option_id');
            const voteCounts = getVotes.all(pollId) as VoteCount[];

            const results: Record<number, number> = {};
            voteCounts.forEach((v) => results[v.option_id] = v.count);

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
