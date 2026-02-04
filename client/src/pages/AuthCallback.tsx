import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { TrendingUp } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      // Handle OAuth errors
      console.error('OAuth error:', error);
      navigate('/login?error=' + error);
      return;
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        setAuth(user, token);

        // Clean redirect to dashboard
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Failed to parse user data:', err);
        navigate('/login?error=invalid_callback');
      }
    } else {
      navigate('/login?error=missing_credentials');
    }
  }, [searchParams, setAuth, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-200 via-neutral-100 to-primary-100 flex items-center justify-center">
      <div className="text-center">
        <TrendingUp className="w-16 h-16 text-primary-600 mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-dark-500 mb-2">Completing sign in...</h2>
        <p className="text-dark-400">Please wait while we set up your account.</p>
      </div>
    </div>
  );
}
