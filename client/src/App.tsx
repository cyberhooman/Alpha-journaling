import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
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

  return (
    <BrowserRouter>
      <Suspense
        fallback={(
          <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-slate-900">
            <div className="relative">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary-200"></div>
              <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-primary-600 absolute top-0"></div>
            </div>
          </div>
        )}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="trades" element={<Trades />} />
            <Route path="trades/new" element={<NewTrade />} />
            <Route path="trades/:id/edit" element={<EditTrade />} />
            <Route path="trades/:id" element={<TradeDetail />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="analytics-dashboard" element={<AnalyticsDashboard />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="strategies" element={<Strategies />} />
            <Route path="checklist" element={<TradingTodoList />} />
            <Route path="import" element={<Import />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
