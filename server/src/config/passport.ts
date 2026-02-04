import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { query } from '../db/database.js';

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;

        if (!email) {
          return done(new Error('No email provided by Google'), undefined);
        }

        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();

        // Check if user exists by google_id
        let result = await query('SELECT * FROM users WHERE google_id = $1', [googleId]);

        if (result.rows.length > 0) {
          // User exists with this Google ID - return user
          console.log(`✅ User logged in via Google: ${normalizedEmail}`);
          return done(null, result.rows[0]);
        }

        // Check if user exists by email (for account linking)
        result = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);

        if (result.rows.length > 0) {
          // Email exists - link Google account to existing user
          const existingUser = result.rows[0] as any;

          const updateResult = await query(
            `UPDATE users
             SET google_id = $1,
                 auth_provider = CASE
                   WHEN password_hash IS NOT NULL THEN 'both'
                   ELSE 'google'
                 END,
                 profile_picture_url = $2,
                 email_verified = 1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [googleId, profile.photos?.[0]?.value, existingUser.id]
          );

          console.log(`✅ Linked Google account to existing user: ${normalizedEmail}`);
          return done(null, updateResult.rows[0]);
        }

        // Create new user with Google OAuth
        const newUserResult = await query(
          `INSERT INTO users
           (email, google_id, first_name, last_name, auth_provider, profile_picture_url, email_verified)
           VALUES ($1, $2, $3, $4, 'google', $5, 1)
           RETURNING *`,
          [
            normalizedEmail,
            googleId,
            profile.name?.givenName || '',
            profile.name?.familyName || '',
            profile.photos?.[0]?.value
          ]
        );

        const newUser = newUserResult.rows[0] as any;

        // Create default user settings
        await query('INSERT INTO user_settings (user_id) VALUES ($1)', [newUser.id]);

        console.log(`✅ Created new user via Google OAuth: ${normalizedEmail}`);
        return done(null, newUser);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error as Error, undefined);
      }
    }
  )
);

// Serialize user for session (used by Passport internally)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
