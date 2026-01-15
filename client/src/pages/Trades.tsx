import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, TrendingUp, TrendingDown, Trash2, Download } from 'lucide-react';
import { tradesAPI, accountsAPI } from '../lib/api';
import { formatToWIB } from '../lib/dateUtils';

export default function Trades() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [accountFilter, setAccountFilter] = useState('ALL');
  const queryClient = useQueryClient();

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await accountsAPI.getAll();
      return response.data;
    },
  });

  const { data: trades, isLoading, refetch } = useQuery({
    queryKey: ['trades', { status: statusFilter === 'ALL' ? undefined : statusFilter, accountId: accountFilter === 'ALL' ? undefined : accountFilter }],
    queryFn: () => tradesAPI.getAll({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      accountId: accountFilter === 'ALL' ? undefined : accountFilter,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tradesAPI.delete(id),
    onSuccess: () => {
      // Invalidate queries instead of awaiting refetch for instant UI response
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['recent-trades'] });
    },
  });

  const filteredTrades = trades?.data.filter((trade: any) =>
    trade.symbol.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const accountParam = accountFilter !== 'ALL' ? `?accountId=${accountFilter}` : '';
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')}/trades/export/csv${accountParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trades_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export trades. Please try again.');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Trades</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm sm:text-base">Manage and review all your trades</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary inline-flex items-center gap-2 flex-1 sm:flex-initial justify-center"
            title="Export trades to CSV"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <Link to="/trades/new" className="btn btn-primary inline-flex items-center gap-2 flex-1 sm:flex-initial justify-center">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            New Trade
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by symbol..."
              className="input pl-9 sm:pl-10 text-sm sm:text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input w-full sm:w-48 text-sm sm:text-base"
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
          >
            <option value="ALL">All Accounts</option>
            {accounts?.data?.map((account: any) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>

          <select
            className="input w-full sm:w-48 text-sm sm:text-base"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Trades List */}
      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">No trades found</p>
            <Link to="/trades/new" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mt-2 inline-block text-sm sm:text-base">
              Create your first trade
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-200">Date</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-200">Account</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-200">Symbol</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-200">Side</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-200">Entry</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-200">Exit</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-200">Qty</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-200">P&L</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-200">Days</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-200">Status</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-200">Tags</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-200">Process</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredTrades.map((trade: any) => {
                  const tradeAccount = accounts?.data?.find((acc: any) => acc.id === trade.account_id);
                  return (
                  <tr key={trade.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap dark:text-slate-300">
                      {formatToWIB(trade.entry_date, 'MMM dd, yyyy')}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                      <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium whitespace-nowrap">
                        {tradeAccount?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-sm sm:text-base">
                      <Link
                        to={`/trades/${trade.id}`}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        {trade.symbol}
                      </Link>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <span className={`inline-flex items-center gap-1 text-xs sm:text-sm font-medium ${
                        trade.side === 'LONG' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {trade.side === 'LONG' ? (
                          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm dark:text-slate-300">
                      {trade.entry_price ? `$${Number(trade.entry_price).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm dark:text-slate-300">
                      {trade.exit_price ? `$${Number(trade.exit_price).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm dark:text-slate-300">
                      {trade.quantity ? Number(trade.quantity) : '-'}
                    </td>
                    <td className={`px-2 sm:px-4 py-2 sm:py-3 font-semibold text-xs sm:text-sm ${
                      (trade.pnl || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {trade.pnl ? `$${Number(trade.pnl).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm dark:text-slate-300">
                      {(() => {
                        if (!trade.entry_date) return '-';
                        const entryDate = new Date(trade.entry_date);
                        const exitDate = trade.exit_date ? new Date(trade.exit_date) : new Date();
                        const diffTime = Math.abs(exitDate.getTime() - entryDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays;
                      })()}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                        trade.status === 'CLOSED' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200' :
                        trade.status === 'OPEN' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <div className="flex flex-wrap gap-1">
                        {trade.tags && trade.tags.length > 0 ? (
                          trade.tags.map((tag: any) => (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 text-xs rounded-full whitespace-nowrap"
                              style={{
                                backgroundColor: `${tag.color}20`,
                                color: tag.color
                              }}
                            >
                              {tag.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <Link
                        to={`/trades/${trade.id}`}
                        className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/40 hover:bg-primary-100 dark:hover:bg-primary-800/50 rounded-lg transition-colors whitespace-nowrap"
                      >
                        View Chart
                      </Link>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this trade?')) {
                            deleteMutation.mutate(trade.id);
                          }
                        }}
                        className="inline-flex items-center p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete trade"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
