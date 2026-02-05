import express from 'express';
import { z } from 'zod';
import { extractTradingViewPosition } from '../services/aiExtractor.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Validation schema for extraction request
const extractionRequestSchema = z.object({
  image: z.string().min(1, 'Image data is required'),
});

/**
 * POST /api/extract/screenshot
 * Extract trading position data from a screenshot using AI
 */
router.post('/screenshot', authenticateToken, async (req, res) => {
  try {
    // Validate request body
    const validationResult = extractionRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validationResult.error.errors,
      });
    }

    const { image } = validationResult.data;

    // Validate base64 image format
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image format. Must be a base64 data URL',
      });
    }

    // Extract trading data using AI
    const result = await extractTradingViewPosition(image);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Extraction endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to extract trading data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
