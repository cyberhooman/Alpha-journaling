import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SquaresFour,
  Notebook,
  ChartBar,
  CalendarBlank,
  UploadSimple,
  ArrowLeft,
  Gear,
  List,
  X,
  Target,
  CheckSquare,
  CaretLeft,
  SignOut,
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

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';
const EXPANDED_W = 240;
const COLLAPSED_W = 56;

const easeOutQuart = [0.25, 1, 0.5, 1] as const;

export default function Layout() {
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleBackToApp = () => {
    window.location.href = 'https://app.alphalabs.live';
  };

  const initials = (user?.firstName || user?.email || 'U').slice(0, 2).toUpperCase();
  const sidebarW = collapsed ? COLLAPSED_W : EXPANDED_W;

  return (
    <div className="min-h-screen flex" style={{ background: 'rgb(var(--background))' }}>
      {/* ── Desktop Sidebar ── */}
      <motion.aside
        className="hidden lg:flex flex-col flex-shrink-0 fixed inset-y-0 left-0 z-40 overflow-hidden"
        initial={false}
        animate={{ width: sidebarW }}
        transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.8 }}
        style={{
          width: sidebarW,
          background: 'rgb(var(--surface))',
          borderRight: '1px solid rgb(var(--border))',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center flex-shrink-0"
          style={{
            borderBottom: '1px solid rgb(var(--border))',
            height: 64,
            padding: collapsed ? '0 14px' : '0 20px',
          }}
        >
          <img src="/alphalabs-icon.png" alt="AlphaLabs" className="w-8 h-8 flex-shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18, ease: easeOutQuart }}
                className="ml-2.5 overflow-hidden whitespace-nowrap"
              >
                <p className="text-sm font-semibold leading-none" style={{ color: 'rgb(var(--text-primary))' }}>Alpha Journaling</p>
                <p className="text-[10px] mt-0.5 uppercase tracking-widest" style={{ color: 'rgb(var(--text-muted))' }}>Pro</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-hidden" style={{ padding: collapsed ? '16px 8px' : '16px 12px' }}>
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
                title={collapsed ? item.name : undefined}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
                }
                style={collapsed ? { paddingLeft: 0, paddingRight: 0, justifyContent: 'center' } : undefined}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      className="text-sm overflow-hidden whitespace-nowrap"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.18, ease: easeOutQuart }}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* User */}
        <div className="flex-shrink-0" style={{ borderTop: '1px solid rgb(var(--border))', padding: collapsed ? '10px 8px' : '12px' }}>
          <div
            className="flex items-center rounded-xl overflow-hidden"
            style={{
              background: 'rgb(var(--surface-2))',
              padding: collapsed ? '8px' : '8px 8px 8px 8px',
              gap: collapsed ? 0 : 12,
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0"
              style={{ background: 'rgba(255,117,34,0.12)', color: '#FF7522' }}
            >
              {initials}
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  className="flex-1 min-w-0 overflow-hidden"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.18, ease: easeOutQuart }}
                >
                  <p className="text-xs font-medium truncate" style={{ color: 'rgb(var(--text-primary))' }}>
                    {user?.firstName || user?.email || 'Trader'}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: 'rgb(var(--text-muted))' }}>{user?.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleBackToApp}
                  title="Back to AlphaLabs"
                  className="p-1 rounded-lg transition-colors flex-shrink-0"
                  style={{ color: 'rgb(var(--text-muted))' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Collapse toggle */}
        <motion.button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute top-[52px] -right-3 w-6 h-6 rounded-full flex items-center justify-center z-50 flex-shrink-0"
          style={{
            background: 'rgb(var(--surface))',
            border: '1px solid rgb(var(--border))',
            color: 'rgb(var(--text-muted))',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.22, ease: easeOutQuart }}
          >
            <CaretLeft className="w-3 h-3" />
          </motion.div>
        </motion.button>
      </motion.aside>

      {/* ── Mobile Header ── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgb(var(--surface))', borderBottom: '1px solid rgb(var(--border))' }}
      >
        <div className="flex items-center gap-2">
          <img src="/alphalabs-icon.png" alt="AlphaLabs" className="w-7 h-7 flex-shrink-0" />
          <span className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>Alpha Journaling</span>
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
                  <img src="/alphalabs-icon.png" alt="AlphaLabs" className="w-7 h-7 flex-shrink-0" />
                  <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>Alpha Journaling</p>
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
              <div className="px-3 pb-4 flex-shrink-0" style={{ borderTop: '1px solid rgb(var(--border))' }}>
                <div className="flex items-center gap-3 px-3 py-2.5 mt-3 rounded-xl" style={{ background: 'rgb(var(--surface-2))' }}>
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
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    title="Sign out"
                    className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                    style={{ color: 'rgb(var(--text-muted))' }}
                  >
                    <SignOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <motion.div
        className="flex-1 pt-12 lg:pt-0 min-w-0"
        initial={false}
        animate={{ marginLeft: isDesktop ? sidebarW : 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.8 }}
      >
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
          <Outlet />
        </main>
      </motion.div>
    </div>
  );
}
