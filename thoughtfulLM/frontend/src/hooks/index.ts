// Custom React hooks
// This file will export all custom hooks used in the application

// Active hooks
export { useTriggerDetection, useAutomaticTriggerDetection } from './useTriggerDetection';
export { useAppInitialization } from './useAppInitialization';

// Core connector functions between data layer and visualization layer
export {
  // Create methods
  createThoughtNode,
  createInputNode,
  createResponseNode,
  
  // Delete methods
  deleteThoughtNode,
  deleteInputNode,
  deleteResponseNode,
  
  // Update methods
  updateThoughtNode,
  updateInputNode,
  updateResponseNode,
  
  // Position methods
  repositionNode,
  repositionNodeByEntityId,
  
  // State transition methods
  markNodeForRemoval,
  
  // Utility methods
  doesNodeExistByEntityId,
  getNodeByEntityId,
  
} from './nodeConnectors'; 