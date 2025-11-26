import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
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
    onSuccess: async () => {
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const filteredTrades = trades?.data.filter((trade: any) =>
    trade.symbol.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Trades</h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">Manage and review all your trades</p>
        </div>
        <Link to="/trades/new" className="btn btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          New Trade
        </Link>
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
            <p className="text-slate-600 text-sm sm:text-base">No trades found</p>
            <Link to="/trades/new" className="text-primary-600 hover:text-primary-700 mt-2 inline-block text-sm sm:text-base">
              Create your first trade
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600">Date</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600">Symbol</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600">Side</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600">Entry</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600">Exit</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600">Qty</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600">P&L</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600">%</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600">Status</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600">Tags</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600">Process</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTrades.map((trade: any) => (
                  <tr key={trade.id} className="hover:bg-slate-50">
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">
                      {formatToWIB(trade.entry_date, 'MMM dd, yyyy')}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-sm sm:text-base">
                      <Link
                        to={`/trades/${trade.id}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {trade.symbol}
                      </Link>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <span className={`inline-flex items-center gap-1 text-xs sm:text-sm font-medium ${
                        trade.side === 'LONG' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trade.side === 'LONG' ? (
                          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                      {trade.entry_price ? `$${Number(trade.entry_price).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                      {trade.exit_price ? `$${Number(trade.exit_price).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                      {trade.quantity ? Number(trade.quantity) : '-'}
                    </td>
                    <td className={`px-2 sm:px-4 py-2 sm:py-3 font-semibold text-xs sm:text-sm ${
                      (trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trade.pnl ? `$${Number(trade.pnl).toFixed(2)}` : '-'}
                    </td>
                    <td className={`px-2 sm:px-4 py-2 sm:py-3 font-semibold text-xs sm:text-sm ${
                      (trade.pnl_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trade.pnl_percentage ? `${Number(trade.pnl_percentage).toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                        trade.status === 'CLOSED' ? 'bg-slate-100 text-slate-700' :
                        trade.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
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
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <Link
                        to={`/trades/${trade.id}`}
                        className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors whitespace-nowrap"
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
