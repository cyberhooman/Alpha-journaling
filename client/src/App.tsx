import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import Layout from './components/Layout';
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Trades = lazy(() => import('./pages/Trades'));
const TradeDetail = lazy(() => import('./pages/TradeDetail'));
const NewTrade = lazy(() => import('./pages/NewTrade'));
const EditTrade = lazy(() => import('./pages/EditTrade'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AnalyticsDashboard = lazy(() =>
  import('./pages/AnalyticsDashboard').then((module) => ({ default: module.AnalyticsDashboard }))
);
const Calendar = lazy(() => import('./pages/Calendar'));
const Import = lazy(() => import('./pages/Import'));
const Settings = lazy(() => import('./pages/Settings'));
const Strategies = lazy(() => import('./pages/Strategies'));
const TradingTodoList = lazy(() => import('./pages/TradingTodoList'));

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  if (!user || !token) {
    window.location.href = 'https://app.alphalabs.live';
    return null;
  }
  return <>{children}</>;
}

function App() {
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    // Apply dark mode on mount
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const pageFallback = (
    <div className="flex items-center justify-center h-64">
      <div className="relative">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200"></div>
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-primary-600 absolute top-0"></div>
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — wrapped in their own Suspense */}
        <Route path="/login" element={<Suspense fallback={pageFallback}><Login /></Suspense>} />
        <Route path="/register" element={<Suspense fallback={pageFallback}><Register /></Suspense>} />
        <Route path="/auth/callback" element={<Suspense fallback={pageFallback}><AuthCallback /></Suspense>} />

        {/* Private routes — Layout always renders, only Outlet is suspended */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Suspense fallback={pageFallback}><Dashboard /></Suspense>} />
          <Route path="trades" element={<Suspense fallback={pageFallback}><Trades /></Suspense>} />
          <Route path="trades/new" element={<Suspense fallback={pageFallback}><NewTrade /></Suspense>} />
          <Route path="trades/:id/edit" element={<Suspense fallback={pageFallback}><EditTrade /></Suspense>} />
          <Route path="trades/:id" element={<Suspense fallback={pageFallback}><TradeDetail /></Suspense>} />
          <Route path="analytics" element={<Suspense fallback={pageFallback}><Analytics /></Suspense>} />
          <Route path="analytics-dashboard" element={<Suspense fallback={pageFallback}><AnalyticsDashboard /></Suspense>} />
          <Route path="calendar" element={<Suspense fallback={pageFallback}><Calendar /></Suspense>} />
          <Route path="strategies" element={<Suspense fallback={pageFallback}><Strategies /></Suspense>} />
          <Route path="checklist" element={<Suspense fallback={pageFallback}><TradingTodoList /></Suspense>} />
          <Route path="import" element={<Suspense fallback={pageFallback}><Import /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={pageFallback}><Settings /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
