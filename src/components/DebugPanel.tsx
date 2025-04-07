import { BlockStack, Text, Box } from '@shopify/polaris';
import { DebugInfo } from '../types';

interface DebugPanelProps {
  debug: DebugInfo;
}

const DebugPanel = ({ debug }: DebugPanelProps) => {
  return (
    <BlockStack gap="400">
      <BlockStack gap="200">
        <Text as="h3" variant="headingSm" fontWeight="medium">Provider</Text>
        <Text as="p" variant="bodyMd">{debug.provider}</Text>
      </BlockStack>

      <BlockStack gap="200">
        <Text as="h3" variant="headingSm" fontWeight="medium">Model</Text>
        <Text as="p" variant="bodyMd">{debug.model}</Text>
      </BlockStack>

      <BlockStack gap="200">
        <Text as="h3" variant="headingSm" fontWeight="medium">Prompt</Text>
        <Box background="bg-surface-secondary" padding="400">
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            <code>{debug.prompt}</code>
          </pre>
        </Box>
      </BlockStack>

      <BlockStack gap="200">
        <Text as="h3" variant="headingSm" fontWeight="medium">Raw Response</Text>
        <Box background="bg-surface-secondary" padding="400">
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            <code>{debug.rawResponse}</code>
          </pre>
        </Box>
      </BlockStack>

      <BlockStack gap="200">
        <Text as="h3" variant="headingSm" fontWeight="medium">Timestamp</Text>
        <Text as="p" variant="bodyMd">{new Date(debug.timestamp).toLocaleString()}</Text>
      </BlockStack>
    </BlockStack>
  );
};

export default DebugPanel;
