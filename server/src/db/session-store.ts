import { Store } from 'express-session';
import type { SessionData } from 'express-session';
import { db } from './database-sqlite.js';

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expired DATETIME NOT NULL
  )
`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_expired ON sessions(expired)`);

export class SQLiteSessionStore extends Store {
  private ttlSeconds: number;

  constructor(ttlSeconds = 86400) {
    super();
    this.ttlSeconds = ttlSeconds;
  }

  get(sid: string, callback: (err: any, session?: SessionData | null) => void): void {
    try {
      const row = db.prepare(
        `SELECT sess FROM sessions WHERE sid = ? AND expired > datetime('now')`
      ).get(sid) as { sess: string } | undefined;
      callback(null, row ? JSON.parse(row.sess) : null);
    } catch (err) {
      callback(err);
    }
  }

  set(sid: string, session: SessionData, callback?: (err?: any) => void): void {
    try {
      const ttl = session.cookie?.maxAge ? Math.floor(session.cookie.maxAge / 1000) : this.ttlSeconds;
      const expired = new Date(Date.now() + ttl * 1000)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19);
      db.prepare(
        `INSERT OR REPLACE INTO sessions (sid, sess, expired) VALUES (?, ?, ?)`
      ).run(sid, JSON.stringify(session), expired);
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  destroy(sid: string, callback?: (err?: any) => void): void {
    try {
      db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  touch(sid: string, session: SessionData, callback?: (err?: any) => void): void {
    this.set(sid, session, callback);
  }
}
