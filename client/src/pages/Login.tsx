import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, ArrowRight, BarChart3, LineChart } from 'lucide-react';
import { authAPI } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tickerData, setTickerData] = useState([
    { symbol: 'AAPL', price: 178.45, change: 2.34 },
    { symbol: 'MSFT', price: 412.89, change: -1.23 },
    { symbol: 'GOOGL', price: 142.67, change: 0.89 },
    { symbol: 'AMZN', price: 181.23, change: 3.45 },
    { symbol: 'TSLA', price: 248.91, change: -2.67 },
    { symbol: 'NVDA', price: 875.34, change: 5.12 },
  ]);

  useEffect(() => {
    // Animate ticker prices
    const interval = setInterval(() => {
      setTickerData(prev => prev.map(item => ({
        ...item,
        price: item.price + (Math.random() - 0.5) * 2,
        change: item.change + (Math.random() - 0.5) * 0.5,
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      setAuth(response.data.user, response.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-500 flex overflow-hidden relative">
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,117,34,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,117,34,0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'gridPulse 4s ease-in-out infinite'
        }}></div>
      </div>

      {/* Left side - Market data / Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r-4 border-primary-500 bg-gradient-to-br from-dark-400 via-dark-500 to-dark-600">
        {/* Animated accent lines */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary-500 via-accent-400 to-primary-500 animate-shimmer"></div>
        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-accent-400 via-primary-500 to-accent-400 animate-shimmer" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          {/* Header */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="relative">
                <TrendingUp className="w-16 h-16 text-primary-500" strokeWidth={3} />
                <div className="absolute -inset-2 bg-primary-500 opacity-20 blur-xl animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-5xl font-black text-white tracking-tighter" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  TRADING
                </h1>
                <div className="text-2xl font-bold text-primary-500" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.3em' }}>
                  JOURNAL
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-12">
              <div className="flex items-center gap-3 text-neutral-200">
                <BarChart3 className="w-5 h-5 text-accent-400" />
                <span className="font-mono text-sm">PRECISION TRACKING</span>
              </div>
              <div className="flex items-center gap-3 text-neutral-200">
                <LineChart className="w-5 h-5 text-accent-400" />
                <span className="font-mono text-sm">REAL-TIME ANALYTICS</span>
              </div>
              <div className="flex items-center gap-3 text-neutral-200">
                <TrendingUp className="w-5 h-5 text-accent-400" />
                <span className="font-mono text-sm">PERFORMANCE OPTIMIZATION</span>
              </div>
            </div>
          </div>

          {/* Live Ticker */}
          <div className="space-y-4">
            <div className="text-xs font-mono text-neutral-400 tracking-widest mb-4">
              LIVE MARKET DATA
            </div>
            <div className="space-y-2">
              {tickerData.map((item, idx) => (
                <div
                  key={item.symbol}
                  className="flex items-center justify-between p-4 bg-dark-600 border-l-4 transition-all duration-500 hover:bg-dark-500 group"
                  style={{
                    borderLeftColor: item.change > 0 ? '#10b981' : '#ef4444',
                    animationDelay: `${idx * 100}ms`
                  }}
                >
                  <div className="font-mono font-bold text-white text-lg tracking-wider">
                    {item.symbol}
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="font-mono text-2xl text-white tabular-nums">
                      ${item.price.toFixed(2)}
                    </div>
                    <div className={`font-mono font-semibold text-sm px-3 py-1 rounded ${
                      item.change > 0 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                    }`}>
                      {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer stat */}
          <div className="mt-12 pt-8 border-t border-neutral-700">
            <div className="font-mono text-xs text-neutral-400 tracking-widest mb-2">
              SYSTEM STATUS
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <span className="font-mono text-neutral-300">ALL SYSTEMS OPERATIONAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Mobile logo */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-3">
          <TrendingUp className="w-10 h-10 text-primary-500" strokeWidth={3} />
          <div>
            <div className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              TRADING
            </div>
            <div className="text-xs font-bold text-primary-500" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.2em' }}>
              JOURNAL
            </div>
          </div>
        </div>

        <div className="w-full max-w-md pt-24 lg:pt-0">
          {/* Form card */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-accent-400 rounded-2xl opacity-20 blur-xl"></div>

            <div className="relative bg-dark-400 border-2 border-neutral-700 rounded-2xl p-8 shadow-2xl">
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-4xl font-black text-white mb-2 tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  ACCESS
                </h2>
                <div className="h-1 w-20 bg-gradient-to-r from-primary-500 to-accent-400 mb-4"></div>
                <p className="font-mono text-sm text-neutral-400 tracking-wide">
                  Enter credentials to continue
                </p>
              </div>

              {error && (
                <div className="bg-danger/10 border-l-4 border-danger text-danger px-4 py-3 mb-6 font-mono text-sm animate-shake">
                  <div className="font-bold mb-1">ACCESS DENIED</div>
                  {error}
                </div>
              )}

              <GoogleSignInButton />

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-neutral-700 border-dashed"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-dark-400 font-mono text-xs text-neutral-500 tracking-widest">
                    OR USE EMAIL
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block font-mono text-xs text-neutral-400 tracking-widest uppercase">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-4 bg-dark-600 border-2 border-neutral-700 rounded-lg font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-mono text-xs text-neutral-400 tracking-widest uppercase">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-4 bg-dark-600 border-2 border-neutral-700 rounded-lg font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full relative group overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={loading}
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-3 tracking-wider">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        AUTHENTICATING...
                      </>
                    ) : (
                      <>
                        SIGN IN
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-400 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-neutral-700">
                <p className="text-center font-mono text-sm text-neutral-400">
                  New user?{' '}
                  <Link
                    to="/register"
                    className="text-primary-500 hover:text-primary-400 font-bold transition-colors duration-200 group"
                  >
                    CREATE ACCOUNT
                    <span className="inline-block ml-1 group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom decoration */}
          <div className="mt-6 flex items-center justify-center gap-2 font-mono text-xs text-neutral-600">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
            SECURE CONNECTION
          </div>
        </div>
      </div>

      {/* Inline animations */}
      <style>{`
        @keyframes gridPulse {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.15; }
        }

        @keyframes shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
