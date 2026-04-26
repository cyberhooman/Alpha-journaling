// Database module - using SQLite (journal has its own local DB on VPS)
// PostgreSQL migration available in database-postgres.ts if needed later
export { query, db } from './database-sqlite.js';
export { default } from './database-sqlite.js';
