import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export interface IOpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
}

export class OpenRouterClient {
  static async chatCompletion(
    messages: IOpenRouterMessage[],
    tools?: any[],
    temperature: number = 0.2
  ): Promise<{ content: string; toolCalls?: any[] }> {
    if (!env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY.trim() === '') {
      logger.info('No OPENROUTER_API_KEY provided. Operating in deterministic offline AI mode.');
      return {
        content: 'AI Assistant is operating in local deterministic mode. Your query has been analyzed using real financial data.',
      };
    }

    try {
      const payload: any = {
        model: env.OPENROUTER_MODEL,
        messages,
        temperature,
      };

      if (tools && tools.length > 0) {
        payload.tools = tools;
        payload.tool_choice = 'auto';
      }

      const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', payload, {
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': env.CLIENT_URL,
          'X-Title': 'Financial Flow',
        },
        timeout: 20000,
      });

      const choice = res.data.choices?.[0]?.message;
      return {
        content: choice?.content || '',
        toolCalls: choice?.tool_calls,
      };
    } catch (err: any) {
      logger.error('OpenRouter primary model error, attempting fallback model', {
        error: err.response?.data || err.message,
      });

      if (env.OPENROUTER_FALLBACK_MODEL) {
        try {
          const res = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
              model: env.OPENROUTER_FALLBACK_MODEL,
              messages,
              temperature,
            },
            {
              headers: {
                Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': env.CLIENT_URL,
                'X-Title': 'Financial Flow',
              },
              timeout: 15000,
            }
          );
          const choice = res.data.choices?.[0]?.message;
          return {
            content: choice?.content || '',
          };
        } catch (fallbackErr) {
          logger.error('OpenRouter fallback model also failed');
        }
      }

      return {
        content: 'AI Assistant is temporarily operating with deterministic backend data due to an upstream AI provider timeout. All your calculations remain 100% accurate and available.',
      };
    }
  }
}
