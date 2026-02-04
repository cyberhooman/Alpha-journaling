declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      first_name?: string;
      last_name?: string;
      google_id?: string;
      auth_provider?: 'local' | 'google' | 'both';
      profile_picture_url?: string;
      email_verified?: number;
      password_hash?: string;
      created_at?: string;
      updated_at?: string;
    }
  }
}
