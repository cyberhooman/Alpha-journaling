// Database module - currently using SQLite
// Note: SQLite data is lost on Railway redeploys (ephemeral filesystem)
// TODO: Refactor all routes to use query() instead of db.prepare() for PostgreSQL
export { query, db } from './database-sqlite.js';
export { default } from './database-sqlite.js';
