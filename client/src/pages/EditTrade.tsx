import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { tradesAPI, tagsAPI, accountsAPI, strategiesAPI } from '../lib/api';

export default function EditTrade() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsAPI.getAll(),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await accountsAPI.getAll();
      return response.data;
    },
  });

  const { data: tradeData, isLoading: isLoadingTrade } = useQuery({
    queryKey: ['trade', id],
    queryFn: async () => {
      const response = await tradesAPI.getOne(Number(id));
      return response.data;
    },
    enabled: !!id,
  });

  const { data: strategies } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      const response = await strategiesAPI.getAll();
      return response.data;
    },
  });

  const [isCustomStrategy, setIsCustomStrategy] = useState(false);

  const [formData, setFormData] = useState({
    accountId: '',
    symbol: '',
    side: 'LONG' as 'LONG' | 'SHORT',
    entryDate: new Date().toISOString().slice(0, 16),
    exitDate: '',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    stopLoss: '',
    takeProfit: '',
    fees: '0',
    pnl: '',
    mfe: '',
    status: 'OPEN' as 'OPEN' | 'CLOSED' | 'CANCELLED',
    strategy: '',
    setup: '',
    timeframe: '',
    marketType: '' as any,
    notes: '',
    entryReasoning: '',
    exitReasoning: '',
    broker: '',
    screenshotUrl: '',
    tagIds: [] as number[],
  });

  // Load existing trade data into form
  useEffect(() => {
    if (tradeData) {
      setFormData({
        accountId: tradeData.account_id ? String(tradeData.account_id) : '',
        symbol: tradeData.symbol || '',
        side: tradeData.side || 'LONG',
        entryDate: tradeData.entry_date ? new Date(tradeData.entry_date).toISOString().slice(0, 16) : '',
        exitDate: tradeData.exit_date ? new Date(tradeData.exit_date).toISOString().slice(0, 16) : '',
        entryPrice: tradeData.entry_price ? String(tradeData.entry_price) : '',
        exitPrice: tradeData.exit_price ? String(tradeData.exit_price) : '',
        quantity: tradeData.quantity ? String(tradeData.quantity) : '',
        stopLoss: tradeData.stop_loss ? String(tradeData.stop_loss) : '',
        takeProfit: tradeData.take_profit ? String(tradeData.take_profit) : '',
        fees: tradeData.fees ? String(tradeData.fees) : '0',
        pnl: tradeData.pnl ? String(tradeData.pnl) : '',
        mfe: tradeData.mfe ? String(tradeData.mfe) : '',
        status: tradeData.status || 'OPEN',
        strategy: tradeData.strategy || '',
        setup: tradeData.setup || '',
        timeframe: tradeData.timeframe || '',
        marketType: tradeData.market_type || '',
        notes: tradeData.notes || '',
        entryReasoning: tradeData.entry_reasoning || '',
        exitReasoning: tradeData.exit_reasoning || '',
        broker: tradeData.broker || '',
        screenshotUrl: tradeData.screenshot_url || '',
        tagIds: tradeData.tag_ids || [],
      });
    }
  }, [tradeData]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => tradesAPI.update(Number(id), data),
    onSuccess: () => {
      // Invalidate queries (marks them stale) instead of awaiting refetch
      // They will refresh when the user navigates to those pages
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['trade', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/trades');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      accountId: formData.accountId ? parseInt(formData.accountId) : undefined,
      entryPrice: parseFloat(formData.entryPrice),
      exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : undefined,
      quantity: parseFloat(formData.quantity),
      stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : undefined,
      takeProfit: formData.takeProfit ? parseFloat(formData.takeProfit) : undefined,
      fees: parseFloat(formData.fees),
      pnl: formData.pnl ? parseFloat(formData.pnl) : undefined,
      mfe: formData.mfe ? parseFloat(formData.mfe) : undefined,
      exitDate: formData.exitDate || undefined,
      marketType: formData.marketType || undefined,
      screenshotUrl: formData.screenshotUrl || undefined,
    };

    updateMutation.mutate(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Please choose an image smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, screenshotUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setFormData(prev => ({ ...prev, screenshotUrl: '' }));
  };

  // Handle paste from clipboard (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (!file) continue;

          if (file.size > 5 * 1024 * 1024) {
            alert('Please choose an image smaller than 5MB.');
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            setFormData(prev => ({ ...prev, screenshotUrl: reader.result as string }));
          };
          reader.readAsDataURL(file);

          e.preventDefault();
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  if (isLoadingTrade) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Edit Trade</h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">Update trade details in your journal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4 sm:space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="md:col-span-2">
              <label className="label">Trading Account *</label>
              <select
                name="accountId"
                className="input"
                value={formData.accountId}
                onChange={handleChange}
                required
              >
                <option value="">Select an account...</option>
                {accounts?.data?.map((account: any) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.account_type}) - ${Number(account.current_balance).toLocaleString()}
                  </option>
                ))}
              </select>
              {(!accounts?.data || accounts.data.length === 0) && (
                <p className="text-sm text-red-600 mt-1">
                  No accounts found. Please create an account in Settings first.
                </p>
              )}
            </div>

            <div>
              <label className="label">Symbol *</label>
              <input
                type="text"
                name="symbol"
                className="input"
                value={formData.symbol}
                onChange={handleChange}
                required
                placeholder="AAPL"
              />
            </div>

            <div>
              <label className="label">Side *</label>
              <select name="side" className="input" value={formData.side} onChange={handleChange} required>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </div>

            <div>
              <label className="label">Entry Date *</label>
              <input
                type="datetime-local"
                name="entryDate"
                className="input"
                value={formData.entryDate}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="label">Exit Date</label>
              <input
                type="datetime-local"
                name="exitDate"
                className="input"
                value={formData.exitDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label">Status *</label>
              <select name="status" className="input" value={formData.status} onChange={handleChange} required>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="label">Market Type</label>
              <select name="marketType" className="input" value={formData.marketType} onChange={handleChange}>
                <option value="">Select...</option>
                <option value="STOCKS">Stocks</option>
                <option value="FOREX">Forex</option>
                <option value="CRYPTO">Crypto</option>
                <option value="FUTURES">Futures</option>
                <option value="OPTIONS">Options</option>
              </select>
            </div>
          </div>
        </div>

        {/* Trade Details */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Trade Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="label">Entry Price *</label>
              <input
                type="number"
                step="0.01"
                name="entryPrice"
                className="input"
                value={formData.entryPrice}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="label">Exit Price</label>
              <input
                type="number"
                step="0.01"
                name="exitPrice"
                className="input"
                value={formData.exitPrice}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label">Quantity *</label>
              <input
                type="number"
                step="0.01"
                name="quantity"
                className="input"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="label">Fees</label>
              <input
                type="number"
                step="0.01"
                name="fees"
                className="input"
                value={formData.fees}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label">P&L (Profit/Loss)</label>
              <input
                type="number"
                step="0.01"
                name="pnl"
                className="input"
                value={formData.pnl}
                onChange={handleChange}
                placeholder="Enter profit or loss amount"
              />
              <p className="text-xs text-slate-500 mt-1">
                Optional: Manually enter P&L or leave blank to calculate automatically
              </p>
            </div>

            <div>
              <label className="label">MFE (Max Favorable Excursion)</label>
              <input
                type="number"
                step="0.01"
                name="mfe"
                className="input"
                value={formData.mfe}
                onChange={handleChange}
                placeholder="Enter MFE value"
              />
              <p className="text-xs text-slate-500 mt-1">
                Optional: Maximum profit reached during trade
              </p>
            </div>

            <div>
              <label className="label">Stop Loss</label>
              <input
                type="number"
                step="0.01"
                name="stopLoss"
                className="input"
                value={formData.stopLoss}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label">Take Profit</label>
              <input
                type="number"
                step="0.01"
                name="takeProfit"
                className="input"
                value={formData.takeProfit}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Strategy */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Strategy & Setup</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="label">Strategy</label>
              <select
                name="strategy"
                className="input"
                value={isCustomStrategy ? '__custom__' : formData.strategy}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomStrategy(true);
                    setFormData({ ...formData, strategy: '' });
                  } else {
                    setIsCustomStrategy(false);
                    setFormData({ ...formData, strategy: e.target.value });
                  }
                }}
              >
                <option value="">Select a strategy...</option>
                {strategies?.filter((s: any) => s.is_active === 1).map((strategy: any) => (
                  <option key={strategy.id} value={strategy.name}>
                    {strategy.name}
                  </option>
                ))}
                <option value="__custom__">Custom (type below)</option>
              </select>
              {isCustomStrategy && (
                <input
                  type="text"
                  name="strategy"
                  className="input mt-2"
                  value={formData.strategy}
                  onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                  placeholder="Enter custom strategy name..."
                  autoFocus
                />
              )}
            </div>

            <div>
              <label className="label">Setup</label>
              <input
                type="text"
                name="setup"
                className="input"
                value={formData.setup}
                onChange={handleChange}
                placeholder="Bull flag, Support bounce, etc."
              />
            </div>

            <div>
              <label className="label">Timeframe</label>
              <input
                type="text"
                name="timeframe"
                className="input"
                value={formData.timeframe}
                onChange={handleChange}
                placeholder="5m, 1h, 1D, etc."
              />
            </div>

            <div>
              <label className="label">Broker</label>
              <input
                type="text"
                name="broker"
                className="input"
                value={formData.broker}
                onChange={handleChange}
              />
            </div>

            {/* Tags Selector */}
            <div className="md:col-span-3">
              <label className="label">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags?.data && tags.data.length > 0 ? (
                  tags.data.map((tag: any) => {
                    const isSelected = formData.tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            tagIds: isSelected
                              ? prev.tagIds.filter(id => id !== tag.id)
                              : [...prev.tagIds, tag.id]
                          }));
                        }}
                        className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                          isSelected
                            ? 'ring-2 ring-offset-1'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                          border: `1px solid ${tag.color}40`
                        } as React.CSSProperties}
                      >
                        {tag.name}
                        {isSelected && (
                          <span className="ml-1.5 font-bold">✓</span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500">No tags available. Create tags in Settings.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trade Capture */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Trade Capture</h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">
            Attach a screenshot of your execution or chart for quick visual context.
          </p>

          {formData.screenshotUrl ? (
            <div className="space-y-2 sm:space-y-3">
              <div className="relative w-full overflow-hidden rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50">
                <img
                  src={formData.screenshotUrl}
                  alt="Uploaded trade screenshot preview"
                  className="w-full object-contain max-h-[280px] sm:max-h-[420px] bg-slate-100"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <a
                  href={formData.screenshotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary inline-flex items-center justify-center text-sm sm:text-base"
                >
                  Open Full Size
                </a>
                <button
                  type="button"
                  onClick={handleRemoveScreenshot}
                  className="btn btn-danger inline-flex items-center justify-center text-sm sm:text-base"
                >
                  Remove Screenshot
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-36 sm:h-48 border-2 border-dashed border-slate-300 rounded-lg sm:rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="text-center px-4">
                <p className="font-semibold text-slate-700 text-sm sm:text-base">Click to upload or press Ctrl+V</p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">PNG, JPG, or GIF up to 5MB</p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleScreenshotUpload}
              />
            </label>
          )}
        </div>

        {/* Notes */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Notes & Analysis</h3>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="label">Entry Reasoning</label>
              <textarea
                name="entryReasoning"
                className="input"
                rows={3}
                value={formData.entryReasoning}
                onChange={handleChange}
                placeholder="Why did you enter this trade?"
              />
            </div>

            <div>
              <label className="label">Exit Reasoning</label>
              <textarea
                name="exitReasoning"
                className="input"
                rows={3}
                value={formData.exitReasoning}
                onChange={handleChange}
                placeholder="Why did you exit this trade?"
              />
            </div>

            <div>
              <label className="label">General Notes</label>
              <textarea
                name="notes"
                className="input"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional notes..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Updating...' : 'Update Trade'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary w-full sm:w-auto">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
