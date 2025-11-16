// Using SQLite for simplicity - no PostgreSQL server required
import { query, db } from './database-sqlite.js';

export { query, db };
export default db;
