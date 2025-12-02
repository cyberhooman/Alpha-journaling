// Database module - using PostgreSQL for production persistence
// SQLite loses data on Railway redeploys (ephemeral filesystem)
export { query, db } from './database-postgres.js';
export { default } from './database-postgres.js';
