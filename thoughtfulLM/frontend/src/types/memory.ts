// Type definitions for memory-related data
// This file contains TypeScript types that mirror the backend's memory_schema.py

import { Content, Timestamps } from './common';

// Memory item - represents a single piece of information to remember
export interface MemoryItem {
  id: string;
  timestamp: Timestamps;
  type: 'LONG_TERM' | 'SHORT_TERM';
  content: Content;
}

// Memory structure containing both long-term and short-term memories
export interface Memory {
  long_term: MemoryItem[];
  short_term: MemoryItem[];
}
