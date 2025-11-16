import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AccountState {
  selectedAccountId: number | null;
  selectAccount: (accountId: number | null) => void;
  clearAccount: () => void;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set) => ({
      selectedAccountId: null,
      selectAccount: (accountId) => set({ selectedAccountId: accountId }),
      clearAccount: () => set({ selectedAccountId: null }),
    }),
    {
      name: 'account-storage',
    }
  )
);
