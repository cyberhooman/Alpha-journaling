import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsAPI, tagsAPI } from '../lib/api';
import type { TradingAccount } from '../types';
import { useThemeStore } from '../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  PencilSimple,
  Trash,
  Tag,
  X,
  Moon,
  Sun,
  Wallet,
  TrendUp,
  TrendDown,
} from '@phosphor-icons/react';
const TrendingUp = TrendUp;
const TrendingDown = TrendDown;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' },
  }),
};

const accountTypeBadge: Record<string, string> = {
  LIVE: 'badge-green',
  PROP_FIRM: 'badge-orange',
  FUNDED: 'badge-orange',
  DEMO: 'badge-neutral',
};

export default function Settings() {
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccount | null>(null);
  const [showNewTagModal, setShowNewTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  const queryClient = useQueryClient();
  const { isDarkMode, toggleDarkMode } = useThemeStore();

  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await accountsAPI.getAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const result = await accountsAPI.create(data);
        return result;
      } catch (err) {
        console.error('createMutation - API error:', err);
        throw err;
      }
    },
    onSuccess: async () => {
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
      return accountsAPI.update(id, data);
    },
    onSuccess: async () => {
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
    <div className="max-w-4xl space-y-8">
      {/* Page Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold text-muted mb-1">Configuration</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">Settings</h1>
          <p className="text-secondary mt-1 text-sm">Manage accounts, tags, and preferences</p>
        </div>
        <button
          onClick={() => setShowNewAccountModal(true)}
          className="btn btn-primary inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={16} weight="bold" />
          New Account
        </button>
      </motion.div>

      {/* Appearance */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-0.5">Preferences</p>
            <h2 className="text-base font-semibold text-primary">Appearance</h2>
            <p className="text-xs text-secondary mt-0.5">Toggle between light and dark mode</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="relative inline-flex items-center h-8 w-16 rounded-full transition-colors"
            style={{ background: isDarkMode ? 'rgb(var(--accent))' : 'rgb(var(--border))' }}
          >
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-full shadow transition-transform"
              style={{
                background: 'rgb(var(--surface))',
                transform: isDarkMode ? 'translateX(36px)' : 'translateX(4px)',
              }}
            >
              {isDarkMode ? (
                <Moon size={13} weight="fill" style={{ color: 'rgb(var(--accent))' }} />
              ) : (
                <Sun size={13} weight="fill" style={{ color: 'rgb(var(--text-muted))' }} />
              )}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="card p-4"
          style={{ borderColor: 'rgba(248,113,113,0.3)' }}
        >
          <p className="text-sm" style={{ color: 'rgb(var(--red))' }}>Error loading accounts: {(error as any).message}</p>
        </motion.div>
      )}

      {/* Accounts Section */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-0.5">Accounts</p>
            <h2 className="text-base font-semibold text-primary">Trading Accounts</h2>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgb(var(--border))', borderTopColor: 'rgb(var(--accent))' }} />
          </div>
        ) : (
          <div className="space-y-3">
            {accounts?.data?.length === 0 && (
              <div className="card p-10 text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(255,117,34,0.08)' }}
                >
                  <Wallet size={24} style={{ color: 'rgb(var(--accent))' }} />
                </div>
                <p className="text-secondary text-sm mb-4">No trading accounts yet</p>
                <button
                  onClick={() => setShowNewAccountModal(true)}
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  <Plus size={16} weight="bold" />
                  Create Your First Account
                </button>
              </div>
            )}

            {accounts?.data?.map((account: TradingAccount, index: number) => {
              const pnl = account.current_balance - account.initial_balance;
              const isProfit = pnl >= 0;
              return (
                <motion.div
                  key={account.id}
                  custom={index + 3}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="card p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="text-base font-bold text-primary">{account.name}</h3>
                        <span className={`badge ${accountTypeBadge[account.account_type] || 'badge-neutral'} text-[10px]`}>
                          {account.account_type}
                        </span>
                        {!account.is_active && (
                          <span className="badge badge-red text-[10px]">Inactive</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted text-xs mb-0.5">Initial Balance</p>
                          <p className="font-mono-nums font-semibold text-primary text-sm">
                            ${Number(account.initial_balance).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted text-xs mb-0.5">Current Balance</p>
                          <p className="font-mono-nums font-semibold text-primary text-sm">
                            ${Number(account.current_balance).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted text-xs mb-0.5">P&L</p>
                          <p
                            className="font-mono-nums font-semibold text-sm flex items-center gap-1"
                            style={{ color: isProfit ? 'rgb(var(--green))' : 'rgb(var(--red))' }}
                          >
                            {isProfit ? (
                              <TrendingUp size={12} weight="bold" />
                            ) : (
                              <TrendingDown size={12} weight="bold" />
                            )}
                            ${pnl.toLocaleString()}
                          </p>
                        </div>
                        {account.broker && (
                          <div>
                            <p className="text-muted text-xs mb-0.5">Broker</p>
                            <p className="font-semibold text-primary text-sm truncate">
                              {account.broker}
                            </p>
                          </div>
                        )}
                      </div>

                      {account.notes && (
                        <p className="mt-3 text-xs text-secondary leading-relaxed">{account.notes}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => setEditingAccount(account)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ '--hover-bg': 'rgb(var(--surface-2))' } as any}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgb(var(--surface-2))')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <PencilSimple size={15} className="text-secondary" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this account?')) {
                            deleteMutation.mutate(account.id);
                          }
                        }}
                        className="p-2 rounded-lg transition-colors"
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Trash size={15} style={{ color: 'rgb(var(--red))' }} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Tags Section */}
      <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible" className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-0.5">Labels</p>
            <h2 className="text-base font-semibold text-primary">Trade Tags</h2>
          </div>
          <button
            onClick={() => setShowNewTagModal(true)}
            className="btn btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <Tag size={14} weight="bold" />
            New Tag
          </button>
        </div>

        {tags?.data && tags.data.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.data.map((tag: any) => (
              <div
                key={tag.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{
                  background: `${tag.color}12`,
                  border: `1px solid ${tag.color}30`,
                }}
              >
                <span className="text-sm font-semibold" style={{ color: tag.color }}>
                  {tag.name}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setEditingTag(tag)}
                    className="p-1 rounded transition-colors hover:opacity-70"
                  >
                    <PencilSimple size={11} style={{ color: tag.color }} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete tag "${tag.name}"?`)) {
                        deleteTagMutation.mutate(tag.id);
                      }
                    }}
                    className="p-1 rounded transition-colors hover:opacity-70"
                  >
                    <Trash size={11} style={{ color: tag.color }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-secondary text-sm">
            No tags yet. Create your first tag to categorize trades.
          </p>
        )}
      </motion.div>

      {/* Tag Modal */}
      <AnimatePresence>
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
      </AnimatePresence>

      {/* Account Modal */}
      <AnimatePresence>
        {(showNewAccountModal || editingAccount) && (
          <AccountFormModal
            account={editingAccount}
            isLoading={createMutation.isPending || updateMutation.isPending}
            onClose={() => {
              setShowNewAccountModal(false);
              setEditingAccount(null);
            }}
            onSubmit={(data) => {
              if (editingAccount) {
                updateMutation.mutate({ id: editingAccount.id, data });
              } else {
                createMutation.mutate(data);
              }
            }}
          />
        )}
      </AnimatePresence>
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
    is_active: account ? Boolean(account.is_active) : true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter an account name');
      return;
    }
    if (!formData.initial_balance || formData.initial_balance <= 0) {
      alert('Please enter a valid initial balance greater than 0');
      return;
    }
    onSubmit({ ...formData });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}
      >
        <div
          className="sticky top-0 px-6 py-4 flex items-center justify-between"
          style={{ background: 'rgb(var(--surface))', borderBottom: '1px solid rgb(var(--border))' }}
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-0.5">Accounts</p>
            <h2 className="text-lg font-bold text-primary">
              {account ? 'Edit Account' : 'New Trading Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            onMouseEnter={e => (e.currentTarget.style.background = 'rgb(var(--surface-2))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={18} className="text-secondary" />
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
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setFormData({ ...formData, initial_balance: isNaN(val) ? 0 : val });
                }}
                step="0.01"
                min="0"
                required
              />
            </div>
            <div>
              <label className="label">Current Balance</label>
              <input
                type="number"
                className="input"
                value={formData.current_balance}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setFormData({ ...formData, current_balance: isNaN(val) ? 0 : val });
                }}
                step="0.01"
                min="0"
              />
            </div>
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

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this account..."
            />
          </div>

          {account && (
            <label
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
              style={{ background: 'rgb(var(--surface-2))', border: '1px solid rgb(var(--border))' }}
            >
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded"
                style={{ accentColor: 'rgb(var(--accent))' }}
              />
              <div>
                <span className="text-sm font-semibold text-primary">Account is active</span>
                <p className="text-xs text-muted">Inactive accounts are hidden from trade creation</p>
              </div>
            </label>
          )}

          <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid rgb(var(--border))' }}>
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
                  <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  {account ? 'Updating...' : 'Creating...'}
                </span>
              ) : account ? (
                'Update Account'
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
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
    color: tag?.color || '#FF7522',
  });

  const presetColors = [
    '#f87171',
    '#FF7522',
    '#34d399',
    '#60a5fa',
    '#a78bfa',
    '#f472b6',
    '#fbbf24',
    '#14b8a6',
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgb(var(--border))' }}
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-0.5">Tags</p>
            <h2 className="text-lg font-bold text-primary">{tag ? 'Edit Tag' : 'New Tag'}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            onMouseEnter={e => (e.currentTarget.style.background = 'rgb(var(--surface-2))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={18} className="text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
            <label className="label mb-2">Color</label>
            <div className="grid grid-cols-8 gap-2 mb-3">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className="w-full aspect-square rounded-lg border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: formData.color === color ? 'rgb(var(--text-primary))' : 'transparent',
                    transform: formData.color === color ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-10 h-9 rounded-lg cursor-pointer border-0 p-0.5"
                style={{ background: 'rgb(var(--surface-2))', border: '1px solid rgb(var(--border))' }}
              />
              <span className="text-xs text-muted">Custom color</span>
            </div>
          </div>

          {/* Preview */}
          <div
            className="p-3 rounded-xl flex items-center gap-2"
            style={{ background: 'rgb(var(--surface-2))', border: '1px solid rgb(var(--border))' }}
          >
            <span className="text-xs text-muted">Preview:</span>
            <span
              className="px-3 py-1 rounded-full text-sm font-semibold"
              style={{
                background: `${formData.color}18`,
                color: formData.color,
                border: `1px solid ${formData.color}35`,
              }}
            >
              {formData.name || 'Tag Name'}
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              {tag ? 'Update Tag' : 'Create Tag'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
