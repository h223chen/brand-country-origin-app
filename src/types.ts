export interface CompanyData {
  name: string;
  headquarters: string;
  founded: string;
  businessRegions: string[];
  mainMarkets: string[];
  additionalInfo?: string;
}

export interface LlmSettings {
  openaiApiKey: string;
  openaiModel: string;
  openaiBaseUrl: string;
  anthropicApiKey: string;
  anthropicModel: string;
  anthropicBaseUrl: string;
  geminiApiKey: string;
  geminiModel: string;
  geminiBaseUrl: string;
  preferredProvider: 'openai' | 'anthropic' | 'gemini';
}

export interface LlmResponse {
  success: boolean;
  data?: CompanyData;
  error?: string;
}

export interface DebugInfo {
  provider: string;
  model: string;
  prompt: string;
  rawResponse: string;
  timestamp: string;
}

// Add these to the global Window interface
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}
