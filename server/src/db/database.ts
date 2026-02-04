// Database module - currently using SQLite
// Use PostgreSQL by setting DATABASE_URL environment variable
// Note: Some routes use db.prepare() which is SQLite-specific
export { query, db } from './database-sqlite.js';
export { default } from './database-sqlite.js';
