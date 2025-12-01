// Database module - uses PostgreSQL for production
// For local development with SQLite, change imports to './database-sqlite.js'
export { query, db } from './database-postgres.js';
export { default } from './database-postgres.js';
