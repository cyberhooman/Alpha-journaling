import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, Tag, Moon, Settings as SettingsIcon } from 'lucide-react';
import { accountsAPI, tagsAPI } from '../lib/api';
import type { TradingAccount } from '../types';

export default function Settings() {
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccount | null>(null);
  const [showNewTagModal, setShowNewTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await accountsAPI.getAll();
      return response.data;
    },
  });

  console.log('Settings - Loading:', isLoading, 'Accounts:', accounts, 'Error:', error);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('createMutation - calling API with:', data);
      try {
        const result = await accountsAPI.create(data);
        console.log('createMutation - API response:', result);
        return result;
      } catch (err) {
        console.error('createMutation - API error:', err);
        throw err;
      }
    },
    onSuccess: async (data) => {
      console.log('createMutation - onSuccess:', data);
      await queryClient.refetchQueries({ queryKey: ['accounts'] });
      setShowNewAccountModal(false);
    },
    onError: (error: any) => {
      console.error('createMutation - onError:', error);
      alert('Failed to create account: ' + (error.response?.data?.error || error.message));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => {
      console.log('updateMutation - calling API with id:', id, 'data:', data);
      return accountsAPI.update(id, data);
    },
    onSuccess: async (data) => {
      console.log('updateMutation - onSuccess:', data);
      await queryClient.refetchQueries({ queryKey: ['accounts'] });
      setEditingAccount(null);
    },
    onError: (error: any) => {
      console.error('updateMutation - onError:', error);
      alert('Failed to update account: ' + (error.response?.data?.error || error.message));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: accountsAPI.delete,
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['accounts'] });
    },
  });

  // Tags management
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsAPI.getAll(),
  });

  const createTagMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) => tagsAPI.create(data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['tags'] });
      setShowNewTagModal(false);
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => tagsAPI.update(id, data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['tags'] });
      setEditingTag(null);
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: tagsAPI.delete,
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['tags'] });
    },
  });

  return (
    <div className="max-w-6xl space-y-6 animate-fade-in">
      {/* Header - Terminal Style */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600/20 via-purple-500/10 to-transparent rounded-xl border border-terminal-border p-6 backdrop-blur-sm">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <SettingsIcon className="w-8 h-8 text-purple-400 animate-pulse-glow" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-terminal-text tracking-tight">SETTINGS</h1>
              <p className="text-xs text-terminal-muted font-mono mt-1">ACCOUNT & SYSTEM CONFIGURATION</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewAccountModal(true)}
            className="btn btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            New Account
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl"></div>
      </div>

      {/* Appearance Section - Terminal Style */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-terminal-text uppercase tracking-wide">Appearance</h2>
            <p className="text-sm text-terminal-muted font-mono mt-1">Terminal theme is always active</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg">
            <Moon className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-bold text-blue-400 uppercase tracking-wider">Dark Mode</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="card bg-red-900/20 border-red-500/30 p-4">
          <p className="text-red-400 font-mono text-sm">Error loading accounts: {(error as any).message}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-terminal-border"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500 absolute top-0"></div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {accounts?.data?.map((account: TradingAccount) => (
            <div key={account.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <h3 className="text-xl font-bold text-terminal-text break-words">
                      {account.name}
                    </h3>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-md whitespace-nowrap uppercase tracking-wider border ${
                      account.account_type === 'LIVE' ? 'bg-green-900/30 text-green-300 border-green-500/30' :
                      account.account_type === 'PROP_FIRM' ? 'bg-blue-900/30 text-blue-300 border-blue-500/30' :
                      account.account_type === 'FUNDED' ? 'bg-purple-900/30 text-purple-300 border-purple-500/30' :
                      'bg-gray-800/50 text-gray-400 border-gray-600'
                    }`}>
                      {account.account_type.replace('_', ' ')}
                    </span>
                    {!account.is_active && (
                      <span className="text-[10px] font-bold px-3 py-1 rounded-md bg-red-900/30 text-red-300 border border-red-500/30 whitespace-nowrap uppercase tracking-wider">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-terminal-muted text-[10px] font-bold uppercase tracking-widest mb-1">Initial Balance</p>
                      <p className="font-bold text-terminal-text text-base mono-number">
                        ${Number(account.initial_balance).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-terminal-muted text-[10px] font-bold uppercase tracking-widest mb-1">Current Balance</p>
                      <p className="font-bold text-terminal-text text-base mono-number">
                        ${Number(account.current_balance).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-terminal-muted text-[10px] font-bold uppercase tracking-widest mb-1">P&L</p>
                      <p className={`font-bold text-base mono-number ${
                        account.current_balance >= account.initial_balance
                          ? 'neon-glow-green'
                          : 'neon-glow-red'
                      }`}>
                        ${(account.current_balance - account.initial_balance).toLocaleString()}
                      </p>
                    </div>
                    {account.broker && (
                      <div>
                        <p className="text-terminal-muted text-[10px] font-bold uppercase tracking-widest mb-1">Broker</p>
                        <p className="font-semibold text-terminal-text text-sm break-words">{account.broker}</p>
                      </div>
                    )}
                  </div>

                  {account.notes && (
                    <p className="mt-4 text-sm text-terminal-muted font-mono italic border-l-2 border-blue-500/30 pl-3">{account.notes}</p>
                  )}
                </div>

                <div className="flex sm:flex-row flex-col gap-2">
                  <button
                    onClick={() => setEditingAccount(account)}
                    className="p-2 hover:bg-gray-800 border border-transparent hover:border-blue-500/30 rounded-lg transition-all"
                  >
                    <Edit className="w-4 h-4 text-terminal-muted hover:text-blue-400" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this account?')) {
                        deleteMutation.mutate(account.id);
                      }
                    }}
                    className="p-2 hover:bg-red-900/30 border border-transparent hover:border-red-500/30 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-terminal-muted hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {accounts?.data?.length === 0 && (
            <div className="card text-center py-12">
              <Plus className="w-16 h-16 mx-auto mb-4 text-terminal-muted opacity-20" />
              <p className="text-terminal-muted mb-4 font-mono text-sm uppercase tracking-wider">No Trading Accounts Yet</p>
              <button
                onClick={() => setShowNewAccountModal(true)}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Your First Account
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tags Section - Terminal Style */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-terminal-text uppercase tracking-wide">Trade Tags</h2>
          <button
            onClick={() => setShowNewTagModal(true)}
            className="btn btn-secondary inline-flex items-center gap-2"
          >
            <Tag className="w-5 h-5" />
            New Tag
          </button>
        </div>

        {tags?.data && tags.data.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {tags.data.map((tag: any) => (
              <div
                key={tag.id}
                className="inline-flex items-center gap-3 px-4 py-2.5 rounded-lg border backdrop-blur-sm transition-all hover:scale-105"
                style={{
                  backgroundColor: `${tag.color}15`,
                  borderColor: `${tag.color}50`,
                }}
              >
                <span
                  className="font-bold text-sm"
                  style={{ color: tag.color }}
                >
                  {tag.name}
                </span>
                <div className="flex items-center gap-1 border-l pl-2" style={{ borderColor: `${tag.color}30` }}>
                  <button
                    onClick={() => setEditingTag(tag)}
                    className="p-1.5 hover:bg-black hover:bg-opacity-20 rounded transition-all"
                  >
                    <Edit className="w-3.5 h-3.5" style={{ color: tag.color }} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete tag "${tag.name}"?`)) {
                        deleteTagMutation.mutate(tag.id);
                      }
                    }}
                    className="p-1.5 hover:bg-black hover:bg-opacity-20 rounded transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" style={{ color: tag.color }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-terminal-muted text-sm font-mono">No tags yet. Create your first tag to categorize trades.</p>
        )}
      </div>

      {/* New/Edit Tag Modal */}
      {(showNewTagModal || editingTag) && (
        <TagFormModal
          tag={editingTag}
          onClose={() => {
            setShowNewTagModal(false);
            setEditingTag(null);
          }}
          onSubmit={(data) => {
            if (editingTag) {
              updateTagMutation.mutate({ id: editingTag.id, data });
            } else {
              createTagMutation.mutate(data);
            }
          }}
        />
      )}

      {/* New/Edit Account Modal */}
      {(showNewAccountModal || editingAccount) && (
        <AccountFormModal
          account={editingAccount}
          isLoading={createMutation.isPending || updateMutation.isPending}
          onClose={() => {
            setShowNewAccountModal(false);
            setEditingAccount(null);
          }}
          onSubmit={(data) => {
            console.log('onSubmit called with data:', data);
            if (editingAccount) {
              console.log('Calling updateMutation');
              updateMutation.mutate({ id: editingAccount.id, data });
            } else {
              console.log('Calling createMutation');
              createMutation.mutate(data);
            }
          }}
        />
      )}
    </div>
  );
}

function AccountFormModal({
  account,
  isLoading,
  onClose,
  onSubmit,
}: {
  account: TradingAccount | null;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: account?.name || '',
    account_type: account?.account_type || 'DEMO',
    broker: account?.broker || '',
    initial_balance: account?.initial_balance || 0,
    current_balance: account?.current_balance || 0,
    currency: account?.currency || 'USD',
    notes: account?.notes || '',
    is_active: account?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!', formData);

    // Validate required fields
    if (!formData.name) {
      alert('Please enter an account name');
      return;
    }

    if (!formData.initial_balance || formData.initial_balance <= 0) {
      alert('Please enter a valid initial balance greater than 0');
      return;
    }

    const submitData: any = { ...formData };

    // Don't send current_balance - it's calculated from trades
    delete submitData.current_balance;

    console.log('Submitting data:', submitData);
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-terminal-surface border border-terminal-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50">
        <div className="sticky top-0 bg-terminal-surface border-b border-terminal-border px-6 py-4 flex items-center justify-between backdrop-blur-lg">
          <h2 className="text-2xl font-bold text-terminal-text uppercase tracking-wide">
            {account ? 'Edit Account' : 'New Trading Account'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 border border-transparent hover:border-blue-500/30 rounded-lg transition-all">
            <X className="w-5 h-5 text-terminal-text" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Account Name *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., FTMO Challenge 1, My Live Account"
              required
            />
          </div>

          <div>
            <label className="label">Account Type *</label>
            <select
              className="input"
              value={formData.account_type}
              onChange={(e) => setFormData({ ...formData, account_type: e.target.value as any })}
              required
            >
              <option value="DEMO">Demo</option>
              <option value="LIVE">Live</option>
              <option value="PROP_FIRM">Prop Firm Challenge</option>
              <option value="FUNDED">Funded Account</option>
            </select>
          </div>

          <div>
            <label className="label">Broker</label>
            <input
              type="text"
              className="input"
              value={formData.broker}
              onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
              placeholder="e.g., FTMO, TopStepTrader, IC Markets"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Initial Balance *</label>
              <input
                type="number"
                className="input"
                value={formData.initial_balance}
                onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="label">Currency</label>
              <select
                className="input"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="ADD ANY NOTES ABOUT THIS ACCOUNT..."
            />
          </div>

          {account && (
            <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg border border-terminal-border">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded accent-blue-500"
              />
              <label htmlFor="is_active" className="text-sm text-terminal-text font-semibold">
                Account is active
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-terminal-border">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {account ? 'UPDATING...' : 'CREATING...'}
                </span>
              ) : (
                account ? 'Update Account' : 'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TagFormModal({
  tag,
  onClose,
  onSubmit,
}: {
  tag: any;
  onClose: () => void;
  onSubmit: (data: { name: string; color: string }) => void;
}) {
  const [formData, setFormData] = useState({
    name: tag?.name || '',
    color: tag?.color || '#3B82F6',
  });

  const presetColors = [
    '#EF4444', // Red
    '#F59E0B', // Orange
    '#10B981', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#14B8A6', // Teal
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a tag name');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-terminal-surface border border-terminal-border rounded-xl max-w-md w-full shadow-2xl shadow-black/50">
        <div className="border-b border-terminal-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-terminal-text uppercase tracking-wide">
            {tag ? 'Edit Tag' : 'New Tag'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 border border-transparent hover:border-blue-500/30 rounded-lg transition-all">
            <X className="w-5 h-5 text-terminal-text" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Tag Name *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Scalping, Swing Trade, Loss"
              required
              maxLength={50}
            />
          </div>

          <div>
            <label className="label">Color</label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-full h-10 rounded-lg border-2 transition-all ${
                    formData.color === color ? 'border-blue-400 scale-110 shadow-lg' : 'border-terminal-border'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg border border-terminal-border">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-10 rounded border border-terminal-border cursor-pointer"
              />
              <span className="text-sm text-terminal-muted font-mono">Or pick a custom color</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-blue-500/30">
            <span className="text-sm text-terminal-muted font-bold uppercase tracking-wider">Preview:</span>
            <span
              className="px-3 py-1.5 rounded-md text-sm font-bold border"
              style={{
                backgroundColor: `${formData.color}20`,
                color: formData.color,
                borderColor: `${formData.color}50`
              }}
            >
              {formData.name || 'Tag Name'}
            </span>
          </div>

          <div className="flex gap-3 pt-4 border-t border-terminal-border">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
            >
              {tag ? 'Update Tag' : 'Create Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
