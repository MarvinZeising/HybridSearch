import type { NewsPost } from './news';
import type { Page } from './pages';
import type { User } from './users';

// Branch type definition
export interface Branch {
  _id: string;
  title: string;
  description: string;
  content: string;
  branchId: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  updatedAt: string;
  updatedBy: string;
  updatedByName: string;
}

// Base search result type
export interface SearchResultBase {
  highlights: string[];
  score: number;
  type: 'post' | 'page' | 'user';
}

// Unified search result types using intersection types
export type PostSearchResult = NewsPost & SearchResultBase & { type: 'post' };
export type PageSearchResult = Page & SearchResultBase & { type: 'page' };
export type UserSearchResult = User & SearchResultBase & { type: 'user' };
export type BranchSearchResult = Branch & SearchResultBase & { type: 'branch' };

// Combined search result type
export type UnifiedSearchResult = PostSearchResult | PageSearchResult | UserSearchResult | BranchSearchResult;

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
}
