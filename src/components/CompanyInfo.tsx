import { useEffect, useRef } from 'react';
import { Card, Text, BlockStack, InlineStack, Badge } from '@shopify/polaris';
import { CompanyData } from '../types';

interface CompanyInfoProps {
  company: CompanyData;
  useVoiceOutput: boolean;
}

const CompanyInfo = ({ company, useVoiceOutput }: CompanyInfoProps) => {
  const speechSynthesisSupported = useRef('speechSynthesis' in window);
  
  useEffect(() => {
    // Speak the company information if speech synthesis is supported and voice output is enabled
    if (speechSynthesisSupported.current && useVoiceOutput) {
      const speech = new SpeechSynthesisUtterance();
      speech.text = `${company.name} is headquartered in ${company.headquarters}. It was founded in ${company.founded} and operates primarily in ${company.mainMarkets.join(', ')}.`;
      speech.rate = 0.9;
      window.speechSynthesis.speak(speech);
      
      return () => {
        window.speechSynthesis.cancel();
      };
    }
  }, [company, useVoiceOutput]);

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingLg">
          {company.name}
        </Text>
        
        <BlockStack gap="200">
          <InlineStack gap="200">
            <Text as="span" fontWeight="bold">Headquarters:</Text>
            <Text as="span">{company.headquarters}</Text>
          </InlineStack>
          
          <InlineStack gap="200">
            <Text as="span" fontWeight="bold">Founded:</Text>
            <Text as="span">{company.founded}</Text>
          </InlineStack>
          
          <BlockStack gap="200">
            <Text as="span" fontWeight="bold">Business Regions:</Text>
            <InlineStack gap="200" wrap>
              {company.businessRegions.map((region) => (
                <Badge key={region}>{region}</Badge>
              ))}
            </InlineStack>
          </BlockStack>
          
          <BlockStack gap="200">
            <Text as="span" fontWeight="bold">Main Markets:</Text>
            <InlineStack gap="200" wrap>
              {company.mainMarkets.map((market) => (
                <Badge key={market} tone="success">{market}</Badge>
              ))}
            </InlineStack>
          </BlockStack>
          
          {company.additionalInfo && (
            <BlockStack gap="200">
              <Text as="span" fontWeight="bold">Additional Information:</Text>
              <Text as="p">{company.additionalInfo}</Text>
            </BlockStack>
          )}
          
          {useVoiceOutput && speechSynthesisSupported.current && (
            <Text as="p" tone="info" variant="bodySm">
              Voice output enabled. The information is being read aloud.
            </Text>
          )}
        </BlockStack>
      </BlockStack>
    </Card>
  );
};

export default CompanyInfo;
