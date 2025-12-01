// Database module - currently using SQLite
// To upgrade to PostgreSQL: change imports to './database-postgres.js'
// and set DATABASE_URL environment variable in Railway
export { query, db } from './database-sqlite.js';
export { default } from './database-sqlite.js';
