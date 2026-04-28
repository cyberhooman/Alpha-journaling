import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  MagnifyingGlass,
  TrendUp,
  TrendDown,
  Trash,
  DownloadSimple,
  Funnel,
  Spinner,
} from '@phosphor-icons/react';
import { tradesAPI, accountsAPI } from '../lib/api';
import { formatToWIB } from '../lib/dateUtils';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: [0.32, 0.72, 0, 1] },
  }),
};

export default function Trades() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [accountFilter, setAccountFilter] = useState('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const queryClient = useQueryClient();

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await accountsAPI.getAll();
      return response.data;
    },
  });

  const { data: trades, isLoading } = useQuery({
    queryKey: ['trades', { status: statusFilter === 'ALL' ? undefined : statusFilter, accountId: accountFilter === 'ALL' ? undefined : accountFilter, symbol: search || undefined }],
    queryFn: () => tradesAPI.getAll({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      accountId: accountFilter === 'ALL' ? undefined : accountFilter,
      symbol: search || undefined,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tradesAPI.delete(id),
    onMutate: async (deletedTradeId: number) => {
      await queryClient.cancelQueries({ queryKey: ['trades'] });

      const previousTrades = queryClient.getQueriesData({ queryKey: ['trades'] });

      queryClient.setQueriesData({ queryKey: ['trades'] }, (oldData: any) => {
        if (!oldData?.data || !Array.isArray(oldData.data)) {
          return oldData;
        }

        return {
          ...oldData,
          data: oldData.data.filter((trade: any) => trade.id !== deletedTradeId),
        };
      });

      return { previousTrades };
    },
    onError: (_error, _deletedTradeId, context) => {
      if (!context?.previousTrades) return;

      for (const [queryKey, data] of context.previousTrades) {
        queryClient.setQueryData(queryKey, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['recent-trades'] });
    },
  });

  const filteredTrades = trades?.data || [];

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('token');
      const accountParam = accountFilter !== 'ALL' ? `?accountId=${accountFilter}` : '';
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')}/trades/export/csv${accountParam}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
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
    } catch {
      alert('Failed to export trades. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest font-medium mb-1" style={{ color: 'rgb(var(--text-muted))' }}>Journal</p>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>Trades</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} disabled={isExporting} className="btn btn-secondary disabled:opacity-40">
              {isExporting
                ? <Spinner className="w-4 h-4 animate-spin" />
                : <DownloadSimple className="w-4 h-4" />}
              <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>
            <Link to="/trades/new" className="btn btn-primary">
              <Plus className="w-4 h-4" weight="bold" />
              New Trade
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Filter bar */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
        className="rounded-2xl p-4 flex flex-col sm:flex-row gap-3"
        style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
        <div className="flex-1 relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgb(var(--text-muted))' }} />
          <input
            type="text"
            placeholder="Search symbol..."
            className="input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <Funnel className="w-4 h-4 flex-shrink-0" style={{ color: 'rgb(var(--text-muted))' }} />
          <select className="input w-40" value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
            <option value="ALL">All Accounts</option>
            {accounts?.data?.map((account: any) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
          <select className="input w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="chart-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="w-6 h-6 animate-spin" style={{ color: '#FF7522' }} />
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgb(var(--surface-2))', border: '1px solid #252525' }}>
              <TrendUp className="w-6 h-6" style={{ color: 'rgb(var(--border))' }} />
            </div>
            <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>No trades found</p>
            <Link to="/trades/new" className="btn btn-primary text-xs px-4 py-2">Add your first trade</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Account</th>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>Qty</th>
                  <th>P&L</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Tags</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade: any, i: number) => {
                  const tradeAccount = accounts?.data?.find((acc: any) => acc.id === trade.account_id);
                  const entryDate = trade.entry_date ? new Date(trade.entry_date) : null;
                  const exitDate = trade.exit_date ? new Date(trade.exit_date) : new Date();
                  const diffDays = entryDate
                    ? Math.ceil(Math.abs(exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <motion.tr key={trade.id} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                      <td className="text-xs font-mono-nums" style={{ color: 'rgb(var(--text-secondary))' }}>
                        {formatToWIB(trade.entry_date, 'MMM dd, yy')}
                      </td>
                      <td>
                        <span className="badge badge-neutral text-[10px]">
                          {tradeAccount?.name || 'Unknown'}
                        </span>
                      </td>
                      <td>
                        <Link to={`/trades/${trade.id}`}
                          className="font-semibold text-sm hover:opacity-70 transition-opacity"
                          style={{ color: '#FF7522' }}>
                          {trade.symbol}
                        </Link>
                      </td>
                      <td>
                        <span className="flex items-center gap-1.5 text-xs font-medium w-fit"
                          style={{ color: trade.side === 'LONG' ? '#34d399' : '#f87171' }}>
                          {trade.side === 'LONG'
                            ? <TrendUp weight="bold" className="w-3 h-3" />
                            : <TrendDown weight="bold" className="w-3 h-3" />}
                          {trade.side}
                        </span>
                      </td>
                      <td className="font-mono-nums text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
                        {trade.entry_price ? `$${Number(trade.entry_price).toFixed(2)}` : '—'}
                      </td>
                      <td className="font-mono-nums text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
                        {trade.exit_price ? `$${Number(trade.exit_price).toFixed(2)}` : '—'}
                      </td>
                      <td className="font-mono-nums text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
                        {trade.quantity ? Number(trade.quantity) : '—'}
                      </td>
                      <td className="font-mono-nums font-semibold"
                        style={{ color: (trade.pnl || 0) >= 0 ? '#34d399' : '#f87171' }}>
                        {trade.pnl ? `$${Number(trade.pnl).toFixed(2)}` : '—'}
                      </td>
                      <td className="font-mono-nums text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
                        {diffDays ?? '—'}
                      </td>
                      <td>
                        <span className={`badge ${trade.status === 'OPEN' ? 'badge-orange' : 'badge-neutral'}`}>
                          {trade.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {trade.tags?.length > 0
                            ? trade.tags.map((tag: any) => (
                              <span key={tag.id} className="px-2 py-0.5 rounded-md text-[10px] font-medium"
                                style={{ background: `${tag.color}18`, color: tag.color }}>
                                {tag.name}
                              </span>
                            ))
                            : <span style={{ color: 'rgb(var(--border))' }}>—</span>
                          }
                        </div>
                      </td>
                      <td>
                        <Link to={`/trades/${trade.id}`}
                          className="text-xs font-medium transition-opacity hover:opacity-70"
                          style={{ color: '#FF7522' }}>
                          View
                        </Link>
                      </td>
                      <td>
                        <button
                          onClick={() => { if (confirm('Delete this trade?')) deleteMutation.mutate(trade.id); }}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                          style={{ color: 'rgb(var(--text-muted))' }}
                          title="Delete trade">
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
