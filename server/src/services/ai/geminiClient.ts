import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export interface IGeminiMessage {
  role: 'user' | 'model' | 'system';
  parts: { text: string }[];
}

export class GeminiClient {
  static async generateFinancialAdvice(
    systemInstruction: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    userQueryWithDossier: string
  ): Promise<string> {
    if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.trim() === '') {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const candidateModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.6-flash',
      'gemini-3.7-flash',
      'gemini-2.5-pro',
    ];

    // Format conversational contents for Gemini API
    const contents: any[] = [];

    // Add prior conversational turns
    for (const h of history.slice(-6)) {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      });
    }

    // Add the current user query with grounded financial dossier
    contents.push({
      role: 'user',
      parts: [{ text: userQueryWithDossier }],
    });

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
        
        const payload: any = {
          contents,
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048,
          },
        };

        const res = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        });

        const text = res.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          logger.info(`Google Gemini successfully generated financial advice using ${model}`);
          return text.trim();
        }
      } catch (err: any) {
        const errMsg = err.response?.data?.error?.message || err.message;
        logger.warn(`Gemini model ${model} error: ${errMsg}, trying next model in pool...`);
      }
    }

    throw new Error('All Gemini models in cascade returned errors or rate limits');
  }
}
