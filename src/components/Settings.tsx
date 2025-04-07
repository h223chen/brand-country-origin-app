import { useState, useCallback, useEffect } from 'react';
import { 
  Card, 
  TextField, 
  Button, 
  BlockStack, 
  Select, 
  Text,
  InlineStack,
  Banner,
  Spinner,
  Divider,
  ButtonGroup,
  Tabs
} from '@shopify/polaris';
import { LlmSettings } from '../types';
import { getStoredLlmSettings, saveLlmSettings } from '../services/storageService';
import { validateOpenAIKey, validateAnthropicKey, validateGeminiKey } from '../services/validationService';

interface SettingsProps {
  onSettingsSaved: () => void;
}

const Settings = ({ onSettingsSaved }: SettingsProps) => {
  const [settings, setSettings] = useState<LlmSettings>({
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
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [openAIKeyValid, setOpenAIKeyValid] = useState<boolean | null>(null);
  const [anthropicKeyValid, setAnthropicKeyValid] = useState<boolean | null>(null);
  const [geminiKeyValid, setGeminiKeyValid] = useState<boolean | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    // Load saved settings
    const storedSettings = getStoredLlmSettings();
    setSettings(storedSettings);
    
    // Mark keys as valid if they were previously saved
    if (storedSettings.openaiApiKey) setOpenAIKeyValid(true);
    if (storedSettings.anthropicApiKey) setAnthropicKeyValid(true);
    if (storedSettings.geminiApiKey) setGeminiKeyValid(true);
    
    // Set the selected tab based on the preferred provider
    if (storedSettings.preferredProvider === 'anthropic') {
      setSelectedTab(1);
    } else if (storedSettings.preferredProvider === 'gemini') {
      setSelectedTab(2);
    } else {
      setSelectedTab(0);
    }
  }, []);

  const validateKeys = useCallback(async () => {
    setIsValidating(true);
    setValidationError(null);
    let hasValidKey = false;
    
    try {
      // Validate OpenAI key if provided
      if (settings.openaiApiKey) {
        try {
          const openaiValid = await validateOpenAIKey(settings.openaiApiKey, settings.openaiBaseUrl);
          setOpenAIKeyValid(openaiValid);
          if (openaiValid) hasValidKey = true;
        } catch (error: any) {
          console.error('OpenAI validation error:', error);
          setOpenAIKeyValid(false);
          if (!settings.anthropicApiKey && !settings.geminiApiKey) {
            setValidationError(`OpenAI API key validation failed: ${error.message || 'Invalid key'}`);
          }
        }
      } else {
        setOpenAIKeyValid(null);
      }
      
      // Validate Anthropic key if provided
      if (settings.anthropicApiKey) {
        try {
          const anthropicValid = await validateAnthropicKey(settings.anthropicApiKey, settings.anthropicBaseUrl);
          setAnthropicKeyValid(anthropicValid);
          if (anthropicValid) hasValidKey = true;
        } catch (error: any) {
          console.error('Anthropic validation error:', error);
          setAnthropicKeyValid(false);
          if ((!settings.openaiApiKey || openAIKeyValid === false) && !settings.geminiApiKey) {
            setValidationError(`Anthropic API key validation failed: ${error.message || 'Invalid key'}`);
          }
        }
      } else {
        setAnthropicKeyValid(null);
      }
      
      // Validate Gemini key if provided
      if (settings.geminiApiKey) {
        try {
          const geminiValid = await validateGeminiKey(
            settings.geminiApiKey, 
            settings.geminiBaseUrl,
            settings.geminiModel
          );
          setGeminiKeyValid(geminiValid);
          if (geminiValid) hasValidKey = true;
        } catch (error: any) {
          console.error('Gemini validation error:', error);
          setGeminiKeyValid(false);
          if ((!settings.openaiApiKey || openAIKeyValid === false) && 
              (!settings.anthropicApiKey || anthropicKeyValid === false)) {
            setValidationError(`Gemini API key validation failed: ${error.message || 'Invalid key'}`);
          }
        }
      } else {
        setGeminiKeyValid(null);
      }
      
      // Check if at least one key is valid
      if (!hasValidKey && (settings.openaiApiKey || settings.anthropicApiKey || settings.geminiApiKey)) {
        setValidationError('No valid API keys provided. Please check your API keys and try again.');
        return false;
      }
      
      return hasValidKey;
    } finally {
      setIsValidating(false);
    }
  }, [settings, openAIKeyValid, anthropicKeyValid, geminiKeyValid]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setValidationError(null);
    
    try {
      // Only validate if there are keys to validate
      if (settings.openaiApiKey || settings.anthropicApiKey || settings.geminiApiKey) {
        const isValid = await validateKeys();
        
        if (!isValid) {
          return;
        }
      }
      
      // Update preferred provider based on selected tab if no provider is explicitly set
      const updatedSettings = {...settings};
      if (selectedTab === 0) {
        updatedSettings.preferredProvider = 'openai';
      } else if (selectedTab === 1) {
        updatedSettings.preferredProvider = 'anthropic';
      } else if (selectedTab === 2) {
        updatedSettings.preferredProvider = 'gemini';
      }
      
      // Save settings
      saveLlmSettings(updatedSettings);
      setSaveSuccess(true);
      
      // Clear success message after a delay
      setTimeout(() => {
        setSaveSuccess(false);
        onSettingsSaved();
      }, 1500);
    } finally {
      setIsSaving(false);
    }
  }, [settings, validateKeys, onSettingsSaved, selectedTab]);

  const handleChange = useCallback((field: keyof LlmSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset validation state when keys or URLs change
    if (field === 'openaiApiKey' || field === 'openaiBaseUrl') {
      setOpenAIKeyValid(null);
    } else if (field === 'anthropicApiKey' || field === 'anthropicBaseUrl') {
      setAnthropicKeyValid(null);
    } else if (field === 'geminiApiKey' || field === 'geminiBaseUrl') {
      setGeminiKeyValid(null);
    }
    
    setValidationError(null);
  }, []);

  const clearOpenAIKey = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      openaiApiKey: ''
    }));
    setOpenAIKeyValid(null);
  }, []);

  const clearAnthropicKey = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      anthropicApiKey: ''
    }));
    setAnthropicKeyValid(null);
  }, []);

  const clearGeminiKey = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      geminiApiKey: ''
    }));
    setGeminiKeyValid(null);
  }, []);

  const resetOpenAIBaseUrl = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      openaiBaseUrl: 'https://proxy.shopify.ai/v1'
    }));
    setOpenAIKeyValid(null);
  }, []);

  const resetAnthropicBaseUrl = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      anthropicBaseUrl: 'https://api.anthropic.com/v1'
    }));
    setAnthropicKeyValid(null);
  }, []);

  const resetGeminiBaseUrl = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      geminiBaseUrl: 'https://proxy.shopify.ai/v1'
    }));
    setGeminiKeyValid(null);
  }, []);

  const getKeyStatusIcon = (isValid: boolean | null) => {
    if (isValid === null) return null;
    if (isValid) return <Text tone="success">✓</Text>;
    return <Text tone="critical">✗</Text>;
  };

  const openaiModels = [
    {label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo'},
    {label: 'GPT-4', value: 'gpt-4'},
    {label: 'GPT-4 Turbo', value: 'gpt-4-turbo-preview'}
  ];

  const anthropicModels = [
    {label: 'Claude 2', value:'claude-2'},
    {label: 'Claude Instant', value: 'claude-instant-1'},
    {label: 'Claude 3 Opus', value: 'claude-3-opus-20240229'},
    {label: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229'},
    {label: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307'}
  ];

  const geminiModels = [
    {label: 'Gemini 1.5 Flash', value: 'google:gemini-1.5-flash'},
    {label: 'Gemini 1.5 Pro', value: 'google:gemini-1.5-pro'}
  ];

  const tabs = [
    {
      id: 'openai',
      content: 'OpenAI',
      accessibilityLabel: 'OpenAI settings',
      panelID: 'openai-settings',
    },
    {
      id: 'anthropic',
      content: 'Anthropic',
      accessibilityLabel: 'Anthropic settings',
      panelID: 'anthropic-settings',
    },
    {
      id: 'gemini',
      content: 'Google Gemini',
      accessibilityLabel: 'Google Gemini settings',
      panelID: 'gemini-settings',
    },
  ];

  return (
    <Card>
      <BlockStack gap="500">
        <Text as="h2" variant="headingMd">
          LLM API Settings
        </Text>
        
        <Banner tone="info">
          <Text as="p">
            This app requires an API key from either OpenAI, Anthropic, or Google Gemini to function. 
            Your API key will be stored locally in your browser and is only used for queries made through this app.
          </Text>
        </Banner>
        
        {saveSuccess && (
          <Banner tone="success" onDismiss={() => setSaveSuccess(false)}>
            Settings saved successfully!
          </Banner>
        )}
        
        {validationError && (
          <Banner tone="critical" onDismiss={() => setValidationError(null)}>
            {validationError}
          </Banner>
        )}

        <Tabs
          tabs={tabs}
          selected={selectedTab}
          onSelect={setSelectedTab}
          fitted
        >
          {selectedTab === 0 && (
            <BlockStack gap="400">
              <div style={{ position: 'relative' }}>
                <TextField
                  label="OpenAI API Key"
                  value={settings.openaiApiKey}
                  onChange={(value) => handleChange('openaiApiKey', value)}
                  type="password"
                  autoComplete="off"
                  helpText="Your OpenAI API key will be stored locally in your browser"
                  suffix={getKeyStatusIcon(openAIKeyValid)}
                  disabled={isValidating || isSaving}
                  connectedRight={
                    <Button onClick={clearOpenAIKey} disabled={!settings.openaiApiKey}>
                      Clear
                    </Button>
                  }
                />
              </div>
              <Select
                label="OpenAI Model"
                options={openaiModels}
                value={settings.openaiModel}
                onChange={(value) => handleChange('openaiModel', value)}
                disabled={!settings.openaiApiKey || openAIKeyValid === false}
              />
              <div style={{ position: 'relative' }}>
                <TextField
                  label="Base URL"
                  value={settings.openaiBaseUrl}
                  onChange={(value) => handleChange('openaiBaseUrl', value)}
                  autoComplete="off"
                  helpText="The base URL for OpenAI API requests"
                  disabled={isValidating || isSaving}
                  connectedRight={
                    <Button onClick={resetOpenAIBaseUrl}>
                      Reset
                    </Button>
                  }
                />
              </div>
            </BlockStack>
          )}
          
          {selectedTab === 1 && (
            <BlockStack gap="400">
              <div style={{ position: 'relative' }}>
                <TextField
                  label="Anthropic API Key"
                  value={settings.anthropicApiKey}
                  onChange={(value) => handleChange('anthropicApiKey', value)}
                  type="password"
                  autoComplete="off"
                  helpText="Your Anthropic API key will be stored locally in your browser"
                  suffix={getKeyStatusIcon(anthropicKeyValid)}
                  disabled={isValidating || isSaving}
                  connectedRight={
                    <Button onClick={clearAnthropicKey} disabled={!settings.anthropicApiKey}>
                      Clear
                    </Button>
                  }
                />
              </div>
              <Select
                label="Anthropic Model"
                options={anthropicModels}
                value={settings.anthropicModel}
                onChange={(value) => handleChange('anthropicModel', value)}
                disabled={!settings.anthropicApiKey || anthropicKeyValid === false}
              />
              <div style={{ position: 'relative' }}>
                <TextField
                  label="Base URL"
                  value={settings.anthropicBaseUrl}
                  onChange={(value) => handleChange('anthropicBaseUrl', value)}
                  autoComplete="off"
                  helpText="The base URL for Anthropic API requests"
                  disabled={isValidating || isSaving}
                  connectedRight={
                    <Button onClick={resetAnthropicBaseUrl}>
                      Reset
                    </Button>
                  }
                />
              </div>
            </BlockStack>
          )}
          
          {selectedTab === 2 && (
            <BlockStack gap="400">
              <div style={{ position: 'relative' }}>
                <TextField
                  label="Google Gemini API Key"
                  value={settings.geminiApiKey}
                  onChange={(value) => handleChange('geminiApiKey', value)}
                  type="password"
                  autoComplete="off"
                  helpText="Your Google Gemini API key will be stored locally in your browser"
                  suffix={getKeyStatusIcon(geminiKeyValid)}
                  disabled={isValidating || isSaving}
                  connectedRight={
                    <Button onClick={clearGeminiKey} disabled={!settings.geminiApiKey}>
                      Clear
                    </Button>
                  }
                />
              </div>
              <Select
                label="Gemini Model"
                options={geminiModels}
                value={settings.geminiModel}
                onChange={(value) => handleChange('geminiModel', value)}
                disabled={!settings.geminiApiKey || geminiKeyValid === false}
              />
              <div style={{ position: 'relative' }}>
                <TextField
                  label="Base URL"
                  value={settings.geminiBaseUrl}
                  onChange={(value) => handleChange('geminiBaseUrl', value)}
                  autoComplete="off"
                  helpText="The base URL for Google Gemini API requests"
                  disabled={isValidating || isSaving}
                  connectedRight={
                    <Button onClick={resetGeminiBaseUrl}>
                      Reset
                    </Button>
                  }
                />
              </div>
            </BlockStack>
          )}
        </Tabs>
        
        <InlineStack align="end" gap="200">
          {isValidating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Spinner size="small" />
              <Text>Validating API keys...</Text>
            </div>
          )}
          <ButtonGroup>
            <Button 
              primary 
              onClick={handleSave} 
              loading={isSaving}
            >
              Save Settings
            </Button>
          </ButtonGroup>
        </InlineStack>
      </BlockStack>
    </Card>
  );
};

export default Settings;
