import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, Mail, Lock, Eye, EyeOff, ArrowRight, BarChart3, Target, Calendar, LineChart, Settings } from 'lucide-react';
import { authAPI } from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: 'Advanced Trade Tracking',
      description: 'Record every detail of your trades with comprehensive data fields, screenshots, and TradingView charts integration.',
      icon: BarChart3,
      color: 'from-blue-500 to-indigo-600',
      preview: (
        <div className="w-full h-full bg-gradient-to-br from-slate-50 to-blue-50 p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">AAPL • LONG</div>
                  <div className="text-xs text-slate-500">Apple Inc.</div>
                </div>
              </div>
              <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">+2.38%</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 rounded-lg p-2">
                <div className="text-xs text-slate-500">Entry</div>
                <div className="text-sm font-bold text-slate-900">$178.50</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2">
                <div className="text-xs text-slate-500">Exit</div>
                <div className="text-sm font-bold text-slate-900">$182.75</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2">
                <div className="text-xs text-slate-500">Qty</div>
                <div className="text-sm font-bold text-slate-900">100</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-3 text-white">
              <div className="text-xs opacity-90">Total P&L</div>
              <div className="text-xl font-bold">+$425.00</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Performance Analytics',
      description: 'Deep insights into your trading performance with win rates, profit factors, and detailed breakdowns by strategy and setup.',
      icon: LineChart,
      color: 'from-emerald-500 to-green-600',
      preview: (
        <div className="w-full h-full bg-gradient-to-br from-slate-50 to-emerald-50 p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-4 space-y-3">
            <div className="text-sm font-bold text-slate-900 mb-2">Performance Overview</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                <div className="text-xs text-green-700 font-medium">Win Rate</div>
                <div className="text-2xl font-bold text-green-600">68.5%</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                <div className="text-xs text-blue-700 font-medium">Profit Factor</div>
                <div className="text-2xl font-bold text-blue-600">2.45</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                <div className="text-xs text-purple-700 font-medium">Total Trades</div>
                <div className="text-2xl font-bold text-purple-600">127</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-100">
                <div className="text-xs text-orange-700 font-medium">Avg R:R</div>
                <div className="text-2xl font-bold text-orange-600">2.1:1</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Strategy Library',
      description: 'Build and document your trading strategies with entry rules, exit rules, and risk management frameworks.',
      icon: Target,
      color: 'from-purple-500 to-pink-600',
      preview: (
        <div className="w-full h-full bg-gradient-to-br from-slate-50 to-purple-50 p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-slate-900">My Strategies</div>
              <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Active</div>
            </div>
            <div className="space-y-2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-3 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4" />
                  <div className="font-bold">Supply & Demand</div>
                </div>
                <div className="text-xs opacity-90">Price Action • 1H, 4H</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-slate-600" />
                  <div className="font-bold text-slate-900">Breakout Trading</div>
                </div>
                <div className="text-xs text-slate-500">Technical • Daily</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Trading Calendar',
      description: 'Visualize your trading activity over time and identify patterns in your performance across different days.',
      icon: Calendar,
      color: 'from-orange-500 to-amber-600',
      preview: (
        <div className="w-full h-full bg-gradient-to-br from-slate-50 to-orange-50 p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-4 space-y-3">
            <div className="text-sm font-bold text-slate-900 mb-2">November 2025</div>
            <div className="grid grid-cols-7 gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-xs text-center font-bold text-slate-400">{day}</div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const isTradeDay = [2, 5, 8, 12, 15, 19, 22, 26, 29].includes(i);
                const isProfitable = [2, 8, 15, 22, 26].includes(i);
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                      isTradeDay
                        ? isProfitable
                          ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white'
                          : 'bg-gradient-to-br from-red-400 to-pink-500 text-white'
                        : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Multi-Account Support',
      description: 'Manage multiple trading accounts seamlessly - Live, Demo, Prop Firm, or Funded accounts all in one place.',
      icon: Settings,
      color: 'from-cyan-500 to-blue-600',
      preview: (
        <div className="w-full h-full bg-gradient-to-br from-slate-50 to-cyan-50 p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-4 space-y-3">
            <div className="text-sm font-bold text-slate-900 mb-2">Trading Accounts</div>
            <div className="space-y-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-3 text-white">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold">Live Account</div>
                  <div className="text-xs opacity-90">LIVE</div>
                </div>
                <div className="text-2xl font-bold">$52,340.50</div>
                <div className="text-xs opacity-90">+12.3% overall</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-slate-900">Prop Firm</div>
                  <div className="text-xs text-slate-500">FUNDED</div>
                </div>
                <div className="text-xl font-bold text-slate-900">$100,000.00</div>
                <div className="text-xs text-slate-500">FTMO Challenge</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
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
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left side - Feature Showcase */}
        <div className="hidden lg:block">
          <div className="space-y-8">
            {/* Logo & Title */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
                    Trading Journal
                  </h1>
                  <p className="text-slate-600 text-lg">Professional Edition</p>
                </div>
              </div>
              <p className="text-xl text-slate-700 leading-relaxed">
                Everything you need to track, analyze, and improve your trading performance.
              </p>
            </div>

            {/* Feature Showcase Carousel */}
            <div className="relative">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
                {/* Feature Display */}
                <div className="relative" style={{ height: '480px' }}>
                  {features.map((feature, index) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <div
                        key={index}
                        className={`absolute inset-0 transition-all duration-700 ${
                          index === activeFeature
                            ? 'opacity-100 translate-x-0'
                            : index < activeFeature
                            ? 'opacity-0 -translate-x-full'
                            : 'opacity-0 translate-x-full'
                        }`}
                      >
                        {/* Product Preview */}
                        <div className="h-full">
                          {feature.preview}
                        </div>

                        {/* Feature Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-6 text-white">
                          <div className="flex items-center gap-2 mb-2">
                            <FeatureIcon className="w-5 h-5" />
                            <h3 className="text-xl font-bold">{feature.title}</h3>
                          </div>
                          <p className="text-sm text-white/90 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress Dots */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveFeature(index)}
                      className={`transition-all duration-300 rounded-full ${
                        index === activeFeature
                          ? 'w-8 h-2 bg-gradient-to-r from-blue-500 to-indigo-600'
                          : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={() => setActiveFeature((prev) => (prev - 1 + features.length) % features.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
              >
                <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setActiveFeature((prev) => (prev + 1) % features.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
              >
                <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/60">
                <div className="text-2xl font-bold text-blue-600">5+</div>
                <div className="text-sm text-slate-600">Key Features</div>
              </div>
              <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/60">
                <div className="text-2xl font-bold text-green-600">∞</div>
                <div className="text-sm text-slate-600">Unlimited Trades</div>
              </div>
              <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/60">
                <div className="text-2xl font-bold text-purple-600">24/7</div>
                <div className="text-sm text-slate-600">Access Anywhere</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
                Trading Journal
              </h1>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-6 sm:py-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-blue-100">Sign in to access your trading journal</p>
            </div>

            {/* Card Body */}
            <div className="px-6 sm:px-8 py-6 sm:py-8">
              {error && (
                <div className="mb-6 p-4 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-xl">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <p className="text-center text-slate-600">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Create one now
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Demo Credentials Info */}
          <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/60">
            <p className="text-xs text-center text-slate-600">
              🎯 <span className="font-semibold">First time here?</span> Create an account to start tracking your trades
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
