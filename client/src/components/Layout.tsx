import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SquaresFour,
  Notebook,
  ChartBar,
  CalendarBlank,
  UploadSimple,
  SignOut,
  TrendUp,
  Gear,
  List,
  X,
  Target,
  CheckSquare,
} from '@phosphor-icons/react';
import { useAuthStore } from '../store/authStore';

const navigation = [
  { name: 'Dashboard', href: '/', icon: SquaresFour },
  { name: 'Trades', href: '/trades', icon: Notebook },
  { name: 'Strategies', href: '/strategies', icon: Target },
  { name: 'Checklist', href: '/checklist', icon: CheckSquare },
  { name: 'Analytics', href: '/analytics', icon: ChartBar },
  { name: 'Calendar', href: '/calendar', icon: CalendarBlank },
  { name: 'Import', href: '/import', icon: UploadSimple },
  { name: 'Settings', href: '/settings', icon: Gear },
];

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = 'https://app.alphalabs.live/logout';
  };

  const initials = (user?.firstName || user?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex" style={{ background: 'rgb(var(--background))' }}>
      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden lg:flex flex-col w-60 flex-shrink-0 fixed inset-y-0 left-0 z-30"
        style={{
          background: 'rgb(var(--surface))',
          borderRight: '1px solid rgb(var(--border))',
        }}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-2.5" style={{ borderBottom: '1px solid rgb(var(--border))' }}>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,117,34,0.12)', border: '1px solid rgba(255,117,34,0.2)' }}
          >
            <TrendUp weight="bold" className="w-4 h-4" style={{ color: '#FF7522' }} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none" style={{ color: 'rgb(var(--text-primary))' }}>Trading Journal</p>
            <p className="text-[10px] mt-0.5 uppercase tracking-widest" style={{ color: 'rgb(var(--text-muted))' }}>Pro</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navigation.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              <NavLink
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{item.name}</span>
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* User */}
        <div className="p-3" style={{ borderTop: '1px solid rgb(var(--border))' }}>
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl" style={{ background: 'rgb(var(--surface-2))' }}>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0"
              style={{ background: 'rgba(255,117,34,0.12)', color: '#FF7522' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'rgb(var(--text-primary))' }}>
                {user?.firstName || user?.email || 'Trader'}
              </p>
              <p className="text-[10px] truncate" style={{ color: 'rgb(var(--text-muted))' }}>{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1 rounded-lg transition-colors"
              style={{ color: 'rgb(var(--text-muted))' }}
            >
              <SignOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgb(var(--surface))', borderBottom: '1px solid rgb(var(--border))' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,117,34,0.12)' }}>
            <TrendUp weight="bold" className="w-3.5 h-3.5" style={{ color: '#FF7522' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>Trading Journal</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-xl transition-colors"
          style={{ color: 'rgb(var(--text-primary))', background: 'rgb(var(--surface-2))' }}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <List className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 flex flex-col"
              style={{ background: 'rgb(var(--surface))', borderRight: '1px solid rgb(var(--border))' }}
            >
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgb(var(--border))' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,117,34,0.12)' }}>
                    <TrendUp weight="bold" className="w-4 h-4" style={{ color: '#FF7522' }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>Trading Journal</p>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} style={{ color: 'rgb(var(--text-muted))' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-0.5">
                {navigation.map((item, i) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <NavLink
                      to={item.href}
                      end={item.href === '/'}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{item.name}</span>
                    </NavLink>
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 lg:ml-60 pt-12 lg:pt-0">
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
