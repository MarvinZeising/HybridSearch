import type { NewsPost } from './news';
import type { Page } from './pages';
import type { User } from './users';

// Base search result type
export interface SearchResultBase {
  score: number;
  type: 'post' | 'page' | 'user';
}

// Unified search result types using intersection types
export type PostSearchResult = NewsPost & SearchResultBase & { type: 'post' };
export type PageSearchResult = Page & SearchResultBase & { type: 'page' };
export type UserSearchResult = User & SearchResultBase & { type: 'user' };

// Combined search result type
export type UnifiedSearchResult = PostSearchResult | PageSearchResult | UserSearchResult;

// API response type for multisearch
export interface MultiSearchResponse {
  results: UnifiedSearchResult[];
  totalHits: {
    posts: number;
    pages: number;
    users: number;
  };
}

// Search request parameters
export interface SearchRequest {
  query: string;
  useReranking?: boolean;
}
