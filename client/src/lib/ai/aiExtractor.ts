import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

/**
 * Extract trading position data from a TradingView screenshot using AI
 * @param base64Image - Base64 encoded image data URL (data:image/png;base64,...)
 * @returns Promise with extraction result
 */
export async function extractTradingViewPosition(
  base64Image: string
): Promise<ExtractionResult> {
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    // Call the server API endpoint
    const response = await axios.post(
      `${API_URL}/extract/screenshot`,
      { image: base64Image },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Extraction failed');
    }

    return response.data.data as ExtractionResult;
  } catch (error) {
    console.error('AI extraction error:', error);

    // Return error result
    if (axios.isAxiosError(error)) {
      return {
        confidence: 0,
        warnings: [
          `API Error: ${error.response?.data?.error || error.message}`,
          'Failed to extract trading data from screenshot',
        ],
      };
    }

    return {
      confidence: 0,
      warnings: [
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Failed to extract trading data from screenshot',
      ],
    };
  }
}
