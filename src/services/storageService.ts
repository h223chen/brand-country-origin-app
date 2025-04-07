import { LlmSettings } from '../types';

const LLM_SETTINGS_KEY = 'brand_lookup_llm_settings';

export const getStoredLlmSettings = (): LlmSettings => {
  try {
    const storedSettings = localStorage.getItem(LLM_SETTINGS_KEY);
    if (storedSettings) {
      return JSON.parse(storedSettings);
    }
  } catch (error) {
    console.error('Error retrieving LLM settings:', error);
  }
  
  // Default settings
  return {
    openaiApiKey: '',
    openaiModel: 'gpt-3.5-turbo',
    openaiBaseUrl: 'https://proxy.shopify.ai/v1',
    anthropicApiKey: '',
    anthropicModel: 'claude-2',
    anthropicBaseUrl: 'https://api.anthropic.com/v1',
    geminiApiKey: '',
    geminiModel: 'google:gemini-1.5-flash',
    geminiBaseUrl: 'https://proxy.shopify.ai/v1',
    preferredProvider: 'openai'
  };
};

export const saveLlmSettings = (settings: LlmSettings): void => {
  try {
    localStorage.setItem(LLM_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving LLM settings:', error);
  }
};
