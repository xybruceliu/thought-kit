// API service for ThoughtfulLM
// This file will contain functions for interacting with the backend API

import axios, { AxiosResponse } from 'axios';

// Import types from the types directory
import { Thought, ThoughtConfig, ThoughtSeed } from '../types/thought';
import { SimpleEventInput, EventType } from '../types/event';
import { Memory } from '../types/memory';
import { Content, Prompt } from '../types/common';

// Base API URL
const BASE_URL = 'http://localhost:8000/api/v1';

// Request types
export interface GenerateThoughtRequest {
  event: SimpleEventInput;
  seed: ThoughtSeed;
  config: ThoughtConfig;
  memory?: Memory;
  thoughts?: Thought[];
}

export interface OperateOnThoughtRequest {
  operation: string;
  thoughts: Thought[];
  memory?: Memory;
  options?: {
    [key: string]: any;
  };
}

export interface ArticulateThoughtsRequest {
  thoughts: Thought[];
  memory?: Memory;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ArticulateThoughtsResponse {
  response: string;
}

// API client class
class ThoughtApi {
  // Generate a thought using the ThoughtKit API
  async generateThought(request: GenerateThoughtRequest): Promise<Thought> {
    try {
      const response: AxiosResponse<Thought> = await axios.post(
        `${BASE_URL}/thoughts/generate`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error generating thought:', error);
      throw this.handleError(error);
    }
  }

  // Perform an operation on thoughts
  async operateOnThought(request: OperateOnThoughtRequest): Promise<Thought | Thought[]> {
    try {
      const response: AxiosResponse<Thought | Thought[]> = await axios.post(
        `${BASE_URL}/thoughts/operate`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error operating on thought:', error);
      throw this.handleError(error);
    }
  }

  // Articulate thoughts into a coherent response
  async articulateThoughts(request: ArticulateThoughtsRequest): Promise<ArticulateThoughtsResponse> {
    try {
      const response: AxiosResponse<ArticulateThoughtsResponse> = await axios.post(
        `${BASE_URL}/thoughts/articulate`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error articulating thoughts:', error);
      throw this.handleError(error);
    }
  }

  // Helper method to handle errors
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      // Return a more helpful error message when possible
      const errorMessage = error.response?.data?.detail || error.message;
      return new Error(`API Error: ${errorMessage}`);
    }
    return error instanceof Error ? error : new Error('Unknown error occurred');
  }
}

// Create and export a singleton instance
export const thoughtApi = new ThoughtApi();

export default thoughtApi; 