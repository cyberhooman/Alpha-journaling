import { useEffect, useRef, useState } from 'react';
import { extractTradingViewPosition, type ExtractionResult } from '../lib/ai/aiExtractor';

type ExtractionStatus = 'idle' | 'running' | 'success' | 'error';

interface ScreenshotExtractorPanelProps {
  screenshotUrl: string;
  onApply: (result: ExtractionResult, options?: { onlyEmpty?: boolean }) => void;
  autoApply?: boolean;
}

const formatValue = (value?: number) => (value === undefined ? '-' : value.toFixed(5));

export default function ScreenshotExtractorPanel({
  screenshotUrl,
  onApply,
  autoApply = true,
}: ScreenshotExtractorPanelProps) {
  const [status, setStatus] = useState<ExtractionStatus>('idle');
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoApplied, setAutoApplied] = useState(false);
  const lastScreenshotRef = useRef<string | null>(null);

  const runExtraction = async () => {
    if (!screenshotUrl) return;
    setStatus('running');
    setError(null);
    try {
      const extraction = await extractTradingViewPosition(screenshotUrl);
      setResult(extraction);
      setStatus('success');

      if (autoApply) {
        onApply(extraction, { onlyEmpty: true });
        setAutoApplied(true);
      }
    } catch (err: any) {
      console.error('Screenshot extraction failed:', err);
      setStatus('error');
      setError(err?.message || 'Failed to extract values from screenshot.');
    }
  };

  useEffect(() => {
    if (!screenshotUrl) {
      setStatus('idle');
      setResult(null);
      setError(null);
      setAutoApplied(false);
      lastScreenshotRef.current = null;
      return;
    }

    if (lastScreenshotRef.current === screenshotUrl) return;
    lastScreenshotRef.current = screenshotUrl;
    setAutoApplied(false);
    runExtraction();
  }, [screenshotUrl]);

  if (!screenshotUrl) return null;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Screenshot Extraction</h4>
          <p className="text-xs text-slate-500">
            Best with TradingView Long/Short Position tool and visible SL/TP labels.
          </p>
        </div>
        <button
          type="button"
          onClick={runExtraction}
          className="btn btn-secondary text-xs"
          disabled={status === 'running'}
        >
          {status === 'running' ? 'Extracting...' : 'Re-run'}
        </button>
      </div>

      {status === 'running' && (
        <div className="text-sm text-slate-600">Extracting prices from screenshot...</div>
      )}

      {status === 'error' && (
        <div className="text-sm text-red-600">
          {error || 'Could not extract Entry/SL/TP. Please verify the screenshot or fill manually.'}
        </div>
      )}

      {result && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-xs text-slate-500">Symbol</p>
              <p className="font-semibold text-slate-800">{result.symbol || '-'}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-xs text-slate-500">Side</p>
              <p className="font-semibold text-slate-800">{result.side || '-'}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-xs text-slate-500">Entry</p>
              <p className="font-semibold text-slate-800">{formatValue(result.entry)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-xs text-slate-500">Stop Loss</p>
              <p className="font-semibold text-slate-800">{formatValue(result.stopLoss)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-xs text-slate-500">Take Profit</p>
              <p className="font-semibold text-slate-800">{formatValue(result.takeProfit)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-xs text-slate-500">Reward:Risk</p>
              <p className="font-semibold text-slate-800">
                {result.rewardRiskRatio ? result.rewardRiskRatio.toFixed(2) : '-'}
              </p>
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className="text-xs text-amber-600 space-y-1">
              {result.warnings.map((warning, idx) => (
                <p key={idx}>• {warning}</p>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Confidence: {(result.confidence * 100).toFixed(0)}%</span>
            {autoApplied && <span className="text-green-600">Auto-applied to empty fields.</span>}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary text-xs"
              onClick={() => onApply(result)}
            >
              Apply Values
            </button>
            <button
              type="button"
              className="btn btn-secondary text-xs"
              onClick={() => setAutoApplied(false)}
            >
              Keep Manual
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
