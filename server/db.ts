import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize database
export async function init(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS polls (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS options (
        id SERIAL PRIMARY KEY,
        poll_id TEXT NOT NULL,
        text TEXT NOT NULL,
        FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        poll_id TEXT NOT NULL,
        option_id INTEGER NOT NULL,
        ip_address TEXT,
        voter_id TEXT, -- New column for browser-based tracking
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
        FOREIGN KEY (option_id) REFERENCES options(id) ON DELETE CASCADE
      );

      -- Attempt to add voter_id column if it doesn't exist (for existing tables)
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='votes' AND column_name='voter_id') THEN
              ALTER TABLE votes ADD COLUMN voter_id TEXT;
          END IF;
      END $$;
      -- Optimizations: Add indices for faster lookups
      CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
      CREATE INDEX IF NOT EXISTS idx_votes_voter_id ON votes(voter_id);
      CREATE INDEX IF NOT EXISTS idx_votes_ip_address ON votes(ip_address);
    `);
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

export { pool };

