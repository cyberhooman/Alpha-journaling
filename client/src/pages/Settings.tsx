import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { accountsAPI } from '../lib/api';
import type { TradingAccount } from '../types';

export default function Settings() {
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccount | null>(null);
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
    onSuccess: (data) => {
      console.log('createMutation - onSuccess:', data);
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setShowNewAccountModal(false);
    },
    onError: (error: any) => {
      console.error('createMutation - onError:', error);
      alert('Failed to create account: ' + (error.response?.data?.error || error.message));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      accountsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setEditingAccount(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: accountsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  return (
    <div className="max-w-6xl space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-dark-500">Settings</h1>
          <p className="text-dark-400 mt-1 text-sm sm:text-base">Manage your trading accounts</p>
        </div>

        <button
          onClick={() => setShowNewAccountModal(true)}
          className="btn btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          New Account
        </button>
      </div>

      {error && (
        <div className="card bg-red-50 border-red-200 p-4">
          <p className="text-red-700">Error loading accounts: {(error as any).message}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {accounts?.data?.map((account: TradingAccount) => (
            <div key={account.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-dark-500 break-words">
                      {account.name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                      account.account_type === 'LIVE' ? 'bg-green-100 text-green-700' :
                      account.account_type === 'PROP_FIRM' ? 'bg-blue-100 text-blue-700' :
                      account.account_type === 'FUNDED' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {account.account_type}
                    </span>
                    {!account.is_active && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 whitespace-nowrap">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                    <div>
                      <p className="text-dark-400 text-xs sm:text-sm">Initial Balance</p>
                      <p className="font-semibold text-dark-500 text-sm sm:text-base">
                        ${Number(account.initial_balance).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-dark-400 text-xs sm:text-sm">Current Balance</p>
                      <p className="font-semibold text-dark-500 text-sm sm:text-base">
                        ${Number(account.current_balance).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-dark-400 text-xs sm:text-sm">P&L</p>
                      <p className={`font-semibold text-sm sm:text-base ${
                        account.current_balance >= account.initial_balance
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        ${(account.current_balance - account.initial_balance).toLocaleString()}
                      </p>
                    </div>
                    {account.broker && (
                      <div>
                        <p className="text-dark-400 text-xs sm:text-sm">Broker</p>
                        <p className="font-semibold text-dark-500 text-sm sm:text-base break-words">{account.broker}</p>
                      </div>
                    )}
                  </div>

                  {account.notes && (
                    <p className="mt-3 text-xs sm:text-sm text-dark-400">{account.notes}</p>
                  )}
                </div>

                <div className="flex sm:flex-row flex-col gap-2">
                <button
                  onClick={() => setEditingAccount(account)}
                  className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4 text-dark-400" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this account?')) {
                      deleteMutation.mutate(account.id);
                    }
                  }}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}

          {accounts?.data?.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-dark-400 mb-4">No trading accounts yet</p>
              <button
                onClick={() => setShowNewAccountModal(true)}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Your First Account
              </button>
            </div>
          )}
        </div>
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

    // For new accounts, set current_balance to initial_balance
    if (!account) {
      delete submitData.current_balance;
    }

    console.log('Submitting data:', submitData);
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-300 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-dark-500">
            {account ? 'Edit Account' : 'New Trading Account'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-200 rounded-lg">
            <X className="w-5 h-5" />
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

            {account && (
              <div>
                <label className="label">Current Balance *</label>
                <input
                  type="number"
                  className="input"
                  value={formData.current_balance}
                  onChange={(e) => setFormData({ ...formData, current_balance: parseFloat(e.target.value) || 0 })}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            )}

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
              placeholder="Add any notes about this account..."
            />
          </div>

          {account && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <label htmlFor="is_active" className="text-sm text-dark-500">
                Account is active
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-neutral-300">
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
                  {account ? 'Updating...' : 'Creating...'}
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
