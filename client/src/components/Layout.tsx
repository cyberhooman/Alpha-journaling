import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Calendar,
  Upload,
  LogOut,
  TrendingUp,
  Settings as SettingsIcon,
  Menu,
  X,
  Target,
  CheckSquare
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
// import AccountSwitcher from './AccountSwitcher';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Trades', href: '/trades', icon: BookOpen },
  { name: 'Strategies', href: '/strategies', icon: Target },
  { name: 'Checklist', href: '/checklist', icon: CheckSquare },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Import', href: '/import', icon: Upload },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-terminal-bg dark:data-grid">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-terminal-surface border-b border-terminal-border px-4 py-3 flex items-center justify-between backdrop-blur-lg shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <TrendingUp className="w-7 h-7 text-blue-500" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full dark:animate-pulse-glow"></div>
          </div>
          <div>
            <h1 className="text-sm font-bold text-terminal-text tracking-tight">TRADING JOURNAL</h1>
            <p className="text-[10px] text-terminal-muted font-mono">PRO TERMINAL</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-terminal-text hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-terminal-surface border-r border-terminal-border transform transition-transform duration-300 ease-in-out z-40 backdrop-blur-xl ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:top-0 top-14`}>
        <div className="flex flex-col h-full relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-500 rounded-full blur-3xl"></div>
          </div>

          {/* Logo - Hidden on mobile since it's in the top bar */}
          <div className="hidden lg:block px-6 py-6 border-b border-terminal-border relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <TrendingUp className="w-9 h-9 text-blue-500" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse-glow"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-terminal-text tracking-tight">TRADING JOURNAL</h1>
                <p className="text-xs text-terminal-muted font-mono">PRO TERMINAL v2.0</p>
              </div>
            </div>
          </div>

          {/* Account Switcher */}
          {/* <div className="px-4 py-4">
            <AccountSwitcher />
          </div> */}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 relative z-10">
            {navigation.map((item, index) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg shadow-blue-900/30'
                      : 'text-terminal-muted hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-terminal-text'
                  }`
                }
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent opacity-50"></div>
                    )}
                    <item.icon className={`w-5 h-5 relative z-10 ${isActive ? 'drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]' : ''}`} />
                    <span className="relative z-10 text-sm tracking-wide">{item.name}</span>
                    {isActive && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-400 rounded-l-full"></div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-terminal-border relative z-10">
            <div className="flex items-center justify-between bg-gray-200/50 dark:bg-gray-800/30 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-terminal-text truncate">
                  {user?.firstName || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-terminal-muted font-mono truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-terminal-muted hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-all ml-2"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 pt-14 lg:pt-0">
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
