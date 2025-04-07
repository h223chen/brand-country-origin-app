import { useState, useCallback, useRef } from 'react';
import { TextField, Button, InlineStack, BlockStack, Text } from '@shopify/polaris';
import { MicrophoneIcon } from '@shopify/polaris-icons';

interface SearchFormProps {
  onSearch: (companyName: string, useVoiceOutput: boolean) => void;
  isLoading: boolean;
}

const SearchForm = ({ onSearch, isLoading }: SearchFormProps) => {
  const [companyName, setCompanyName] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );
  
  const recognitionRef = useRef<any>(null);

  const handleSubmit = useCallback(() => {
    onSearch(companyName, false); // Text input, no voice output
  }, [companyName, onSearch]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);

  const startListening = useCallback(() => {
    if (!speechSupported) return;

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCompanyName(transcript);
        setTimeout(() => {
          onSearch(transcript, true); // Voice input, use voice output
        }, 500);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.start();
    } catch (error) {
      console.error('Speech recognition error:', error);
      setSpeechSupported(false);
    }
  }, [speechSupported, onSearch]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return (
    <BlockStack gap="400">
      <InlineStack gap="200" align="start">
        <div style={{ flexGrow: 1 }}>
          <TextField
            label="Company name"
            value={companyName}
            onChange={setCompanyName}
            autoComplete="off"
            placeholder="Enter a company name (e.g., Apple, Nike, Samsung)"
            onKeyPress={handleKeyPress}
            disabled={isLoading || isListening}
          />
        </div>
        
        <div style={{ marginTop: '2rem' }}>
          <InlineStack gap="200">
            <Button 
              onClick={handleSubmit} 
              primary 
              disabled={!companyName.trim() || isLoading || isListening}
              loading={isLoading && !isListening}
            >
              Search
            </Button>
            
            {speechSupported && (
              <Button 
                icon={MicrophoneIcon}
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading && !isListening}
                tone={isListening ? "critical" : undefined}
              >
                {isListening ? "Stop" : "Speak"}
              </Button>
            )}
          </InlineStack>
        </div>
      </InlineStack>
      
      {isListening && (
        <Text as="p" tone="success">
          Listening... Speak the company name clearly.
        </Text>
      )}
    </BlockStack>
  );
};

export default SearchForm;
