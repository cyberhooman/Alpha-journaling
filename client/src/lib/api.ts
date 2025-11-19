import axios from 'axios';
import {
  mockTrades,
  mockPerformance,
  mockCalendarData,
  mockTags,
} from './mockData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_MOCK_DATA = false; // Demo mode - set to false to use real API

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API functions
export const authAPI = {
  register: (data: { email: string; password: string; firstName?: string; lastName?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
};

// Mock API responses for demo mode
const mockResponse = (data: any) => Promise.resolve({ data });

export const tradesAPI = {
  getAll: (params?: any) => USE_MOCK_DATA ? mockResponse(mockTrades) : api.get('/trades', { params }),
  getOne: (id: number) => USE_MOCK_DATA ? mockResponse(mockTrades.find(t => t.id === id)) : api.get(`/trades/${id}`),
  create: (data: any) => {
    if (USE_MOCK_DATA) {
      const newTrade = {
        ...data,
        screenshot_url: data.screenshotUrl || null,
        id: mockTrades.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      delete (newTrade as any).screenshotUrl;
      mockTrades.push(newTrade);
      return mockResponse(newTrade);
    }
    return api.post('/trades', data);
  },
  update: (id: number, data: any) => {
    if (USE_MOCK_DATA) {
      const index = mockTrades.findIndex(t => t.id === id);
      if (index !== -1) {
        mockTrades[index] = { ...mockTrades[index], ...data };
        if (data.screenshotUrl !== undefined) {
          mockTrades[index].screenshot_url = data.screenshotUrl;
          delete (mockTrades[index] as any).screenshotUrl;
        }
        return mockResponse(mockTrades[index]);
      }
      return mockResponse(null);
    }
    return api.put(`/trades/${id}`, data);
  },
  delete: (id: number) => {
    if (USE_MOCK_DATA) {
      const index = mockTrades.findIndex(t => t.id === id);
      if (index !== -1) {
        mockTrades.splice(index, 1);
      }
      return mockResponse({ message: 'Trade deleted successfully' });
    }
    return api.delete(`/trades/${id}`);
  },
};

// Calculate dashboard stats dynamically from current trades
const calculateDashboardStats = () => {
  const totalTrades = mockTrades.length;
  const closedTrades = mockTrades.filter(t => t.status === 'CLOSED' && t.pnl !== null);
  const openTrades = mockTrades.filter(t => t.status === 'OPEN');

  if (totalTrades === 0) {
    return {
      overview: {
        totalTrades: 0,
        closedTrades: 0,
        openTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalPnl: 0,
        avgPnl: 0,
        bestTrade: 0,
        worstTrade: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
      },
      pnlByDay: [],
      pnlBySymbol: [],
      pnlByStrategy: [],
      pnlBySetup: [],
      winRateByDay: [],
    };
  }

  const totalPnl = closedTrades.reduce((sum, trade) => sum + (Number(trade.pnl) || 0), 0);

  const winningTrades = closedTrades.filter(t => Number(t.pnl) > 0);
  const losingTrades = closedTrades.filter(t => Number(t.pnl) < 0);

  const totalWins = winningTrades.reduce((sum, trade) => sum + Number(trade.pnl), 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + Number(trade.pnl), 0));

  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;

  const avgPnl = closedTrades.length > 0 ? totalPnl / closedTrades.length : 0;
  const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;

  const sortedByPnl = [...closedTrades].sort((a, b) => Number(b.pnl) - Number(a.pnl));
  const bestTrade = sortedByPnl[0] ? Number(sortedByPnl[0].pnl) : 0;
  const worstTrade = sortedByPnl[sortedByPnl.length - 1] ? Number(sortedByPnl[sortedByPnl.length - 1].pnl) : 0;

  // Calculate P&L by day
  const pnlByDayMap = new Map();
  closedTrades.forEach(trade => {
    const date = trade.entry_date.split('T')[0];
    const existing = pnlByDayMap.get(date) || { pnl: 0, trades: 0 };
    pnlByDayMap.set(date, {
      pnl: existing.pnl + Number(trade.pnl),
      trades: existing.trades + 1,
    });
  });
  const pnlByDay = Array.from(pnlByDayMap.entries()).map(([date, data]) => ({
    date,
    pnl: data.pnl,
    trades: data.trades,
  }));

  // Calculate P&L by symbol
  const pnlBySymbolMap = new Map();
  mockTrades.forEach(trade => {
    const existing = pnlBySymbolMap.get(trade.symbol) || { total_pnl: 0, trades: 0, wins: 0, losses: 0 };
    const pnl = Number(trade.pnl) || 0;
    pnlBySymbolMap.set(trade.symbol, {
      total_pnl: existing.total_pnl + pnl,
      trades: existing.trades + 1,
      wins: existing.wins + (pnl > 0 ? 1 : 0),
      losses: existing.losses + (pnl < 0 ? 1 : 0),
    });
  });
  const pnlBySymbol = Array.from(pnlBySymbolMap.entries())
    .map(([symbol, data]) => ({
      symbol,
      trades: data.trades,
      total_pnl: data.total_pnl,
      avg_pnl: data.trades > 0 ? data.total_pnl / data.trades : 0,
      wins: data.wins,
      losses: data.losses,
    }))
    .sort((a, b) => b.total_pnl - a.total_pnl);

  // Calculate P&L by strategy
  const pnlByStrategyMap = new Map();
  closedTrades.forEach(trade => {
    if (trade.strategy) {
      const existing = pnlByStrategyMap.get(trade.strategy) || { total_pnl: 0, trades: 0, wins: 0 };
      const pnl = Number(trade.pnl) || 0;
      pnlByStrategyMap.set(trade.strategy, {
        total_pnl: existing.total_pnl + pnl,
        trades: existing.trades + 1,
        wins: existing.wins + (pnl > 0 ? 1 : 0),
      });
    }
  });
  const pnlByStrategy = Array.from(pnlByStrategyMap.entries()).map(([strategy, data]) => ({
    strategy,
    trades: data.trades,
    total_pnl: data.total_pnl,
    avg_pnl: data.trades > 0 ? data.total_pnl / data.trades : 0,
    wins: data.wins,
  }));

  // Calculate P&L by setup
  const pnlBySetupMap = new Map();
  closedTrades.forEach(trade => {
    if (trade.setup) {
      const existing = pnlBySetupMap.get(trade.setup) || { total_pnl: 0, trades: 0, wins: 0 };
      const pnl = Number(trade.pnl) || 0;
      pnlBySetupMap.set(trade.setup, {
        total_pnl: existing.total_pnl + pnl,
        trades: existing.trades + 1,
        wins: existing.wins + (pnl > 0 ? 1 : 0),
      });
    }
  });
  const pnlBySetup = Array.from(pnlBySetupMap.entries()).map(([setup, data]) => ({
    setup,
    trades: data.trades,
    total_pnl: data.total_pnl,
    avg_pnl: data.trades > 0 ? data.total_pnl / data.trades : 0,
    wins: data.wins,
  }));

  // Calculate win rate by day of week
  const winRateByDay = Array.from({ length: 7 }, (_, day) => {
    const dayTrades = closedTrades.filter(trade => new Date(trade.entry_date).getDay() === day);
    const dayWins = dayTrades.filter(trade => Number(trade.pnl) > 0);
    const dayPnl = dayTrades.reduce((sum, trade) => sum + Number(trade.pnl), 0);
    return {
      day_of_week: day,
      trades: dayTrades.length,
      wins: dayWins.length,
      total_pnl: dayPnl,
    };
  });

  return {
    overview: {
      totalTrades,
      closedTrades: closedTrades.length,
      openTrades: openTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      totalPnl,
      avgPnl,
      bestTrade,
      worstTrade,
      avgWin,
      avgLoss,
      profitFactor,
    },
    pnlByDay,
    pnlBySymbol,
    pnlByStrategy,
    pnlBySetup,
    winRateByDay,
  };
};

export const analyticsAPI = {
  getDashboard: (params?: any) => USE_MOCK_DATA ? mockResponse(calculateDashboardStats()) : api.get('/analytics/dashboard', { params }),
  getCalendar: (params?: any) => USE_MOCK_DATA ? mockResponse(mockCalendarData) : api.get('/analytics/calendar', { params }),
  getPerformance: () => USE_MOCK_DATA ? mockResponse(mockPerformance) : api.get('/analytics/performance'),
};

export const tagsAPI = {
  getAll: () => USE_MOCK_DATA ? mockResponse(mockTags) : api.get('/tags'),
  create: (data: { name: string; color: string }) => {
    if (USE_MOCK_DATA) {
      const newTag = { ...data, id: mockTags.length + 1 };
      mockTags.push(newTag);
      return mockResponse(newTag);
    }
    return api.post('/tags', data);
  },
  update: (id: number, data: any) => USE_MOCK_DATA ? mockResponse({ id, ...data }) : api.put(`/tags/${id}`, data),
  delete: (id: number) => USE_MOCK_DATA ? mockResponse({ message: 'Tag deleted successfully' }) : api.delete(`/tags/${id}`),
};

export const importAPI = {
  uploadCSV: (csvData: string) => api.post('/import/csv', { csvData }),
  getTemplate: () => api.get('/import/csv/template'),
};

export const accountsAPI = {
  getAll: () => api.get('/accounts'),
  getOne: (id: number) => api.get(`/accounts/${id}`),
  create: (data: {
    name: string;
    account_type: 'LIVE' | 'DEMO' | 'PROP_FIRM' | 'FUNDED';
    broker?: string;
    initial_balance: number;
    currency?: string;
    notes?: string;
  }) => api.post('/accounts', data),
  update: (id: number, data: any) => api.put(`/accounts/${id}`, data),
  delete: (id: number) => api.delete(`/accounts/${id}`),
  getStats: (id: number) => api.get(`/accounts/${id}/stats`),
};

export const strategiesAPI = {
  getAll: () => api.get('/strategies'),
  getOne: (id: number) => api.get(`/strategies/${id}`),
  create: (data: {
    name: string;
    description?: string;
    category?: 'PRICE_ACTION' | 'TECHNICAL' | 'FUNDAMENTAL' | 'SENTIMENT' | 'PATTERN' | 'INDICATOR' | 'CUSTOM';
    entry_rules?: string;
    exit_rules?: string;
    risk_management?: string;
    timeframes?: string;
    markets?: string;
    notes?: string;
    is_active?: boolean;
  }) => api.post('/strategies', data),
  update: (id: number, data: any) => api.put(`/strategies/${id}`, data),
  delete: (id: number) => api.delete(`/strategies/${id}`),
  getStats: (id: number) => api.get(`/strategies/${id}/stats`),
};
