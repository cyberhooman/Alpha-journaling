import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { strategiesAPI } from '../lib/api';
import { CheckSquare, Square, Target, TrendUp, Shield, WarningCircle, Clock, Sparkle, CaretDown, CaretUp } from '@phosphor-icons/react';
const TrendingUp = TrendUp;
const AlertCircle = WarningCircle;
const Sparkles = Sparkle;
const ChevronDown = CaretDown;
const ChevronUp = CaretUp;

interface TodoItem {
  id: string;
  strategyId: number;
  strategyName: string;
  category: 'ENTRY' | 'EXIT' | 'RISK' | 'GENERAL';
  text: string;
  completed: boolean;
}

export default function TradingTodoList() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [expandedStrategies, setExpandedStrategies] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  const { data: strategies = [], isLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      const response = await strategiesAPI.getAll();
      return response.data;
    },
  });

  // Generate todos from strategies
  useEffect(() => {
    const savedTodos = localStorage.getItem('trading_todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
      return;
    }

    const generatedTodos: TodoItem[] = [];

    strategies.forEach((strategy: any) => {
      if (strategy.is_active !== 1) return;

      // Parse entry rules into checklist items
      if (strategy.entry_rules) {
        const entryRules = strategy.entry_rules.split('\n').filter((line: string) => line.trim());
        entryRules.forEach((rule: string, index: number) => {
          generatedTodos.push({
            id: `${strategy.id}-entry-${index}`,
            strategyId: strategy.id,
            strategyName: strategy.name,
            category: 'ENTRY',
            text: rule.replace(/^[•\-*]\s*/, ''),
            completed: false,
          });
        });
      }

      // Parse exit rules into checklist items
      if (strategy.exit_rules) {
        const exitRules = strategy.exit_rules.split('\n').filter((line: string) => line.trim());
        exitRules.forEach((rule: string, index: number) => {
          generatedTodos.push({
            id: `${strategy.id}-exit-${index}`,
            strategyId: strategy.id,
            strategyName: strategy.name,
            category: 'EXIT',
            text: rule.replace(/^[•\-*]\s*/, ''),
            completed: false,
          });
        });
      }

      // Parse risk management into checklist items
      if (strategy.risk_management) {
        const riskRules = strategy.risk_management.split('\n').filter((line: string) => line.trim());
        riskRules.forEach((rule: string, index: number) => {
          generatedTodos.push({
            id: `${strategy.id}-risk-${index}`,
            strategyId: strategy.id,
            strategyName: strategy.name,
            category: 'RISK',
            text: rule.replace(/^[•\-*]\s*/, ''),
            completed: false,
          });
        });
      }

      // Add general reminders
      if (strategy.timeframes) {
        generatedTodos.push({
          id: `${strategy.id}-timeframe`,
          strategyId: strategy.id,
          strategyName: strategy.name,
          category: 'GENERAL',
          text: `Verify timeframe: ${strategy.timeframes}`,
          completed: false,
        });
      }
    });

    setTodos(generatedTodos);
    // Auto-expand all strategies initially
    setExpandedStrategies(new Set(strategies.map((s: any) => s.id)));
  }, [strategies]);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    if (todos.length > 0) {
      localStorage.setItem('trading_todos', JSON.stringify(todos));
    }
  }, [todos]);

  const handleToggleTodo = (id: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleToggleStrategy = (strategyId: number) => {
    setExpandedStrategies(prev => {
      const next = new Set(prev);
      if (next.has(strategyId)) {
        next.delete(strategyId);
      } else {
        next.add(strategyId);
      }
      return next;
    });
  };

  const handleResetAll = () => {
    if (window.confirm('Reset all checklist items? This will mark everything as incomplete.')) {
      setTodos(prev => prev.map(todo => ({ ...todo, completed: false })));
    }
  };

  const handleResetStrategy = (strategyId: number) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.strategyId === strategyId ? { ...todo, completed: false } : todo
      )
    );
  };

  const getCategoryIcon = (category: TodoItem['category']) => {
    switch (category) {
      case 'ENTRY': return <Target className="w-4 h-4" />;
      case 'EXIT': return <TrendingUp className="w-4 h-4" />;
      case 'RISK': return <Shield className="w-4 h-4" />;
      case 'GENERAL': return <Clock className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: TodoItem['category']) => {
    switch (category) {
      case 'ENTRY': return 'text-green-600 bg-green-50';
      case 'EXIT': return 'text-blue-600 bg-blue-50';
      case 'RISK': return 'text-red-600 bg-red-50';
      case 'GENERAL': return 'text-slate-600 bg-slate-50';
    }
  };

  // Group todos by strategy
  const groupedTodos = todos.reduce((acc, todo) => {
    if (!acc[todo.strategyId]) {
      acc[todo.strategyId] = {
        strategyName: todo.strategyName,
        todos: [],
      };
    }
    acc[todo.strategyId].todos.push(todo);
    return acc;
  }, {} as Record<number, { strategyName: string; todos: TodoItem[] }>);

  const getFilteredTodos = (strategyTodos: TodoItem[]) => {
    switch (filter) {
      case 'active':
        return strategyTodos.filter(t => !t.completed);
      case 'completed':
        return strategyTodos.filter(t => t.completed);
      default:
        return strategyTodos;
    }
  };

  const getStrategyProgress = (strategyTodos: TodoItem[]) => {
    const completed = strategyTodos.filter(t => t.completed).length;
    const total = strategyTodos.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    return { completed, total, percentage };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading checklist...</p>
        </div>
      </div>
    );
  }

  const activeStrategies = strategies.filter((s: any) => s.is_active === 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20">
                  <CheckSquare className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
                    Trading Checklist
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Pre-trade checklist from your strategies
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleResetAll}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Reset All
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-200">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
              filter === 'active'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
              filter === 'completed'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Completed
          </button>
        </div>

        {/* Strategy Checklists */}
        {activeStrategies.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">No Active Strategies</h3>
              <p className="text-slate-600 mb-8">
                Create and activate strategies to generate your trading checklist
              </p>
              <a
                href="/strategies"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
              >
                <Target className="w-5 h-5" />
                Go to Strategies
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTodos).map(([strategyId, { strategyName, todos: strategyTodos }]) => {
              const filteredTodos = getFilteredTodos(strategyTodos);
              const { completed, total, percentage } = getStrategyProgress(strategyTodos);
              const isExpanded = expandedStrategies.has(Number(strategyId));

              if (filteredTodos.length === 0) return null;

              return (
                <div
                  key={strategyId}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all"
                >
                  {/* Strategy Header */}
                  <div
                    className="p-5 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-200 cursor-pointer"
                    onClick={() => handleToggleStrategy(Number(strategyId))}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-slate-900">{strategyName}</h3>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 max-w-xs">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-slate-600 font-medium">Progress</span>
                              <span className="text-slate-900 font-bold">
                                {completed}/{total}
                              </span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResetStrategy(Number(strategyId));
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Todo Items */}
                  {isExpanded && (
                    <div className="p-4 space-y-2">
                      {filteredTodos.map((todo) => (
                        <label
                          key={todo.id}
                          className={`group flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            todo.completed
                              ? 'bg-slate-50 border-slate-200 opacity-60'
                              : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                          }`}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {todo.completed ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors" />
                            )}
                          </div>
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => handleToggleTodo(todo.id)}
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="flex items-start gap-2">
                              <span
                                className={`flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full ${getCategoryColor(
                                  todo.category
                                )}`}
                              >
                                {getCategoryIcon(todo.category)}
                                {todo.category}
                              </span>
                            </div>
                            <p
                              className={`text-sm mt-2 leading-relaxed ${
                                todo.completed ? 'line-through text-slate-500' : 'text-slate-900'
                              }`}
                            >
                              {todo.text}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
