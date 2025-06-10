// Content 
export interface Content {
    text: string;
    // No embedding in frontend
    embedding?: number[];
  }

// Timestamp information
export interface Timestamps {
    created: string;
    updated: string;
  }

// Types for generating prompts
export interface Prompt {
  system_prompt: string;
  user_prompt: string;
}

// Scoring metrics for thoughts
export interface Score {
  weight: number; // 0-1
}

  