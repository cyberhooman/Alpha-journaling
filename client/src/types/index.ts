export interface TradingAccount {
  id: number;
  user_id: number;
  name: string;
  account_type: 'LIVE' | 'DEMO' | 'PROP_FIRM' | 'FUNDED';
  broker?: string;
  initial_balance: number;
  current_balance: number;
  currency: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: number;
  account_id?: number;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entry_date: string;
  exit_date?: string;
  entry_price: number;
  exit_price?: number;
  quantity: number;
  stop_loss?: number;
  take_profit?: number;
  pnl?: number;
  pnl_percentage?: number;
  fees: number;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  strategy?: string;
  setup?: string;
  timeframe?: string;
  market_type?: 'STOCKS' | 'FOREX' | 'CRYPTO' | 'FUTURES' | 'OPTIONS';
  notes?: string;
  entry_reasoning?: string;
  exit_reasoning?: string;
  mistakes?: string;
  lessons_learned?: string;
  emotional_state?: string;
  confidence_level?: number;
  broker?: string;
  screenshot_url?: string;
  account_balance?: number;
  risk_amount?: number;
  risk_percentage?: number;
  reward_risk_ratio?: number;
  tags?: Tag[];
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface DashboardStats {
  overview: {
    totalTrades: number;
    closedTrades: number;
    openTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnl: number;
    avgPnl: number;
    bestTrade: number;
    worstTrade: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
  };
  pnlByDay: Array<{ date: string; pnl: number; trades: number }>;
  pnlBySymbol: Array<{ symbol: string; trades: number; total_pnl: number; avg_pnl: number; wins: number; losses: number }>;
  pnlByStrategy: Array<{ strategy: string; trades: number; total_pnl: number; avg_pnl: number; wins: number }>;
  pnlBySetup: Array<{ setup: string; trades: number; total_pnl: number; avg_pnl: number; wins: number }>;
  winRateByDay: Array<{ day_of_week: number; trades: number; wins: number; total_pnl: number }>;
}
