import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  PencilSimple,
  Trash,
  TrendUp,
  TrendDown,
  ArrowSquareOut,
  ChartLine,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { tradesAPI } from '../lib/api';
import { formatToWIB, TIMEZONE_LABEL } from '../lib/dateUtils';
import TradingViewChart from '../components/TradingViewChart';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' },
  }),
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#282828] last:border-0">
      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span className="text-sm font-medium font-mono-nums" style={{ color: 'var(--color-text-primary)' }}>
        {value ?? <span style={{ color: 'var(--color-text-secondary)' }}>—</span>}
      </span>
    </div>
  );
}

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
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/trades');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  const tradeData = trade?.data;

  if (!tradeData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p style={{ color: 'var(--color-text-secondary)' }}>Trade not found</p>
      </div>
    );
  }

  const pnl = tradeData.pnl ? Number(tradeData.pnl) : null;
  const mfe = tradeData.mfe ? Number(tradeData.mfe) : null;
  const mae = tradeData.mae ? Number(tradeData.mae) : null;
  const isLong = tradeData.side === 'LONG';
  const screenshot = (tradeData as any).screenshot_url || (tradeData as any).screenshotUrl;

  const statusBadge: Record<string, string> = {
    OPEN: 'badge badge-orange',
    CLOSED: 'badge badge-neutral',
    CANCELLED: 'badge badge-neutral',
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-start justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg transition-colors flex-shrink-0"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          >
            <ArrowLeft weight="bold" size={18} />
          </button>
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-0.5"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Trade Detail
            </p>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              {tradeData.symbol}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {formatToWIB(tradeData.entry_date, 'MMMM dd, yyyy HH:mm')} {TIMEZONE_LABEL}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0 mt-1">
          <button
            onClick={() => navigate(`/trades/${id}/edit`)}
            className="btn btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <PencilSimple size={15} weight="bold" />
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this trade?')) {
                deleteMutation.mutate();
              }
            }}
            className="btn btn-danger inline-flex items-center gap-2 text-sm"
          >
            <Trash size={15} weight="bold" />
            Delete
          </button>
        </div>
      </motion.div>

      {/* P&L Summary bar */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl p-5 grid grid-cols-2 md:grid-cols-5 gap-4"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* P&L */}
        <div className="md:col-span-1">
          <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>P&L</p>
          <p
            className="text-2xl font-bold font-mono-nums"
            style={{ color: pnl === null ? 'var(--color-text-secondary)' : pnl >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}
          >
            {pnl !== null ? `$${pnl.toFixed(2)}` : '—'}
          </p>
        </div>

        {/* MFE */}
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>MFE</p>
          <p
            className="text-2xl font-bold font-mono-nums"
            style={{ color: mfe === null ? 'var(--color-text-secondary)' : mfe >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}
          >
            {mfe !== null ? `$${mfe.toFixed(2)}` : '—'}
          </p>
        </div>

        {/* MAE */}
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>MAE</p>
          <p
            className="text-2xl font-bold font-mono-nums"
            style={{ color: mae === null ? 'var(--color-text-secondary)' : mae >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}
          >
            {mae !== null ? `$${mae.toFixed(2)}` : '—'}
          </p>
        </div>

        {/* Side */}
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Side</p>
          <span
            className="inline-flex items-center gap-1.5 text-base font-bold font-mono-nums mt-0.5"
            style={{ color: isLong ? 'var(--color-green)' : 'var(--color-red)' }}
          >
            {isLong ? <TrendUp weight="bold" size={18} /> : <TrendDown weight="bold" size={18} />}
            {tradeData.side}
          </span>
        </div>

        {/* Status */}
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>Status</p>
          <span className={statusBadge[tradeData.status] ?? 'badge badge-neutral'}>
            {tradeData.status}
          </span>
        </div>
      </motion.div>

      {/* Chart */}
      {tradeData.entry_price && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
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
        </motion.div>
      )}

      {/* Screenshot */}
      {screenshot && (
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2">
              <ChartLine size={16} style={{ color: 'var(--color-accent)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Trade Screenshot</h3>
            </div>
            <a
              href={screenshot}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
              style={{ color: 'var(--color-accent)' }}
            >
              <ArrowSquareOut size={13} weight="bold" />
              Open in new tab
            </a>
          </div>
          <div style={{ background: '#0a0a0a' }}>
            <img
              src={screenshot}
              alt={`Screenshot for ${tradeData.symbol}`}
              className="w-full object-contain max-h-[540px]"
            />
          </div>
        </motion.div>
      )}

      {/* Entry / Exit Details */}
      <motion.div
        custom={4}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: 'var(--color-accent)' }}>
            Entry Details
          </h3>
          <DetailRow
            label="Entry Price"
            value={tradeData.entry_price ? `$${Number(tradeData.entry_price).toFixed(2)}` : null}
          />
          <DetailRow
            label="Entry Date"
            value={tradeData.entry_date ? `${formatToWIB(tradeData.entry_date, 'MMM dd, yyyy HH:mm')} ${TIMEZONE_LABEL}` : null}
          />
          <DetailRow
            label="Quantity"
            value={tradeData.quantity ? Number(tradeData.quantity) : null}
          />
          <DetailRow
            label="Stop Loss"
            value={tradeData.stop_loss ? `$${Number(tradeData.stop_loss).toFixed(2)}` : null}
          />
          <DetailRow
            label="Take Profit"
            value={tradeData.take_profit ? `$${Number(tradeData.take_profit).toFixed(2)}` : null}
          />
          <DetailRow
            label="Reward:Risk"
            value={tradeData.reward_risk_ratio ? Number(tradeData.reward_risk_ratio).toFixed(2) : null}
          />
        </div>

        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: 'var(--color-accent)' }}>
            Exit Details
          </h3>
          <DetailRow
            label="Exit Price"
            value={tradeData.exit_price ? `$${Number(tradeData.exit_price).toFixed(2)}` : null}
          />
          <DetailRow
            label="Exit Date"
            value={tradeData.exit_date ? `${formatToWIB(tradeData.exit_date, 'MMM dd, yyyy HH:mm')} ${TIMEZONE_LABEL}` : null}
          />
          <DetailRow
            label="Fees"
            value={`$${Number(tradeData.fees).toFixed(2)}`}
          />
        </div>
      </motion.div>

      {/* Strategy & Setup */}
      {(tradeData.strategy || tradeData.setup || tradeData.timeframe) && (
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-xl p-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: 'var(--color-accent)' }}>
            Strategy & Setup
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tradeData.strategy && (
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Strategy</p>
                <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{tradeData.strategy}</p>
              </div>
            )}
            {tradeData.setup && (
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Setup</p>
                <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{tradeData.setup}</p>
              </div>
            )}
            {tradeData.timeframe && (
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Timeframe</p>
                <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{tradeData.timeframe}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Notes & Analysis */}
      {(tradeData.entry_reasoning || tradeData.exit_reasoning || tradeData.notes) && (
        <motion.div
          custom={6}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-xl p-5 space-y-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--color-accent)' }}>
            Notes & Analysis
          </h3>
          {tradeData.entry_reasoning && (
            <div>
              <h4 className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Entry Reasoning
              </h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>
                {tradeData.entry_reasoning}
              </p>
            </div>
          )}
          {tradeData.exit_reasoning && (
            <div>
              <h4 className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Exit Reasoning
              </h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>
                {tradeData.exit_reasoning}
              </p>
            </div>
          )}
          {tradeData.notes && (
            <div>
              <h4 className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                General Notes
              </h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>
                {tradeData.notes}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
