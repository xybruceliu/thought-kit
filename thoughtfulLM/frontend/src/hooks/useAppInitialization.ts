import { useEffect } from 'react';
import { useThoughtStore } from '../store/thoughtStore';
import { useMemoryStore } from '../store/memoryStore';
import { useNodeStore } from '../store/nodeStore';
import { useSettingsStore } from '../store/settingsStore';
import { useInputStore } from '../store/inputStore';
import { createInputNode } from './nodeConnectors';
import { XYPosition } from 'reactflow';

/**
 * Default position for the initial input node
 */
const FIRST_INPUT_POSITION: XYPosition = { x: 250, y: 250 };

/**
 * Hook that handles application initialization
 * Clears all data and creates initial input node when the app starts
 * Only creates input node for interface types 1 and 2
 * 
 * @param customPosition Optional position override for the initial input node
 * @returns An object with the current interface type
 */
export const useAppInitialization = (customPosition?: XYPosition) => {
  // Track initialization status
  const position = customPosition || FIRST_INPUT_POSITION;
  
  // Monitor interface type changes
  const interfaceType = useSettingsStore(state => state.interfaceType);

  // Initialize the application when the hook is first used or when interface type changes
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log(`Initializing application for interface type ${interfaceType}...`);
        
        // Get the store actions directly
        const thoughtStore = useThoughtStore.getState();
        const memoryStore = useMemoryStore.getState();
        const nodeStore = useNodeStore.getState();
        const inputStore = useInputStore.getState();
        
        // Clear all existing data
        thoughtStore.clearThoughts();
        memoryStore.clearMemories();
        nodeStore.clearAllNodes();
        inputStore.clearInputs();

        // Handle initialization based on interface type
        if (interfaceType === 1) {
          // Create a node-based input for interface 1
          console.log('Creating input node for interface type 1');
          createInputNode(position);
        } 
        else if (interfaceType === 2) {
          // For interface 2, we just need to create an input in the store
          // The TextInputFixed component will use this inputId
          console.log('Creating input for interface type 2 (fixed position)');
          const inputId = `input-${Date.now()}`;
          inputStore.addInput(inputId);
          inputStore.setActiveInputId(inputId);
        }
        else {
          console.log(`Skipping input creation for interface type ${interfaceType}`);
        }
        
        console.log('Application initialized successfully');
        console.log(`Interface: ${interfaceType}`);
        return true;
      } catch (error) {
        console.error('Error initializing application:', error);
        return false;
      }
    };
    
    // Execute initialization
    initializeApp();
    
  }, [interfaceType]);

  return {
    currentInterfaceType: interfaceType
  };
}; 