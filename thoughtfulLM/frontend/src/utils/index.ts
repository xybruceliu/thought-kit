// Utility functions
// This file will contain helper functions and utilities

// Array of possible thought contents (emojis and short phrases)
const thoughtContents = [
  "💡",
  "🤔",
  "What about Tokyo?",
  "Maybe coffee?",
  "⚡️",
  "Good idea!",
  "Let's try...",
  "Think differently",
  "What if...",
  "Interesting!",
  "🌈",
  "Not sure...",
  "Consider this",
  "🎯",
  "Worth a shot!",
  "Look deeper",
  "One moment...",
  "⏱️",
  "Remember to...",
  "Why not?",
];

/**
 * Generates a random thought content from predefined options
 */
export const generateRandomThought = (): string => {
  const randomIndex = Math.floor(Math.random() * thoughtContents.length);
  return thoughtContents[randomIndex];
};

/**
 * Generates a random integer between min and max (inclusive)
 */
export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Export node positioning utilities
export * from './nodePositioning'; 