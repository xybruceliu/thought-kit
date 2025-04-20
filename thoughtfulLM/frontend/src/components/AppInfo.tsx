import React from 'react';
import { Text, VStack, Box, Divider } from '@chakra-ui/react';
import { useSettingsStore } from '../store/settingsStore';
import { useNodeStore } from '../store/nodeStore';
import { useThoughtStore } from '../store/thoughtStore';
import { useMemoryStore } from '../store/memoryStore';
import { useChatStore } from '../store/chatStore';
import { useInputStore } from '../store/inputStore';

/**
 * A subtle information display in the top left corner
 * Shows interface type and debug information when debug mode is enabled
 */
const AppInfo: React.FC = () => {
  // Get stores data - always call hooks unconditionally
  const { interfaceType, debugMode } = useSettingsStore();
  
  // Always call hooks, but conditionally select data inside the selector function
  const nodeCount = useNodeStore(state => debugMode ? state.nodes.length : 0);
  const thoughtCount = useThoughtStore(state => debugMode ? state.thoughts.length : 0);
  const activeThoughts = useThoughtStore(state => debugMode ? state.activeThoughtIds.length : 0);
  const memoryItems = useMemoryStore(state => debugMode 
    ? state.memory.long_term.length + state.memory.short_term.length 
    : 0);
  const memoryLongTerm = useMemoryStore(state => debugMode ? state.memory.long_term.length : 0);
  const memoryShortTerm = useMemoryStore(state => debugMode ? state.memory.short_term.length : 0);
  const messageCount = useChatStore(state => debugMode ? state.messages.length : 0);
  const inputLength = useInputStore(state => debugMode ? state.inputData.currentInput.length : 0);
  
  return (
    <Box
      position="absolute"
      top="10px"
      left="10px"
      fontSize="xs"
      color="gray.700"
      fontWeight="light"
      opacity={0.8}
      zIndex="10"
      pointerEvents="none"
      bg={debugMode ? "rgba(0,0,0,0.05)" : "transparent"}
      p={debugMode ? 2 : 0}
      borderRadius="md"
      boxShadow={debugMode ? "sm" : "none"}
      maxWidth="220px"
    >
      <VStack align="start" spacing={1}>
        <Text fontWeight="medium">Interface {interfaceType}</Text>
        
        {debugMode && (
          <>
            <Divider my={1} borderColor="gray.300" />
            
            <Text fontWeight="medium">Store Data</Text>
            <Box pl={2} width="100%">
              <Text>Thought Nodes: {nodeCount}</Text>
              <Text>Thoughts: {thoughtCount} (Active: {activeThoughts})</Text>
              <Text>Memory: {memoryItems} (LT: {memoryLongTerm}, ST: {memoryShortTerm})</Text>
              <Text>Chat Messages: {messageCount}</Text>
              <Text>Input Length: {inputLength} chars</Text>
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default AppInfo; 