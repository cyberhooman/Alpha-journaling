import { createWorker, type Worker } from 'tesseract.js';

export type TradeSide = 'LONG' | 'SHORT';

export interface ExtractionResult {
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  symbol?: string;
  side?: TradeSide;
  rewardRiskRatio?: number;
  confidence: number;
  warnings: string[];
}

type CandidateColor = 'red' | 'green' | 'neutral';

interface NumericCandidate {
  value: number;
  confidence: number; // 0-100 from OCR
  bbox: { x0: number; y0: number; x1: number; y1: number };
  color: CandidateColor;
}

let workerPromise: Promise<Worker> | null = null;
let workerQueue: Promise<unknown> = Promise.resolve();

const getWorker = async (): Promise<Worker> => {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng', 1, {
        workerPath: new URL('tesseract.js/dist/worker.min.js', import.meta.url).toString(),
        corePath: new URL('tesseract.js-core/tesseract-core.wasm.js', import.meta.url).toString(),
        langPath: `${import.meta.env.BASE_URL}ocr`,
        gzip: true,
        logger: () => undefined,
      });
      return worker;
    })();
  }
  return workerPromise;
};

const withWorker = async <T>(task: (worker: Worker) => Promise<T>): Promise<T> => {
  const worker = await getWorker();
  const run = () => task(worker);
  const result = workerQueue.then(run, run);
  workerQueue = result.then(() => undefined, () => undefined);
  return result;
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const rgbToHsv = (r: number, g: number, b: number) => {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) h = ((gNorm - bNorm) / delta) % 6;
    else if (max === gNorm) h = (bNorm - rNorm) / delta + 2;
    else h = (rNorm - gNorm) / delta + 4;
    h *= 60;
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h, s, v };
};

const classifyColor = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
): CandidateColor => {
  const size = 6;
  const half = Math.floor(size / 2);
  const x0 = clamp(Math.round(x) - half, 0, ctx.canvas.width - 1);
  const y0 = clamp(Math.round(y) - half, 0, ctx.canvas.height - 1);
  const w = clamp(size, 1, ctx.canvas.width - x0);
  const h = clamp(size, 1, ctx.canvas.height - y0);
  const data = ctx.getImageData(x0, y0, w, h).data;

  let r = 0;
  let g = 0;
  let b = 0;
  const total = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  r /= total;
  g /= total;
  b /= total;

  const { h: hue, s, v } = rgbToHsv(r, g, b);

  const isGreen = hue >= 80 && hue <= 160 && s > 0.3 && v > 0.2;
  const isRed = (hue <= 20 || hue >= 340) && s > 0.3 && v > 0.2;

  if (isGreen) return 'green';
  if (isRed) return 'red';
  return 'neutral';
};

const median = (values: number[]) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const toNumber = (text: string) => {
  const cleaned = text.replace(/[^0-9.]/g, '');
  if (!cleaned) return undefined;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const calculateRewardRisk = (entry?: number, stopLoss?: number, takeProfit?: number) => {
  if (entry === undefined || stopLoss === undefined || takeProfit === undefined) return undefined;
  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(takeProfit - entry);
  if (!Number.isFinite(risk) || risk === 0) return undefined;
  return reward / risk;
};

export const extractTradingViewPosition = async (dataUrl: string): Promise<ExtractionResult> => {
  return withWorker(async (worker) => {
    const warnings: string[] = [];
    const image = await loadImage(dataUrl);

    const scale = image.width < 1600 ? 1600 / image.width : 1;
    const width = Math.round(image.width * scale);
    const height = Math.round(image.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to initialize canvas');
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(image, 0, 0, width, height);

    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = image.width;
    colorCanvas.height = image.height;
    const colorCtx = colorCanvas.getContext('2d');
    if (!colorCtx) {
      throw new Error('Failed to initialize color canvas');
    }
    colorCtx.drawImage(image, 0, 0, image.width, image.height);

    const roiX = Math.floor(width * 0.75);
    const roiW = Math.floor(width * 0.25);
    const roiH = height;
    const roiCanvas = document.createElement('canvas');
    roiCanvas.width = roiW;
    roiCanvas.height = roiH;
    const roiCtx = roiCanvas.getContext('2d');
    if (!roiCtx) {
      throw new Error('Failed to initialize ROI canvas');
    }
    roiCtx.drawImage(canvas, roiX, 0, roiW, roiH, 0, 0, roiW, roiH);

    await worker.setParameters({
      tessedit_char_whitelist: '0123456789.',
      tessedit_pageseg_mode: '6',
    });
    const numericData = await worker.recognize(roiCanvas);

    const candidates: NumericCandidate[] = [];
    numericData.data.words.forEach((word) => {
      const value = toNumber(word.text);
      if (value === undefined) return;
      const bbox = {
        x0: word.bbox.x0 + roiX,
        y0: word.bbox.y0,
        x1: word.bbox.x1 + roiX,
        y1: word.bbox.y1,
      };
      const centerX = (bbox.x0 + bbox.x1) / 2;
      const centerY = (bbox.y0 + bbox.y1) / 2;
      const origX = centerX / scale;
      const origY = centerY / scale;
      const color = classifyColor(colorCtx, origX, origY);
      candidates.push({
        value,
        confidence: word.confidence,
        bbox,
        color,
      });
    });

    if (candidates.length === 0) {
      throw new Error('No price labels detected. Make sure the TradingView position tool is visible.');
    }

    const candidateYs = candidates.map((c) => (c.bbox.y0 + c.bbox.y1) / 2);
    const medianY = median(candidateYs);

    const bandHeight = Math.round(height * 0.2);
    const bandY = clamp(Math.round(medianY - bandHeight / 2), 0, height - bandHeight);
    const bandCanvas = document.createElement('canvas');
    bandCanvas.width = width;
    bandCanvas.height = bandHeight;
    const bandCtx = bandCanvas.getContext('2d');
    if (!bandCtx) {
      throw new Error('Failed to initialize band canvas');
    }
    bandCtx.drawImage(canvas, 0, bandY, width, bandHeight, 0, 0, width, bandHeight);

    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/',
      tessedit_pageseg_mode: '6',
    });
    const symbolData = await worker.recognize(bandCanvas);
    const symbolText = symbolData.data.words.map((w) => w.text).join(' ');
    const symbolMatch = symbolText.match(/[A-Z]{3,8}\/?[A-Z]{3,8}/);
    const symbol = symbolMatch ? symbolMatch[0].replace('/', '') : undefined;

    if (!symbol) {
      warnings.push('Symbol not detected.');
    }

    const neutralCandidates = candidates.filter((c) => c.color === 'neutral');
    const entryCandidateSource = neutralCandidates.length ? neutralCandidates : candidates;
    const entryCandidate = entryCandidateSource
      .map((c) => ({ c, distance: Math.abs(((c.bbox.y0 + c.bbox.y1) / 2) - medianY) }))
      .sort((a, b) => a.distance - b.distance || b.c.confidence - a.c.confidence)[0]?.c;

    const greenCandidates = candidates.filter((c) => c.color === 'green');
    const redCandidates = candidates.filter((c) => c.color === 'red');

    const bestGreen = greenCandidates.sort((a, b) => b.confidence - a.confidence)[0];
    const bestRed = redCandidates.sort((a, b) => b.confidence - a.confidence)[0];

    let entry = entryCandidate?.value;
    let takeProfit = bestGreen?.value;
    let stopLoss = bestRed?.value;

    if (!bestGreen || !bestRed) {
      warnings.push('TP/SL colors not detected. Verify the position tool colors.');
    }

    if (entry !== undefined && (!takeProfit || !stopLoss)) {
      const higher = candidates.filter((c) => c.value > entry).sort((a, b) => b.confidence - a.confidence);
      const lower = candidates.filter((c) => c.value < entry).sort((a, b) => b.confidence - a.confidence);
      if (!takeProfit && higher.length > 0) {
        takeProfit = higher[0].value;
      }
      if (!stopLoss && lower.length > 0) {
        stopLoss = lower[0].value;
      }
    }

    let side: TradeSide | undefined;
    if (entry !== undefined && stopLoss !== undefined && takeProfit !== undefined) {
      if (takeProfit > entry && stopLoss < entry) side = 'LONG';
      if (takeProfit < entry && stopLoss > entry) side = 'SHORT';
    }

    if (!side) {
      warnings.push('Side not detected. Please confirm LONG/SHORT.');
    }

    const rewardRiskRatio = calculateRewardRisk(entry, stopLoss, takeProfit);
    if (rewardRiskRatio === undefined) {
      warnings.push('Reward:Risk could not be calculated.');
    }

    const used = [entryCandidate, bestGreen, bestRed].filter(Boolean) as NumericCandidate[];
    const confidence = used.length
      ? used.reduce((sum, c) => sum + c.confidence, 0) / (used.length * 100)
      : 0;

    return {
      entry,
      stopLoss,
      takeProfit,
      symbol,
      side,
      rewardRiskRatio,
      confidence,
      warnings,
    };
  });
};
