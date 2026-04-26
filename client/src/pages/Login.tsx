import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ChartBar, ChartLine, TrendUp } from '@phosphor-icons/react';
const BarChart3 = ChartBar;
const LineChart = ChartLine;
const TrendingUp = TrendUp;
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
    <div className="min-h-screen bg-neutral-100 text-dark-500 flex overflow-hidden relative">
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Gloock&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Atmospheric background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-48 -left-40 h-[520px] w-[520px] rounded-full bg-primary-200/60 blur-3xl"></div>
        <div className="absolute -bottom-56 -right-40 h-[520px] w-[520px] rounded-full bg-accent-200/50 blur-3xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.65),transparent_60%)]"></div>
      </div>

      {/* Left side - Brand story */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="relative z-10 w-full px-16 py-20 flex items-center">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 text-primary-600 fade-up" style={{ animationDelay: '80ms' }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md">
                <img
                  src="/icon.png"
                  alt="Alphalabs icon"
                  className="h-7 w-7 object-contain"
                />
              </div>
              <div className="text-sm font-semibold tracking-[0.3em] text-primary-700 uppercase">
                Alphalabs Trading Journal
              </div>
            </div>

            <h1
              className="mt-8 text-5xl leading-tight text-dark-500 fade-up"
              style={{ fontFamily: 'Gloock, serif', animationDelay: '140ms' }}
            >
              Clarity, every trade.
            </h1>
            <p
              className="mt-6 text-lg text-dark-400 leading-relaxed fade-up"
              style={{ fontFamily: 'Manrope, sans-serif', animationDelay: '200ms' }}
            >
              A calm, precise journal that turns today&apos;s trades into tomorrow&apos;s edge. Capture fast,
              review deeper, improve without noise.
            </p>

            <div className="mt-10 grid gap-4">
              <div className="flex items-start gap-4 rounded-2xl bg-white/70 border border-neutral-200 p-5 shadow-sm fade-up" style={{ animationDelay: '260ms' }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-semibold text-dark-500" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Patterns you can act on
                  </div>
                  <div className="text-sm text-dark-400">
                    See wins, losses, and behaviors with zero spreadsheet work.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-2xl bg-white/70 border border-neutral-200 p-5 shadow-sm fade-up" style={{ animationDelay: '320ms' }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-accent-700">
                  <LineChart className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-semibold text-dark-500" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Momentum without chaos
                  </div>
                  <div className="text-sm text-dark-400">
                    Daily reflection that keeps you consistent, not reactive.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-2xl bg-white/70 border border-neutral-200 p-5 shadow-sm fade-up" style={{ animationDelay: '380ms' }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 text-dark-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-semibold text-dark-500" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Built for serious focus
                  </div>
                  <div className="text-sm text-dark-400">
                    A clean, premium workspace that respects your attention.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center gap-3 text-sm text-dark-400 fade-up" style={{ animationDelay: '440ms' }}>
              <div className="h-2 w-2 rounded-full bg-success"></div>
              Secure by design. Your data stays yours.
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 relative">
        {/* Mobile logo */}
        <div className="lg:hidden absolute top-8 left-6 flex items-center gap-3 fade-up">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-md">
            <img
              src="/icon.png"
              alt="Alphalabs icon"
              className="h-6 w-6 object-contain"
            />
          </div>
          <div className="text-sm font-semibold tracking-[0.3em] text-primary-700 uppercase">
            Alphalabs Trading Journal
          </div>
        </div>

        <div className="w-full max-w-md pt-24 lg:pt-0">
          <div className="mb-8 text-center lg:text-left fade-up" style={{ animationDelay: '120ms' }}>
            <div className="text-xs uppercase tracking-[0.4em] text-dark-300">Welcome back</div>
            <h2 className="mt-3 text-4xl text-dark-500" style={{ fontFamily: 'Gloock, serif' }}>
              Sign in to your journal.
            </h2>
            <p className="mt-3 text-base text-dark-400" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Simple, focused, premium. Keep your edge where it belongs.
            </p>
          </div>

          <div className="relative fade-up" style={{ animationDelay: '200ms' }}>
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary-200/60 via-white to-accent-200/60 blur-xl opacity-80"></div>

            <div className="relative rounded-3xl border border-neutral-200 bg-white/85 p-8 shadow-[0_24px_60px_-28px_rgba(31,31,31,0.6)] backdrop-blur">
              {error && (
                <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 mb-6 rounded-xl text-sm">
                  <div className="font-semibold mb-1">We couldn&apos;t sign you in.</div>
                  {error}
                </div>
              )}

              <GoogleSignInButton className="rounded-xl border-neutral-200 bg-white hover:bg-neutral-50" text="Continue with Google" />

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white/90 text-xs tracking-[0.3em] uppercase text-dark-300">
                    Or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-[0.3em] text-dark-300">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-dark-500 placeholder-dark-300 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-200/40 transition-all duration-200"
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-[0.3em] text-dark-300">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-dark-500 placeholder-dark-300 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-200/40 transition-all duration-200"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full relative group overflow-hidden bg-dark-500 hover:bg-dark-600 text-neutral-100 font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-neutral-100 border-t-transparent rounded-full animate-spin"></div>
                        Signing in...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-neutral-200 text-center text-sm text-dark-400">
                New here?{' '}
                <Link
                  to="/register"
                  className="text-primary-700 hover:text-primary-800 font-semibold transition-colors duration-200"
                >
                  Create an account
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center lg:justify-start gap-2 text-xs text-dark-300">
            <div className="w-2 h-2 rounded-full bg-success"></div>
            Secure connection
          </div>
        </div>
      </div>

      {/* Inline animations */}
      <style>{`
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .fade-up {
          animation: fadeUp 0.8s ease-out both;
        }
      `}</style>
    </div>
  );
}
