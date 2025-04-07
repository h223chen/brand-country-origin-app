import { CompanyData, LlmResponse, DebugInfo } from '../types';
import { getStoredLlmSettings } from './storageService';

export const lookupCompany = async (companyName: string): Promise<{ data: CompanyData, debug?: DebugInfo }> => {
  const settings = getStoredLlmSettings();
  const hasUserKeys = !!(settings.openaiApiKey || settings.anthropicApiKey || settings.geminiApiKey);
  
  // Check if user has API keys
  if (!hasUserKeys) {
    throw new Error('No API keys configured. Please add an API key in Settings to use this app.');
  }

  // Determine which provider to use
  let response: LlmResponse;
  let debugInfo: DebugInfo | undefined;
  
  if (settings.preferredProvider === 'gemini' && settings.geminiApiKey) {
    const result = await queryGemini(companyName, settings.geminiApiKey, settings.geminiModel, settings.geminiBaseUrl);
    response = result.response;
    debugInfo = result.debug;
  } else if (settings.preferredProvider === 'anthropic' && settings.anthropicApiKey) {
    const result = await queryAnthropic(companyName, settings.anthropicApiKey, settings.anthropicModel, settings.anthropicBaseUrl);
    response = result.response;
    debugInfo = result.debug;
  } else if (settings.openaiApiKey) {
    const result = await queryOpenAI(companyName, settings.openaiApiKey, settings.openaiModel, settings.openaiBaseUrl);
    response = result.response;
    debugInfo = result.debug;
  } else if (settings.anthropicApiKey) {
    const result = await queryAnthropic(companyName, settings.anthropicApiKey, settings.anthropicModel, settings.anthropicBaseUrl);
    response = result.response;
    debugInfo = result.debug;
  } else if (settings.geminiApiKey) {
    const result = await queryGemini(companyName, settings.geminiApiKey, settings.geminiModel, settings.geminiBaseUrl);
    response = result.response;
    debugInfo = result.debug;
  } else {
    throw new Error('No valid LLM configuration found');
  }

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to get company information');
  }

  return { 
    data: response.data,
    debug: debugInfo
  };
};

async function queryOpenAI(companyName: string, apiKey: string, model: string, baseUrl: string): Promise<{ response: LlmResponse, debug: DebugInfo }> {
  try {
    const prompt = createCompanyPrompt(companyName);
    
    console.log('Querying OpenAI with model:', model);
    
    const requestBody = {
      model: model || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides accurate information about companies. Respond with JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    };
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    const debugInfo: DebugInfo = {
      provider: 'OpenAI',
      model: model,
      prompt: prompt,
      rawResponse: '',
      timestamp: new Date().toISOString()
    };

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      debugInfo.rawResponse = JSON.stringify(errorData, null, 2);
      return {
        response: {
          success: false,
          error: `OpenAI API error: ${errorData.error?.message || response.statusText}`
        },
        debug: debugInfo
      };
    }

    const data = await response.json();
    console.log('OpenAI response:', data);
    debugInfo.rawResponse = JSON.stringify(data, null, 2);
    
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return {
        response: { 
          success: false, 
          error: 'Empty response from OpenAI' 
        },
        debug: debugInfo
      };
    }

    // Try to parse the content as JSON directly first
    try {
      const parsedData = JSON.parse(content);
      return {
        response: {
          success: true,
          data: formatCompanyData(parsedData, companyName)
        },
        debug: debugInfo
      };
    } catch (e) {
      // If direct parsing fails, try to extract JSON from markdown code blocks or text
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                         content.match(/{[\s\S]*?}/);
        
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        
        const jsonString = jsonMatch[1] || jsonMatch[0];
        const cleanedJson = jsonString.trim().replace(/^```json\s*|\s*```$/g, '');
        const parsedData = JSON.parse(cleanedJson);
        
        return {
          response: {
            success: true,
            data: formatCompanyData(parsedData, companyName)
          },
          debug: debugInfo
        };
      } catch (extractError) {
        console.error('JSON extraction error:', extractError, 'Content:', content);
        return {
          response: {
            success: false,
            error: `Failed to parse JSON response: ${extractError}`
          },
          debug: debugInfo
        };
      }
    }
  } catch (error) {
    console.error('OpenAI API request failed:', error);
    return {
      response: {
        success: false,
        error: `OpenAI API request failed: ${error}`
      },
      debug: {
        provider: 'OpenAI',
        model: model,
        prompt: createCompanyPrompt(companyName),
        rawResponse: JSON.stringify({ error: String(error) }),
        timestamp: new Date().toISOString()
      }
    };
  }
}

async function queryAnthropic(companyName: string, apiKey: string, model: string, baseUrl: string): Promise<{ response: LlmResponse, debug: DebugInfo }> {
  try {
    const prompt = createCompanyPrompt(companyName);
    
    console.log('Querying Anthropic with model:', model);
    
    const requestBody = {
      model: model || 'claude-2',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    };
    
    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    const debugInfo: DebugInfo = {
      provider: 'Anthropic',
      model: model,
      prompt: prompt,
      rawResponse: '',
      timestamp: new Date().toISOString()
    };

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      debugInfo.rawResponse = JSON.stringify(errorData, null, 2);
      return {
        response: {
          success: false,
          error: `Anthropic API error: ${errorData.error?.message || response.statusText}`
        },
        debug: debugInfo
      };
    }

    const data = await response.json();
    console.log('Anthropic response:', data);
    debugInfo.rawResponse = JSON.stringify(data, null, 2);
    
    const content = data.content?.[0]?.text;
    
    if (!content) {
      return {
        response: { 
          success: false, 
          error: 'Empty response from Anthropic' 
        },
        debug: debugInfo
      };
    }

    // Try to parse the content as JSON directly first
    try {
      const parsedData = JSON.parse(content);
      return {
        response: {
          success: true,
          data: formatCompanyData(parsedData, companyName)
        },
        debug: debugInfo
      };
    } catch (e) {
      // If direct parsing fails, try to extract JSON from markdown code blocks or text
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                         content.match(/{[\s\S]*?}/);
        
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        
        const jsonString = jsonMatch[1] || jsonMatch[0];
        const cleanedJson = jsonString.trim().replace(/^```json\s*|\s*```$/g, '');
        const parsedData = JSON.parse(cleanedJson);
        
        return {
          response: {
            success: true,
            data: formatCompanyData(parsedData, companyName)
          },
          debug: debugInfo
        };
      } catch (extractError) {
        console.error('JSON extraction error:', extractError, 'Content:', content);
        return {
          response: {
            success: false,
            error: `Failed to parse JSON response: ${extractError}`
          },
          debug: debugInfo
        };
      }
    }
  } catch (error) {
    console.error('Anthropic API request failed:', error);
    return {
      response: {
        success: false,
        error: `Anthropic API request failed: ${error}`
      },
      debug: {
        provider: 'Anthropic',
        model: model,
        prompt: createCompanyPrompt(companyName),
        rawResponse: JSON.stringify({ error: String(error) }),
        timestamp: new Date().toISOString()
      }
    };
  }
}

async function queryGemini(companyName: string, apiKey: string, model: string, baseUrl: string): Promise<{ response: LlmResponse, debug: DebugInfo }> {
  try {
    const prompt = createCompanyPrompt(companyName);
    
    console.log('Querying Google Gemini with model:', model);
    
    // Format for Gemini API through Shopify proxy
    const requestBody = {
      model: model || 'google:gemini-1.5-flash',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    };
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    const debugInfo: DebugInfo = {
      provider: 'Google Gemini',
      model: model,
      prompt: prompt,
      rawResponse: '',
      timestamp: new Date().toISOString()
    };

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      debugInfo.rawResponse = JSON.stringify(errorData, null, 2);
      return {
        response: {
          success: false,
          error: `Gemini API error: ${errorData.error?.message || response.statusText}`
        },
        debug: debugInfo
      };
    }

    const data = await response.json();
    console.log('Gemini response:', data);
    debugInfo.rawResponse = JSON.stringify(data, null, 2);
    
    // Extract content from Gemini response format (similar to OpenAI format through the proxy)
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return {
        response: { 
          success: false, 
          error: 'Empty response from Gemini' 
        },
        debug: debugInfo
      };
    }

    // Try to parse the content as JSON directly first
    try {
      const parsedData = JSON.parse(content);
      return {
        response: {
          success: true,
          data: formatCompanyData(parsedData, companyName)
        },
        debug: debugInfo
      };
    } catch (e) {
      // If direct parsing fails, try to extract JSON from markdown code blocks or text
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                         content.match(/{[\s\S]*?}/);
        
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        
        const jsonString = jsonMatch[1] || jsonMatch[0];
        const cleanedJson = jsonString.trim().replace(/^```json\s*|\s*```$/g, '');
        const parsedData = JSON.parse(cleanedJson);
        
        return {
          response: {
            success: true,
            data: formatCompanyData(parsedData, companyName)
          },
          debug: debugInfo
        };
      } catch (extractError) {
        console.error('JSON extraction error:', extractError, 'Content:', content);
        return {
          response: {
            success: false,
            error: `Failed to parse JSON response: ${extractError}`
          },
          debug: debugInfo
        };
      }
    }
  } catch (error) {
    console.error('Gemini API request failed:', error);
    return {
      response: {
        success: false,
        error: `Gemini API request failed: ${error}`
      },
      debug: {
        provider: 'Google Gemini',
        model: model,
        prompt: createCompanyPrompt(companyName),
        rawResponse: JSON.stringify({ error: String(error) }),
        timestamp: new Date().toISOString()
      }
    };
  }
}

function createCompanyPrompt(companyName: string): string {
  return `
I need information about the company "${companyName}" in a specific JSON format.

Please provide the following details:
- Full company name
- Headquarters location (city and country)
- Year founded
- Business regions where they operate
- Main markets where they generate most revenue
- Brief additional information about their business

Return ONLY a valid JSON object with this structure:
{
  "name": "Full company name",
  "headquarters": "City, Country",
  "founded": "Year founded",
  "businessRegions": ["Region 1", "Region 2", ...],
  "mainMarkets": ["Market 1", "Market 2", ...],
  "additionalInfo": "Brief additional information about their business"
}

If you're not certain about some information, provide your best estimate or use "Unknown" as the value.
Do not include any explanatory text outside the JSON object.
`;
}

function formatCompanyData(data: any, companyName: string): CompanyData {
  // Ensure we have all required fields with fallbacks
  return {
    name: data.name || companyName,
    headquarters: data.headquarters || 'Information not available',
    founded: data.founded || 'Information not available',
    businessRegions: Array.isArray(data.businessRegions) ? data.businessRegions : ['Global'],
    mainMarkets: Array.isArray(data.mainMarkets) ? data.mainMarkets : ['Global'],
    additionalInfo: data.additionalInfo || undefined
  };
}
