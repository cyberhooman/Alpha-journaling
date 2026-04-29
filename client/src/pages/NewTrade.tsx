import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UploadSimple, X, Check } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { tradesAPI, tagsAPI, accountsAPI, strategiesAPI } from '../lib/api';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' },
  }),
};

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-xs uppercase tracking-widest font-semibold mb-4 pb-3 border-b"
      style={{ color: 'var(--color-accent)', borderColor: 'var(--color-border)' }}
    >
      {children}
    </h3>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
      {children}
    </p>
  );
}

export default function NewTrade() {
  const navigate = useNavigate();
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

  const { data: strategies } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      const response = await strategiesAPI.getAll();
      return response.data;
    },
  });

  const [simpleMode, setSimpleMode] = useState(false);
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
    rewardRiskRatio: '',
    fees: '0',
    pnl: '',
    mfe: '',
    mae: '',
    status: 'OPEN' as 'OPEN' | 'CLOSED' | 'CANCELLED',
    strategy: '',
    setup: '',
    timeframe: '',
    marketType: '' as 'STOCKS' | 'FOREX' | 'CRYPTO' | 'FUTURES' | 'OPTIONS' | '',
    notes: '',
    entryReasoning: '',
    exitReasoning: '',
    screenshotUrl: '',
    tagIds: [] as number[],
  });

  const calculateRewardRisk = (entry?: number, stopLoss?: number, takeProfit?: number) => {
    if (entry === undefined || stopLoss === undefined || takeProfit === undefined) return '';
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(takeProfit - entry);
    if (!Number.isFinite(risk) || risk === 0) return '';
    return (reward / risk).toFixed(2);
  };

  useEffect(() => {
    const entry = Number.parseFloat(formData.entryPrice);
    const stopLoss = Number.parseFloat(formData.stopLoss);
    const takeProfit = Number.parseFloat(formData.takeProfit);

    const rr = calculateRewardRisk(
      Number.isFinite(entry) ? entry : undefined,
      Number.isFinite(stopLoss) ? stopLoss : undefined,
      Number.isFinite(takeProfit) ? takeProfit : undefined
    );

    if (rr !== formData.rewardRiskRatio) {
      setFormData((prev) => ({ ...prev, rewardRiskRatio: rr }));
    }
  }, [formData.entryPrice, formData.stopLoss, formData.takeProfit]);

  useEffect(() => {
    if (accounts?.data && accounts.data.length > 0 && !formData.accountId) {
      const activeAccount = accounts.data.find((acc: any) => acc.is_active);
      if (activeAccount) {
        setFormData(prev => ({ ...prev, accountId: String(activeAccount.id) }));
      } else {
        setFormData(prev => ({ ...prev, accountId: String(accounts.data[0].id) }));
      }
    }
  }, [accounts, formData.accountId]);

  const createMutation = useMutation({
    mutationFn: (data: any) => tradesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['recent-trades'] });
      navigate('/trades');
    },
    onError: (error: any) => {
      console.error('Create trade error:', error);
      alert('Failed to create trade: ' + (error.response?.data?.error || error.message));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const safeParseFloat = (value: string): number | undefined => {
      if (!value || value.trim() === '') return undefined;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? undefined : parsed;
    };

    const safeParseInt = (value: string): number | undefined => {
      if (!value || value.trim() === '') return undefined;
      const parsed = parseInt(value);
      return isNaN(parsed) ? undefined : parsed;
    };

    const data = {
      ...formData,
      accountId: safeParseInt(formData.accountId),
      entryPrice: safeParseFloat(formData.entryPrice),
      exitPrice: safeParseFloat(formData.exitPrice),
      quantity: safeParseFloat(formData.quantity) ?? (simpleMode ? 1 : undefined),
      stopLoss: safeParseFloat(formData.stopLoss),
      takeProfit: safeParseFloat(formData.takeProfit),
      fees: safeParseFloat(formData.fees) ?? 0,
      pnl: safeParseFloat(formData.pnl),
      mfe: safeParseFloat(formData.mfe),
      mae: safeParseFloat(formData.mae),
      rewardRiskRatio: safeParseFloat(formData.rewardRiskRatio),
      exitDate: formData.exitDate || undefined,
      marketType: formData.marketType || undefined,
      screenshotUrl: formData.screenshotUrl || undefined,
      status: simpleMode ? 'CLOSED' : formData.status,
    };

    createMutation.mutate(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Please choose an image smaller than 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => setFormData(prev => ({ ...prev, screenshotUrl: reader.result as string }));
    reader.onerror = () => alert('Failed to read the image file. Please try again.');
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setFormData(prev => ({ ...prev, screenshotUrl: '' }));
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (!file) continue;
          if (file.size > 5 * 1024 * 1024) { alert('Please choose an image smaller than 5MB.'); return; }
          const reader = new FileReader();
          reader.onload = () => setFormData(prev => ({ ...prev, screenshotUrl: reader.result as string }));
          reader.onerror = () => alert('Failed to read the pasted image. Please try again.');
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Page Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg transition-colors flex-shrink-0"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
        >
          <ArrowLeft weight="bold" size={18} />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Journal
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            New Trade
          </h1>
        </div>
      </motion.div>

      <motion.form
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        onSubmit={handleSubmit}
        className="rounded-xl p-5 sm:p-6 space-y-8"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* Mode Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {simpleMode ? 'Quick Entry Mode' : 'Detailed Entry Mode'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {simpleMode ? 'Essential fields only' : 'All fields available'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSimpleMode(!simpleMode)}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
            style={{ background: !simpleMode ? 'rgb(var(--accent))' : 'rgba(128,128,128,0.35)' }}
          >
            <span
              className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow"
              style={{ transform: !simpleMode ? 'translateX(24px)' : 'translateX(4px)' }}
            />
          </button>
        </div>

        {/* Basic Info */}
        <div>
          <SectionHeader>{simpleMode ? 'Trade Information' : 'Basic Information'}</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Trading Account *</label>
              <select name="accountId" className="input" value={formData.accountId} onChange={handleChange} required>
                <option value="">Select an account...</option>
                {accounts?.data?.map((account: any) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.account_type}) - ${Number(account.current_balance).toLocaleString()}
                  </option>
                ))}
              </select>
              {(!accounts?.data || accounts.data.length === 0) && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-red)' }}>
                  No accounts found. Please create an account in Settings first.
                </p>
              )}
            </div>

            <div>
              <label className="label">Symbol (Pair) *</label>
              <input
                type="text"
                name="symbol"
                className="input"
                value={formData.symbol}
                onChange={handleChange}
                required
                placeholder="e.g., GBPJPY, EURUSD, AAPL"
              />
            </div>

            {!simpleMode && (
              <div>
                <label className="label">Side *</label>
                <select name="side" className="input" value={formData.side} onChange={handleChange} required>
                  <option value="LONG">Long</option>
                  <option value="SHORT">Short</option>
                </select>
              </div>
            )}

            <div>
              <label className="label">{simpleMode ? 'Date *' : 'Entry Date *'}</label>
              <input
                type="datetime-local"
                name="entryDate"
                className="input"
                value={formData.entryDate}
                onChange={handleChange}
                required
              />
            </div>

            {!simpleMode && (
              <>
                <div>
                  <label className="label">Exit Date</label>
                  <input type="datetime-local" name="exitDate" className="input" value={formData.exitDate} onChange={handleChange} />
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
              </>
            )}
          </div>
        </div>

        {/* Detailed: Trade Details */}
        {!simpleMode && (
          <div>
            <SectionHeader>Trade Details</SectionHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Entry Price *</label>
                <input type="number" step="0.01" name="entryPrice" className="input" value={formData.entryPrice} onChange={handleChange} required />
              </div>
              <div>
                <label className="label">Exit Price</label>
                <input type="number" step="0.01" name="exitPrice" className="input" value={formData.exitPrice} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Quantity *</label>
                <input type="number" step="0.01" name="quantity" className="input" value={formData.quantity} onChange={handleChange} required />
              </div>
              <div>
                <label className="label">Fees</label>
                <input type="number" step="0.01" name="fees" className="input" value={formData.fees} onChange={handleChange} />
              </div>
              <div>
                <label className="label">P&L (Profit/Loss)</label>
                <input type="number" step="0.01" name="pnl" className="input" value={formData.pnl} onChange={handleChange} placeholder="Enter profit or loss amount" />
                <FieldHint>Optional: Manually enter P&L or leave blank to calculate automatically</FieldHint>
              </div>
              <div>
                <label className="label">MFE (Max Favorable Excursion)</label>
                <input type="number" step="0.01" name="mfe" className="input" value={formData.mfe} onChange={handleChange} placeholder="Enter MFE value" />
                <FieldHint>Optional: Maximum profit reached during trade</FieldHint>
              </div>
              <div>
                <label className="label">MAE (Max Adverse Excursion)</label>
                <input type="number" step="0.01" name="mae" className="input" value={formData.mae} onChange={handleChange} placeholder="Enter MAE value" />
                <FieldHint>Optional: Maximum loss reached during trade</FieldHint>
              </div>
              <div>
                <label className="label">Stop Loss</label>
                <input type="number" step="0.01" name="stopLoss" className="input" value={formData.stopLoss} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Take Profit</label>
                <input type="number" step="0.01" name="takeProfit" className="input" value={formData.takeProfit} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Reward:Risk</label>
                <input
                  type="text"
                  name="rewardRiskRatio"
                  className="input font-mono-nums opacity-70"
                  value={formData.rewardRiskRatio}
                  readOnly
                  placeholder="Auto-calculated"
                />
                <FieldHint>Calculated from entry, stop loss, and take profit.</FieldHint>
              </div>
            </div>
          </div>
        )}

        {/* Simple mode: Prices & Results */}
        {simpleMode && (
          <div>
            <SectionHeader>Prices & Results</SectionHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Entry Price</label>
                <input type="number" step="0.01" name="entryPrice" className="input" value={formData.entryPrice} onChange={handleChange} placeholder="Optional" />
              </div>
              <div>
                <label className="label">Exit Price</label>
                <input type="number" step="0.01" name="exitPrice" className="input" value={formData.exitPrice} onChange={handleChange} placeholder="Optional" />
              </div>
              <div>
                <label className="label">P&L (Profit/Loss) *</label>
                <input type="number" step="0.01" name="pnl" className="input" value={formData.pnl} onChange={handleChange} placeholder="Enter profit or loss amount" required={simpleMode} />
              </div>
              <div>
                <label className="label">MFE (Max Favorable Excursion)</label>
                <input type="number" step="0.01" name="mfe" className="input" value={formData.mfe} onChange={handleChange} placeholder="Optional" />
              </div>
              <div>
                <label className="label">MAE (Max Adverse Excursion)</label>
                <input type="number" step="0.01" name="mae" className="input" value={formData.mae} onChange={handleChange} placeholder="Optional" />
              </div>
            </div>
          </div>
        )}

        {/* Strategy */}
        <div>
          <SectionHeader>{simpleMode ? 'Strategy & Notes' : 'Strategy & Setup'}</SectionHeader>
          <div className={`grid grid-cols-1 gap-4 ${!simpleMode ? 'sm:grid-cols-2 md:grid-cols-3' : ''}`}>
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
                  <option key={strategy.id} value={strategy.name}>{strategy.name}</option>
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

            {!simpleMode && (
              <>
                <div>
                  <label className="label">Setup</label>
                  <input type="text" name="setup" className="input" value={formData.setup} onChange={handleChange} placeholder="Bull flag, Support bounce, etc." />
                </div>
                <div>
                  <label className="label">Timeframe</label>
                  <input type="text" name="timeframe" className="input" value={formData.timeframe} onChange={handleChange} placeholder="5m, 1h, 1D, etc." />
                </div>
              </>
            )}

            {/* Tags */}
            <div className={simpleMode ? '' : 'md:col-span-3'}>
              <label className="label">Tags</label>
              <div className="flex flex-wrap gap-2">
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
                              : [...prev.tagIds, tag.id],
                          }));
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full transition-all"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                          border: `1px solid ${tag.color}40`,
                          opacity: isSelected ? 1 : 0.55,
                        }}
                      >
                        {isSelected && <Check size={11} weight="bold" className="mr-1.5" />}
                        {tag.name}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No tags available. Create tags in Settings.</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className={simpleMode ? '' : 'md:col-span-3'}>
              <label className="label">Notes{simpleMode ? ' — Why trade succeeded or failed' : ''}</label>
              <textarea
                name="notes"
                className="input"
                rows={simpleMode ? 4 : 3}
                value={formData.notes}
                onChange={handleChange}
                placeholder={simpleMode ? 'Explain what worked or what went wrong with this trade...' : 'General notes about this trade'}
              />
            </div>

            {/* Screenshot in Simple Mode */}
            {simpleMode && (
              <div>
                <label className="label">Screenshot</label>
                {formData.screenshotUrl ? (
                  <div className="space-y-2">
                    <div className="relative w-full overflow-hidden rounded-lg" style={{ border: '1px solid var(--color-border)', background: '#0a0a0a' }}>
                      <img src={formData.screenshotUrl} alt="Trade screenshot" className="w-full object-contain max-h-[200px]" />
                    </div>
                    <button type="button" onClick={handleRemoveScreenshot} className="btn btn-danger text-sm inline-flex items-center gap-1.5">
                      <X size={13} weight="bold" /> Remove
                    </button>
                  </div>
                ) : (
                  <label
                    className="flex flex-col items-center justify-center w-full h-24 rounded-lg cursor-pointer transition-colors"
                    style={{
                      border: '2px dashed var(--color-border)',
                      background: 'var(--color-surface-2)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                  >
                    <UploadSimple size={20} style={{ color: 'var(--color-text-secondary)' }} className="mb-1" />
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Click to upload or Ctrl+V</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>PNG, JPG up to 5MB</p>
                    <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotUpload} />
                  </label>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Screenshot (Detailed Mode) */}
        {!simpleMode && (
          <div>
            <SectionHeader>Trade Capture</SectionHeader>
            <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Attach a screenshot of your execution or chart for quick visual context.
            </p>
            {formData.screenshotUrl ? (
              <div className="space-y-3">
                <div className="relative w-full overflow-hidden rounded-xl" style={{ border: '1px solid var(--color-border)', background: '#0a0a0a' }}>
                  <img src={formData.screenshotUrl} alt="Uploaded trade screenshot preview" className="w-full object-contain max-h-[420px]" />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a href={formData.screenshotUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary inline-flex items-center justify-center gap-2 text-sm">
                    Open Full Size
                  </a>
                  <button type="button" onClick={handleRemoveScreenshot} className="btn btn-danger inline-flex items-center justify-center gap-2 text-sm">
                    <X size={13} weight="bold" /> Remove Screenshot
                  </button>
                </div>
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center w-full h-44 rounded-xl cursor-pointer transition-colors"
                style={{ border: '2px dashed var(--color-border)', background: 'var(--color-surface-2)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              >
                <UploadSimple size={28} style={{ color: 'var(--color-text-secondary)' }} className="mb-2" />
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Click to upload or press Ctrl+V</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>PNG, JPG, or GIF up to 5MB</p>
                <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotUpload} />
              </label>
            )}
          </div>
        )}

        {/* Notes & Analysis (Detailed Mode) */}
        {!simpleMode && (
          <div>
            <SectionHeader>Notes & Analysis</SectionHeader>
            <div className="space-y-4">
              <div>
                <label className="label">Entry Reasoning</label>
                <textarea name="entryReasoning" className="input" rows={3} value={formData.entryReasoning} onChange={handleChange} placeholder="Why did you enter this trade?" />
              </div>
              <div>
                <label className="label">Exit Reasoning</label>
                <textarea name="exitReasoning" className="input" rows={3} value={formData.exitReasoning} onChange={handleChange} placeholder="Why did you exit this trade?" />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Trade'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary w-full sm:w-auto">
            Cancel
          </button>
        </div>
      </motion.form>
    </div>
  );
}
