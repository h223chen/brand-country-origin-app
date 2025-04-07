import { useState, useEffect } from 'react';
import { Page, Card, Text, BlockStack, Frame, Navigation, Toast, Button, InlineStack, EmptyState } from '@shopify/polaris';
import { HomeIcon, SettingsIcon } from '@shopify/polaris-icons';
import SearchForm from './components/SearchForm';
import CompanyInfo from './components/CompanyInfo';
import DebugPanel from './components/DebugPanel';
import Settings from './components/Settings';
import { CompanyData, DebugInfo } from './types';
import { lookupCompany } from './services/companyService';
import { getStoredLlmSettings } from './services/storageService';

function App() {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'settings'>('home');
  const [llmConfigured, setLlmConfigured] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState('');
  const [toastError, setToastError] = useState(false);
  const [useVoiceOutput, setUseVoiceOutput] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  useEffect(() => {
    // Check if LLM settings are configured
    const settings = getStoredLlmSettings();
    const hasApiKeys = !!(settings.openaiApiKey || settings.anthropicApiKey || settings.geminiApiKey);
    setLlmConfigured(hasApiKeys);
  }, [currentPage]);

  const showToast = (content: string, isError = false) => {
    setToastContent(content);
    setToastError(isError);
    setToastActive(true);
  };

  const handleSearch = async (companyName: string, useVoice: boolean) => {
    if (!companyName.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setUseVoiceOutput(useVoice);
    setDebugInfo(null);
    
    try {
      const result = await lookupCompany(companyName);
      setCompanyData(result.data);
      
      if (result.debug) {
        setDebugInfo(result.debug);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      const errorMessage = err.message || 'Unable to find information for this company';
      setError(errorMessage);
      showToast(errorMessage, true);
      setCompanyData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDebugPanel = () => {
    setShowDebugPanel(!showDebugPanel);
  };

  const goToSettings = () => {
    setCurrentPage('settings');
  };

  const renderContent = () => {
    if (currentPage === 'settings') {
      return <Settings onSettingsSaved={() => {
        setCurrentPage('home');
        showToast('Settings saved successfully!');
      }} />;
    }

    // If no API keys are configured, show an empty state
    if (!llmConfigured) {
      return (
        <Card>
          <EmptyState
            heading="API key required"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            action={{
              content: 'Configure API Key',
              onAction: goToSettings,
            }}
          >
            <p>
              To use the Brand Origin Lookup app, you need to add an OpenAI, Anthropic, or Google Gemini API key in the settings.
            </p>
          </EmptyState>
        </Card>
      );
    }

    return (
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="400">
            <Text as="p" variant="bodyMd">
              Enter a company name to find out where it's headquartered and other business information.
            </Text>
            <SearchForm onSearch={handleSearch} isLoading={isLoading} />
          </BlockStack>
        </Card>
        
        {error && (
          <Card>
            <Text as="p" tone="critical">
              {error}
            </Text>
          </Card>
        )}
        
        {companyData && !error && (
          <>
            <CompanyInfo company={companyData} useVoiceOutput={useVoiceOutput} />
            {debugInfo && (
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text as="h2" variant="headingMd">Debug Information</Text>
                    <Button onClick={toggleDebugPanel} plain>
                      {showDebugPanel ? 'Hide' : 'Show'} Debug Panel
                    </Button>
                  </InlineStack>
                  {showDebugPanel && <DebugPanel debug={debugInfo} />}
                </BlockStack>
              </Card>
            )}
          </>
        )}
      </BlockStack>
    );
  };

  const toastMarkup = toastActive ? (
    <Toast 
      content={toastContent}
      error={toastError}
      onDismiss={() => setToastActive(false)} 
    />
  ) : null;

  return (
    <Frame
      navigation={
        <Navigation location="/">
          <Navigation.Section
            items={[
              {
                url: '#',
                label: 'Home',
                icon: HomeIcon,
                onClick: () => setCurrentPage('home'),
                selected: currentPage === 'home',
              },
              {
                url: '#',
                label: 'Settings',
                icon: SettingsIcon,
                onClick: () => setCurrentPage('settings'),
                selected: currentPage === 'settings',
              },
            ]}
          />
        </Navigation>
      }
      toast={toastMarkup}
    >
      <Page
        title={currentPage === 'home' ? "Brand Origin Lookup" : "Settings"}
        backAction={currentPage === 'settings' ? {
          content: 'Back',
          onAction: () => setCurrentPage('home'),
        } : undefined}
        primaryAction={currentPage === 'home' ? {
          content: 'Settings',
          icon: SettingsIcon,
          onAction: goToSettings,
        } : undefined}
      >
        {renderContent()}
      </Page>
    </Frame>
  );
}

export default App;
