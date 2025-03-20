// Type definitions for thought-related data
// This file contains TypeScript types that mirror the backend schemas

import { Event, EventType } from './event';

// Content of a thought
export interface ThoughtContent {
  text: string;
  // No embedding in frontend
}

// Configuration for how a thought should behave
export interface ThoughtConfig {
  modality: 'TEXT' | 'EMOJI' | 'VISUAL';
  depth: number; // 1-5
  length: number; 
  interactivity: 'VIEW' | 'COMMENT' | 'EDIT';
  persistent: boolean;
  weight: number; // 0-1
}

// Timestamp information
export interface Timestamps {
  created: string;
  updated: string;
}

// Main thought structure (simplified from backend schema)
export interface Thought {
  id: string;
  content: ThoughtContent;
  config: ThoughtConfig;
  timestamps: Timestamps;
  triggerEvent: Event;
  // We're omitting some fields from the backend schema for frontend simplicity
}

// Re-export EventType as TriggerType for backward compatibility
export type TriggerType = EventType;
