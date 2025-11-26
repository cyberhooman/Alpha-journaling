import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, TrendingUp, TrendingDown, Trash2, BookOpen } from 'lucide-react';
import { tradesAPI } from '../lib/api';
import { formatToWIB } from '../lib/dateUtils';

export default function Trades() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const queryClient = useQueryClient();

  const { data: trades, isLoading, refetch } = useQuery({
    queryKey: ['trades', { status: statusFilter === 'ALL' ? undefined : statusFilter }],
    queryFn: () => tradesAPI.getAll({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tradesAPI.delete(id),
    onSuccess: async () => {
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const filteredTrades = trades?.data.filter((trade: any) =>
    trade.symbol.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header - Terminal Style */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600/20 via-green-500/10 to-transparent rounded-xl border border-terminal-border p-6 backdrop-blur-sm">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <BookOpen className="w-8 h-8 text-green-400 animate-pulse-glow" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-terminal-text tracking-tight">TRADES</h1>
              <p className="text-xs text-terminal-muted font-mono mt-1">TRADING ACTIVITY LOG</p>
            </div>
          </div>
          <Link to="/trades/new" className="btn btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center">
            <Plus className="w-5 h-5" />
            New Trade
          </Link>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl"></div>
      </div>

      {/* Filters - Terminal Style */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-terminal-muted" />
            <input
              type="text"
              placeholder="SEARCH SYMBOL..."
              className="input pl-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input w-full sm:w-56"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">ALL STATUS</option>
            <option value="OPEN">OPEN</option>
            <option value="CLOSED">CLOSED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Trades List - Terminal Style */}
      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-terminal-border"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500 absolute top-0"></div>
            </div>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-terminal-muted opacity-20" />
            <p className="text-terminal-muted text-sm font-mono uppercase tracking-wider mb-2">No Trades Found</p>
            <Link to="/trades/new" className="text-blue-400 hover:text-blue-300 mt-2 inline-block text-sm font-semibold">
              Create Your First Trade
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-800/50 border-b-2 border-blue-500/30">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-terminal-muted uppercase tracking-widest">Date</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-terminal-muted uppercase tracking-widest">Symbol</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-terminal-muted uppercase tracking-widest">Side</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-terminal-muted uppercase tracking-widest">Entry</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-terminal-muted uppercase tracking-widest">Exit</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-terminal-muted uppercase tracking-widest">Qty</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-terminal-muted uppercase tracking-widest">P&L</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-terminal-muted uppercase tracking-widest">%</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-terminal-muted uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-terminal-muted uppercase tracking-widest">Tags</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-terminal-muted uppercase tracking-widest">Process</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-terminal-muted uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-terminal-border">
                {filteredTrades.map((trade: any) => (
                  <tr key={trade.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono whitespace-nowrap text-terminal-muted">
                      {formatToWIB(trade.entry_date, 'MMM dd, yyyy')}
                    </td>
                    <td className="px-4 py-3 font-bold text-sm">
                      <Link
                        to={`/trades/${trade.id}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {trade.symbol}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                        trade.side === 'LONG' ? 'neon-glow-green' : 'neon-glow-red'
                      }`}>
                        {trade.side === 'LONG' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm mono-number text-terminal-text">
                      {trade.entry_price ? `$${Number(trade.entry_price).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm mono-number text-terminal-text">
                      {trade.exit_price ? `$${Number(trade.exit_price).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm mono-number text-terminal-text">
                      {trade.quantity ? Number(trade.quantity) : '-'}
                    </td>
                    <td className={`px-4 py-3 font-bold text-sm mono-number ${
                      (trade.pnl || 0) >= 0 ? 'neon-glow-green' : 'neon-glow-red'
                    }`}>
                      {trade.pnl ? `$${Number(trade.pnl).toFixed(2)}` : '-'}
                    </td>
                    <td className={`px-4 py-3 font-bold text-sm mono-number ${
                      (trade.pnl_percentage || 0) >= 0 ? 'neon-glow-green' : 'neon-glow-red'
                    }`}>
                      {trade.pnl_percentage ? `${Number(trade.pnl_percentage).toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-md whitespace-nowrap uppercase tracking-wide ${
                        trade.status === 'CLOSED' ? 'bg-gray-700/50 text-gray-300 border border-gray-600' :
                        trade.status === 'OPEN' ? 'bg-blue-900/30 text-blue-300 border border-blue-500/30' :
                        'bg-gray-800/50 text-gray-400 border border-gray-600'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {trade.tags && trade.tags.length > 0 ? (
                          trade.tags.map((tag: any) => (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 text-[10px] font-semibold rounded-md whitespace-nowrap border"
                              style={{
                                backgroundColor: `${tag.color}20`,
                                color: tag.color,
                                borderColor: `${tag.color}40`
                              }}
                            >
                              {tag.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-terminal-muted">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/trades/${trade.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-blue-300 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/30 hover:border-blue-500/50 rounded-md transition-all whitespace-nowrap uppercase tracking-wide"
                      >
                        View Chart
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this trade?')) {
                            deleteMutation.mutate(trade.id);
                          }
                        }}
                        className="inline-flex items-center p-2 text-red-400 hover:bg-red-900/30 hover:text-red-300 border border-transparent hover:border-red-500/30 rounded-md transition-all"
                        title="Delete trade"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
