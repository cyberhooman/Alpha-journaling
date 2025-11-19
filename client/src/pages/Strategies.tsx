import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { strategiesAPI } from '../lib/api';
import { Plus, BookOpen, Edit, Trash2, TrendingUp, Target, Shield, Clock, Globe, FileText, X, Sparkles, BarChart3 } from 'lucide-react';

const categoryColors = {
  PRICE_ACTION: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
  TECHNICAL: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white',
  FUNDAMENTAL: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white',
  SENTIMENT: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white',
  PATTERN: 'bg-gradient-to-br from-pink-500 to-pink-600 text-white',
  INDICATOR: 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white',
  CUSTOM: 'bg-gradient-to-br from-slate-500 to-slate-600 text-white',
};

const categoryIcons = {
  PRICE_ACTION: TrendingUp,
  TECHNICAL: BarChart3,
  FUNDAMENTAL: BookOpen,
  SENTIMENT: Sparkles,
  PATTERN: Target,
  INDICATOR: BarChart3,
  CUSTOM: FileText,
};

const categoryLabels = {
  PRICE_ACTION: 'Price Action',
  TECHNICAL: 'Technical',
  FUNDAMENTAL: 'Fundamental',
  SENTIMENT: 'Sentiment',
  PATTERN: 'Pattern',
  INDICATOR: 'Indicator',
  CUSTOM: 'Custom',
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading strategies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
                    Strategy Library
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Build and document your trading edge
                  </p>
                </div>
              </div>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="group relative inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-200"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                <span>New Strategy</span>
              </button>
            )}
          </div>
        </div>

        {/* Strategy Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl border-b border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {editingStrategy ? 'Edit Strategy' : 'Create New Strategy'}
                      </h2>
                      <p className="text-sm text-blue-100 mt-0.5">Define your trading framework</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancel}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Strategy Name & Description */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Strategy Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                      placeholder="e.g., Supply & Demand Zones"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400 resize-none"
                      rows={2}
                      placeholder="Brief overview of your strategy..."
                    />
                  </div>
                </div>

                {/* Category & Meta Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-900"
                    >
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Timeframes
                    </label>
                    <input
                      type="text"
                      value={formData.timeframes}
                      onChange={(e) => setFormData({ ...formData, timeframes: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                      placeholder="e.g., 1H, 4H, Daily"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <Globe className="w-4 h-4 inline mr-1" />
                      Markets
                    </label>
                    <input
                      type="text"
                      value={formData.markets}
                      onChange={(e) => setFormData({ ...formData, markets: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                      placeholder="Forex, Crypto, Stocks"
                    />
                  </div>
                </div>

                {/* Strategy Rules */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200/50">
                    <label className="flex items-center gap-2 text-sm font-semibold text-emerald-900 mb-3">
                      <Target className="w-5 h-5" />
                      Entry Rules
                    </label>
                    <textarea
                      value={formData.entry_rules}
                      onChange={(e) => setFormData({ ...formData, entry_rules: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400 resize-none"
                      rows={3}
                      placeholder="• Define your entry criteria&#10;• What signals trigger a trade?&#10;• Required confirmations..."
                    />
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200/50">
                    <label className="flex items-center gap-2 text-sm font-semibold text-blue-900 mb-3">
                      <TrendingUp className="w-5 h-5" />
                      Exit Rules
                    </label>
                    <textarea
                      value={formData.exit_rules}
                      onChange={(e) => setFormData({ ...formData, exit_rules: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400 resize-none"
                      rows={3}
                      placeholder="• When do you exit?&#10;• Profit targets and stop loss&#10;• Trailing stop conditions..."
                    />
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-5 border border-red-200/50">
                    <label className="flex items-center gap-2 text-sm font-semibold text-red-900 mb-3">
                      <Shield className="w-5 h-5" />
                      Risk Management
                    </label>
                    <textarea
                      value={formData.risk_management}
                      onChange={(e) => setFormData({ ...formData, risk_management: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-red-200 rounded-lg focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400 resize-none"
                      rows={3}
                      placeholder="• Position sizing rules&#10;• Risk per trade (e.g., 1-2%)&#10;• Maximum daily loss..."
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <FileText className="w-4 h-4" />
                      Additional Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400 resize-none"
                      rows={3}
                      placeholder="Any additional information, examples, or observations..."
                    />
                  </div>
                </div>

                {/* Active Toggle */}
                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border-2 border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-900">Active Strategy</span>
                    <p className="text-xs text-slate-500">Make this strategy available when creating trades</p>
                  </div>
                </label>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {editingStrategy ? 'Update Strategy' : 'Create Strategy'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Strategies List */}
        {strategies.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">No Strategies Yet</h3>
              <p className="text-slate-600 mb-8">
                Start building your edge by documenting your proven trading strategies and frameworks
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Your First Strategy
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {strategies.map((strategy: any) => {
              const CategoryIcon = categoryIcons[strategy.category as keyof typeof categoryIcons] || FileText;

              return (
                <div
                  key={strategy.id}
                  className="group bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {strategy.name}
                          </h3>
                          {strategy.is_active === 1 && (
                            <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-sm">
                              Active
                            </span>
                          )}
                        </div>
                        {strategy.category && (
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg ${categoryColors[strategy.category as keyof typeof categoryColors]} shadow-sm`}>
                            <CategoryIcon className="w-4 h-4" />
                            {categoryLabels[strategy.category as keyof typeof categoryLabels]}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(strategy)}
                          className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit strategy"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(strategy.id)}
                          className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete strategy"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {strategy.description && (
                      <p className="text-sm text-slate-600 leading-relaxed">{strategy.description}</p>
                    )}
                  </div>

                  {/* Quick Info */}
                  {(strategy.timeframes || strategy.markets) && (
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                      <div className="grid grid-cols-2 gap-4">
                        {strategy.timeframes && (
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <Clock className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-xs font-medium text-slate-500">Timeframes</div>
                              <div className="text-sm font-semibold text-slate-900">{strategy.timeframes}</div>
                            </div>
                          </div>
                        )}
                        {strategy.markets && (
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <Globe className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-xs font-medium text-slate-500">Markets</div>
                              <div className="text-sm font-semibold text-slate-900">{strategy.markets}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Strategy Details */}
                  <div className="p-6 space-y-4">
                    {strategy.entry_rules && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-green-600" />
                          <h4 className="text-sm font-bold text-green-900">Entry Rules</h4>
                        </div>
                        <p className="text-sm text-green-800 whitespace-pre-line leading-relaxed">{strategy.entry_rules}</p>
                      </div>
                    )}

                    {strategy.exit_rules && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <h4 className="text-sm font-bold text-blue-900">Exit Rules</h4>
                        </div>
                        <p className="text-sm text-blue-800 whitespace-pre-line leading-relaxed">{strategy.exit_rules}</p>
                      </div>
                    )}

                    {strategy.risk_management && (
                      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border border-red-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-red-600" />
                          <h4 className="text-sm font-bold text-red-900">Risk Management</h4>
                        </div>
                        <p className="text-sm text-red-800 whitespace-pre-line leading-relaxed">{strategy.risk_management}</p>
                      </div>
                    )}

                    {strategy.notes && (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-slate-600" />
                          <h4 className="text-sm font-bold text-slate-900">Notes</h4>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{strategy.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
