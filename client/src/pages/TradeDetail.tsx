import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { tradesAPI } from '../lib/api';
import { formatToWIB, TIMEZONE_LABEL } from '../lib/dateUtils';
import TradingViewChart from '../components/TradingViewChart';

export default function TradeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: trade, isLoading } = useQuery({
    queryKey: ['trade', id],
    queryFn: () => tradesAPI.getOne(Number(id)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => tradesAPI.delete(Number(id)),
    onSuccess: () => {
      // Invalidate queries (marks them stale) instead of awaiting refetch
      // They will refresh when the user navigates to those pages
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/trades');
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }

  const tradeData = trade?.data;

  if (!tradeData) {
    return <div className="flex items-center justify-center h-96">
      <p className="text-slate-500">Trade not found</p>
    </div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{tradeData.symbol}</h1>
            <p className="text-slate-600 mt-1">
              {formatToWIB(tradeData.entry_date, 'MMMM dd, yyyy HH:mm')} {TIMEZONE_LABEL}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/trades/${id}/edit`)}
            className="btn btn-secondary inline-flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this trade?')) {
                deleteMutation.mutate();
              }
            }}
            className="btn btn-danger inline-flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* P&L Summary */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-slate-600 mb-1">P&L</p>
            <p className={`text-3xl font-bold ${(tradeData.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {tradeData.pnl ? `$${Number(tradeData.pnl).toFixed(2)}` : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">MFE</p>
            <p className={`text-3xl font-bold ${(tradeData.mfe || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {tradeData.mfe ? `$${Number(tradeData.mfe).toFixed(2)}` : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Status</p>
            <span className={`inline-block px-3 py-1 text-sm rounded-full mt-1 ${
              tradeData.status === 'CLOSED' ? 'bg-slate-100 text-slate-700' :
              tradeData.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {tradeData.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Side</p>
            <span className={`inline-flex items-center gap-1 text-lg font-bold mt-1 ${
              tradeData.side === 'LONG' ? 'text-green-600' : 'text-red-600'
            }`}>
              {tradeData.side === 'LONG' ? <TrendingUp /> : <TrendingDown />}
              {tradeData.side}
            </span>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      {tradeData.entry_price && (
        <TradingViewChart
          symbol={tradeData.symbol}
          entryPrice={Number(tradeData.entry_price)}
          exitPrice={tradeData.exit_price ? Number(tradeData.exit_price) : undefined}
          entryDate={tradeData.entry_date}
          exitDate={tradeData.exit_date || undefined}
          side={tradeData.side}
          stopLoss={tradeData.stop_loss ? Number(tradeData.stop_loss) : undefined}
          takeProfit={tradeData.take_profit ? Number(tradeData.take_profit) : undefined}
        />
      )}

      {(() => {
        const screenshot =
          (tradeData as any).screenshot_url || (tradeData as any).screenshotUrl;
        if (!screenshot) {
          return null;
        }
        return (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Trade Screenshot</h3>
              <a
                href={screenshot}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Open in new tab
              </a>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <img
                src={screenshot}
                alt={`Screenshot for ${tradeData.symbol}`}
                className="w-full object-contain max-h-[540px] bg-slate-100"
              />
            </div>
          </div>
        );
      })()}

      {/* Trade Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Entry Details</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-slate-600">Entry Price</dt>
              <dd className="font-semibold">
                {tradeData.entry_price ? `$${Number(tradeData.entry_price).toFixed(2)}` : '-'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Entry Date</dt>
              <dd className="font-semibold">
                {formatToWIB(tradeData.entry_date, 'MMM dd, yyyy HH:mm')} {TIMEZONE_LABEL}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Quantity</dt>
              <dd className="font-semibold">
                {tradeData.quantity ? Number(tradeData.quantity) : '-'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Stop Loss</dt>
              <dd className="font-semibold">
                {tradeData.stop_loss ? `$${Number(tradeData.stop_loss).toFixed(2)}` : '-'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Take Profit</dt>
              <dd className="font-semibold">
                {tradeData.take_profit ? `$${Number(tradeData.take_profit).toFixed(2)}` : '-'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Reward:Risk</dt>
              <dd className="font-semibold">
                {tradeData.reward_risk_ratio ? Number(tradeData.reward_risk_ratio).toFixed(2) : '-'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Exit Details</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-slate-600">Exit Price</dt>
              <dd className="font-semibold">
                {tradeData.exit_price ? `$${Number(tradeData.exit_price).toFixed(2)}` : '-'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Exit Date</dt>
              <dd className="font-semibold">
                {tradeData.exit_date ? `${formatToWIB(tradeData.exit_date, 'MMM dd, yyyy HH:mm')} ${TIMEZONE_LABEL}` : '-'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Fees</dt>
              <dd className="font-semibold">${Number(tradeData.fees).toFixed(2)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Strategy Info */}
      {(tradeData.strategy || tradeData.setup || tradeData.timeframe) && (
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Strategy & Setup</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tradeData.strategy && (
              <div>
                <p className="text-sm text-slate-600">Strategy</p>
                <p className="font-semibold mt-1">{tradeData.strategy}</p>
              </div>
            )}
            {tradeData.setup && (
              <div>
                <p className="text-sm text-slate-600">Setup</p>
                <p className="font-semibold mt-1">{tradeData.setup}</p>
              </div>
            )}
            {tradeData.timeframe && (
              <div>
                <p className="text-sm text-slate-600">Timeframe</p>
                <p className="font-semibold mt-1">{tradeData.timeframe}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {(tradeData.entry_reasoning || tradeData.exit_reasoning || tradeData.notes) && (
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Notes & Analysis</h3>
          <div className="space-y-4">
            {tradeData.entry_reasoning && (
              <div>
                <h4 className="font-medium text-slate-900 mb-2">Entry Reasoning</h4>
                <p className="text-slate-700 whitespace-pre-wrap">{tradeData.entry_reasoning}</p>
              </div>
            )}
            {tradeData.exit_reasoning && (
              <div>
                <h4 className="font-medium text-slate-900 mb-2">Exit Reasoning</h4>
                <p className="text-slate-700 whitespace-pre-wrap">{tradeData.exit_reasoning}</p>
              </div>
            )}
            {tradeData.notes && (
              <div>
                <h4 className="font-medium text-slate-900 mb-2">General Notes</h4>
                <p className="text-slate-700 whitespace-pre-wrap">{tradeData.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
