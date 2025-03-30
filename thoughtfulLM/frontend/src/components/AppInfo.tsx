import React from 'react';
import { Text, VStack, Box, Divider } from '@chakra-ui/react';
import { useSettingsStore } from '../store/settingsStore';
import { useNodeStore } from '../store/nodeStore';
import { useThoughtStore } from '../store/thoughtStore';
import { useMemoryStore } from '../store/memoryStore';
import { useInputStore } from '../store/inputStore';
import { useBoundsStore } from '../store/boundsStore';

/**
 * A subtle information display in the top left corner
 * Shows interface type and debug information when debug mode is enabled
 */
const AppInfo: React.FC = () => {
  // Get stores data - always call hooks unconditionally
  const { interfaceType, debugMode } = useSettingsStore();
  
  // Always call hooks, but conditionally select data inside the selector function
  const nodes = useNodeStore(state => debugMode ? state.nodes : []);
  const thoughtCount = useThoughtStore(state => debugMode ? state.thoughts.length : 0);
  const memoryItems = useMemoryStore(state => debugMode 
    ? state.memory.long_term.length + state.memory.short_term.length 
    : 0);
  const memoryLongTerm = useMemoryStore(state => debugMode ? state.memory.long_term.length : 0);
  const memoryShortTerm = useMemoryStore(state => debugMode ? state.memory.short_term.length : 0);
  const inputsCount = useInputStore(state => debugMode ? Object.keys(state.inputs).length : 0);

  // Calculate node types when debug mode is enabled
  const nodeTypes = React.useMemo(() => {
    if (!debugMode) return { total: 0, thought: 0, input: 0, response: 0 };
    
    return nodes.reduce((acc, node) => {
      acc.total++;
      if (node.data.type === 'thoughtBubble') acc.thought++;
      else if (node.data.type === 'textInput') acc.input++;
      else if (node.data.type === 'response') acc.response++;
      return acc;
    }, { total: 0, thought: 0, input: 0, response: 0 });
  }, [nodes, debugMode]);
  
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
            
            <Text fontWeight="medium">Nodes ({nodeTypes.total})</Text>
            <Box pl={2} width="100%">
              <Text>Thought: {nodeTypes.thought}</Text>
              <Text>Input: {nodeTypes.input}</Text>
              <Text>Response: {nodeTypes.response}</Text>
            </Box>
            
            <Divider my={1} borderColor="gray.300" />
            
            <Text fontWeight="medium">Store Data</Text>
            <Box pl={2} width="100%">
              <Text>Thoughts: {thoughtCount}</Text>
              <Text>Memory: {memoryItems} (LT: {memoryLongTerm}, ST: {memoryShortTerm})</Text>
              <Text>Inputs: {inputsCount}</Text>
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default AppInfo; 