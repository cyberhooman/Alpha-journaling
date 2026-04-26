import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { strategiesAPI } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  BookOpen,
  PencilSimple,
  Trash,
  TrendUp,
  Target,
  ShieldCheck,
  Clock,
  Globe,
  FileDoc,
  Sparkle,
  ChartBar,
  X,
} from '@phosphor-icons/react';
const TrendingUp = TrendUp;
const FileText = FileDoc;

const categoryColors: Record<string, string> = {
  PRICE_ACTION: '#FF7522',
  TECHNICAL: '#a78bfa',
  FUNDAMENTAL: '#34d399',
  SENTIMENT: '#fbbf24',
  PATTERN: '#f87171',
  INDICATOR: '#60a5fa',
  CUSTOM: '#8c8c8c',
};

const categoryIcons: Record<string, any> = {
  PRICE_ACTION: TrendingUp,
  TECHNICAL: ChartBar,
  FUNDAMENTAL: BookOpen,
  SENTIMENT: Sparkle,
  PATTERN: Target,
  INDICATOR: ChartBar,
  CUSTOM: FileText,
};

const categoryLabels: Record<string, string> = {
  PRICE_ACTION: 'Price Action',
  TECHNICAL: 'Technical',
  FUNDAMENTAL: 'Fundamental',
  SENTIMENT: 'Sentiment',
  PATTERN: 'Pattern',
  INDICATOR: 'Indicator',
  CUSTOM: 'Custom',
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' },
  }),
};

export default function Strategies() {
  const [showForm, setShowForm] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'CUSTOM' as keyof typeof categoryLabels,
    entry_rules: '',
    exit_rules: '',
    risk_management: '',
    timeframes: '',
    markets: '',
    notes: '',
    is_active: true,
  });

  const { data: strategies = [], isLoading, refetch } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      const response = await strategiesAPI.getAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: strategiesAPI.create,
    onSuccess: async () => {
      await refetch();
      setShowForm(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => strategiesAPI.update(id, data),
    onSuccess: async () => {
      await refetch();
      setShowForm(false);
      setEditingStrategy(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: strategiesAPI.delete,
    onSuccess: async () => {
      await refetch();
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'CUSTOM',
      entry_rules: '',
      exit_rules: '',
      risk_management: '',
      timeframes: '',
      markets: '',
      notes: '',
      is_active: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStrategy) {
      updateMutation.mutate({ id: editingStrategy.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (strategy: any) => {
    setEditingStrategy(strategy);
    setFormData({
      name: strategy.name || '',
      description: strategy.description || '',
      category: strategy.category || 'CUSTOM',
      entry_rules: strategy.entry_rules || '',
      exit_rules: strategy.exit_rules || '',
      risk_management: strategy.risk_management || '',
      timeframes: strategy.timeframes || '',
      markets: strategy.markets || '',
      notes: strategy.notes || '',
      is_active: strategy.is_active === 1,
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this strategy?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStrategy(null);
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#282828] border-t-[#FF7522] animate-spin" />
          <p className="text-[#555] text-sm">Loading strategies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold text-[#555] mb-1">Library</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#f2f2f2]">Strategy Library</h1>
          <p className="text-[#8c8c8c] mt-1 text-sm">Build and document your trading edge</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} weight="bold" />
            New Strategy
          </button>
        )}
      </motion.div>

      {/* Strategy Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="w-full max-w-3xl my-8 rounded-2xl overflow-hidden"
              style={{ background: '#161616', border: '1px solid #282828' }}
            >
              {/* Modal Header */}
              <div
                className="sticky top-0 px-6 py-5 flex items-center justify-between"
                style={{
                  background: '#161616',
                  borderBottom: '1px solid #282828',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FF7522]/10 flex items-center justify-center">
                    <Sparkle size={16} weight="fill" className="text-[#FF7522]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#f2f2f2]">
                      {editingStrategy ? 'Edit Strategy' : 'Create New Strategy'}
                    </h2>
                    <p className="text-xs text-[#555]">Define your trading framework</p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-2 rounded-lg hover:bg-[#282828] transition-colors"
                >
                  <X size={18} className="text-[#8c8c8c]" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Name & Description */}
                <div className="space-y-4">
                  <div>
                    <label className="label">
                      Strategy Name <span className="text-[#f87171]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      placeholder="e.g., Supply & Demand Zones"
                    />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input resize-none"
                      rows={2}
                      placeholder="Brief overview of your strategy..."
                    />
                  </div>
                </div>

                {/* Category & Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value as any })
                      }
                      className="input"
                    >
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label flex items-center gap-1">
                      <Clock size={13} className="text-[#555]" />
                      Timeframes
                    </label>
                    <input
                      type="text"
                      value={formData.timeframes}
                      onChange={(e) => setFormData({ ...formData, timeframes: e.target.value })}
                      className="input"
                      placeholder="e.g., 1H, 4H, Daily"
                    />
                  </div>
                  <div>
                    <label className="label flex items-center gap-1">
                      <Globe size={13} className="text-[#555]" />
                      Markets
                    </label>
                    <input
                      type="text"
                      value={formData.markets}
                      onChange={(e) => setFormData({ ...formData, markets: e.target.value })}
                      className="input"
                      placeholder="Forex, Crypto, Stocks"
                    />
                  </div>
                </div>

                {/* Rules */}
                <div className="space-y-4">
                  {/* Entry Rules */}
                  <div
                    className="rounded-xl p-5"
                    style={{ background: '#34d39910', border: '1px solid #34d39930' }}
                  >
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#34d399] mb-3">
                      <Target size={16} weight="bold" />
                      Entry Rules
                    </label>
                    <textarea
                      value={formData.entry_rules}
                      onChange={(e) => setFormData({ ...formData, entry_rules: e.target.value })}
                      className="input resize-none"
                      rows={3}
                      placeholder={'• Define your entry criteria\n• What signals trigger a trade?\n• Required confirmations...'}
                    />
                  </div>

                  {/* Exit Rules */}
                  <div
                    className="rounded-xl p-5"
                    style={{ background: '#60a5fa10', border: '1px solid #60a5fa30' }}
                  >
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#60a5fa] mb-3">
                      <TrendingUp size={16} weight="bold" />
                      Exit Rules
                    </label>
                    <textarea
                      value={formData.exit_rules}
                      onChange={(e) => setFormData({ ...formData, exit_rules: e.target.value })}
                      className="input resize-none"
                      rows={3}
                      placeholder={'• When do you exit?\n• Profit targets and stop loss\n• Trailing stop conditions...'}
                    />
                  </div>

                  {/* Risk Management */}
                  <div
                    className="rounded-xl p-5"
                    style={{ background: '#f8717110', border: '1px solid #f8717130' }}
                  >
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#f87171] mb-3">
                      <ShieldCheck size={16} weight="bold" />
                      Risk Management
                    </label>
                    <textarea
                      value={formData.risk_management}
                      onChange={(e) =>
                        setFormData({ ...formData, risk_management: e.target.value })
                      }
                      className="input resize-none"
                      rows={3}
                      placeholder={'• Position sizing rules\n• Risk per trade (e.g., 1-2%)\n• Maximum daily loss...'}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="label flex items-center gap-1">
                      <FileText size={13} className="text-[#555]" />
                      Additional Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="input resize-none"
                      rows={3}
                      placeholder="Any additional information, examples, or observations..."
                    />
                  </div>
                </div>

                {/* Active Toggle */}
                <label
                  className="flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:border-[#FF7522]/40 transition-colors"
                  style={{ background: '#1e1e1e', border: '1px solid #282828' }}
                >
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 accent-[#FF7522] rounded"
                  />
                  <div>
                    <span className="text-sm font-semibold text-[#f2f2f2]">Active Strategy</span>
                    <p className="text-xs text-[#555]">
                      Make this strategy available when creating trades
                    </p>
                  </div>
                </label>

                {/* Actions */}
                <div
                  className="flex gap-3 pt-4"
                  style={{ borderTop: '1px solid #282828' }}
                >
                  <button type="button" onClick={handleCancel} className="btn btn-secondary flex-1">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="btn btn-primary flex-1"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        {editingStrategy ? 'Updating...' : 'Creating...'}
                      </span>
                    ) : editingStrategy ? (
                      'Update Strategy'
                    ) : (
                      'Create Strategy'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Strategies List */}
      {strategies.length === 0 ? (
        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="card p-12 text-center"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: '#FF7522/10', backgroundColor: 'rgba(255,117,34,0.08)' }}
          >
            <BookOpen size={32} className="text-[#FF7522]" />
          </div>
          <h3 className="text-xl font-bold text-[#f2f2f2] mb-2">No Strategies Yet</h3>
          <p className="text-[#8c8c8c] text-sm mb-6 max-w-sm mx-auto">
            Start building your edge by documenting your proven trading strategies and frameworks
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Plus size={16} weight="bold" />
            Create Your First Strategy
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {strategies.map((strategy: any, index: number) => {
            const CategoryIcon =
              categoryIcons[strategy.category as keyof typeof categoryIcons] || FileText;
            const catColor = categoryColors[strategy.category] || '#8c8c8c';

            return (
              <motion.div
                key={strategy.id}
                custom={index + 1}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="card overflow-hidden flex flex-col hover:border-[#383838] transition-colors"
              >
                {/* Card Header */}
                <div className="p-5" style={{ borderBottom: '1px solid #282828' }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="text-base font-bold text-[#f2f2f2]">{strategy.name}</h3>
                        {strategy.is_active === 1 && (
                          <span className="badge badge-green text-[10px] px-2 py-0.5">Active</span>
                        )}
                      </div>
                      {strategy.category && (
                        <div
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{
                            background: `${catColor}15`,
                            color: catColor,
                            border: `1px solid ${catColor}30`,
                          }}
                        >
                          <CategoryIcon size={12} weight="bold" />
                          {categoryLabels[strategy.category as keyof typeof categoryLabels]}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(strategy)}
                        className="p-2 rounded-lg hover:bg-[#282828] transition-colors"
                        title="Edit strategy"
                      >
                        <PencilSimple size={15} className="text-[#8c8c8c]" />
                      </button>
                      <button
                        onClick={() => handleDelete(strategy.id)}
                        className="p-2 rounded-lg hover:bg-[#f87171]/10 transition-colors"
                        title="Delete strategy"
                      >
                        <Trash size={15} className="text-[#f87171]" />
                      </button>
                    </div>
                  </div>
                  {strategy.description && (
                    <p className="text-sm text-[#8c8c8c] leading-relaxed">{strategy.description}</p>
                  )}
                </div>

                {/* Meta Info */}
                {(strategy.timeframes || strategy.markets) && (
                  <div
                    className="px-5 py-3 grid grid-cols-2 gap-4"
                    style={{ background: '#1e1e1e', borderBottom: '1px solid #282828' }}
                  >
                    {strategy.timeframes && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-[#555] shrink-0" />
                        <div>
                          <div className="text-[10px] text-[#555] uppercase tracking-wider">
                            Timeframes
                          </div>
                          <div className="text-xs font-semibold text-[#f2f2f2]">
                            {strategy.timeframes}
                          </div>
                        </div>
                      </div>
                    )}
                    {strategy.markets && (
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-[#555] shrink-0" />
                        <div>
                          <div className="text-[10px] text-[#555] uppercase tracking-wider">
                            Markets
                          </div>
                          <div className="text-xs font-semibold text-[#f2f2f2]">
                            {strategy.markets}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Rules */}
                <div className="p-5 space-y-3 flex-1">
                  {strategy.entry_rules && (
                    <div
                      className="rounded-lg p-3"
                      style={{ background: '#34d39910', border: '1px solid #34d39928' }}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Target size={13} weight="bold" className="text-[#34d399]" />
                        <span className="text-[11px] font-bold text-[#34d399] uppercase tracking-wider">
                          Entry Rules
                        </span>
                      </div>
                      <p className="text-xs text-[#8c8c8c] whitespace-pre-line leading-relaxed">
                        {strategy.entry_rules}
                      </p>
                    </div>
                  )}

                  {strategy.exit_rules && (
                    <div
                      className="rounded-lg p-3"
                      style={{ background: '#60a5fa10', border: '1px solid #60a5fa28' }}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <TrendingUp size={13} weight="bold" style={{ color: '#60a5fa' }} />
                        <span
                          className="text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: '#60a5fa' }}
                        >
                          Exit Rules
                        </span>
                      </div>
                      <p className="text-xs text-[#8c8c8c] whitespace-pre-line leading-relaxed">
                        {strategy.exit_rules}
                      </p>
                    </div>
                  )}

                  {strategy.risk_management && (
                    <div
                      className="rounded-lg p-3"
                      style={{ background: '#f8717110', border: '1px solid #f8717128' }}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <ShieldCheck size={13} weight="bold" className="text-[#f87171]" />
                        <span className="text-[11px] font-bold text-[#f87171] uppercase tracking-wider">
                          Risk Management
                        </span>
                      </div>
                      <p className="text-xs text-[#8c8c8c] whitespace-pre-line leading-relaxed">
                        {strategy.risk_management}
                      </p>
                    </div>
                  )}

                  {strategy.notes && (
                    <div
                      className="rounded-lg p-3"
                      style={{ background: '#1e1e1e', border: '1px solid #282828' }}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <FileText size={13} weight="bold" className="text-[#555]" />
                        <span className="text-[11px] font-bold text-[#555] uppercase tracking-wider">
                          Notes
                        </span>
                      </div>
                      <p className="text-xs text-[#8c8c8c] whitespace-pre-line leading-relaxed">
                        {strategy.notes}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
