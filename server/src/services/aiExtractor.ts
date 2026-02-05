import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI client with DeepSeek configuration
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
});

export interface ExtractionResult {
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  symbol?: string;
  side?: 'LONG' | 'SHORT';
  rewardRiskRatio?: number;
  confidence: number;
  warnings: string[];
}

/**
 * Extract trading position data from a TradingView screenshot using DeepSeek AI
 */
export async function extractTradingViewPosition(
  base64Image: string
): Promise<ExtractionResult> {
  try {
    // Prepare the prompt for DeepSeek
    const prompt = `You are an expert trading analyst. Analyze this TradingView screenshot and extract the following information:

1. **Symbol**: The trading pair or stock ticker (e.g., EURUSD, AAPL, BTCUSDT)
2. **Side**: Whether this is a LONG or SHORT position
3. **Entry Price**: The entry price level
4. **Stop Loss**: The stop loss price level (usually marked in red)
5. **Take Profit**: The take profit price level (usually marked in green)

Return your response ONLY as a valid JSON object with this exact structure (no additional text):
{
  "symbol": "string or null",
  "side": "LONG or SHORT or null",
  "entry": "number or null",
  "stopLoss": "number or null",
  "takeProfit": "number or null",
  "confidence": "number between 0-100",
  "warnings": ["array of warning strings if any issues detected"]
}

Important notes:
- For LONG positions: Take Profit should be above Entry, Stop Loss below Entry
- For SHORT positions: Take Profit should be below Entry, Stop Loss above Entry
- If you cannot detect a value with confidence, set it to null
- Confidence should reflect how certain you are about the extracted values
- Add warnings for any inconsistencies or missing information
- Return ONLY the JSON object, no markdown formatting or additional text`;

    // Call DeepSeek API
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat', // or 'deepseek-vl' if available
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: base64Image,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.1, // Lower temperature for more consistent extraction
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from DeepSeek API');
    }

    // Try to extract JSON from the response (in case there's extra text)
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;

    const parsed = JSON.parse(jsonStr);

    // Calculate reward-risk ratio if possible
    let rewardRiskRatio: number | undefined;
    if (parsed.entry && parsed.stopLoss && parsed.takeProfit) {
      const risk = Math.abs(parsed.entry - parsed.stopLoss);
      const reward = Math.abs(parsed.takeProfit - parsed.entry);
      rewardRiskRatio = risk > 0 ? reward / risk : undefined;
    }

    // Validate and return the result
    const result: ExtractionResult = {
      symbol: parsed.symbol || undefined,
      side: parsed.side === 'LONG' || parsed.side === 'SHORT' ? parsed.side : undefined,
      entry: typeof parsed.entry === 'number' ? parsed.entry : undefined,
      stopLoss: typeof parsed.stopLoss === 'number' ? parsed.stopLoss : undefined,
      takeProfit: typeof parsed.takeProfit === 'number' ? parsed.takeProfit : undefined,
      rewardRiskRatio,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    };

    // Add warning if API key is not configured
    if (!process.env.DEEPSEEK_API_KEY) {
      result.warnings.push('DeepSeek API key not configured');
      result.confidence = 0;
    }

    return result;
  } catch (error) {
    console.error('DeepSeek AI extraction error:', error);

    // Return empty result with error warning
    return {
      confidence: 0,
      warnings: [
        `AI extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Please check your DeepSeek API key configuration',
      ],
    };
  }
}
