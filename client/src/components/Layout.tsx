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
  ClipboardCheck
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
// import AccountSwitcher from './AccountSwitcher';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Trades', href: '/trades', icon: BookOpen },
  { name: 'Checklist', href: '/checklist', icon: ClipboardCheck },
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
    <div className="min-h-screen bg-neutral-100">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-dark-500 border-b border-dark-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary-500" />
          <h1 className="text-lg font-bold text-white">Trading Journal</h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-white hover:bg-dark-600 rounded-lg"
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
      <div className={`fixed inset-y-0 left-0 w-64 bg-dark-500 border-r border-dark-600 transform transition-transform duration-300 ease-in-out z-40 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:top-0 top-14`}>
        <div className="flex flex-col h-full">
          {/* Logo - Hidden on mobile since it's in the top bar */}
          <div className="hidden lg:block px-6 py-6 border-b border-dark-600">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-primary-500" />
              <div>
                <h1 className="text-xl font-bold text-white">Trading Journal</h1>
                <p className="text-xs text-neutral-400">Pro Edition</p>
              </div>
            </div>
          </div>

          {/* Account Switcher */}
          {/* <div className="px-4 py-4">
            <AccountSwitcher />
          </div> */}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-2 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white font-medium'
                      : 'text-neutral-300 hover:bg-dark-600 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-dark-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">
                  {user?.firstName || user?.email}
                </p>
                <p className="text-xs text-neutral-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-neutral-400 hover:text-white hover:bg-dark-600 rounded-lg transition-colors"
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
