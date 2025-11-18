import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Trades from './pages/Trades';
import TradeDetail from './pages/TradeDetail';
import NewTrade from './pages/NewTrade';
import EditTrade from './pages/EditTrade';
import Analytics from './pages/Analytics';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import Calendar from './pages/Calendar';
import Import from './pages/Import';
import Settings from './pages/Settings';
import Strategies from './pages/Strategies';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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
          <Route path="import" element={<Import />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
