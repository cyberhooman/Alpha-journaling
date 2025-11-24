import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle, AlertTriangle, TrendingUp, Wallet } from 'lucide-react';
import { strategiesAPI, accountsAPI } from '../lib/api';

interface ChecklistItem {
  id: string;
  category: string;
  question: string;
  required: boolean;
  checked: boolean;
}

export default function TradingChecklist() {
  const [selectedStrategy, setSelectedStrategy] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  const { data: strategies } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      const response = await strategiesAPI.getAll();
      return response.data;
    },
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await accountsAPI.getAll();
      return response.data;
    },
  });

  // Auto-select the first active account on load
  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccount) {
      const activeAccount = accounts.find((acc: any) => acc.is_active);
      if (activeAccount) {
        setSelectedAccount(activeAccount.id);
      } else {
        setSelectedAccount(accounts[0].id);
      }
    }
  }, [accounts, selectedAccount]);

  // Default checklist items
  const defaultChecklist: ChecklistItem[] = [
    // Market Analysis
    { id: '1', category: 'Market Analysis', question: 'Is the overall market trend aligned with my trade direction?', required: true, checked: false },
    { id: '2', category: 'Market Analysis', question: 'Have I checked major support/resistance levels?', required: true, checked: false },
    { id: '3', category: 'Market Analysis', question: 'Are there any major news events scheduled that could impact this trade?', required: true, checked: false },
    { id: '4', category: 'Market Analysis', question: 'Have I analyzed multiple timeframes?', required: true, checked: false },

    // Entry Setup
    { id: '5', category: 'Entry Setup', question: 'Does this setup match my trading strategy criteria?', required: true, checked: false },
    { id: '6', category: 'Entry Setup', question: 'Is my entry point clearly defined?', required: true, checked: false },
    { id: '7', category: 'Entry Setup', question: 'Have I waited for confirmation signals?', required: true, checked: false },
    { id: '8', category: 'Entry Setup', question: 'Is the risk-reward ratio at least 1:2?', required: true, checked: false },

    // Risk Management
    { id: '9', category: 'Risk Management', question: 'Have I set a clear stop loss level?', required: true, checked: false },
    { id: '10', category: 'Risk Management', question: 'Is my position size appropriate (not risking more than 1-2% of capital)?', required: true, checked: false },
    { id: '11', category: 'Risk Management', question: 'Have I calculated my take profit levels?', required: true, checked: false },
    { id: '12', category: 'Risk Management', question: 'Am I comfortable with the maximum loss if stopped out?', required: true, checked: false },

    // Psychology & Discipline
    { id: '13', category: 'Psychology & Discipline', question: 'Am I trading according to my plan, not emotions?', required: true, checked: false },
    { id: '14', category: 'Psychology & Discipline', question: 'Am I in the right mental state to trade?', required: true, checked: false },
    { id: '15', category: 'Psychology & Discipline', question: 'Have I avoided revenge trading or overtrading?', required: true, checked: false },
    { id: '16', category: 'Psychology & Discipline', question: 'Am I free from distractions and can focus on this trade?', required: true, checked: false },

    // Trade Documentation
    { id: '17', category: 'Trade Documentation', question: 'Have I documented my trade thesis and reasoning?', required: false, checked: false },
    { id: '18', category: 'Trade Documentation', question: 'Have I taken a screenshot of the chart?', required: false, checked: false },
    { id: '19', category: 'Trade Documentation', question: 'Have I tagged this trade appropriately?', required: false, checked: false },
  ];

  useEffect(() => {
    setChecklistItems(defaultChecklist);
  }, []);

  useEffect(() => {
    if (selectedStrategy && strategies) {
      const strategy = strategies.find((s: any) => s.id === selectedStrategy);
      if (strategy) {
        // Add strategy-specific items
        const strategyItems: ChecklistItem[] = [];

        if (strategy.entry_rules) {
          strategyItems.push({
            id: `strategy-entry`,
            category: `${strategy.name} - Entry Rules`,
            question: strategy.entry_rules,
            required: true,
            checked: false,
          });
        }

        if (strategy.exit_rules) {
          strategyItems.push({
            id: `strategy-exit`,
            category: `${strategy.name} - Exit Rules`,
            question: strategy.exit_rules,
            required: true,
            checked: false,
          });
        }

        if (strategy.risk_management) {
          strategyItems.push({
            id: `strategy-risk`,
            category: `${strategy.name} - Risk Management`,
            question: strategy.risk_management,
            required: true,
            checked: false,
          });
        }

        setChecklistItems([...defaultChecklist, ...strategyItems]);
      }
    } else {
      setChecklistItems(defaultChecklist);
    }
  }, [selectedStrategy, strategies]);

  const toggleItem = (id: string) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const resetChecklist = () => {
    setChecklistItems(items =>
      items.map(item => ({ ...item, checked: false }))
    );
  };

  // Group items by category
  const groupedItems = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  // Calculate progress
  const totalRequired = checklistItems.filter(item => item.required).length;
  const checkedRequired = checklistItems.filter(item => item.required && item.checked).length;
  const totalOptional = checklistItems.filter(item => !item.required).length;
  const checkedOptional = checklistItems.filter(item => !item.required && item.checked).length;
  const progressPercentage = totalRequired > 0 ? (checkedRequired / totalRequired) * 100 : 0;
  const allRequiredChecked = checkedRequired === totalRequired;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trading Checklist</h1>
          <p className="text-slate-600 mt-1">Verify all criteria before entering a trade</p>
        </div>
        <button
          onClick={resetChecklist}
          className="btn btn-secondary"
        >
          Reset Checklist
        </button>
      </div>

      {/* Account & Strategy Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trading Account Selector */}
        <div className="card">
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Trading Account
          </label>
          <select
            className="input"
            value={selectedAccount || ''}
            onChange={(e) => setSelectedAccount(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Select Account</option>
            {accounts?.map((account: any) => (
              <option key={account.id} value={account.id}>
                {account.name} {account.is_active ? '(Active)' : ''} - ${Number(account.current_balance).toFixed(2)}
              </option>
            ))}
          </select>
          <p className="text-sm text-slate-500 mt-2">
            Account you'll be trading with
          </p>
        </div>

        {/* Strategy Selector */}
        <div className="card">
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trading Strategy (Optional)
          </label>
          <select
            className="input"
            value={selectedStrategy || ''}
            onChange={(e) => setSelectedStrategy(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">General Trading Checklist</option>
            {strategies?.map((strategy: any) => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-slate-500 mt-2">
            Adds strategy-specific criteria
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Progress</h3>
            <p className="text-sm text-slate-600">
              {checkedRequired} of {totalRequired} required items completed
              {totalOptional > 0 && ` • ${checkedOptional} of ${totalOptional} optional items`}
            </p>
          </div>
          {allRequiredChecked ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-semibold">Ready to Trade!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <span className="font-semibold">Not Ready</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              allRequiredChecked ? 'bg-green-500' : 'bg-primary-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Checklist Items by Category */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="card">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              {category}
            </h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    item.checked
                      ? 'bg-green-50 border-green-200 hover:bg-green-100'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {item.checked ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-base ${
                      item.checked ? 'text-slate-700 line-through' : 'text-slate-900'
                    }`}>
                      {item.question}
                    </p>
                    {item.required && (
                      <span className="inline-block mt-1 text-xs font-medium text-red-600">
                        Required
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Card */}
      <div className={`card ${allRequiredChecked ? 'bg-green-50 border-2 border-green-200' : 'bg-amber-50 border-2 border-amber-200'}`}>
        <div className="flex items-center gap-4">
          {allRequiredChecked ? (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900">All Required Criteria Met!</h3>
                <p className="text-green-700 mt-1">
                  You've verified all essential criteria. You're ready to proceed with confidence.
                  Remember to document your trade in the journal.
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-12 h-12 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900">Review Required Criteria</h3>
                <p className="text-amber-700 mt-1">
                  Please complete all required checklist items before entering this trade.
                  Following your checklist helps maintain discipline and consistency.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
