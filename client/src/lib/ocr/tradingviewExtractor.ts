import { createWorker, PSM, type Worker } from 'tesseract.js';

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

interface TesseractWord {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

const collectWords = (page: any): TesseractWord[] => {
  if (page?.words && Array.isArray(page.words)) {
    return page.words as TesseractWord[];
  }

  const words: TesseractWord[] = [];
  page?.blocks?.forEach((block: any) => {
    block?.paragraphs?.forEach((paragraph: any) => {
      paragraph?.lines?.forEach((line: any) => {
        line?.words?.forEach((word: any) => {
          if (word?.text && word?.bbox) {
            words.push(word as TesseractWord);
          }
        });
      });
    });
  });

  return words;
};

let workerPromise: Promise<Worker> | null = null;
let workerQueue: Promise<unknown> = Promise.resolve();

const getWorker = async (): Promise<Worker> => {
  if (!workerPromise) {
    workerPromise = (async () => {
      const basePath = import.meta.env.BASE_URL.endsWith('/')
        ? import.meta.env.BASE_URL
        : `${import.meta.env.BASE_URL}/`;
      const worker = await createWorker('eng', 1, {
        workerPath: `${basePath}ocr/worker.min.js`,
        corePath: `${basePath}ocr/tesseract-core.wasm.js`,
        langPath: `${basePath}ocr`,
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
  const cleaned = text.replace(/[^0-9.,]/g, '').replace(/,/g, '');
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

    const scale = image.width < 2000 ? 2000 / image.width : 1;
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

    const roiX = Math.floor(width * 0.65);
    const roiW = Math.floor(width * 0.35);
    const roiH = height;
    const roiCanvas = document.createElement('canvas');
    roiCanvas.width = roiW;
    roiCanvas.height = roiH;
    const roiCtx = roiCanvas.getContext('2d');
    if (!roiCtx) {
      throw new Error('Failed to initialize ROI canvas');
    }
    roiCtx.drawImage(canvas, roiX, 0, roiW, roiH, 0, 0, roiW, roiH);

    const recognizeWords = async (source: HTMLCanvasElement, psm: PSM) => {
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789.,',
        tessedit_pageseg_mode: psm,
        user_defined_dpi: '200',
      });
      const data = await worker.recognize(source);
      return collectWords(data.data);
    };

    let numericWords = await recognizeWords(roiCanvas, PSM.SINGLE_BLOCK);
    if (numericWords.length === 0) {
      numericWords = await recognizeWords(roiCanvas, PSM.SPARSE_TEXT);
    }

    const candidates: NumericCandidate[] = [];
    numericWords.forEach((word) => {
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
      const fullWords = await recognizeWords(canvas, PSM.SPARSE_TEXT);
      fullWords.forEach((word) => {
        const value = toNumber(word.text);
        if (value === undefined) return;
        const bbox = word.bbox;
        if ((bbox.x0 + bbox.x1) / 2 < width * 0.6) return;
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
    }

    const detectColorRegions = (targetColor: CandidateColor) => {
      const downscale = 3;
      const dw = Math.floor(image.width / downscale);
      const dh = Math.floor(image.height / downscale);
      const small = document.createElement('canvas');
      small.width = dw;
      small.height = dh;
      const smallCtx = small.getContext('2d');
      if (!smallCtx) return [];
      smallCtx.drawImage(image, 0, 0, dw, dh);
      const data = smallCtx.getImageData(0, 0, dw, dh).data;

      const mask = new Uint8Array(dw * dh);
      for (let y = 0; y < dh; y++) {
        for (let x = 0; x < dw; x++) {
          const idx = (y * dw + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const { h, s, v } = rgbToHsv(r, g, b);
          const isGreen = h >= 80 && h <= 160 && s > 0.25 && v > 0.2;
          const isRed = (h <= 20 || h >= 340) && s > 0.25 && v > 0.2;
          if ((targetColor === 'green' && isGreen) || (targetColor === 'red' && isRed)) {
            mask[y * dw + x] = 1;
          }
        }
      }

      const visited = new Uint8Array(dw * dh);
      const boxes: { x0: number; y0: number; x1: number; y1: number }[] = [];
      const stack: number[] = [];

      for (let y = 0; y < dh; y++) {
        for (let x = 0; x < dw; x++) {
          const idx = y * dw + x;
          if (!mask[idx] || visited[idx]) continue;

          let minX = x;
          let maxX = x;
          let minY = y;
          let maxY = y;
          visited[idx] = 1;
          stack.push(idx);

          while (stack.length) {
            const current = stack.pop()!;
            const cx = current % dw;
            const cy = Math.floor(current / dw);
            minX = Math.min(minX, cx);
            maxX = Math.max(maxX, cx);
            minY = Math.min(minY, cy);
            maxY = Math.max(maxY, cy);

            const neighbors = [
              current - 1,
              current + 1,
              current - dw,
              current + dw,
            ];
            neighbors.forEach((n) => {
              if (n < 0 || n >= mask.length) return;
              if (visited[n] || !mask[n]) return;
              visited[n] = 1;
              stack.push(n);
            });
          }

          const w = maxX - minX + 1;
          const h = maxY - minY + 1;
          if (w < 8 || h < 8) continue;
          boxes.push({
            x0: minX * downscale,
            y0: minY * downscale,
            x1: (maxX + 1) * downscale,
            y1: (maxY + 1) * downscale,
          });
        }
      }

      return boxes;
    };

    if (candidates.length === 0) {
      const redBoxes = detectColorRegions('red');
      const greenBoxes = detectColorRegions('green');
      const coloredBoxes = [...redBoxes.map((b) => ({ ...b, color: 'red' as CandidateColor })), ...greenBoxes.map((b) => ({ ...b, color: 'green' as CandidateColor }))];

      for (const box of coloredBoxes) {
        if ((box.x0 + box.x1) / 2 < image.width * 0.55) continue;
        const padding = 6;
        const left = clamp(box.x0 - padding, 0, image.width);
        const top = clamp(box.y0 - padding, 0, image.height);
        const right = clamp(box.x1 + padding, 0, image.width);
        const bottom = clamp(box.y1 + padding, 0, image.height);

        const cropW = right - left;
        const cropH = bottom - top;
        if (cropW <= 0 || cropH <= 0) continue;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropW * scale;
        cropCanvas.height = cropH * scale;
        const cropCtx = cropCanvas.getContext('2d');
        if (!cropCtx) continue;
        cropCtx.drawImage(
          image,
          left,
          top,
          cropW,
          cropH,
          0,
          0,
          cropCanvas.width,
          cropCanvas.height
        );

        await worker.setParameters({
          tessedit_char_whitelist: '0123456789.,',
          tessedit_pageseg_mode: PSM.SINGLE_LINE,
          user_defined_dpi: '240',
        });
        const cropData = await worker.recognize(cropCanvas);
        const words = collectWords(cropData.data);
        const best = words
          .map((word) => ({ value: toNumber(word.text), confidence: word.confidence }))
          .filter((entry) => entry.value !== undefined)
          .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0];

        if (best?.value !== undefined) {
          candidates.push({
            value: best.value,
            confidence: best.confidence ?? 0,
            bbox: {
              x0: left * scale,
              y0: top * scale,
              x1: right * scale,
              y1: bottom * scale,
            },
            color: box.color,
          });
        }
      }
    }

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

    const recognizeSymbolWords = async (psm: PSM) => {
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/',
        tessedit_pageseg_mode: psm,
        user_defined_dpi: '200',
      });
      const data = await worker.recognize(bandCanvas);
      return collectWords(data.data);
    };

    let symbolWords = await recognizeSymbolWords(PSM.SINGLE_BLOCK);
    if (symbolWords.length === 0) {
      symbolWords = await recognizeSymbolWords(PSM.SPARSE_TEXT);
    }
    const symbolText = symbolWords.map((w) => w.text).join(' ');
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
