// Type definitions for thought-related data
// This file contains TypeScript types that mirror the backend schemas

import { Prompt, Timestamps, Content, Score } from './common';
import { Event, EventType } from './event';


// Configuration for how a thought should behave
export interface ThoughtConfig {
  modality: 'TEXT' | 'EMOJI' | 'VISUAL';
  depth: number; // 1-5
  length: number; 
  interactivity: 'VIEW' | 'COMMENT' | 'EDIT';
  persistent: boolean;
  weight: number; // 0-1
}


// Main thought structure (simplified from backend schema)
export interface Thought {
  id: string;
  content: Content;
  config: ThoughtConfig;
  timestamps: Timestamps;
  trigger_event: Event;
  seed?: ThoughtSeed;
  references: string[];
  user_comments: string[];
  score: Score;
  is_active: boolean;
}

export interface ThoughtSeed {
  prompt: Prompt;
  model: 'gpt-4o' | 'gpt-4o-mini';
  temperature: number;
  type: string;
  max_tokens: number;
}