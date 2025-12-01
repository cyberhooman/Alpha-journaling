// Use PostgreSQL for better concurrency and scalability
// Set DATABASE_URL environment variable to use PostgreSQL
// Falls back to SQLite if DATABASE_URL is not set
const usePostgres = !!process.env.DATABASE_URL;

if (usePostgres) {
  console.log('🐘 Using PostgreSQL database');
  const { query, db } = await import('./database-postgres.js');
  export { query, db };
  export default db;
} else {
  console.log('💾 Using SQLite database (set DATABASE_URL to use PostgreSQL)');
  const { query, db } = await import('./database-sqlite.js');
  export { query, db };
  export default db;
}
