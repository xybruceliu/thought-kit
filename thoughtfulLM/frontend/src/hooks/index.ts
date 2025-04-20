// Custom React hooks
// This file will export all custom hooks used in the application

// Active hooks
export { useTriggerDetection, useAutomaticTriggerDetection } from './useTriggerDetection';

// Core connector functions between data layer and visualization layer
export {
  // Create methods
  createThoughtNode,
  
  // Delete methods
  deleteThoughtNode,
  
  // Update methods
  updateThoughtNode,
  
  // Position methods
  repositionNode,
  repositionNodeByThoughtId,
  
  // State transition methods
  markNodeForRemoval,
  
  // Utility methods
  doesNodeExistForThought,
  getNodeByThoughtId,
  getNodeById,
  
} from './nodeConnectors'; 