// Type definitions for event-related data
// This file contains TypeScript types that mirror the backend's event_schema.py

import { Timestamps } from './common';

// Content of an event
export interface EventContent {
  text: string;
  // No embedding in frontend
}

// Types of events that can trigger thoughts
export type EventType = 
  | 'CLICK'           // User clicked somewhere
  | 'IDLE_TIME'       // User has been idle
  | 'WORD_COUNT_CHANGE' // User added or removed words
  | 'SENTENCE_END'    // User completed a sentence
  | 'NAMED_ENTITY';   // Named entity detected (for future implementation)

// Main event structure (simplified from backend schema)
export interface Event {
  id: string;
  timestamps: Timestamps;
  content: EventContent;
  type: EventType;
  duration?: number; // Optional field
}

// Simple event input for creating events
export interface SimpleEventInput {
  text: string;
  type: EventType;
  duration?: number;
} 