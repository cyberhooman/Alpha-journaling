import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CaretDown, Plus, Wallet } from '@phosphor-icons/react';
const ChevronDown = CaretDown;
import { accountsAPI } from '../lib/api';
import { useAccountStore } from '../store/accountStore';
import type { TradingAccount } from '../types';

export default function AccountSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedAccountId, selectAccount } = useAccountStore();

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsAPI.getAll(),
  });

  const activeAccounts = accounts?.data?.filter((acc: TradingAccount) => acc.is_active) || [];
  const selectedAccount = activeAccounts.find((acc: TradingAccount) => acc.id === selectedAccountId);

  const handleSelectAccount = (accountId: number | null) => {
    selectAccount(accountId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-dark-600 hover:bg-dark-700 rounded-lg transition-colors text-left"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Wallet className="w-4 h-4 text-primary-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {selectedAccount ? (
              <>
                <div className="text-sm font-medium text-white truncate">
                  {selectedAccount.name}
                </div>
                <div className="text-xs text-neutral-400">
                  ${Number(selectedAccount.current_balance).toLocaleString()}
                </div>
              </>
            ) : (
              <div className="text-sm text-neutral-300">All Accounts</div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute left-0 right-0 mt-1 bg-dark-600 border border-dark-700 rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
            <div className="p-2">
              <button
                onClick={() => handleSelectAccount(null)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  !selectedAccountId
                    ? 'bg-primary-600 text-white'
                    : 'text-neutral-300 hover:bg-dark-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm font-medium">All Accounts</span>
                </div>
              </button>

              {activeAccounts.length > 0 && (
                <>
                  <div className="border-t border-dark-700 my-2" />
                  {activeAccounts.map((account: TradingAccount) => (
                    <button
                      key={account.id}
                      onClick={() => handleSelectAccount(account.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedAccountId === account.id
                          ? 'bg-primary-600 text-white'
                          : 'text-neutral-300 hover:bg-dark-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{account.name}</div>
                          <div className="text-xs opacity-75">
                            {account.account_type} • ${Number(account.current_balance).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              <div className="border-t border-dark-700 my-2" />
              <a
                href="/settings?tab=accounts"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary-400 hover:bg-dark-700 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Plus className="w-4 h-4" />
                Manage Accounts
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
