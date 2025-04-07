/**
 * Service for validating API keys
 */

export const validateOpenAIKey = async (apiKey: string, baseUrl: string): Promise<boolean> => {
  try {
    // Make a minimal API call to validate the key
    const response = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || response.statusText || 'Invalid API key');
    }

    // If we get a successful response, the key is valid
    return true;
  } catch (error: any) {
    console.error('OpenAI key validation error:', error);
    throw new Error(error.message || 'Failed to validate OpenAI API key');
  }
};

export const validateAnthropicKey = async (apiKey: string, baseUrl: string): Promise<boolean> => {
  try {
    // Make a minimal API call to validate the key
    // Anthropic doesn't have a dedicated endpoint for key validation,
    // so we'll use a minimal models endpoint call
    const response = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || response.statusText || 'Invalid API key');
    }

    // If we get a successful response, the key is valid
    return true;
  } catch (error: any) {
    console.error('Anthropic key validation error:', error);
    throw new Error(error.message || 'Failed to validate Anthropic API key');
  }
};

export const validateGeminiKey = async (apiKey: string, baseUrl: string, model: string): Promise<boolean> => {
  try {
    // For Gemini through Shopify proxy, we'll validate with a minimal chat completion
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 5
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || response.statusText || 'Invalid API key');
    }

    // If we get a successful response, the key is valid
    return true;
  } catch (error: any) {
    console.error('Gemini key validation error:', error);
    throw new Error(error.message || 'Failed to validate Gemini API key');
  }
};
